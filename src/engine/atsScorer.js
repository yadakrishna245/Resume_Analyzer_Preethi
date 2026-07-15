/**
 * @fileoverview ATS (Applicant Tracking System) Scoring Engine.
 * Evaluates resumes against industry-standard ATS criteria with
 * a weighted scoring formula totaling 100 points.
 * @module engine/atsScorer
 */

import { getAllKeywords, getKeywordsByCategory } from './keywords.js';

/**
 * @typedef {Object} ChecklistItem
 * @property {'pass'|'warn'|'fail'} status - Status of the check
 * @property {string} message - Human-readable description
 */

/**
 * @typedef {Object} ScoreBreakdown
 * @property {number} contact - Contact & Links score (max 15)
 * @property {number} sections - Sections & Structure score (max 20)
 * @property {number} keywords - Keywords match score (max 25)
 * @property {number} contentQuality - Content quality score (max 20)
 * @property {number} format - Format & Length score (max 20)
 */

/**
 * @typedef {Object} ATSResult
 * @property {number} score - Total ATS score (0-100)
 * @property {ScoreBreakdown} breakdown - Score breakdown by category
 * @property {ChecklistItem[]} checklist - Detailed checklist of all checks
 * @property {string[]} keywordsFound - Role keywords found in resume
 * @property {string[]} keywordsMissing - Role keywords missing from resume
 */

/**
 * Common action verbs used in strong resumes.
 * @const {string[]}
 */
const ACTION_VERBS = [
  'achieved', 'administered', 'architected', 'automated', 'built',
  'configured', 'consolidated', 'created', 'decreased', 'delivered',
  'deployed', 'designed', 'developed', 'eliminated', 'engineered',
  'established', 'expanded', 'implemented', 'improved', 'increased',
  'integrated', 'launched', 'led', 'maintained', 'managed',
  'migrated', 'monitored', 'optimized', 'orchestrated', 'oversaw',
  'performed', 'planned', 'provisioned', 'reduced', 'refactored',
  'resolved', 'scaled', 'secured', 'simplified', 'spearheaded',
  'streamlined', 'supervised', 'supported', 'transformed', 'troubleshot',
  'upgraded', 'utilized',
  // HR / Talent Acquisition action verbs
  'recruited', 'sourced', 'screened', 'interviewed', 'onboarded',
  'coordinated', 'facilitated', 'trained', 'mentored', 'counseled',
  'negotiated', 'partnered', 'collaborated', 'engaged', 'retained',
  'assessed', 'evaluated', 'shortlisted', 'scheduled', 'conducted',
  'organized', 'processed', 'verified', 'documented', 'communicated',
  'aligned', 'advised', 'influenced', 'advocated', 'championed',
  'initiated', 'drove', 'ensured', 'maintained', 'fostered'
];

/**
 * First-person pronouns that should be avoided in resumes.
 * @const {string[]}
 */
const FIRST_PERSON_WORDS = ['i ', 'i\'m', 'my ', 'me ', 'mine ', 'myself', 'we ', 'our ', 'us '];

/**
 * Score the Contact & Links section (max 15 points).
 * Checks for: email (4pts), phone (3pts), LinkedIn (3pts), GitHub (3pts), portfolio (2pts)
 * @param {string} text - Resume text content
 * @returns {{score: number, checklist: ChecklistItem[]}}
 */
