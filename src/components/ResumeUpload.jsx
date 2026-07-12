/**
 * ResumeUpload.jsx - Resume Upload & Input Section
 * 
 * Features:
 * - Target role dropdown matching the engine keyword database
 * - Drag & drop zone for PDF, DOCX, TXT files
 * - Client-side file parsing (pdf.js, mammoth.js)
 * - File info display after upload (filename, word count)
 * - Expandable textarea for pasting resume text
 * - Two action buttons: 'Check my ATS Score' and 'Compare with a Job Description'
 * - Integrates with the REAL ATS scoring engine (no mock data)
 */
import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, FileText, File, X, ChevronDown, ChevronUp, 
  Target, Loader2, CheckCircle, AlertCircle 
} from 'lucide-react';
import { getAvailableRoles } from '../engine/keywords.js';
import { scoreResume } from '../engine/atsScorer.js';
import { parseResume, validateFile } from '../engine/resumeParser.js';

// ============================================
// Get roles from the actual keyword database
// ============================================
const ENGINE_ROLES = getAvailableRoles();

// Additional common roles (without keyword matching but still usable)
const ADDITIONAL_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'Data Engineer',
  'Machine Learning Engineer',
  'Product Manager',
  'QA Engineer',
  'Mobile Developer',
  'Database Administrator',
  'Network Engineer',
  'Technical Writer',
];

// Combine engine roles (primary, with full scoring) and additional roles
const ALL_ROLES = [
  ...ENGINE_ROLES.map(r => ({ value: r.slug, label: r.title, hasKeywords: true })),
  { value: 'divider', label: '── Other Roles (basic scoring) ──', disabled: true },
  ...ADDITIONAL_ROLES.map(r => ({ value: r.toLowerCase().replace(/\s+/g, '-'), label: r, hasKeywords: false })),
];

// Supported file types (kept for UI display only; validation uses resumeParser.validateFile)
const SUPPORTED_TYPES = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
};

