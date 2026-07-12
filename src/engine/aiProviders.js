/**
 * @fileoverview AI Provider Integration Module.
 * Provides a unified interface for calling multiple AI providers
 * with automatic fallback chain support.
 * @module engine/aiProviders
 */

/**
 * @typedef {Object} ProviderConfig
 * @property {string} name - Display name of the provider
 * @property {string} slug - Provider identifier
 * @property {string} baseUrl - API base URL
 * @property {string[]} models - Available models for this provider
 * @property {string} defaultModel - Default model to use
 * @property {boolean} needsKey - Whether an API key is required
 * @property {string} keyPlaceholder - Placeholder text for API key input
 * @property {string} keyUrl - URL where user can get an API key
 * @property {string} format - API format ('openai' compatible or 'gemini' custom)
 */

/**
 * @typedef {Object} AIMessage
 * @property {'system'|'user'|'assistant'} role - Message role
 * @property {string} content - Message content
 */

/**
 * @typedef {Object} AIResponse
 * @property {boolean} success - Whether the call succeeded
 * @property {string} content - Response text content
 * @property {string} provider - Which provider handled the request
 * @property {string} model - Which model was used
 * @property {Object} [usage] - Token usage stats if available
 * @property {string} [error] - Error message if failed
 */

/**
 * Provider configurations for all supported AI services.
 * @type {Object.<string, ProviderConfig>}
 */
export const PROVIDERS = {
  groq: {
    name: 'Groq',
    slug: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.3-70b-versatile',
    needsKey: true,
    keyPlaceholder: 'gsk_...',
    keyUrl: 'https://console.groq.com/keys',
    format: 'openai'
  },

  gemini: {
    name: 'Google Gemini',
    slug: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.0-flash'],
    defaultModel: 'gemini-2.0-flash',
    needsKey: true,
    keyPlaceholder: 'AIza...',
    keyUrl: 'https://aistudio.google.com/apikey',
    format: 'gemini'
  },

  openrouter: {
    name: 'OpenRouter',
    slug: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['meta-llama/llama-3.3-70b-instruct:free'],
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    needsKey: true,
    keyPlaceholder: 'sk-or-...',
    keyUrl: 'https://openrouter.ai/keys',
    format: 'openai'
  },

  claude: {
    name: 'Anthropic Claude',
    slug: 'claude',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-20250514'],
    defaultModel: 'claude-sonnet-4-20250514',
    needsKey: true,
    keyPlaceholder: 'sk-ant-...',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    format: 'anthropic'
  },

  openai: {
    name: 'OpenAI',
    slug: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o'],
    defaultModel: 'gpt-4o',
    needsKey: true,
    keyPlaceholder: 'sk-...',
    keyUrl: 'https://platform.openai.com/api-keys',
    format: 'openai'
  },

  nvidia: {
    name: 'NVIDIA',
    slug: 'nvidia',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    models: ['meta/llama-3.1-70b-instruct'],
    defaultModel: 'meta/llama-3.1-70b-instruct',
    needsKey: true,
    keyPlaceholder: 'nvapi-...',
    keyUrl: 'https://build.nvidia.com/',
    format: 'openai'
  },

  custom: {
    name: 'Custom Provider',
    slug: 'custom',
    baseUrl: '',
    models: [],
    defaultModel: '',
    needsKey: true,
    keyPlaceholder: 'your-api-key',
    keyUrl: '',
    format: 'openai'
  }
};

/**
 * Call an AI provider with the unified interface.
 * Automatically routes to the correct API format based on provider config.
 *
 * @param {string} providerSlug - Provider identifier (e.g., 'groq', 'gemini')
 * @param {string} apiKey - API key for authentication
 * @param {AIMessage[]} messages - Array of conversation messages
 * @param {Object} [options] - Additional options
 * @param {string} [options.model] - Override the default model
 * @param {number} [options.temperature=0.7] - Sampling temperature
 * @param {number} [options.maxTokens=4096] - Maximum tokens in response
 * @param {string} [options.baseUrl] - Override base URL (for custom provider)
 * @returns {Promise<AIResponse>} AI response
 *
 * @example
 * const response = await callAI('groq', 'gsk_xxx', [
 *   { role: 'system', content: 'You are a resume analyst.' },
 *   { role: 'user', content: 'Analyze this resume: ...' }
 * ]);
 * console.log(response.content);
 */
