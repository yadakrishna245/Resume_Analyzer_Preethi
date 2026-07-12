/**
 * ATSScoreTab.jsx - ATS Score Display Component
 * 
 * Displays results from the REAL atsScorer engine.
 * Engine returns: { score, breakdown: {contact, sections, keywords, contentQuality, format},
 *                   checklist: [{status, message}], keywordsFound:[], keywordsMissing:[] }
 * 
 * Features:
 * - Circular progress with score and grade
 * - Breakdown bars with actual/max points
 * - Checklist with pass/warn/fail indicators
 * - Found/missing keyword tags
 */
import React from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { getScoreGrade, getMaxPoints } from '../engine/atsScorer.js';

// ============================================
// Max points for each category
// ============================================
const MAX_POINTS = getMaxPoints();

// Category display labels and their max points
const BREAKDOWN_CONFIG = {
  contact: { label: 'Contact & links', max: MAX_POINTS.contact },
  sections: { label: 'Sections & structure', max: MAX_POINTS.sections },
  keywords: { label: 'Keywords', max: MAX_POINTS.keywords },
  contentQuality: { label: 'Content quality', max: MAX_POINTS.contentQuality },
  format: { label: 'Format & length', max: MAX_POINTS.format },
};

/**
 * Get score info for the circular display
 */
function getScoreInfo(score) {
  if (score >= 80) return { label: 'Excellent — ATS optimized 🔥', emoji: '🔥', color: 'text-accent-green', strokeClass: 'stroke-green-400' };
  if (score >= 65) return { label: 'Good — minor fixes needed 👍', emoji: '👍', color: 'text-accent-green', strokeClass: 'stroke-green-400' };
  if (score >= 50) return { label: 'Fair — needs improvement 📝', emoji: '📝', color: 'text-accent-yellow', strokeClass: 'stroke-yellow-400' };
  if (score >= 35) return { label: 'Below average — significant gaps', emoji: '⚠️', color: 'text-accent-yellow', strokeClass: 'stroke-yellow-400' };
  return { label: 'Poor — major revision needed', emoji: '❌', color: 'text-accent-red', strokeClass: 'stroke-red-400' };
}

/**
 * CircularProgress - SVG circular score indicator
 */
function CircularProgress({ score }) {
  const scoreInfo = getScoreInfo(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div className="flex items-center gap-5">
      {/* Circle */}
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64" cy="64" r={radius}
            fill="none" stroke="currentColor" strokeWidth="8"
            className="text-navy-600"
          />
          <circle
            cx="64" cy="64" r={radius}
            fill="none" strokeWidth="8" strokeLinecap="round"
            className={scoreInfo.strokeClass}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${scoreInfo.color}`}>{score}</span>
          <span className="text-[10px] text-gray-500">/ 100</span>
        </div>
      </div>
      {/* Label */}
      <div>
        <p className={`text-lg font-semibold ${scoreInfo.color}`}>
          {scoreInfo.label}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {score >= 80 
            ? 'Your resume is well-optimized for ATS systems.' 
            : 'Fix the items flagged below to push your score above 80 and improve your shortlisting chances.'}
        </p>
      </div>
    </div>
  );
}

/**
 * BreakdownBar - Shows actual/max points with a progress bar
 */
function BreakdownBar({ label, score, max }) {
  const percentage = Math.round((score / max) * 100);
  
  const getBarColor = (pct) => {
    if (pct >= 75) return 'bg-accent-green';
    if (pct >= 50) return 'bg-accent-yellow';
    return 'bg-accent-red';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm font-medium text-gray-200">{score} / {max}</span>
      </div>
      <div className="h-2 bg-navy-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getBarColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * ChecklistItem - Individual checklist item with status icon
 */
function ChecklistItem({ message, status }) {
  const icons = {
    pass: <Check size={14} className="text-accent-green" />,
    warn: <AlertTriangle size={14} className="text-accent-yellow" />,
    fail: <X size={14} className="text-accent-red" />,
  };

  const bgColors = {
    pass: 'bg-accent-green/10 border-accent-green/30',
    warn: 'bg-accent-yellow/10 border-accent-yellow/30',
    fail: 'bg-accent-red/10 border-accent-red/30',
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center border flex-shrink-0 ${bgColors[status]}`}>
        {icons[status]}
      </div>
      <span className={`text-sm ${status === 'pass' ? 'text-gray-400' : 'text-gray-300'}`}>
        {message}
      </span>
    </div>
  );
}

/**
 * Main ATSScoreTab Component
 * Expects data from calculateATSScore() engine function
 */
function ATSScoreTab({ data }) {
  if (!data) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p>No ATS score data available. Upload a resume and click "Check my ATS Score".</p>
      </div>
    );
  }

  const { score, breakdown, checklist, keywordsFound, keywordsMissing } = data;

  // Separate checklist by status for display order (fails first, then warns, then passes)
  const sortedChecklist = [...(checklist || [])].sort((a, b) => {
    const order = { fail: 0, warn: 1, pass: 2 };
    return (order[a.status] || 2) - (order[b.status] || 2);
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ---- Score + Label ---- */}
      <CircularProgress score={score} />

      {/* ---- Breakdown Bars ---- */}
      <div className="space-y-3">
        {Object.entries(BREAKDOWN_CONFIG).map(([key, config]) => (
          <BreakdownBar
            key={key}
            label={config.label}
            score={breakdown[key] || 0}
            max={config.max}
          />
        ))}
      </div>

      {/* ---- Checklist & Fixes ---- */}
      {sortedChecklist.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-200 mb-3">
            Checklist & fixes
          </h3>
          <div className="space-y-0.5">
            {sortedChecklist.map((item, index) => (
              <ChecklistItem
                key={index}
                message={item.message}
                status={item.status}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---- Keywords Found ---- */}
      {keywordsFound?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-200 mb-3">
            Keywords found for this role
          </h3>
          <div className="flex flex-wrap gap-2">
            {keywordsFound.map((keyword, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">
                ✓ {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ---- Keywords Missing ---- */}
      {keywordsMissing?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-200 mb-3">
            Missing keywords to add
          </h3>
          <div className="flex flex-wrap gap-2">
            {keywordsMissing.map((keyword, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-red/10 text-accent-red border border-accent-red/20">
                ✗ {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ATSScoreTab;