function scoreContact(text) {
  const lower = text.toLowerCase();
  let score = 0;
  const checklist = [];

  // Email check (4 pts)
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  if (hasEmail) {
    score += 4;
    checklist.push({ status: 'pass', message: 'Email address found' });
  } else {
    checklist.push({ status: 'fail', message: 'No email address detected — essential for ATS' });
  }

  // Phone check (3 pts)
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text) ||
                   /\d{10,}/.test(text.replace(/\D/g, '').slice(0, 15));
  if (hasPhone) {
    score += 3;
    checklist.push({ status: 'pass', message: 'Phone number found' });
  } else {
    checklist.push({ status: 'warn', message: 'No phone number detected' });
  }

  // LinkedIn check (3 pts)
  const hasLinkedIn = lower.includes('linkedin.com') || lower.includes('linkedin:');
  if (hasLinkedIn) {
    score += 3;
    checklist.push({ status: 'pass', message: 'LinkedIn profile link found' });
  } else {
    checklist.push({ status: 'warn', message: 'No LinkedIn URL — recommended for professional visibility' });
  }

  // GitHub check (3 pts)
  const hasGitHub = lower.includes('github.com') || lower.includes('github:') || lower.includes('gitlab.com');
  if (hasGitHub) {
    score += 3;
    checklist.push({ status: 'pass', message: 'GitHub/GitLab profile found' });
  } else {
    checklist.push({ status: 'warn', message: 'No GitHub/GitLab link — helpful for technical roles' });
  }

  // Portfolio/Website check (2 pts)
  const hasPortfolio = lower.includes('portfolio') || lower.includes('website') ||
                       /https?:\/\/(?!.*(?:linkedin|github|gitlab))[\w.-]+\.\w+/.test(text);
  if (hasPortfolio) {
    score += 2;
    checklist.push({ status: 'pass', message: 'Portfolio or personal website found' });
  } else {
    checklist.push({ status: 'warn', message: 'No portfolio/personal website link' });
  }

  return { score, checklist };
}

/**
 * Score the Sections & Structure (max 20 points).
 * Checks for standard resume sections with proper headings.
 * @param {string} text - Resume text content
 * @returns {{score: number, checklist: ChecklistItem[]}}
 */
function scoreSections(text) {
  const lower = text.toLowerCase();
  let score = 0;
  const checklist = [];

  // Summary/Objective (4 pts)
  const hasSummary = /\b(summary|objective|professional summary|career objective|profile|about)\b/i.test(text);
  if (hasSummary) {
    score += 4;
    checklist.push({ status: 'pass', message: 'Summary/Objective section found' });
  } else {
    checklist.push({ status: 'fail', message: 'No Summary/Objective section — ATS looks for this first' });
  }

  // Experience (5 pts)
  const hasExperience = /\b(experience|work experience|professional experience|employment|work history)\b/i.test(text);
  if (hasExperience) {
    score += 5;
    checklist.push({ status: 'pass', message: 'Experience section found' });
  } else {
    checklist.push({ status: 'fail', message: 'No Experience section detected — critical for ATS parsing' });
  }

  // Education (4 pts)
  const hasEducation = /\b(education|academic|qualifications|degree|university|college)\b/i.test(text);
  if (hasEducation) {
    score += 4;
    checklist.push({ status: 'pass', message: 'Education section found' });
  } else {
    checklist.push({ status: 'warn', message: 'No Education section — most ATS systems require this' });
  }

  // Skills (4 pts)
  const hasSkills = /\b(skills|technical skills|core competencies|technologies|tech stack)\b/i.test(text);
  if (hasSkills) {
    score += 4;
    checklist.push({ status: 'pass', message: 'Skills section found' });
  } else {
    checklist.push({ status: 'fail', message: 'No Skills section — critical for keyword matching' });
  }

  // Projects/Certifications (3 pts)
  const hasProjects = /\b(projects|certifications|certificates|achievements|accomplishments|publications)\b/i.test(text);
  if (hasProjects) {
    score += 3;
    checklist.push({ status: 'pass', message: 'Projects/Certifications section found' });
  } else {
    checklist.push({ status: 'warn', message: 'No Projects or Certifications section' });
  }

  return { score, checklist };
}

/**
 * Score keyword match against role requirements (max 25 points).
 * @param {string} text - Resume text content
 * @param {string} roleSlug - Target role identifier
 * @returns {{score: number, checklist: ChecklistItem[], keywordsFound: string[], keywordsMissing: string[]}}
 */
