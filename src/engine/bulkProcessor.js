/**
 * @fileoverview Bulk Resume Processor for Recruiter Mode.
 * Handles batch parsing, candidate info extraction, and skill matching
 * for screening 50+ resumes against a job description or skill set.
 * @module engine/bulkProcessor
 */

import { parseResume, validateFile } from './resumeParser.js';
import { extractKeywords } from './jdMatcher.js';

/**
 * @typedef {Object} CandidateResult
 * @property {number} rank - Ranking position (1-based)
 * @property {string} fileName - Original file name
 * @property {string} name - Extracted candidate name
 * @property {string} email - Extracted email address
 * @property {string} phone - Extracted phone number
 * @property {number} score - Match percentage (0-100)
 * @property {string[]} matchedSkills - Skills found in resume
 * @property {string[]} missingSkills - Skills not found in resume
 * @property {string} status - 'Strong Match' | 'Moderate' | 'Weak'
 */

/**
 * Extract candidate contact information from resume text.
 * Looks for name (first meaningful line), email, and phone patterns.
 *
 * @param {string} text - Parsed resume text
 * @param {string} fileName - Original file name (fallback for name)
 * @returns {{name: string, email: string, phone: string}}
 */
export function extractCandidateInfo(text, fileName) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Extract email
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0].toLowerCase() : '';

  // Extract phone - various formats
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/;
  const phonePatterns = [
    /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/,          // Indian mobile
    /(?:\+1[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/, // US format
    /(?:\+?\d{1,3}[\s-]?)?\d{3,5}[\s-]?\d{3,5}[\s-]?\d{0,5}/, // General international
  ];

  let phone = '';
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match && match[0].replace(/\D/g, '').length >= 10) {
      phone = match[0].trim();
      break;
    }
  }

  // Extract name - typically the first non-empty line that looks like a name
  let name = '';
  const nameStopWords = new Set([
    'resume', 'curriculum', 'vitae', 'cv', 'objective', 'summary',
    'experience', 'education', 'skills', 'contact', 'profile', 'about'
  ]);

  for (const line of lines.slice(0, 8)) {
    const lower = line.toLowerCase();
    // Skip lines that are headers, emails, phones, or URLs
    if (emailRegex.test(line)) continue;
    if (/\d{5,}/.test(line)) continue; // phone-like numbers
    if (/https?:\/\//.test(line)) continue;
    if (lower.startsWith('http')) continue;
    if (nameStopWords.has(lower.replace(/[^a-z]/g, ''))) continue;
    if (line.length > 60) continue; // Too long for a name

    // Likely a name if it's 2-4 words, mostly letters
    const words = line.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 1 && words.length <= 5) {
      const alphaRatio = line.replace(/[^a-zA-Z\s.]/g, '').length / line.length;
      if (alphaRatio > 0.7) {
        name = line.replace(/[|•·\-–—]/g, '').trim();
        break;
      }
    }
  }

  // Fallback: use filename without extension
  if (!name) {
    name = fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/resume|cv/gi, '')
      .trim() || 'Unknown';
  }

  return { name, email, phone };
}

/**
 * Match a resume text against a set of required skills.
 * Performs case-insensitive matching with word boundary awareness.
 *
 * @param {string} resumeText - Parsed resume text
 * @param {string[]} requiredSkills - Array of skill strings to match
 * @returns {{score: number, matchedSkills: string[], missingSkills: string[]}}
 */