function ResumeUpload({ resumeText, setResumeText, targetRole, setTargetRole, setResults, setActiveTab }) {
  // Component state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  /**
   * Count words in a text string
   */
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  /**
   * Handle file selection (from input or drop).
   * Delegates to resumeParser.js (validateFile + parseResume) instead of
   * duplicating the PDF/DOCX extraction logic here.
   */
  const handleFile = useCallback(async (file) => {
    if (!file) return;

    // Use the engine's validator (handles size, extension, empty file)
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setUploadedFile(file);
    setError('');
    setIsProcessing(true);

    try {
      const parsed = await parseResume(file);
      setResumeText(parsed.text);
      setWordCount(parsed.wordCount);
    } catch (err) {
      console.error('File extraction error:', err);
      setError(`Failed to read file: ${err.message}`);
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, [setResumeText]);

  // ---- Drag & Drop handlers ----
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  /**
   * Handle paste text changes
   */
  const handleTextChange = (e) => {
    const text = e.target.value;
    setResumeText(text);
    setWordCount(countWords(text));
    setUploadedFile(null);
  };

  /**
   * Remove uploaded file
   */
  const clearFile = () => {
    setUploadedFile(null);
    setResumeText('');
    setWordCount(0);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Handle 'Check my ATS Score' button - uses REAL scoring engine
   */
  const handleCheckATS = async () => {
    if (!resumeText.trim()) {
      setError('Please upload a resume or paste your text first.');
      return;
    }
    if (!targetRole) {
      setError('Please select a target role.');
      return;
    }
    
    setIsScoring(true);
    setError('');

    try {
      // Call the REAL ATS scoring engine
      const atsResult = scoreResume(resumeText, targetRole);
      
      setResults({
        ats: atsResult,
        ai: null,
        jd: null,
      });
      setActiveTab('ats');
    } catch (err) {
      console.error('ATS scoring error:', err);
      setError(`Scoring failed: ${err.message}`);
    } finally {
      setIsScoring(false);
    }
  };

  /**
   * Handle 'Compare with a Job Description' button
   */
  const handleCompareJD = () => {
    if (!resumeText.trim()) {
      setError('Please upload a resume or paste your text first.');
      return;
    }
    
    // Switch to JD tab (scoring happens there when JD is provided)
    setResults(prev => prev || { ats: null, ai: null, jd: null });
    setActiveTab('jd');
  };

  return (
    <div className="card space-y-5">
      {/* ---- Section Title ---- */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 bg-accent-orange/20 rounded-full">
          <span className="text-accent-orange font-bold text-sm">1</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Your Resume</h2>
      </div>

      {/* ---- Target Role Dropdown ---- */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Target role
        </label>
        <select
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="input-field appearance-none cursor-pointer"
        >
          <option value="">— Select your target role —</option>
          {ALL_ROLES.map(role => (
            <option 
              key={role.value} 
              value={role.value} 
              disabled={role.disabled}
            >
              {role.label} {role.hasKeywords ? '' : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Roles with full keyword scoring are listed first
        </p>
      </div>

      {/* ---- Drag & Drop Zone ---- */}
      {!uploadedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragging 
              ? 'border-accent-orange bg-accent-orange/5 scale-[1.01]' 
              : 'border-navy-500 hover:border-navy-400 hover:bg-navy-700/30'
            }
          `}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={40} className="text-accent-orange animate-spin" />
              <p className="text-gray-300 font-medium">Extracting text from file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-navy-700 rounded-full flex items-center justify-center">
                <FileText size={24} className="text-gray-400" />
              </div>
              <div>
                <p className="text-gray-200 font-medium">
                  Drop your resume here <span className="text-gray-400">or</span>{' '}
                  <span className="text-accent-orange hover:underline">browse files</span>
                </p>
              </div>
              <p className="text-xs text-gray-500">
                PDF · DOCX · TXT — parsed right here in your browser, never uploaded
              </p>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        /* ---- Uploaded File Info ---- */
        <div className="bg-navy-700/50 border border-accent-green/30 rounded-xl p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-green/10 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-accent-green" />
            </div>
            <div>
              <p className="text-gray-200 font-medium text-sm">{uploadedFile.name}</p>
              <p className="text-xs text-gray-400">
                {wordCount} words extracted
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-2 text-gray-400 hover:text-accent-red hover:bg-accent-red/10 
                       rounded-lg transition-colors duration-200"
            aria-label="Remove file"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ---- Or Paste Text Section ---- */}
      <div>
        <button
          onClick={() => setShowPasteArea(!showPasteArea)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 
                     transition-colors duration-200"
        >
          {showPasteArea ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          ...or paste your resume text instead
        </button>

        {showPasteArea && (
          <div className="mt-3 animate-slide-down">
            <textarea
              value={uploadedFile ? '' : resumeText}
              onChange={handleTextChange}
              placeholder="Paste your full resume text here..."
              rows={8}
              className="input-field resize-y min-h-[120px]"
              disabled={!!uploadedFile}
            />
            {!uploadedFile && resumeText && (
              <p className="text-xs text-gray-400 mt-1">
                {wordCount} words
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---- Error Message ---- */}
      {error && (
        <div className="flex items-center gap-2 text-accent-red text-sm animate-fade-in">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ---- Action Buttons ---- */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={handleCheckATS}
          disabled={!resumeText.trim() || isProcessing || isScoring}
          className="btn-primary flex-1 flex items-center justify-center gap-2 text-base py-3"
        >
          {isScoring ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <span>📊</span>
          )}
          {isScoring ? 'Analyzing...' : 'Check my ATS Score'}
        </button>
        <button
          onClick={handleCompareJD}
          disabled={!resumeText.trim() || isProcessing}
          className="btn-secondary flex-1 flex items-center justify-center gap-2 text-base py-3"
        >
          <span>🎯</span>
          Compare with a Job Description
        </button>
      </div>

      {/* ---- Info Note ---- */}
      <p className="text-xs text-gray-500 text-center">
        The ATS score and quick JD keyword match run instantly on your device — no API key needed. 
        The ✨ AI features use the provider configured above.
      </p>
    </div>
  );
}

export default ResumeUpload;
