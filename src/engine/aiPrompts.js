/**
 * @fileoverview AI Prompt Templates for Resume Analysis.
 * Provides structured prompts for AI-powered resume analysis,
 * JD comparison, and improvement suggestions.
 * @module engine/aiPrompts
 */

/**
 * @typedef {Object} PromptPair
 * @property {string} system - System prompt setting AI behavior
 * @property {string} user - User prompt with the actual request
 */

/**
 * @typedef {Object} AnalysisOutput
 * @property {string} summary - Brief overall assessment (2-3 sentences)
 * @property {string[]} strengths - List of resume strengths
 * @property {string[]} weaknesses - List of resume weaknesses
 * @property {string[]} suggestions - Actionable improvement suggestions
 * @property {Array<{original: string, rewritten: string}>} rewrittenBullets - Improved bullet points
 * @property {string[]} missingKeywords - Important keywords not found in resume
 * @property {number} overallRating - Rating from 1-10
 */

/**
 * Generate the system and user prompts for comprehensive resume analysis.
 * The AI will evaluate the resume for the specified target role and return
 * structured JSON feedback.
 *
 * @param {string} resumeText - Full text content of the resume
 * @param {string} role - Target role (e.g., 'AWS DevOps Engineer', 'SRE')
 * @returns {PromptPair} System and user prompts
 *
 * @example
 * const { system, user } = getAnalysisPrompt(resumeText, 'DevOps Engineer');
 * const messages = [
 *   { role: 'system', content: system },
 *   { role: 'user', content: user }
 * ];
 * const response = await callAI('groq', apiKey, messages);
 */
export function getAnalysisPrompt(resumeText, role) {
  const system = `You are an expert technical resume reviewer and ATS (Applicant Tracking System) specialist with 15+ years of experience in tech recruiting. You specialize in evaluating resumes for ${role} positions.

Your analysis must be:
- Specific and actionable (not generic advice)
- Based on what's actually in the resume (cite specific lines/bullets when relevant)
- Focused on ATS optimization and recruiter appeal
- Honest but constructive

You MUST respond with valid JSON only. No markdown, no extra text outside the JSON object.

Output JSON Schema:
{
  "summary": "string - 2-3 sentence overall assessment",
  "strengths": ["string - specific strength with evidence from resume"],
  "weaknesses": ["string - specific weakness with explanation"],
  "suggestions": ["string - actionable improvement with example"],
  "rewrittenBullets": [
    {
      "original": "string - original bullet point from resume",
      "rewritten": "string - improved version with metrics/action verbs"
    }
  ],
  "missingKeywords": ["string - important keywords for ${role} not found in resume"],
  "overallRating": "number - 1 to 10 scale"
}`;

  const user = `Analyze this resume for a **${role}** position. Evaluate ATS compatibility, keyword optimization, content quality, and provide specific improvements.

RESUME TEXT:
---
${resumeText}
---

Provide your analysis as a JSON object following the schema in your instructions. Include:
1. At least 3-5 strengths with specific references to resume content
2. At least 3-5 weaknesses or gaps
3. At least 5 actionable suggestions
4. Rewrite the 3-5 weakest bullet points to be stronger (add metrics, action verbs, quantified impact)
5. List 10-15 important keywords for ${role} that are missing from this resume
6. Rate overall quality 1-10

Focus especially on:
- Are achievements quantified with numbers (%, $, time saved, team size, uptime)?
- Are bullet points starting with strong action verbs?
- Is there evidence of impact and scale?
- Are key ${role} technologies and practices mentioned?
- Is the structure ATS-friendly (clear sections, no complex formatting)?`;

  return { system, user };
}

/**
 * Generate prompts for comparing resume against a specific job description.
 * Provides gap analysis and tailoring recommendations.
 *
 * @param {string} resumeText - Full text content of the resume
 * @param {string} jdText - Full text of the job description
 * @param {string} role - Target role name
 * @returns {PromptPair} System and user prompts
 *
 * @example
 * const { system, user } = getJDComparePrompt(resumeText, jdText, 'AWS Cloud Engineer');
 * const messages = [
 *   { role: 'system', content: system },
 *   { role: 'user', content: user }
 * ];
 */
export function getJDComparePrompt(resumeText, jdText, role) {
  const system = `You are an expert technical recruiter and ATS optimization specialist. Your job is to compare a resume against a specific job description for a ${role} position and provide a detailed gap analysis.

You understand:
- How ATS systems parse and rank resumes
- What hiring managers look for in ${role} candidates
- How to tailor a resume without fabricating experience
- The difference between must-have and nice-to-have requirements

You MUST respond with valid JSON only. No markdown, no extra text outside the JSON object.

Output JSON Schema:
{
  "summary": "string - 2-3 sentence fit assessment",
  "strengths": ["string - how the candidate matches this specific JD"],
  "weaknesses": ["string - gaps between resume and JD requirements"],
  "suggestions": ["string - specific ways to tailor resume for this JD"],
  "rewrittenBullets": [
    {
      "original": "string - existing bullet that could be rewritten to match JD better",
      "rewritten": "string - improved version aligned with JD language"
    }
  ],
  "missingKeywords": ["string - JD keywords/phrases not in resume"],
  "overallRating": "number - 1 to 10 fit score for this specific job"
}`;

  const user = `Compare this resume against the job description below. Analyze how well the candidate matches, identify gaps, and suggest specific tailoring improvements.

RESUME:
---
${resumeText}
---

JOB DESCRIPTION:
---
${jdText}
---

Provide your analysis as a JSON object. Include:
1. Strengths: What in the resume directly matches JD requirements (cite both sides)
2. Weaknesses: Required qualifications or skills in the JD that aren't evidenced in the resume
3. Suggestions: How to reword existing experience to better align with JD language (without fabricating)
4. Rewritten Bullets: Take 3-5 resume bullets and rewrite them using JD terminology and requirements
5. Missing Keywords: Extract specific technical terms, tools, and skills from the JD that are absent from the resume
6. Overall fit rating: How likely is this candidate to pass initial ATS screening for this specific job?

Important guidelines:
- Don't suggest adding skills the candidate clearly doesn't have
- Focus on reframing existing experience to match JD language
- Prioritize must-have requirements over nice-to-haves
- Note if the JD has requirements that seem impossible to address with existing experience`;

  return { system, user };
}