function scoreKeywords(text, roleSlug) {
  const lower = text.toLowerCase();
  const allKeywords = getAllKeywords(roleSlug);
  const checklist = [];

  if (allKeywords.length === 0) {
    return {
      score: 0,
      checklist: [{ status: 'warn', message: 'No role selected for keyword analysis' }],
      keywordsFound: [],
      keywordsMissing: []
    };
  }

  const keywordsFound = [];
  const keywordsMissing = [];

  for (const keyword of allKeywords) {
    // Use word boundary-like matching for short keywords, includes for longer ones
    const lowerKeyword = keyword.toLowerCase();
    if (lowerKeyword.length <= 3) {
      // Short keywords need more exact matching
      const regex = new RegExp(`\\b${escapeRegex(lowerKeyword)}\\b`, 'i');
      if (regex.test(text)) {
        keywordsFound.push(keyword);
      } else {
        keywordsMissing.push(keyword);
      }
    } else {
      if (lower.includes(lowerKeyword)) {
        keywordsFound.push(keyword);
      } else {
        keywordsMissing.push(keyword);
      }
    }
  }

  const matchPercentage = (keywordsFound.length / allKeywords.length) * 100;
  const score = Math.round((matchPercentage / 100) * 25);

  // Checklist based on percentage
  if (matchPercentage >= 60) {
    checklist.push({ status: 'pass', message: `Strong keyword match: ${matchPercentage.toFixed(0)}% (${keywordsFound.length}/${allKeywords.length} keywords found)` });
  } else if (matchPercentage >= 30) {
    checklist.push({ status: 'warn', message: `Moderate keyword match: ${matchPercentage.toFixed(0)}% (${keywordsFound.length}/${allKeywords.length} keywords) — aim for 60%+` });
  } else {
    checklist.push({ status: 'fail', message: `Low keyword match: ${matchPercentage.toFixed(0)}% (${keywordsFound.length}/${allKeywords.length} keywords) — resume may be filtered out` });
  }

  // Category-specific feedback
  const byCategory = getKeywordsByCategory(roleSlug);
  if (byCategory) {
    const categoryScores = {};
    for (const [category, keywords] of Object.entries(byCategory)) {
      const found = keywords.filter(k => lower.includes(k.toLowerCase()));
      categoryScores[category] = {
        found: found.length,
        total: keywords.length,
        percentage: Math.round((found.length / keywords.length) * 100)
      };
    }

    // Warn about weak categories
    for (const [category, data] of Object.entries(categoryScores)) {
      const label = category.replace(/_/g, ' ');
      if (data.percentage < 20) {
        checklist.push({ status: 'fail', message: `Very few ${label} keywords (${data.found}/${data.total}) — major gap` });
      } else if (data.percentage < 40) {
        checklist.push({ status: 'warn', message: `Low ${label} coverage (${data.found}/${data.total})` });
      }
    }
  }

  return { score, checklist, keywordsFound, keywordsMissing };
}

/**
 * Score content quality (max 20 points).
 * Evaluates: quantified achievements, action verbs, no first-person, bullet points.
 * @param {string} text - Resume text content
 * @returns {{score: number, checklist: ChecklistItem[]}}
 */
function scoreContentQuality(text) {
  const lower = text.toLowerCase();
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  let score = 0;
  const checklist = [];

  // Quantified achievements - numbers/metrics (6 pts)
  const numberMatches = text.match(/\d+[%+]|\$[\d,]+|\d+[xX]|\b\d{2,}\b/g) || [];
  const quantifiedCount = numberMatches.length;

  if (quantifiedCount >= 8) {
    score += 6;
    checklist.push({ status: 'pass', message: `Strong quantification: ${quantifiedCount} metrics/numbers found` });
  } else if (quantifiedCount >= 4) {
    score += 4;
    checklist.push({ status: 'warn', message: `Some quantification: ${quantifiedCount} numbers found — aim for 8+ metrics` });
  } else if (quantifiedCount >= 1) {
    score += 2;
    checklist.push({ status: 'warn', message: `Weak quantification: only ${quantifiedCount} numbers — add metrics like percentages, dollar amounts, team sizes` });
  } else {
    checklist.push({ status: 'fail', message: 'No quantified achievements found — add numbers (%, $, team size, uptime, etc.)' });
  }

  // Action verbs (5 pts)
  const foundVerbs = ACTION_VERBS.filter(verb => lower.includes(verb));
  const verbCount = foundVerbs.length;

  if (verbCount >= 10) {
    score += 5;
    checklist.push({ status: 'pass', message: `Excellent use of action verbs (${verbCount} unique verbs)` });
  } else if (verbCount >= 5) {
    score += 3;
    checklist.push({ status: 'warn', message: `Good action verb usage (${verbCount}) — try adding more variety` });
  } else {
    score += 1;
    checklist.push({ status: 'fail', message: `Few action verbs (${verbCount}) — start bullets with strong verbs like "Deployed", "Automated", "Reduced"` });
  }

  // No first person (4 pts)
  const firstPersonFound = FIRST_PERSON_WORDS.filter(word => lower.includes(word));
  if (firstPersonFound.length === 0) {
    score += 4;
    checklist.push({ status: 'pass', message: 'No first-person pronouns — professional tone maintained' });
  } else if (firstPersonFound.length <= 2) {
    score += 2;
    checklist.push({ status: 'warn', message: `Minor first-person usage detected (${firstPersonFound.join(', ')}) — remove for professional tone` });
  } else {
    checklist.push({ status: 'fail', message: 'Frequent first-person pronouns — rewrite in third-person implied voice' });
  }

  // Bullet points usage (5 pts)
  const bulletLines = lines.filter(l => /^[\s]*[•\-\*\u2022\u2023\u25E6\u2043\u2219]/.test(l) || /^\s*\d+[\.\)]\s/.test(l));
  const bulletRatio = lines.length > 0 ? bulletLines.length / lines.length : 0;

  if (bulletRatio >= 0.3 && bulletRatio <= 0.8) {
    score += 5;
    checklist.push({ status: 'pass', message: `Good bullet point usage (${Math.round(bulletRatio * 100)}% of content)` });
  } else if (bulletRatio >= 0.15) {
    score += 3;
    checklist.push({ status: 'warn', message: 'More bullet points recommended for readability and ATS parsing' });
  } else {
    score += 1;
    checklist.push({ status: 'fail', message: 'Very few bullet points — ATS and recruiters prefer bulleted achievements' });
  }

  return { score, checklist };
}

