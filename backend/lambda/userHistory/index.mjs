/**
 * User History Lambda Function
 * - POST /history   → Save analysis result
 * - GET /history    → Get user's past analyses
 * - DELETE /history/{id} → Delete specific analysis
 * - Auth: Cognito JWT token verified by API Gateway authorizer
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.TABLE_NAME;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    // Extract user ID from Cognito JWT (verified by API Gateway authorizer)
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return respond(401, { error: 'Unauthorized. Please sign in.' });
    }

    const method = event.httpMethod;
    const pathParams = event.pathParameters;

    switch (method) {
      case 'POST':
        return await saveAnalysis(userId, event.body);
      case 'GET':
        return await getHistory(userId, event.queryStringParameters);
      case 'DELETE':
        return await deleteAnalysis(userId, pathParams?.id);
      default:
        return respond(405, { error: 'Method not allowed.' });
    }
  } catch (err) {
    console.error('Handler error:', err);
    return respond(500, { error: 'Internal server error.' });
  }
};

/**
 * POST /history - Save a new analysis result
 */
async function saveAnalysis(userId, body) {
  const data = JSON.parse(body || '{}');

  if (!data.analysis) {
    return respond(400, { error: 'analysis field is required.' });
  }

  const analysisId = `ANALYSIS#${randomUUID()}`;
  const now = new Date().toISOString();

  const item = {
    userId,
    analysisId,
    createdAt: now,
    resumeTitle: data.resumeTitle || 'Untitled Resume',
    analysisType: data.analysisType || 'full',
    analysis: data.analysis,
    score: data.score || null,
    jobTitle: data.jobTitle || null,
    provider: data.provider || null,
    // TTL: auto-delete after 90 days (optional, user can delete sooner)
    ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));

  return respond(201, {
    message: 'Analysis saved successfully.',
    analysisId: analysisId.replace('ANALYSIS#', ''),
    createdAt: now,
  });
}

/**
 * GET /history - Get user's past analyses (paginated)
 */
async function getHistory(userId, queryParams) {
  const limit = Math.min(parseInt(queryParams?.limit || '20', 10), 50);
  const lastKey = queryParams?.cursor ? JSON.parse(decodeURIComponent(queryParams.cursor)) : undefined;

  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'UserDateIndex',
    KeyConditionExpression: 'userId = :uid',
    FilterExpression: 'begins_with(analysisId, :prefix)',
    ExpressionAttributeValues: {
      ':uid': userId,
      ':prefix': 'ANALYSIS#',
    },
    ScanIndexForward: false, // Most recent first
    Limit: limit,
    ExclusiveStartKey: lastKey,
  }));

  const items = (result.Items || []).map((item) => ({
    id: item.analysisId.replace('ANALYSIS#', ''),
    resumeTitle: item.resumeTitle,
    analysisType: item.analysisType,
    score: item.score,
    jobTitle: item.jobTitle,
    provider: item.provider,
    createdAt: item.createdAt,
    // Truncate analysis for list view
    analysisSummary: item.analysis?.substring(0, 200) + '...',
  }));

  const response = {
    items,
    count: items.length,
    hasMore: !!result.LastEvaluatedKey,
  };

  if (result.LastEvaluatedKey) {
    response.cursor = encodeURIComponent(JSON.stringify(result.LastEvaluatedKey));
  }

  return respond(200, response);
}

/**
 * DELETE /history/{id} - Delete a specific analysis
 */
async function deleteAnalysis(userId, id) {
  if (!id) {
    return respond(400, { error: 'Analysis ID is required.' });
  }

  const analysisId = id.startsWith('ANALYSIS#') ? id : `ANALYSIS#${id}`;

  // Delete the item (only if owned by this user - key includes userId)
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      userId,
      analysisId,
    },
    ConditionExpression: 'attribute_exists(userId)',
  }));

  return respond(200, { message: 'Analysis deleted successfully.' });
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
