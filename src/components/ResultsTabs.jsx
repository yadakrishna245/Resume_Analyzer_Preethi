/**
 * ResultsTabs.jsx - Results Section with Tab Navigation
 * 
 * Features:
 * - 3 tabs: ATS Score, AI Analysis, JD Match
 * - Smooth tab switching with animation
 * - Renders the appropriate tab content component
 * 
 * Design: Horizontal tab bar with active indicator, card container
 */
import React from 'react';
import { BarChart3, Brain, GitCompare } from 'lucide-react';
import ATSScoreTab from './ATSScoreTab.jsx';
import AIAnalysisTab from './AIAnalysisTab.jsx';
import JDMatchTab from './JDMatchTab.jsx';

// ============================================
// Tab definitions
// ============================================
const TABS = [
  { id: 'ats', label: 'ATS Score', icon: BarChart3 },
  { id: 'ai', label: 'AI Analysis', icon: Brain },
  { id: 'jd', label: 'JD Match', icon: GitCompare },
];

function ResultsTabs({ results, activeTab, setActiveTab, resumeText, targetRole }) {
  return (
    <div className="card animate-appear">
      {/* ---- Tab Navigation Bar ---- */}
      <div className="flex border-b border-navy-600 -mx-6 px-6 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium 
                transition-all duration-200 border-b-2 -mb-[1px]
                ${isActive 
                  ? 'text-accent-orange border-accent-orange' 
                  : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-navy-500'
                }
              `}
              aria-selected={isActive}
              role="tab"
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---- Tab Content ---- */}
      <div className="animate-fade-in" role="tabpanel">
        {activeTab === 'ats' && results?.ats && (
          <ATSScoreTab data={results.ats} />
        )}
        {activeTab === 'ai' && (
          <AIAnalysisTab 
            data={results?.ai} 
            resumeText={resumeText} 
            targetRole={targetRole} 
          />
        )}
        {activeTab === 'jd' && (
          <JDMatchTab 
            data={results?.jd} 
            resumeText={resumeText} 
          />
        )}
      </div>
    </div>
  );
}

export default ResultsTabs;
