/**
 * JDMatchTab.jsx - Job Description Match Tab Component
 * 
 * Uses REAL jdMatcher engine for keyword matching and REAL AI providers
 * for deep semantic comparison. No mock data.
 * 
 * Features:
 * - Textarea for pasting job description
 * - 'Quick keyword match (free)' - uses jdMatcher.js engine (no API needed)
 * - 'Compare with AI' - uses configured AI provider for deep analysis
 * - Results: match score, matched/missing keywords, actionable suggestions
 */
import React, { useState, useContext } from 'react';
import { 
  Zap, Brain, Loader2, Check, X, 
  TrendingUp, AlertCircle, Sparkles, RefreshCw 
} from 'lucide-react';
import { AppContext } from '../App.jsx';
import { quickMatch } from '../engine/jdMatcher.js';
import { callAI } from '../engine/aiProviders.js';
import { getJDComparePrompt } from '../engine/aiPrompts.js';

function JDMatchTab({ data, resumeText, targetRole }) {
  const { aiProvider, aiConfig } = useContext(AppContext);

  const [jobDescription, setJobDescription] = useState('');
  const [matchResult, setMatchResult] = useState(data);
  const [isComparing, setIsComparing] = useState(false);
  const [compareMode, setCompareMode] = useState(''); // 'quick' or 'ai'
  const [error, setError] = useState('');

  // Pre-loaded sample JDs for quick testing
  const SAMPLE_JDS = {
    'wipro-ta': {
      label: '📋 Wipro - Talent Acquisition',
      text: `Job Title: Talent Acquisition Specialist
Company: Wipro Limited
Location: Bengaluru, India
Experience: 3-8 years

About the Role:
We are looking for a Talent Acquisition Specialist to join our HR team at Wipro. The ideal candidate will manage end-to-end recruitment for technology and non-technology roles, build strong talent pipelines, and deliver a world-class candidate experience.

Key Responsibilities:
- Manage full-cycle recruitment including sourcing, screening, interviewing, offer management, and onboarding
- Partner with hiring managers to understand role requirements, team dynamics, and hiring priorities
- Source candidates through multiple channels including LinkedIn Recruiter, Naukri, employee referrals, and recruitment drives
- Conduct initial phone screens and assess candidates for cultural fit and role alignment
- Coordinate interview scheduling across multiple panels and time zones
- Manage offer negotiations, salary benchmarking, and compensation discussions
- Drive campus recruitment and lateral hiring programs
- Maintain recruitment MIS, dashboards, and weekly hiring reports
- Ensure positive candidate experience throughout the hiring lifecycle
- Support employer branding initiatives and recruitment marketing campaigns
- Handle volume hiring for large project ramp-ups with tight timelines
- Ensure compliance with hiring policies, diversity goals, and documentation standards
- Manage vendor relationships with recruitment agencies and job portals
- Conduct background verification coordination and joining formalities
- Support employee onboarding and induction programs

Required Skills & Qualifications:
- 3-8 years of experience in Talent Acquisition / Recruitment (IT services preferred)
- Strong sourcing skills using LinkedIn Recruiter, Naukri, Boolean search
- Experience with ATS tools (Workday, Taleo, SuccessFactors, or similar)
- Excellent communication and stakeholder management skills
- Experience in volume hiring and lateral hiring
- Knowledge of recruitment metrics (Time to Fill, Cost per Hire, Source of Hire)
- Strong MS Office skills (Excel, PowerPoint)
- Ability to manage multiple requisitions simultaneously
- Experience in campus recruitment and walk-in drives
- Understanding of IT roles and technology terminology is a plus

Preferred Qualifications:
- MBA/PGDM in HR or equivalent
- SHRM-CP or equivalent HR certification
- Experience with employer branding and recruitment marketing
- Knowledge of labor laws and HR compliance
- Prior experience in IT/ITES talent acquisition

What We Offer:
- Competitive compensation and benefits
- Learning and development opportunities
- Inclusive and diverse work environment
- Career growth in a Fortune 500 company`
    },
    'wipro-hr-recruiter': {
      label: '📋 Wipro - HR Recruiter',
      text: `Job Title: HR Recruiter
Company: Wipro Limited
Location: Bengaluru, India
Experience: 2-5 years

About the Role:
Wipro is hiring an HR Recruiter to support our growing talent needs. You will work closely with business teams to fulfill hiring requirements, manage candidate pipelines, and ensure smooth onboarding processes.

Key Responsibilities:
- Source and screen candidates for various IT and non-IT positions
- Coordinate end-to-end recruitment activities from job posting to offer rollout
- Schedule and coordinate interviews with hiring managers and interview panels
- Manage candidate communication and provide timely status updates
- Conduct reference checks and background verification processes
- Support employee onboarding, induction, and joining formalities
- Maintain accurate records in HRIS/ATS systems
- Generate recruitment reports and MIS for management review
- Coordinate with recruitment agencies and manage vendor relationships
- Support employee engagement activities and HR administration
- Assist in organizing recruitment drives and campus hiring events
- Ensure adherence to company policies and HR compliance standards

Required Skills:
- 2-5 years in HR recruitment or talent acquisition
- Proficiency in job portals (Naukri, LinkedIn, Indeed)
- Good communication and interpersonal skills
- MS Office proficiency (Excel, Word, PowerPoint)
- Experience with HRIS or ATS platforms
- Ability to handle multiple roles and priorities
- Knowledge of employee onboarding processes
- Team player with strong organizational skills

Preferred:
- MBA in HR / PGDM in HRM
- Experience in IT recruitment
- Knowledge of HRMS tools (GreytHR, Darwin Box, SAP HR)
- Understanding of labor compliance and statutory requirements`
    }
  };

  const loadSampleJD = (key) => {
    setJobDescription(SAMPLE_JDS[key].text);
    setError('');
    setMatchResult(null);
  };

  /**
   * Quick keyword match using the REAL jdMatcher engine
   * Runs entirely client-side, no API key needed
   */
  const handleQuickMatch = () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description first.');
      return;
    }
    if (!resumeText?.trim()) {
      setError('No resume text available. Please upload or paste your resume first.');
      return;
    }

    setError('');
    setCompareMode('quick');

    try {
      // Call the REAL jdMatcher engine
      const result = quickMatch(resumeText, jobDescription);

      setMatchResult({
        score: result.score,
        matchedKeywords: result.matched,
        missingKeywords: result.missing,
        extraKeywords: result.extra || [],
        suggestions: generateSuggestions(result),
        mode: 'quick',
      });
    } catch (err) {
      setError(`Matching failed: ${err.message}`);
    }
  };

  /**
   * AI-powered comparison using configured provider
   */
  const handleAICompare = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description first.');
      return;
    }
    if (!resumeText?.trim()) {
      setError('No resume text available. Please upload or paste your resume first.');
      return;
    }
    if (aiProvider === 'default' || !aiConfig.apiKey) {
      setError('Please configure an AI provider with your API key in AI Settings above to use AI comparison.');
      return;
    }

    setError('');
    setIsComparing(true);
    setCompareMode('ai');

    try {
      // Build prompt using template engine
      const { system, user } = getJDComparePrompt(resumeText, jobDescription, targetRole || 'general');
      const messages = [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ];

      // Call the configured AI provider
      const result = await callAI(aiProvider, aiConfig.apiKey, messages, {
        model: aiConfig.model,
        baseUrl: aiConfig.baseUrl,
      });

      if (!result.success) {
        throw new Error(result.error || 'AI comparison failed');
      }

      const responseText = result.content;

      // Parse AI response
      let parsed;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = { summary: responseText, suggestions: [] };
        }
      } catch {
        parsed = { summary: responseText, suggestions: [] };
      }

      // Also run quick match for keywords
      const quickResult = quickMatch(resumeText, jobDescription);

      setMatchResult({
        score: parsed.matchScore || quickResult.score,
        matchedKeywords: parsed.matchedSkills || quickResult.matched,
        missingKeywords: parsed.missingSkills || quickResult.missing,
        suggestions: parsed.suggestions || [],
        aiSummary: parsed.summary || '',
        mode: 'ai',
      });
    } catch (err) {
      let errorMsg = err.message || 'AI comparison failed';
      if (errorMsg.includes('401')) errorMsg = 'Invalid API key. Check AI Settings.';
      if (errorMsg.includes('429')) errorMsg = 'Rate limit reached. Try again shortly.';
      setError(errorMsg);
    } finally {
      setIsComparing(false);
    }
  };

  /**
   * Generate actionable suggestions from match results
   */
  function generateSuggestions(result) {
    const suggestions = [];
    
    if (result.score < 50) {
      suggestions.push('Your resume has low keyword overlap with this JD. Consider tailoring it specifically for this role.');
    }
    if (result.missing.length > 10) {
      suggestions.push(`Add these high-priority missing skills to your resume: ${result.missing.slice(0, 5).join(', ')}`);
    }
    if (result.missing.length > 0 && result.missing.length <= 10) {
      suggestions.push(`Include these missing keywords where relevant: ${result.missing.join(', ')}`);
    }
    if (result.score >= 70) {
      suggestions.push('Good match! Focus on quantifying achievements related to the matched skills.');
    }
    if (result.extra && result.extra.length > 5) {
      suggestions.push('You have extra skills not in the JD — consider removing irrelevant ones to save space.');
    }
    
    return suggestions;
  }

  /**
   * Get score color based on percentage
   */
  const getScoreColor = (score) => {
    if (score >= 75) return 'text-accent-green';
    if (score >= 50) return 'text-accent-gold';
    return 'text-accent-red';
  };

  const getScoreLabel = (score) => {
    if (score >= 75) return 'Strong Match';
    if (score >= 50) return 'Moderate Match';
    if (score >= 30) return 'Weak Match';
    return 'Poor Match';
  };

  return (
    <div className="space-y-6">
      {/* JD Input */}
      <div>
        <p className="text-gray-300 text-sm mb-3">
          Paste a job description below to see how well your resume matches it.
        </p>

        {/* Sample JD Quick Load Buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs text-gray-500 self-center">Load sample JD:</span>
          {Object.entries(SAMPLE_JDS).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => loadSampleJD(key)}
              className="text-xs px-3 py-1.5 rounded-full border border-brand-indigo/30 text-brand-indigo hover:bg-brand-indigo/10 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here (from LinkedIn, Naukri, Indeed...)"
          rows={6}
          className="input-field resize-y min-h-[140px]"
        />
        {jobDescription && (
          <p className="text-xs text-gray-500 mt-1">
            {jobDescription.split(/\s+/).length} words
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleQuickMatch}
          disabled={!jobDescription.trim() || isComparing}
          className="btn-secondary flex items-center justify-center gap-2 flex-1"
        >
          <Zap size={16} />
          Quick keyword match (free)
        </button>
        <button
          onClick={handleAICompare}
          disabled={!jobDescription.trim() || isComparing}
          className="btn-primary flex items-center justify-center gap-2 flex-1"
        >
          {isComparing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {isComparing ? 'Comparing...' : 'Compare with AI'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-accent-red text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Results */}
      {matchResult && (
        <div className="space-y-5 animate-fade-in border-t border-navy-600 pt-5">
          {/* Score */}
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${getScoreColor(matchResult.score)}`}>
              {matchResult.score}%
            </div>
            <div>
              <p className={`font-semibold ${getScoreColor(matchResult.score)}`}>
                {getScoreLabel(matchResult.score)}
              </p>
              <p className="text-gray-400 text-sm">
                {matchResult.mode === 'ai' ? 'AI-powered analysis' : 'Keyword-based match'}
              </p>
            </div>
          </div>

          {/* AI Summary (if AI mode) */}
          {matchResult.aiSummary && (
            <div className="bg-navy-700/50 border border-navy-600 rounded-lg p-4">
              <p className="text-sm text-gray-300">{matchResult.aiSummary}</p>
            </div>
          )}

          {/* Matched Keywords */}
          {matchResult.matchedKeywords?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Check size={14} className="text-accent-green" />
                Keywords Found ({matchResult.matchedKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {matchResult.matchedKeywords.map((kw, i) => (
                  <span key={i} className="tag-success text-xs">
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Keywords */}
          {matchResult.missingKeywords?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <X size={14} className="text-accent-red" />
                Missing from Resume ({matchResult.missingKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {matchResult.missingKeywords.map((kw, i) => (
                  <span key={i} className="tag-error text-xs">
                    ✗ {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {matchResult.suggestions?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <TrendingUp size={14} className="text-accent-gold" />
                Suggestions
              </h4>
              <ul className="space-y-2">
                {matchResult.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-accent-gold mt-1">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default JDMatchTab;