export async function callAI(providerSlug, apiKey, messages, options = {}) {
  const provider = PROVIDERS[providerSlug];
  if (!provider && providerSlug !== 'custom' && providerSlug !== 'default') {
    return { success: false, content: '', provider: providerSlug, model: '', error: `Unknown provider: ${providerSlug}` };
  }

  // Default provider: uses shared key on Lambda proxy
  if (providerSlug === 'default') {
    try {
      const response = await callOpenAICompatible('', 'shared', messages, '', 0.7, 2048, 'default');
      return { success: true, content: response.content, provider: 'default', model: 'auto', usage: response.usage };
    } catch (error) {
      return { success: false, content: '', provider: 'default', model: '', error: error.message };
    }
  }

  const config = providerSlug === 'custom'
    ? { ...PROVIDERS.custom, baseUrl: options.baseUrl || '' }
    : provider;

  if (config.needsKey && !apiKey) {
    return { success: false, content: '', provider: providerSlug, model: '', error: 'API key is required' };
  }

  const model = options.model || config.defaultModel;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 4096;

  try {
    let response;

    switch (config.format) {
      case 'gemini':
        response = await callGemini(config.baseUrl, apiKey, messages, model, temperature, maxTokens);
        break;
      case 'anthropic':
        response = await callAnthropic(config.baseUrl, apiKey, messages, model, temperature, maxTokens);
        break;
      case 'openai':
      default:
        response = await callOpenAICompatible(config.baseUrl, apiKey, messages, model, temperature, maxTokens, providerSlug);
        break;
    }

    return {
      success: true,
      content: response.content,
      provider: providerSlug,
      model,
      usage: response.usage || null
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      provider: providerSlug,
      model,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Call OpenAI-compatible API (Groq, OpenRouter, OpenAI, NVIDIA, custom).
 * @param {string} baseUrl - API base URL
 * @param {string} apiKey - API key
 * @param {AIMessage[]} messages - Messages array
 * @param {string} model - Model identifier
 * @param {number} temperature - Temperature
 * @param {number} maxTokens - Max tokens
 * @param {string} providerSlug - Provider identifier for headers
 * @returns {Promise<{content: string, usage: Object}>}
 */
async function callOpenAICompatible(baseUrl, apiKey, messages, model, temperature, maxTokens, providerSlug) {
  // Use VITE_API_ENDPOINT env var; fall back to the deployed URL for convenience
  const PROXY_URL = import.meta.env.VITE_API_ENDPOINT || 'https://783ilka8w4.execute-api.us-east-1.amazonaws.com/';

  const body = {
    messages,
    provider: providerSlug || 'groq',
    apiKey: apiKey,
    model: model || '',
    baseUrl: baseUrl || '',
    temperature,
    max_tokens: Math.min(maxTokens, 2048)
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage || null
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The AI provider took too long to respond.');
    }
    throw err;
  }
}

/**
 * Call Google Gemini API (different format from OpenAI).
 * @param {string} baseUrl - Gemini API base URL
 * @param {string} apiKey - Gemini API key
 * @param {AIMessage[]} messages - Messages array
 * @param {string} model - Model name
 * @param {number} temperature - Temperature
 * @param {number} maxTokens - Max output tokens
 * @returns {Promise<{content: string, usage: Object}>}
 */
async function callGemini(baseUrl, apiKey, messages, model, temperature, maxTokens) {
  const PROXY_URL = import.meta.env.VITE_API_ENDPOINT || 'https://783ilka8w4.execute-api.us-east-1.amazonaws.com/';
  const body = { messages, provider: 'gemini', apiKey, model: model || 'gemini-2.0-flash', baseUrl: baseUrl || '', temperature, max_tokens: Math.min(maxTokens, 2048) };
  const res = await fetch(PROXY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || e.error || `HTTP ${res.status}`); }
  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content || '', usage: data.usage || null };
}

/**
 * Call Anthropic Claude API (Messages API format).
 * @param {string} baseUrl - Anthropic API base URL
 * @param {string} apiKey - Anthropic API key
 * @param {AIMessage[]} messages - Messages array
 * @param {string} model - Model name
 * @param {number} temperature - Temperature
 * @param {number} maxTokens - Max tokens
 * @returns {Promise<{content: string, usage: Object}>}
 */