export function matchSkills(resumeText, requiredSkills) {
  if (!resumeText || !requiredSkills || requiredSkills.length === 0) {
    return { score: 0, matchedSkills: [], missingSkills: [...requiredSkills] };
  }

  const resumeLower = resumeText.toLowerCase();
  const matched = [];
  const missing = [];

  for (const skill of requiredSkills) {
    const skillLower = skill.toLowerCase().trim();
    if (!skillLower) continue;

    // Check for presence in resume text
    // Use includes for multi-word skills, word boundary for single words
    let found = false;

    if (skillLower.includes(' ') || skillLower.includes('/') || skillLower.includes('-')) {
      // Multi-word or compound skill - use includes
      found = resumeLower.includes(skillLower);
    } else {
      // Single word - try word boundary match
      const regex = new RegExp(`\\b${escapeRegex(skillLower)}\\b`, 'i');
      found = regex.test(resumeText);
    }

    // Additional fuzzy: check for common variations
    if (!found) {
      const variations = getSkillVariations(skillLower);
      for (const variant of variations) {
        if (resumeLower.includes(variant)) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const score = requiredSkills.length > 0
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : 0;

  return { score, matchedSkills: matched, missingSkills: missing };
}

/**
 * Get common variations/aliases of a skill name.
 * @param {string} skill - Lowercase skill name
 * @returns {string[]} Array of variations
 */
function getSkillVariations(skill) {
  const variations = [];

  // Common abbreviation expansions
  const aliases = {
    'ats': ['applicant tracking system', 'applicant tracking'],
    'jd': ['job description'],
    'ta': ['talent acquisition'],
    'hr': ['human resources', 'hr administration'],
    'l&d': ['learning and development', 'learning & development'],
    'hrbp': ['hr business partner'],
    'kpi': ['key performance indicator'],
    'roi': ['return on investment'],
    'crm': ['candidate relationship management', 'customer relationship management'],
    'sourcing': ['source', 'sourced', 'talent sourcing', 'sourcing candidates'],
    'screening': ['screen', 'screened', 'pre-screening', 'candidate screening'],
    'onboarding': ['on-boarding', 'on boarding', 'employee onboarding', 'onboarding activities'],
    'interviewing': ['interview', 'interviews', 'conducted interviews', 'interview scheduling', 'interview coordination'],
    'recruitment': ['recruiting', 'recruit', 'recruitment activities'],
    'talent acquisition': ['talent sourcing', 'recruitment', 'recruiting', 'hiring', 'human resources'],
    'stakeholder management': ['stakeholder engagement', 'managing stakeholders', 'cross-functional stakeholder management', 'hiring managers'],
    'vendor management': ['vendor coordination', 'managing vendors', 'vendor negotiations'],
    'offer management': ['offer negotiation', 'offer letter', 'compensation negotiation', 'salary negotiation', 'offer rollout'],
    'employee engagement': ['team morale', 'engagement activities', 'retention'],
    'compliance': ['adherence to company policies', 'hr compliance', 'documentation'],
    'background verification': ['background check', 'bgv', 'verification'],
    'training': ['training programs', 'skill development', 'training & development', 'induction sessions'],
    'team management': ['team supervision', 'supervised store teams', 'managing teams', 'team coordination'],
    'hr administration': ['hr administrative', 'hr admin', 'employee records', 'employee documentation'],
    'campus recruitment': ['campus hiring', 'campus drives', 'walk-in drives'],
    'lateral hiring': ['lateral recruitment', 'experienced hiring'],
    'volume hiring': ['bulk hiring', 'mass recruitment', 'hiring drive'],
    'diversity hiring': ['diversity and inclusion', 'd&i hiring', 'equal opportunity'],
    'employer branding': ['employer brand', 'company branding', 'recruitment marketing'],
  };

  if (aliases[skill]) {
    variations.push(...aliases[skill]);
  }

  // Hyphenated vs space
  if (skill.includes('-')) {
    variations.push(skill.replace(/-/g, ' '));
  }
  if (skill.includes(' ')) {
    variations.push(skill.replace(/\s+/g, '-'));
  }

  return variations;
}

/**
 * Escape regex special characters.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get status badge based on score.
 * @param {number} score - Match percentage
 * @returns {string} 'Strong Match' | 'Moderate' | 'Weak'
 */
export function getStatusFromScore(score) {
  if (score > 75) return 'Strong Match';
  if (score >= 50) return 'Moderate';
  return 'Weak';
}

/**
 * Process a batch of resume files against required skills.
 * Parses each file, extracts candidate info, and scores against skills.
 *
 * @param {File[]} files - Array of File objects to process
 * @param {string[]} skills - Required skills to match against
 * @param {Function} [onProgress] - Progress callback: (current, total) => void
 * @returns {Promise<CandidateResult[]>} Sorted array of results (highest score first)
 *
 * @example
 * const results = await processBatch(files, ['sourcing', 'ATS', 'screening'], (i, total) => {
 *   console.log(`Processing ${i}/${total}...`);
 * });
 */
export async function processBatch(files, skills, onProgress) {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Report progress
    if (onProgress) {
      onProgress(i + 1, files.length);
    }

    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        results.push({
          rank: 0,
          fileName: file.name,
          name: file.name.replace(/\.[^.]+$/, ''),
          email: '',
          phone: '',
          score: 0,
          matchedSkills: [],
          missingSkills: [...skills],
          status: 'Weak',
          error: validation.error,
        });
        continue;
      }

      // Parse resume
      const parsed = await parseResume(file);

      // Extract candidate info
      const { name, email, phone } = extractCandidateInfo(parsed.text, file.name);

      // Match skills
      const { score, matchedSkills, missingSkills } = matchSkills(parsed.text, skills);

      // Get status
      const status = getStatusFromScore(score);

      results.push({
        rank: 0,
        fileName: file.name,
        name,
        email,
        phone,
        score,
        matchedSkills,
        missingSkills,
        status,
        error: null,
      });
    } catch (error) {
      // File parsing failed - still include in results with error
      results.push({
        rank: 0,
        fileName: file.name,
        name: file.name.replace(/\.[^.]+$/, ''),
        email: '',
        phone: '',
        score: 0,
        matchedSkills: [],
        missingSkills: [...skills],
        status: 'Weak',
        error: error.message,
      });
    }

    // Small delay to prevent UI freezing on large batches
    if (i % 5 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Assign ranks
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return results;
}

/**
 * Extract skills from a Job Description text using the existing extractKeywords engine.
 * Filters to return only meaningful, recruiter-relevant terms.
 *
 * @param {string} jdText - Full job description text
 * @returns {string[]} Extracted skill keywords
 */
export function extractSkillsFromJD(jdText) {
  if (!jdText || !jdText.trim()) return [];

  const keywords = extractKeywords(jdText);

  // Filter out very short or generic extracted keywords
  return keywords.filter(k => k.length >= 2);
}

/**
 * Export results to CSV format.
 *
 * @param {CandidateResult[]} results - Array of candidate results
 * @returns {string} CSV string content
 */
export function exportToCSV(results) {
  const headers = [
    'Rank',
    'Candidate Name',
    'Email',
    'Phone',
    'Match Score (%)',
    'Status',
    'Matched Skills',
    'Missing Skills',
    'File Name',
  ];

  const rows = results.map(r => [
    r.rank,
    `"${(r.name || '').replace(/"/g, '""')}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    `"${(r.phone || '').replace(/"/g, '""')}"`,
    r.score,
    r.status,
    `"${(r.matchedSkills || []).join(', ').replace(/"/g, '""')}"`,
    `"${(r.missingSkills || []).join(', ').replace(/"/g, '""')}"`,
    `"${(r.fileName || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csv;
}

export default processBatch;