/**
 * Generate a prompt for quick bullet point improvement.
 * Used for inline editing of individual resume bullets.
 *
 * @param {string} bulletPoint - Original bullet point text
 * @param {string} role - Target role
 * @returns {PromptPair} System and user prompts
 */
export function getBulletImprovementPrompt(bulletPoint, role) {
  const system = `You are a resume writing expert specializing in ${role} positions. Improve resume bullet points to be more impactful by adding metrics, strong action verbs, and quantified results. Respond with JSON only.

Output format: { "options": ["string - improved version 1", "string - improved version 2", "string - improved version 3"] }`;

  const user = `Rewrite this resume bullet point 3 different ways to be more impactful for a ${role} role. Add metrics where plausible, start with strong action verbs, and emphasize technical impact.

Original: "${bulletPoint}"

Return 3 improved versions as JSON.`;

  return { system, user };
}

/**
 * Generate a prompt for creating a professional summary.
 * Used when resume is missing a summary section.
 *
 * @param {string} resumeText - Full resume text
 * @param {string} role - Target role
 * @param {number} [yearsExperience] - Years of experience (optional)
 * @returns {PromptPair} System and user prompts
 */
export function getSummaryGenerationPrompt(resumeText, role, yearsExperience = null) {
  const system = `You are a resume writing expert. Generate a compelling professional summary for a ${role} position based on the candidate's experience. Respond with JSON only.

Output format: { "summaries": ["string - summary option 1", "string - summary option 2"] }`;

  const expNote = yearsExperience ? ` The candidate has approximately ${yearsExperience} years of experience.` : '';

  const user = `Based on this resume, generate 2 professional summary options (3-4 sentences each) for a ${role} position.${expNote}

The summary should:
- Open with years of experience and main expertise area
- Highlight 2-3 key technical strengths relevant to ${role}
- Mention a notable achievement with metrics if possible
- Be ATS-friendly (include important keywords naturally)

RESUME:
---
${resumeText}
---

Return 2 summary options as JSON.`;

  return { system, user };
}

/**
 * Generate a prompt for skills gap analysis.
 * Identifies what the candidate should learn next.
 *
 * @param {string} resumeText - Full resume text
 * @param {string} role - Target role
 * @param {string[]} missingKeywords - Keywords already identified as missing
 * @returns {PromptPair} System and user prompts
 */
export function getSkillsGapPrompt(resumeText, role, missingKeywords = []) {
  const system = `You are a career development advisor specializing in ${role} career paths. Analyze skill gaps and provide a learning roadmap. Respond with JSON only.

Output format:
{
  "criticalGaps": ["string - must-learn skills for ${role}"],
  "recommendedLearning": [
    { "skill": "string", "reason": "string", "resources": ["string - free resource"] }
  ],
  "quickWins": ["string - skills that can be added to resume quickly (certifications, short courses)"],
  "longTermGoals": ["string - skills that take months to develop"]
}`;

  const missingNote = missingKeywords.length > 0
    ? `\n\nAlready identified missing keywords: ${missingKeywords.join(', ')}`
    : '';

  const user = `Analyze this resume for a ${role} role and identify the most important skill gaps with a learning roadmap.${missingNote}

RESUME:
---
${resumeText}
---

Prioritize gaps that would have the biggest impact on getting hired. Include free learning resources where possible.`;

  return { system, user };
}

/**
 * Helper to format messages array from a prompt pair.
 * Convenience function for use with callAI.
 *
 * @param {PromptPair} promptPair - System and user prompts
 * @returns {AIMessage[]} Formatted messages array
 *
 * @example
 * const prompts = getAnalysisPrompt(text, role);
 * const messages = formatMessages(prompts);
 * const response = await callAI('groq', key, messages);
 */
export function formatMessages(promptPair) {
  return [
    { role: 'system', content: promptPair.system },
    { role: 'user', content: promptPair.user }
  ];
}

/**
 * Get the expected output schema description for documentation.
 * @returns {Object} Schema descriptions for all prompt types
 */
export function getOutputSchemas() {
  return {
    analysis: {
      summary: 'string - 2-3 sentence overall assessment',
      strengths: 'string[] - specific strengths with evidence',
      weaknesses: 'string[] - specific weaknesses',
      suggestions: 'string[] - actionable improvements',
      rewrittenBullets: 'Array<{original, rewritten}> - improved bullet points',
      missingKeywords: 'string[] - important missing keywords',
      overallRating: 'number - 1-10 scale'
    },
    jdCompare: {
      summary: 'string - fit assessment',
      strengths: 'string[] - matching qualifications',
      weaknesses: 'string[] - gaps vs JD',
      suggestions: 'string[] - tailoring tips',
      rewrittenBullets: 'Array<{original, rewritten}> - JD-aligned rewrites',
      missingKeywords: 'string[] - JD terms not in resume',
      overallRating: 'number - 1-10 fit score'
    }
  };
}

export default {
  getAnalysisPrompt,
  getJDComparePrompt,
  getBulletImprovementPrompt,
  getSummaryGenerationPrompt,
  getSkillsGapPrompt,
  formatMessages,
  getOutputSchemas
};