async function callAnthropic(baseUrl, apiKey, messages, model, temperature, maxTokens) {
  const PROXY_URL = import.meta.env.VITE_API_ENDPOINT || 'https://783ilka8w4.execute-api.us-east-1.amazonaws.com/';
  const body = { messages, provider: 'anthropic', apiKey, model: model || 'claude-sonnet-4-20250514', baseUrl: baseUrl || '', temperature, max_tokens: Math.min(maxTokens, 2048) };
  const res = await fetch(PROXY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || e.error || `HTTP ${res.status}`); }
  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content || '', usage: data.usage || null };
}

/**
 * Test if an API key works for a given provider.
 * Makes a minimal request to verify authentication.
 *
 * @param {string} providerSlug - Provider identifier
 * @param {string} apiKey - API key to test
 * @param {Object} [options] - Additional options
 * @param {string} [options.baseUrl] - Override base URL (for custom provider)
 * @returns {Promise<{success: boolean, message: string, model?: string}>}
 *
 * @example
 * const result = await testConnection('groq', 'gsk_xxx');
 * if (result.success) {
 *   console.log('Connected!', result.model);
 * }
 */
export async function testConnection(providerSlug, apiKey, options = {}) {
  const testMessages = [
    { role: 'user', content: 'Say "connected" in one word.' }
  ];

  const response = await callAI(providerSlug, apiKey, testMessages, {
    ...options,
    temperature: 0,
    maxTokens: 10
  });

  if (response.success) {
    return {
      success: true,
      message: `Successfully connected to ${PROVIDERS[providerSlug]?.name || providerSlug}`,
      model: response.model
    };
  }

  return {
    success: false,
    message: response.error || 'Connection failed'
  };
}

/**
 * Try calling AI with a fallback chain of providers.
 * Attempts each provider in order until one succeeds.
 *
 * @param {Array<{provider: string, apiKey: string}>} providers - Ordered list of providers to try
 * @param {AIMessage[]} messages - Messages to send
 * @param {Object} [options] - Call options (passed to each provider)
 * @returns {Promise<AIResponse>} Response from the first successful provider
 *
 * @example
 * const result = await tryWithFallback(
 *   [
 *     { provider: 'groq', apiKey: 'gsk_...' },
 *     { provider: 'openrouter', apiKey: 'sk-or-...' },
 *     { provider: 'gemini', apiKey: 'AIza...' }
 *   ],
 *   messages
 * );
 * console.log(`Answered by: ${result.provider}`);
 */
export async function tryWithFallback(providers, messages, options = {}) {
  const errors = [];

  for (const { provider, apiKey } of providers) {
    const response = await callAI(provider, apiKey, messages, options);

    if (response.success) {
      return response;
    }

    errors.push(`${provider}: ${response.error}`);
    console.warn(`[aiProviders] ${provider} failed: ${response.error}, trying next...`);
  }

  // All providers failed
  return {
    success: false,
    content: '',
    provider: 'none',
    model: '',
    error: `All providers failed:\n${errors.join('\n')}`
  };
}

/**
 * Get provider configuration by slug.
 * @param {string} providerSlug - Provider identifier
 * @returns {ProviderConfig|null} Provider config or null if not found
 */
export function getProvider(providerSlug) {
  return PROVIDERS[providerSlug] || null;
}

/**
 * Get all available providers as an array.
 * @returns {ProviderConfig[]} Array of provider configurations
 */
export function getAllProviders() {
  return Object.values(PROVIDERS);
}

/**
 * Parse AI response content as JSON (handles markdown code blocks).
 * AI models often wrap JSON in ```json ... ``` blocks.
 *
 * @param {string} content - Raw AI response content
 * @returns {Object|null} Parsed JSON object, or null if parsing fails
 */
export function parseAIResponse(content) {
  if (!content) return null;

  // Try direct JSON parse first
  try {
    return JSON.parse(content);
  } catch {
    // Not direct JSON
  }

  // Try extracting from markdown code block
  const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // Invalid JSON in code block
    }
  }

  // Try finding JSON object/array in the text
  const jsonObjMatch = content.match(/\{[\s\S]*\}/);
  if (jsonObjMatch) {
    try {
      return JSON.parse(jsonObjMatch[0]);
    } catch {
      // Not valid JSON
    }
  }

  return null;
}

export default { callAI, testConnection, tryWithFallback, PROVIDERS };
