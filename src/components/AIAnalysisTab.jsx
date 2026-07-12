/**
 * AIAnalysisTab.jsx - AI Analysis Tab (Aviz Academy style)
 * 
 * Display format matching Aviz:
 * - Score circle (85/100) with summary
 * - Strengths card
 * - Weaknesses card
 * - Missing keywords card
 * - ATS formatting issues card
 * - Improvement plan card
 * - Bullet rewrites (YOUR VERSION / STRONGER VERSION)
 */
import React, { useState, useContext } from 'react';
import { 
  Brain, Loader2, Sparkles, RefreshCw, AlertCircle, Key
} from 'lucide-react';
import { AppContext } from '../App.jsx';
import { callAI } from '../engine/aiProviders.js';
import { getAnalysisPrompt } from '../engine/aiPrompts.js';

function AIAnalysisTab({ data, resumeText, targetRole }) {
  const { aiProvider, aiConfig } = useContext(AppContext);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(data);
  const [error, setError] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');

  const hasValidProvider = () => {
    // Default mode uses shared key on Lambda
    if (aiProvider === 'default') return true;
    if (!aiConfig.apiKey) return false;
    return true;
  };

  const handleAnalyze = async () => {
    if (!resumeText?.trim()) {
      setError('No resume text available. Please upload or paste your resume first.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => prev >= 85 ? 85 : prev + Math.random() * 12);
    }, 500);

    try {
      const { system, user } = getAnalysisPrompt(resumeText, targetRole || 'general');
      const messages = [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ];

      // If default mode, pass provider as 'default' so Lambda uses shared key
      const providerToUse = aiProvider === 'default' ? 'default' : aiProvider;
      const keyToUse = aiProvider === 'default' ? 'shared' : aiConfig.apiKey;

      const result = await callAI(providerToUse, keyToUse, messages, {
        model: aiConfig.model,
        baseUrl: aiConfig.baseUrl,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!result.success) {
        throw new Error(result.error || 'AI analysis failed');
      }

      setReviewedBy(result.provider || aiProvider);

      // Parse response
      let parsed;
      const responseText = result.content;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        try {
          let cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          const s = cleaned.indexOf('{');
          const e = cleaned.lastIndexOf('}');
          if (s !== -1 && e > s) {
            parsed = JSON.parse(cleaned.substring(s, e + 1));
          } else throw new Error('No JSON');
        } catch {
          parsed = { summary: responseText.slice(0, 1000), overallRating: 0 };
        }
      }

      // Normalize
      if (parsed.rewrittenBullets) {
        parsed.rewrittenBullets = parsed.rewrittenBullets.map(b => ({
          original: b.original || b.before || b.your_version || '',
          improved: b.improved || b.rewritten || b.stronger_version || b.after || ''
        }));
      }

      setAnalysisResult(parsed);
    } catch (err) {
      clearInterval(progressInterval);
      let errorMsg = err.message || 'Unknown error';
      if (errorMsg.includes('503')) errorMsg = 'AI model is temporarily overloaded. Please try again in a moment.';
      if (errorMsg.includes('401')) errorMsg = 'Invalid API key. Please check your settings.';
      setError(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Loading
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-5">
        <div className="relative">
          <Brain size={48} className="text-accent-orange animate-pulse" />
        </div>
        <p className="text-gray-200 font-medium">Analyzing your resume with AI...</p>
        <div className="w-64 h-2 bg-navy-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent-orange to-yellow-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <AlertCircle size={40} className="text-accent-red" />
        <p className="text-gray-300 text-sm text-center max-w-md">{error}</p>
        <button onClick={() => { setError(''); handleAnalyze(); }} className="btn-primary flex items-center gap-2">
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    );
  }

  // Results - Aviz style
  if (analysisResult) {
    const score = analysisResult.overallRating ? analysisResult.overallRating * 10 : 75;
    const scoreLabel = score >= 80 ? 'Strong resume with minor gaps' : score >= 60 ? 'Good resume, needs improvements' : 'Resume needs significant work';

    return (
      <div className="space-y-4 animate-fade-in">
        {/* Reviewed by badge */}
        {reviewedBy && (
          <p className="text-sm text-gray-400">✓ Reviewed by {reviewedBy}</p>
        )}

        {/* Score + Summary Card */}
        <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-5 flex items-center gap-5">
          {/* Score circle */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-navy-600" />
              <circle cx="50" cy="50" r="40" fill="none" strokeWidth="6" strokeLinecap="round"
                className="stroke-green-400"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-accent-green">{score}</span>
              <span className="text-[9px] text-gray-500">/ 100</span>
            </div>
          </div>
          {/* Summary */}
          <div>
            <h3 className="text-white font-bold text-lg">{scoreLabel}</h3>
            <p className="text-gray-400 text-sm mt-1">{analysisResult.summary}</p>
          </div>
        </div>

        {/* Strengths Card */}
        {analysisResult.strengths?.length > 0 && (
          <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-5">
            <h3 className="text-white font-bold mb-3">💪 Strengths</h3>
            <ul className="space-y-1.5">
              {analysisResult.strengths.map((s, i) => (
                <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                  <span className="text-accent-green mt-0.5">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses Card */}
        {analysisResult.weaknesses?.length > 0 && (
          <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-5">
            <h3 className="text-white font-bold mb-3">⚠️ Weaknesses</h3>
            <ul className="space-y-1.5">
              {analysisResult.weaknesses.map((w, i) => (
                <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                  <span className="text-accent-yellow mt-0.5">•</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Keywords Card */}
        {analysisResult.missingKeywords?.length > 0 && (
          <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-5">
            <h3 className="text-white font-bold mb-3">🔑 Missing keywords to consider</h3>
            <ul className="space-y-1.5">
              {analysisResult.missingKeywords.map((k, i) => (
                <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span> {k}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions / Improvement Plan Card */}
        {analysisResult.suggestions?.length > 0 && (
          <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-5">
            <h3 className="text-white font-bold mb-3">🎆 Improvement plan</h3>
            <ul className="space-y-1.5">
              {analysisResult.suggestions.map((s, i) => (
                <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                  <span className="text-accent-orange mt-0.5">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bullet Rewrites Card */}
        {analysisResult.rewrittenBullets?.length > 0 && (
          <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4">💪 Bullet rewrites</h3>
            <div className="space-y-4">
              {analysisResult.rewrittenBullets.map((b, i) => (
                <div key={i} className="space-y-2">
                  {/* Your version */}
                  <div className="border-l-4 border-red-400/50 bg-red-900/10 rounded-r-lg p-3">
                    <p className="text-[10px] uppercase font-bold text-red-400 tracking-wider mb-1">YOUR VERSION</p>
                    <p className="text-gray-300 text-sm">{b.original}</p>
                  </div>
                  {/* Stronger version */}
                  <div className="border-l-4 border-green-400/50 bg-green-900/10 rounded-r-lg p-3">
                    <p className="text-[10px] uppercase font-bold text-green-400 tracking-wider mb-1">STRONGER VERSION</p>
                    <p className="text-gray-200 text-sm">{b.improved}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Re-analyze */}
        <button onClick={handleAnalyze} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Re-analyze
        </button>
      </div>
    );
  }

  // Initial state
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-5">
      <p className="text-gray-300 text-center max-w-lg">
        Get a recruiter-grade review of your resume — strengths, gaps, missing keywords 
        and rewritten bullet points — from the AI model you configured.
      </p>
      <button onClick={handleAnalyze} className="btn-primary flex items-center gap-2 px-6 py-3 text-base">
        <Sparkles size={18} /> Analyze with AI
      </button>
      {aiProvider === 'default' && (
        <p className="text-xs text-gray-500">Uses shared free AI — no key needed</p>
      )}
    </div>
  );
}

export default AIAnalysisTab;
