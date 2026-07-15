/**
 * BulkScreening.jsx — Recruiter Mode / Bulk Resume Screening
 * Screen 50+ resumes against skills or a JD in one click.
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  Users, Upload, FileSearch, Download, Filter, X, Plus,
  Trash2, ArrowUpDown, CheckCircle2, AlertCircle, Loader2,
  FileText, Sparkles, ChevronDown
} from 'lucide-react';
import { processBatch, extractSkillsFromJD, exportToCSV } from '../engine/bulkProcessor.js';

const PRESET_SKILLS = [
  'sourcing', 'screening', 'ATS', 'onboarding', 'stakeholder management',
  'recruitment', 'talent acquisition', 'interviewing', 'offer management',
  'vendor management'
];

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.txt';

export default function BulkScreening() {
  // State
  const [files, setFiles] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [inputMode, setInputMode] = useState('manual'); // 'manual' | 'jd'
  const [jdText, setJdText] = useState('');
  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [sortBy, setSortBy] = useState('score');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // --- File handling ---
  const handleFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles);
    setFiles(prev => [...prev, ...fileArray]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  // --- Skills handling ---
  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const parts = skillInput.split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(addSkill);
      setSkillInput('');
    }
  };

  const handleSkillInputBlur = () => {
    if (skillInput.trim()) {
      const parts = skillInput.split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(addSkill);
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => setSkills(prev => prev.filter(s => s !== skill));

  const extractFromJD = () => {
    const extracted = extractSkillsFromJD(jdText);
    const newSkills = [...new Set([...skills, ...extracted])];
    setSkills(newSkills);
  };

  // --- Processing ---
  const handleScreenAll = async () => {
    if (files.length === 0 || skills.length === 0) return;
    setProcessing(true);
    setResults([]);
    setProgress({ current: 0, total: files.length });

    try {
      const batchResults = await processBatch(files, skills, (current, total) => {
        setProgress({ current, total });
      });
      setResults(batchResults);
    } catch (err) {
      console.error('Batch processing error:', err);
    } finally {
      setProcessing(false);
    }
  };

  // --- Export ---
  const handleExportCSV = () => {
    const csv = exportToCSV(getFilteredResults());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-screening-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Clear ---
  const handleClearAll = () => {
    setFiles([]);
    setSkills([]);
    setSkillInput('');
    setJdText('');
    setResults([]);
    setProgress({ current: 0, total: 0 });
  };

  // --- Sorting & Filtering ---
  const getFilteredResults = () => {
    let filtered = [...results];
    if (filterStatus === 'strong') filtered = filtered.filter(r => r.status === 'Strong Match');
    else if (filterStatus === 'moderate') filtered = filtered.filter(r => r.status === 'Moderate');
    else if (filterStatus === 'weak') filtered = filtered.filter(r => r.status === 'Weak');

    if (sortBy === 'score') filtered.sort((a, b) => b.score - a.score);
    else if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'matchCount') filtered.sort((a, b) => b.matchedSkills.length - a.matchedSkills.length);

    return filtered;
  };

  const filteredResults = getFilteredResults();

  // --- RENDER ---
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-indigo/30 text-sm font-medium"
             style={{ background: 'rgba(99,102,241,0.10)', color: '#a5b4fc' }}>
          <Users size={14} />
          Recruiter Mode
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Bulk Resume Screening</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Upload multiple resumes, define your required skills, and instantly rank all candidates by match score.
        </p>
      </div>

      {/* Upload Section */}
      <div className="card-glass">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={18} className="text-brand-indigo" />
          <h2 className="text-lg font-bold text-white">Upload Resumes</h2>
          {files.length > 0 && (
            <span className="ml-auto text-sm text-gray-400">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
          )}
        </div>

        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-brand-indigo bg-brand-indigo/10'
              : 'border-navy-600 hover:border-brand-indigo/50 hover:bg-navy-700/30'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          aria-label="Upload resume files"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <FileText size={40} className="mx-auto mb-3 text-gray-500" />
          <p className="text-gray-300 font-medium">Drop resumes here or click to browse</p>
          <p className="text-gray-500 text-sm mt-1">PDF, DOCX, TXT — up to 50+ files at once</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto space-y-1 pr-2">
            {files.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-700/50 text-sm">
                <FileText size={14} className="text-brand-indigo flex-shrink-0" />
                <span className="text-gray-300 truncate flex-1">{file.name}</span>
                <span className="text-gray-500 text-xs flex-shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-gray-500 hover:text-accent-red transition-colors" aria-label={`Remove ${file.name}`}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills Input Section */}
      <div className="card-glass">
        <div className="flex items-center gap-2 mb-4">
          <FileSearch size={18} className="text-brand-violet" />
          <h2 className="text-lg font-bold text-white">Required Skills</h2>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setInputMode('manual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputMode === 'manual' ? 'bg-brand-indigo text-white' : 'bg-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            Manual Skills
          </button>
          <button
            onClick={() => setInputMode('jd')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputMode === 'jd' ? 'bg-brand-indigo text-white' : 'bg-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            Paste Job Description
          </button>
        </div>

        {inputMode === 'manual' ? (
          <div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onBlur={handleSkillInputBlur}
                placeholder="Type skills separated by commas..."
                className="input-field flex-1"
              />
              <button
                onClick={() => { handleSkillInputBlur(); }}
                className="btn-secondary px-4"
              >
                <Plus size={16} />
              </button>
            </div>
            {/* Preset suggestions */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs text-gray-500 self-center">Suggestions:</span>
              {PRESET_SKILLS.filter(s => !skills.includes(s)).slice(0, 8).map(skill => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border border-navy-600 text-gray-400 hover:border-brand-indigo hover:text-brand-indigo transition-all"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full Job Description here..."
              rows={6}
              className="input-field w-full resize-y mb-3"
            />
            <button
              onClick={extractFromJD}
              disabled={!jdText.trim()}
              className="btn-secondary text-sm"
            >
              <Sparkles size={14} />
              Extract Keywords from JD
            </button>
          </div>
        )}

        {/* Active skills tags */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-navy-600/50">
            <span className="text-xs text-gray-500 self-center mr-1">Active ({skills.length}):</span>
            {skills.map(skill => (
              <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-indigo/20 text-brand-indigo border border-brand-indigo/30">
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-white transition-colors" aria-label={`Remove skill ${skill}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={handleScreenAll}
          disabled={processing || files.length === 0 || skills.length === 0}
          className="btn-brand px-6 py-3 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing {progress.current}/{progress.total}...
            </>
          ) : (
            <>
              <FileSearch size={18} />
              Screen All Resumes
            </>
          )}
        </button>

        {results.length > 0 && (
          <button onClick={handleExportCSV} className="btn-secondary px-4 py-3">
            <Download size={16} />
            Export CSV
          </button>
        )}

        {(files.length > 0 || skills.length > 0 || results.length > 0) && (
          <button onClick={handleClearAll} className="btn-secondary px-4 py-3 text-accent-red border-accent-red/30 hover:bg-accent-red/10">
            <Trash2 size={16} />
            Clear All
          </button>
        )}
      </div>

      {/* Progress bar */}
      {processing && (
        <div className="card-glass">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300 font-medium">Processing resumes...</span>
            <span className="text-sm text-brand-indigo font-bold">{progress.current}/{progress.total}</span>
          </div>
          <div className="w-full h-2 bg-navy-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #6366f1, #a855f7)'
              }}
            />
          </div>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && !processing && (
        <div className="card-glass">
          {/* Results header with filter/sort */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-accent-green" />
              <h2 className="text-lg font-bold text-white">Results</h2>
              <span className="text-sm text-gray-400">({filteredResults.length} of {results.length})</span>
            </div>
            <div className="flex gap-2 sm:ml-auto flex-wrap">
              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field text-sm py-1.5 px-3 w-auto"
              >
                <option value="all">All Candidates</option>
                <option value="strong">Strong Match</option>
                <option value="moderate">Moderate</option>
                <option value="weak">Weak</option>
              </select>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field text-sm py-1.5 px-3 w-auto"
              >
                <option value="score">Sort by Score</option>
                <option value="name">Sort by Name</option>
                <option value="matchCount">Sort by Match Count</option>
              </select>
            </div>
          </div>

          {/* Results table */}
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <div className="inline-block min-w-full px-4 sm:px-6">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider border-b border-navy-600">
                    <th className="pb-3 pr-3 font-semibold">#</th>
                    <th className="pb-3 pr-3 font-semibold">Candidate</th>
                    <th className="pb-3 pr-3 font-semibold hidden md:table-cell">Email</th>
                    <th className="pb-3 pr-3 font-semibold hidden lg:table-cell">Phone</th>
                    <th className="pb-3 pr-3 font-semibold">Score</th>
                    <th className="pb-3 pr-3 font-semibold hidden sm:table-cell">Matched</th>
                    <th className="pb-3 pr-3 font-semibold hidden sm:table-cell">Missing</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700/50">
                  {filteredResults.map((r) => (
                    <tr key={`${r.fileName}-${r.rank}`} className="hover:bg-navy-700/30 transition-colors">
                      <td className="py-3 pr-3 text-gray-500 font-bold">{r.rank}</td>
                      <td className="py-3 pr-3">
                        <div className="text-white font-medium">{r.name}</div>
                        <div className="text-gray-500 text-xs truncate max-w-[150px]">{r.fileName}</div>
                        {r.error && <div className="text-accent-red text-xs mt-0.5">⚠ {r.error}</div>}
                      </td>
                      <td className="py-3 pr-3 text-gray-300 hidden md:table-cell text-xs">{r.email || '—'}</td>
                      <td className="py-3 pr-3 text-gray-300 hidden lg:table-cell text-xs">{r.phone || '—'}</td>
                      <td className="py-3 pr-3">
                        <span className={`text-lg font-black ${
                          r.score > 75 ? 'text-accent-green' : r.score >= 50 ? 'text-yellow-400' : 'text-accent-red'
                        }`}>
                          {r.score}%
                        </span>
                      </td>
                      <td className="py-3 pr-3 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {r.matchedSkills.slice(0, 4).map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-green/15 text-accent-green border border-accent-green/25">
                              {s}
                            </span>
                          ))}
                          {r.matchedSkills.length > 4 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] text-gray-400">+{r.matchedSkills.length - 4}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-3 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {r.missingSkills.slice(0, 3).map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-red/15 text-accent-red border border-accent-red/25">
                              {s}
                            </span>
                          ))}
                          {r.missingSkills.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] text-gray-400">+{r.missingSkills.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.status === 'Strong Match'
                            ? 'bg-accent-green/15 text-accent-green border border-accent-green/30'
                            : r.status === 'Moderate'
                            ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30'
                            : 'bg-accent-red/15 text-accent-red border border-accent-red/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Filter size={24} className="mx-auto mb-2 opacity-50" />
              <p>No candidates match the current filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!processing && results.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-gray-400">Ready to screen</p>
          <p className="text-sm mt-1">Upload resumes and add skills to get started.</p>
        </div>
      )}
    </div>
  );
}