/**
 * Score format and length (max 20 points).
 * Evaluates: word count, no tables/images, consistent formatting.
 * @param {string} text - Resume text content
 * @param {number} wordCount - Word count of the resume
 * @returns {{score: number, checklist: ChecklistItem[]}}
 */
function scoreFormat(text, wordCount) {
  let score = 0;
  const checklist = [];

  // Word count - ideal range 400-1000 (8 pts)
  if (wordCount >= 400 && wordCount <= 1000) {
    score += 8;
    checklist.push({ status: 'pass', message: `Word count (${wordCount}) is in ideal range (400-1000)` });
  } else if (wordCount >= 300 && wordCount <= 1200) {
    score += 5;
    checklist.push({ status: 'warn', message: `Word count (${wordCount}) is acceptable but not ideal (aim for 400-1000)` });
  } else if (wordCount < 300) {
    score += 2;
    checklist.push({ status: 'fail', message: `Resume too short (${wordCount} words) — ATS may flag as incomplete` });
  } else {
    score += 3;
    checklist.push({ status: 'warn', message: `Resume may be too long (${wordCount} words) — consider trimming to 1-2 pages` });
  }

  // No tables/images detected (6 pts)
  const hasTableIndicators = /\t{2,}|(\|.*\|.*\|)|(┌|┐|└|┘|├|┤|─|│)/.test(text);
  const hasImageIndicators = /\[image\]|\[picture\]|\[photo\]|\.png|\.jpg|\.jpeg|\.gif|embedded/i.test(text);

  if (!hasTableIndicators && !hasImageIndicators) {
    score += 6;
    checklist.push({ status: 'pass', message: 'No tables or images detected — clean ATS-friendly format' });
  } else {
    if (hasTableIndicators) {
      score += 2;
      checklist.push({ status: 'fail', message: 'Table formatting detected — ATS cannot parse tables correctly' });
    }
    if (hasImageIndicators) {
      score += 1;
      checklist.push({ status: 'fail', message: 'Image references detected — ATS cannot read images' });
    }
  }

  // Consistent formatting (6 pts)
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const inconsistencies = [];

  // Check for excessive blank lines
  const excessiveBlanks = text.match(/\n{4,}/g);
  if (excessiveBlanks) {
    inconsistencies.push('excessive blank lines');
  }

  // Check for mixed bullet styles
  const bulletStyles = new Set();
  lines.forEach(l => {
    if (/^\s*•/.test(l)) bulletStyles.add('•');
    if (/^\s*-\s/.test(l)) bulletStyles.add('-');
    if (/^\s*\*\s/.test(l)) bulletStyles.add('*');
    if (/^\s*\d+[\.\)]/.test(l)) bulletStyles.add('numbered');
  });
  if (bulletStyles.size > 2) {
    inconsistencies.push('mixed bullet styles');
  }

  // Check for very long lines (potential parsing issues)
  const longLines = lines.filter(l => l.length > 200);
  if (longLines.length > 3) {
    inconsistencies.push('very long lines (may indicate poor formatting)');
  }

  if (inconsistencies.length === 0) {
    score += 6;
    checklist.push({ status: 'pass', message: 'Formatting appears consistent and well-structured' });
  } else if (inconsistencies.length === 1) {
    score += 4;
    checklist.push({ status: 'warn', message: `Minor formatting issue: ${inconsistencies[0]}` });
  } else {
    score += 2;
    checklist.push({ status: 'fail', message: `Multiple formatting issues: ${inconsistencies.join(', ')}` });
  }

  return { score, checklist };
}

