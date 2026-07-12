/**
 * AI Proxy Lambda Function
 * - Proxies AI requests using shared API keys (stored in env vars)
 * - Rate limiting: configurable requests per user per day (DynamoDB)
 * - Multi-provider fallback: Groq → Gemini → OpenRouter
 * - CORS headers included
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.TABLE_NAME;
const DAILY_LIMIT = parseInt(process.env.DAILY_REQUEST_LIMIT || '3', 10);
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    // Extract user ID from Cognito authorizer
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return respond(401, { error: 'Unauthorized. Please sign in.' });
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { resumeText, jobDescription, analysisType } = body;

    if (!resumeText) {
      return respond(400, { error: 'resumeText is required.' });
    }

    // Check rate limit
    const usageToday = await getDailyUsage(userId);
    if (usageToday >= DAILY_LIMIT) {
      return respond(429, {
        error: `Daily limit reached (${DAILY_LIMIT} analyses/day). Try again tomorrow.`,
        limit: DAILY_LIMIT,
        used: usageToday,
      });
    }

    // Build the AI prompt
    const prompt = buildPrompt(resumeText, jobDescription, analysisType);

    // Try providers in order: Groq → Gemini → OpenRouter
    let aiResponse = null;
    let provider = null;

    if (GROQ_API_KEY) {
      try {
        aiResponse = await callGroq(prompt);
        provider = 'groq';
      } catch (err) {
        console.warn('Groq failed:', err.message);
      }
    }

    if (!aiResponse && GEMINI_API_KEY) {
      try {
        aiResponse = await callGemini(prompt);
        provider = 'gemini';
      } catch (err) {
        console.warn('Gemini failed:', err.message);
      }
    }

    if (!aiResponse && OPENROUTER_API_KEY) {
      try {
        aiResponse = await callOpenRouter(prompt);
        provider = 'openrouter';
      } catch (err) {
        console.warn('OpenRouter failed:', err.message);
      }
    }

    if (!aiResponse) {
      return respond(503, { error: 'All AI providers are currently unavailable. Please try again later.' });
    }

    // Increment usage counter
    await incrementDailyUsage(userId);

    return respond(200, {
      analysis: aiResponse,
      provider,
      usage: { used: usageToday + 1, limit: DAILY_LIMIT },
    });
  } catch (err) {
    console.error('Handler error:', err);
    return respond(500, { error: 'Internal server error.' });
  }
};

/**
 * Build the analysis prompt
 */
function buildPrompt(resumeText, jobDescription, analysisType = 'full') {
  let systemPrompt = `You are an expert AI resume analyzer. Provide detailed, actionable feedback.`;

  let userPrompt = `Analyze the following resume:\n\n${resumeText}\n\n`;

  if (jobDescription) {
    userPrompt += `Target job description:\n${jobDescription}\n\n`;
  }

  switch (analysisType) {
    case 'ats':
      userPrompt += 'Focus on ATS compatibility: keyword optimization, formatting issues, and parsing concerns.';
      break;
    case 'impact':
      userPrompt += 'Focus on impact statements: quantify achievements, strengthen action verbs, improve bullet points.';
      break;
    case 'match':
      userPrompt += 'Focus on job match: skill alignment, gap analysis, and tailoring recommendations.';
      break;
    default:
      userPrompt += `Provide a comprehensive analysis including:
1. Overall Score (0-100)
2. ATS Compatibility
3. Content Quality (impact statements, action verbs)
4. Structure & Formatting
5. Key Strengths
6. Areas for Improvement
7. Specific Recommendations`;
  }

  return { systemPrompt, userPrompt };
}

/**
 * Call Groq API (Llama models - fastest)
 */
async function callGroq({ systemPrompt, userPrompt }) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content;
}

/**
 * Call Google Gemini API
 */
async function callGemini({ systemPrompt, userPrompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

/**
 * Call OpenRouter API (fallback)
 */
async function callOpenRouter({ systemPrompt, userPrompt }) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://resume-analyzer.app',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content;
}

/**
 * Get today's usage count for a user
 */
async function getDailyUsage(userId) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const rateKey = `RATE#${today}`;

  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :uid AND analysisId = :key',
    ExpressionAttributeValues: {
      ':uid': userId,
      ':key': rateKey,
    },
  }));

  return result.Items?.[0]?.count || 0;
}

/**
 * Increment daily usage counter
 */
async function incrementDailyUsage(userId) {
  const today = new Date().toISOString().split('T')[0];
  const rateKey = `RATE#${today}`;
  // TTL: expire at end of next day (cleanup old rate records)
  const ttl = Math.floor(Date.now() / 1000) + 172800; // +48 hours

  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { userId, analysisId: rateKey },
    UpdateExpression: 'SET #count = if_not_exists(#count, :zero) + :one, #ttl = :ttl, createdAt = :today',
    ExpressionAttributeNames: {
      '#count': 'count',
      '#ttl': 'ttl',
    },
    ExpressionAttributeValues: {
      ':zero': 0,
      ':one': 1,
      ':ttl': ttl,
      ':today': today,
    },
  }));
}

/**
 * Utility: build response with CORS headers
 */
function respond(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}
