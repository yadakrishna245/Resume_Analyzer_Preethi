/**
 * @fileoverview Client-side resume parser supporting PDF, DOCX, and TXT formats.
 * Uses pdf.js for PDF parsing and mammoth for DOCX parsing.
 * All parsing happens in the browser — no server required.
 * @module engine/resumeParser
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure pdf.js worker
// In a bundled app (Vite/Webpack), the worker is typically served from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * @typedef {Object} ParseResult
 * @property {string} text - Extracted text content from the resume
 * @property {number} wordCount - Total word count
 * @property {string} fileName - Original file name
 * @property {string} fileType - Detected file type ('pdf', 'docx', 'txt')
 */

/**
 * Parse a PDF file and extract its text content.
 * Uses pdf.js (pdfjs-dist) for client-side PDF rendering and text extraction.
 *
 * @param {File} file - PDF File object from file input or drag-and-drop
 * @returns {Promise<ParseResult>} Parsed resume data
 * @throws {Error} If the file cannot be read or parsed as PDF
 *
 * @example
 * const fileInput = document.getElementById('resume-upload');
 * const result = await parsePDF(fileInput.files[0]);
 * console.log(result.text); // "John Doe\nSoftware Engineer\n..."
 */
export async function parsePDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const textParts = [];
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Extract text items and reconstruct lines
      let lastY = null;
      let lineText = '';

      for (const item of textContent.items) {
        if (item.str === undefined) continue;

        // Detect line breaks based on Y position change
        const currentY = item.transform[5];
        if (lastY !== null && Math.abs(currentY - lastY) > 2) {
          textParts.push(lineText.trim());
          lineText = '';
        }

        lineText += item.str + ' ';
        lastY = currentY;
      }

      // Push the last line of the page
      if (lineText.trim()) {
        textParts.push(lineText.trim());
      }

      // Add page separator for multi-page docs
      if (pageNum < totalPages) {
        textParts.push('');
      }
    }

    const text = textParts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const wordCount = countWords(text);

    return {
      text,
      wordCount,
      fileName: file.name,
      fileType: 'pdf'
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF "${file.name}": ${error.message}`);
  }
}

/**
 * Parse a DOCX file and extract its text content.
 * Uses mammoth.js for client-side DOCX parsing.
 * Extracts raw text while preserving structure (headings, lists, paragraphs).
 *
 * @param {File} file - DOCX File object from file input or drag-and-drop
 * @returns {Promise<ParseResult>} Parsed resume data
 * @throws {Error} If the file cannot be read or parsed as DOCX
 *
 * @example
 * const result = await parseDOCX(file);
 * console.log(result.wordCount); // 650
 */
export async function parseDOCX(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Use mammoth to extract raw text (preserves structure better than HTML for our use case)
    const result = await mammoth.extractRawText({ arrayBuffer });

    const text = result.value.replace(/\n{3,}/g, '\n\n').trim();
    const wordCount = countWords(text);

    // Log any conversion warnings (non-critical)
    if (result.messages && result.messages.length > 0) {
      console.warn('[resumeParser] DOCX conversion warnings:', result.messages);
    }

    return {
      text,
      wordCount,
      fileName: file.name,
      fileType: 'docx'
    };
  } catch (error) {
    throw new Error(`Failed to parse DOCX "${file.name}": ${error.message}`);
  }
}

/**
 * Parse a plain text file.
 * Reads the file as UTF-8 text directly.
 *
 * @param {File} file - TXT File object from file input or drag-and-drop
 * @returns {Promise<ParseResult>} Parsed resume data
 * @throws {Error} If the file cannot be read
 *
 * @example
 * const result = await parseTXT(file);
 * console.log(result.fileType); // 'txt'
 */
export async function parseTXT(file) {
  try {
    const text = await file.text();
    const cleanedText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    const wordCount = countWords(cleanedText);

    return {
      text: cleanedText,
      wordCount,
      fileName: file.name,
      fileType: 'txt'
    };
  } catch (error) {
    throw new Error(`Failed to parse text file "${file.name}": ${error.message}`);
  }
}

/**
 * Auto-detect file type and route to the appropriate parser.
 * Supports: .pdf, .docx, .doc, .txt, .text, .md
 *
 * @param {File} file - File object from file input or drag-and-drop
 * @returns {Promise<ParseResult>} Parsed resume data
 * @throws {Error} If the file type is unsupported or parsing fails
 *
 * @example
 * // Works with any supported file type
 * const input = document.querySelector('input[type="file"]');
 * input.addEventListener('change', async (e) => {
 *   const result = await parseResume(e.target.files[0]);
 *   console.log(`Parsed ${result.fileName}: ${result.wordCount} words`);
 * });
 */
export async function parseResume(file) {
  if (!file) {
    throw new Error('No file provided');
  }

  // Determine file type from extension and MIME type
  const fileName = file.name.toLowerCase();
  const mimeType = file.type;

  if (fileName.endsWith('.pdf') || mimeType === 'application/pdf') {
    return parsePDF(file);
  }

  if (fileName.endsWith('.docx') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return parseDOCX(file);
  }

  if (fileName.endsWith('.doc') || mimeType === 'application/msword') {
    // .doc (legacy Word) is not well-supported client-side
    // Attempt to read as text; warn user if garbled
    console.warn('[resumeParser] .doc format has limited support. Consider converting to .docx or .pdf');
    return parseTXT(file);
  }

  if (fileName.endsWith('.txt') || fileName.endsWith('.text') || fileName.endsWith('.md') ||
      mimeType.startsWith('text/')) {
    return parseTXT(file);
  }

  // Unsupported format
  throw new Error(
    `Unsupported file format: "${file.name}" (${mimeType || 'unknown type'}). ` +
    `Supported formats: PDF, DOCX, TXT, MD`
  );
}

/**
 * Count words in a text string.
 * Handles multiple whitespace, newlines, and special characters.
 *
 * @param {string} text - Text to count words in
 * @returns {number} Word count
 */
function countWords(text) {
  if (!text) return 0;
  return text
    .split(/\s+/)
    .filter(word => word.length > 0 && /[a-zA-Z0-9]/.test(word))
    .length;
}

/**
 * Get supported file extensions for the file input accept attribute.
 * @returns {string} Comma-separated file extensions
 */
export function getSupportedExtensions() {
  return '.pdf,.docx,.doc,.txt,.text,.md';
}

/**
 * Get supported MIME types for validation.
 * @returns {string[]} Array of MIME types
 */
export function getSupportedMimeTypes() {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown'
  ];
}

/**
 * Validate file before parsing (size and type checks).
 * @param {File} file - File to validate
 * @param {Object} [options] - Validation options
 * @param {number} [options.maxSizeMB=10] - Maximum file size in megabytes
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateFile(file, options = {}) {
  const maxSizeMB = options.maxSizeMB || 10;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${maxSizeMB}MB` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  const fileName = file.name.toLowerCase();
  const supportedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.text', '.md'];
  const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return { valid: false, error: `Unsupported file type. Accepted: ${supportedExtensions.join(', ')}` };
  }

  return { valid: true };
}

export default parseResume;
