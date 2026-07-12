/**
 * @fileoverview Job Description Matcher.
 * Extracts technical keywords from job descriptions and compares
 * them against resume content to calculate overlap and gaps.
 * @module engine/jdMatcher
 */

/**
 * @typedef {Object} MatchResult
 * @property {number} score - Match percentage (0-100)
 * @property {string[]} matched - Keywords found in both resume and JD
 * @property {string[]} missing - Keywords in JD but not in resume
 * @property {string[]} extra - Keywords in resume but not in JD (bonus skills)
 */

/**
 * Common non-technical words to filter out during keyword extraction.
 * @const {Set<string>}
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'must',
  'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
  'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her', 'who', 'whom',
  'which', 'what', 'where', 'when', 'how', 'why', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
  'only', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'above',
  'after', 'again', 'also', 'any', 'because', 'before', 'between', 'during',
  'if', 'into', 'through', 'under', 'until', 'up', 'while', 'able',
  'work', 'working', 'experience', 'required', 'preferred', 'including',
  'strong', 'knowledge', 'ability', 'skills', 'using', 'used', 'use',
  'years', 'year', 'team', 'teams', 'role', 'position', 'job',
  'responsibilities', 'requirements', 'qualifications', 'candidate',
  'looking', 'seeking', 'join', 'company', 'organization', 'environment',
  'understanding', 'familiar', 'familiarity', 'proficient', 'proficiency',
  'excellent', 'good', 'great', 'well', 'best', 'based', 'across',
  'within', 'related', 'relevant', 'etc', 'e.g', 'i.e', 'plus',
  'minimum', 'maximum', 'least', 'equivalent', 'similar', 'like'
]);

/**
 * Known technical compound terms that should be kept together.
 * @const {string[]}
 */
const COMPOUND_TERMS = [
  'infrastructure as code', 'ci/cd', 'ci cd', 'continuous integration',
  'continuous delivery', 'continuous deployment', 'blue-green deployment',
  'blue green deployment', 'canary deployment', 'rolling update',
  'high availability', 'disaster recovery', 'load balancing', 'auto scaling',
  'machine learning', 'deep learning', 'version control', 'source control',
  'object storage', 'block storage', 'file storage', 'container orchestration',
  'service mesh', 'api gateway', 'serverless computing', 'event driven',
  'event-driven', 'domain driven design', 'test driven development',
  'shift left', 'shift-left', 'zero trust', 'least privilege',
  'identity and access management', 'single sign-on', 'multi-factor authentication',
  'virtual private cloud', 'content delivery network', 'database management',
  'configuration management', 'change management', 'incident management',
  'chaos engineering', 'site reliability', 'platform engineering',
  'cloud native', 'cloud-native', 'microservices architecture',
  'rest api', 'rest apis', 'graphql api', 'web services',
  'devops', 'devsecops', 'gitops', 'finops', 'mlops', 'aiops',
  'red hat', 'open source', 'real time', 'real-time',
  'well-architected framework', 'well architected framework'
];

/**
 * Known technical terms (single words or abbreviations) to always capture.
 * @const {Set<string>}
 */
const TECH_TERMS = new Set([
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s', 'terraform',
  'ansible', 'jenkins', 'python', 'java', 'javascript', 'typescript',
  'golang', 'go', 'rust', 'bash', 'powershell', 'linux', 'windows',
  'nginx', 'apache', 'redis', 'postgresql', 'postgres', 'mysql',
  'mongodb', 'dynamodb', 'elasticsearch', 'kafka', 'rabbitmq',
  'prometheus', 'grafana', 'datadog', 'splunk', 'kibana',
  'helm', 'argocd', 'flux', 'istio', 'envoy', 'consul', 'vault',
  'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence',
  'ec2', 's3', 'rds', 'lambda', 'ecs', 'eks', 'fargate', 'iam',
  'vpc', 'cloudfront', 'cloudwatch', 'sns', 'sqs', 'kinesis',
  'aurora', 'redshift', 'athena', 'glue', 'sagemaker', 'bedrock',
  'packer', 'vagrant', 'puppet', 'chef', 'saltstack',
  'sonarqube', 'nexus', 'artifactory', 'harbor',
  'circleci', 'travisci', 'tekton', 'spinnaker',
  'agile', 'scrum', 'kanban', 'jira', 'itil',
  'tcp', 'udp', 'http', 'https', 'dns', 'dhcp', 'ssl', 'tls',
  'ssh', 'vpn', 'cidr', 'nat', 'cdn',
  'sql', 'nosql', 'api', 'rest', 'graphql', 'grpc',
  'json', 'yaml', 'xml', 'csv', 'protobuf',
  'oauth', 'saml', 'oidc', 'jwt', 'mfa', 'sso',
  'soc2', 'hipaa', 'pci', 'gdpr', 'fedramp', 'iso27001',
  'cka', 'ckad', 'cks', 'rhcsa', 'rhce', 'cissp', 'ccsp',
  'sli', 'slo', 'sla', 'mttr', 'mttf', 'rpo', 'rto'
]);