/**
 * Escape special regex characters in a string.
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for RegExp
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Run the complete ATS scoring analysis on a resume.
 * Evaluates across 5 weighted categories totaling 100 points.
 *
 * @param {string} resumeText - The full text content of the resume
 * @param {string} roleSlug - Target role slug from keywords database (e.g., 'aws-devops')
 * @param {Object} [options] - Additional options
 * @param {number} [options.wordCount] - Pre-calculated word count (calculated if not provided)
 * @returns {ATSResult} Complete scoring result with breakdown and recommendations
 *
 * @example
 * const result = scoreResume(resumeText, 'aws-devops');
 * console.log(result.score); // 72
 * console.log(result.breakdown.keywords); // 18
 * console.log(result.keywordsMissing); // ['Terraform', 'ArgoCD', ...]
 */
export function scoreResume(resumeText, roleSlug, options = {}) {
  if (!resumeText || typeof resumeText !== 'string') {
    return {
      score: 0,
      breakdown: { contact: 0, sections: 0, keywords: 0, contentQuality: 0, format: 0 },
      checklist: [{ status: 'fail', message: 'No resume text provided for analysis' }],
      keywordsFound: [],
      keywordsMissing: getAllKeywords(roleSlug)
    };
  }

  const wordCount = options.wordCount || resumeText.split(/\s+/).filter(w => w.length > 0).length;

  // Run all scoring modules
  const contactResult = scoreContact(resumeText);
  const sectionsResult = scoreSections(resumeText);
  const keywordsResult = scoreKeywords(resumeText, roleSlug);
  const contentResult = scoreContentQuality(resumeText);
  const formatResult = scoreFormat(resumeText, wordCount);

  // Compile total score
  const totalScore = contactResult.score + sectionsResult.score +
                     keywordsResult.score + contentResult.score + formatResult.score;

  // Compile all checklist items
  const checklist = [
    ...contactResult.checklist,
    ...sectionsResult.checklist,
    ...keywordsResult.checklist,
    ...contentResult.checklist,
    ...formatResult.checklist
  ];

  return {
    score: Math.min(totalScore, 100),
    breakdown: {
      contact: contactResult.score,
      sections: sectionsResult.score,
      keywords: keywordsResult.score,
      contentQuality: contentResult.score,
      format: formatResult.score
    },
    checklist,
    keywordsFound: keywordsResult.keywordsFound,
    keywordsMissing: keywordsResult.keywordsMissing
  };
}

/**
 * Get a human-readable grade for the ATS score.
 * @param {number} score - ATS score (0-100)
 * @returns {{grade: string, label: string, color: string}} Grade information
 */
export function getScoreGrade(score) {
  if (score >= 85) return { grade: 'A+', label: 'Excellent — highly ATS-optimized', color: '#22c55e' };
  if (score >= 75) return { grade: 'A', label: 'Strong — good ATS compatibility', color: '#4ade80' };
  if (score >= 65) return { grade: 'B+', label: 'Good — minor improvements needed', color: '#84cc16' };
  if (score >= 55) return { grade: 'B', label: 'Average — several areas to improve', color: '#eab308' };
  if (score >= 45) return { grade: 'C', label: 'Below Average — significant gaps', color: '#f97316' };
  if (score >= 30) return { grade: 'D', label: 'Poor — major revision needed', color: '#ef4444' };
  return { grade: 'F', label: 'Failing — resume likely filtered out by ATS', color: '#dc2626' };
}

/**
 * Get the maximum points for each scoring category.
 * @returns {Object} Maximum points per category
 */
export function getMaxPoints() {
  return {
    contact: 15,
    sections: 20,
    keywords: 25,
    contentQuality: 20,
    format: 20,
    total: 100
  };
}

export default scoreResume;