/**
 * Extract technical keywords and skills from a text (JD or resume).
 * Uses pattern matching, compound term detection, and tech dictionary lookup.
 *
 * @param {string} text - Job description or resume text
 * @returns {string[]} Array of unique extracted technical keywords (lowercase)
 *
 * @example
 * const jdKeywords = extractKeywords(jobDescriptionText);
 * // ['kubernetes', 'terraform', 'ci/cd', 'aws', 'python', ...]
 */
export function extractKeywords(text) {
  if (!text || typeof text !== 'string') return [];

  const lower = text.toLowerCase();
  const keywords = new Set();

  // Step 1: Find compound terms first
  for (const term of COMPOUND_TERMS) {
    if (lower.includes(term)) {
      keywords.add(term);
    }
  }

  // Step 2: Extract individual technical terms
  // Tokenize - split on whitespace and common separators
  const tokens = lower
    .replace(/[()[\]{}<>]/g, ' ')
    .replace(/[,;:]/g, ' ')
    .replace(/\./g, ' ')
    .split(/\s+/)
    .map(t => t.replace(/^['"]+|['"]+$/g, '').trim())
    .filter(t => t.length > 0);

  for (const token of tokens) {
    // Check if it's a known tech term
    if (TECH_TERMS.has(token)) {
      keywords.add(token);
      continue;
    }

    // Skip stop words and short generic words
    if (STOP_WORDS.has(token) || token.length < 2) {
      continue;
    }

    // Capture terms with special patterns (likely technical)
    // Terms with numbers (e.g., "s3", "ec2", "k8s", "python3")
    if (/^[a-z]+\d+|\d+[a-z]+$/.test(token) && token.length >= 2) {
      keywords.add(token);
      continue;
    }

    // Terms with hyphens or slashes (e.g., "ci/cd", "blue-green")
    if (/[/\-]/.test(token) && token.length >= 3) {
      keywords.add(token);
      continue;
    }

    // All-caps abbreviations (e.g., "AWS", "IAM", "VPC")
    if (/^[A-Z]{2,}$/.test(text.match(new RegExp(`\\b${escapeRegex(token)}\\b`, 'i'))?.[0] || '')) {
      keywords.add(token);
      continue;
    }
  }

  // Step 3: Extract capitalized terms from original text (proper nouns / tools)
  const capitalizedTerms = text.match(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*\b/g) || [];
  for (const term of capitalizedTerms) {
    const lower_term = term.toLowerCase();
    if (!STOP_WORDS.has(lower_term) && lower_term.length >= 3) {
      // Only add if it looks technical (not common English words)
      if (TECH_TERMS.has(lower_term) || /[A-Z]{2,}/.test(term)) {
        keywords.add(lower_term);
      }
    }
  }

  // Step 4: Extract terms in common JD patterns
  // "experience with X", "knowledge of X", "proficiency in X"
  const patternMatches = lower.matchAll(/(?:experience (?:with|in)|knowledge of|proficiency in|familiar with|hands-on with|expertise in)\s+([a-z0-9/\-. ]+?)(?:\.|,|;|\band\b|\bor\b|\n)/g);
  for (const match of patternMatches) {
    const terms = match[1].split(/\s*[,/]\s*/);
    for (const t of terms) {
      const cleaned = t.trim();
      if (cleaned.length >= 2 && !STOP_WORDS.has(cleaned)) {
        keywords.add(cleaned);
      }
    }
  }

  return Array.from(keywords).sort();
}

/**
 * Perform a quick keyword match between resume and job description.
 * Extracts keywords from both texts and calculates overlap.
 *
 * @param {string} resumeText - Full text content of the resume
 * @param {string} jdText - Full text of the job description
 * @returns {MatchResult} Match result with score, matched, missing, and extra keywords
 *
 * @example
 * const result = quickMatch(resumeText, jobDescription);
 * console.log(result.score); // 72
 * console.log(result.missing); // ['terraform', 'argocd', 'helm']
 * console.log(result.extra); // ['ansible', 'puppet'] // resume has but JD doesn't
 */
export function quickMatch(resumeText, jdText) {
  if (!resumeText || !jdText) {
    return { score: 0, matched: [], missing: [], extra: [] };
  }

  const jdKeywords = extractKeywords(jdText);
  const resumeKeywords = extractKeywords(resumeText);

  // Also check resume text directly for JD keywords (handles formatting differences)
  const resumeLower = resumeText.toLowerCase();

  const matched = [];
  const missing = [];

  for (const keyword of jdKeywords) {
    // Check if keyword exists in resume (either extracted or present in text)
    if (resumeKeywords.includes(keyword) || resumeLower.includes(keyword)) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  // Extra: keywords in resume that aren't in JD (bonus/additional skills)
  const jdSet = new Set(jdKeywords);
  const extra = resumeKeywords.filter(k => !jdSet.has(k) && !matched.includes(k));

  // Score is percentage of JD keywords found in resume
  const score = jdKeywords.length > 0
    ? Math.round((matched.length / jdKeywords.length) * 100)
    : 0;

  return {
    score,
    matched: matched.sort(),
    missing: missing.sort(),
    extra: extra.sort()
  };
}

/**
 * Get a detailed match analysis with categorized results.
 * Provides more context than quickMatch for UI display.
 *
 * @param {string} resumeText - Resume text
 * @param {string} jdText - Job description text
 * @returns {Object} Detailed analysis including priority levels for missing keywords
 */
export function detailedMatch(resumeText, jdText) {
  const { score, matched, missing, extra } = quickMatch(resumeText, jdText);

  // Categorize missing keywords by importance (frequency in JD)
  const jdLower = jdText.toLowerCase();
  const missingWithPriority = missing.map(keyword => {
    // Count occurrences in JD — more mentions = higher priority
    const regex = new RegExp(escapeRegex(keyword), 'gi');
    const occurrences = (jdLower.match(regex) || []).length;
    return { keyword, occurrences, priority: occurrences >= 3 ? 'high' : occurrences >= 2 ? 'medium' : 'low' };
  });

  // Sort by priority (high first)
  missingWithPriority.sort((a, b) => b.occurrences - a.occurrences);

  return {
    score,
    matched,
    missing: missingWithPriority,
    extra,
    stats: {
      totalJDKeywords: matched.length + missing.length,
      totalResumeKeywords: matched.length + extra.length,
      matchRate: score,
      highPriorityMissing: missingWithPriority.filter(m => m.priority === 'high').length
    },
    recommendation: getRecommendation(score)
  };
}

/**
 * Get a match recommendation based on score.
 * @param {number} score - Match percentage
 * @returns {{level: string, message: string, color: string}}
 */
function getRecommendation(score) {
  if (score >= 80) {
    return {
      level: 'excellent',
      message: 'Excellent match! Your resume aligns very well with this job description.',
      color: '#22c55e'
    };
  }
  if (score >= 60) {
    return {
      level: 'good',
      message: 'Good match. Add a few missing keywords to strengthen your application.',
      color: '#84cc16'
    };
  }
  if (score >= 40) {
    return {
      level: 'moderate',
      message: 'Moderate match. Consider adding missing high-priority keywords to your resume.',
      color: '#eab308'
    };
  }
  if (score >= 20) {
    return {
      level: 'weak',
      message: 'Weak match. Significant keyword gaps — tailor your resume for this role.',
      color: '#f97316'
    };
  }
  return {
    level: 'poor',
    message: 'Poor match. This role may require skills not reflected in your resume.',
    color: '#ef4444'
  };
}

/**
 * Escape regex special characters.
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default quickMatch;
