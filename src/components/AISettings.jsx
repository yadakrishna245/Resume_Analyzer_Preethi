/**
 * AISettings.jsx - Collapsible AI Settings Panel
 * 
 * Features:
 * - Provider dropdown with MODEL DROPDOWN per provider (not text input)
 * - API keys are SESSION ONLY — cleared on page refresh (never persisted)
 * - Test connection button (real API test)
 * - Privacy note
 */
import React, { useState, useContext } from 'react';
import { 
  Settings, ChevronDown, ChevronUp, Check, AlertCircle, 
  Loader2, Shield, Eye, EyeOff 
} from 'lucide-react';
import { AppContext } from '../App.jsx';

// ============================================
// AI Providers with their available models
// ============================================
const AI_PROVIDERS = [
  { 
    id: 'default', 
    name: 'Default (Free — no key needed)', 
    requiresKey: false,
    models: [],
    defaultUrl: ''
  },
  { 
    id: 'groq', 
    name: 'Groq', 
    requiresKey: true, 
    defaultUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Versatile)' },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B (Versatile)' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32K context)' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
    ]
  },
  { 
    id: 'gemini', 
    name: 'Google Gemini', 
    requiresKey: true, 
    defaultUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Latest)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Stable)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Advanced)' },
    ]
  },
  { 
    id: 'openrouter', 
    name: 'OpenRouter', 
    requiresKey: true, 
    defaultUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'openrouter/free', name: '🔄 Auto (Free Router - picks best available)' },
      { id: 'google/gemma-4-31b-it:free', name: 'Google Gemma 4 31B (Free)' },
      { id: 'tencent/hy3:free', name: 'Tencent Hy3 295B (Free, Best)' },
      { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'NVIDIA Nemotron 3 Super (Free)' },
      { id: 'openai/gpt-oss-120b:free', name: 'OpenAI GPT-OSS 120B (Free)' },
      { id: 'openai/gpt-oss-20b:free', name: 'OpenAI GPT-OSS 20B (Free, Fast)' },
      { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google Gemma 4 26B MoE (Free)' },
      { id: 'nvidia/nemotron-nano-9b-v2:free', name: 'NVIDIA Nemotron Nano 9B (Free, Fast)' },
    ]
  },
  { 
    id: 'claude', 
    name: 'Claude (Anthropic)', 
    requiresKey: true, 
    defaultUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Latest)' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Fast)' },
    ]
  },
  { 
    id: 'openai', 
    name: 'OpenAI (GPT)', 
    requiresKey: true, 
    defaultUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Latest)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cheap)' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Budget)' },
    ]
  },
  { 
    id: 'nvidia', 
    name: 'NVIDIA NIM', 
    requiresKey: true, 
    defaultUrl: 'https://integrate.api.nvidia.com/v1',
    models: [
      { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
      { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
      { id: 'mistralai/mixtral-8x7b-instruct-v0.1', name: 'Mixtral 8x7B' },
      { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B' },
    ]
  },
  { 
    id: 'custom', 
    name: 'Custom (OpenAI-compatible)', 
    requiresKey: true, 
    defaultUrl: '',
    models: []
  },
];

function AISettings() {
  const { aiProvider, setAiProvider, aiConfig, setAiConfig } = useContext(AppContext);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [testMessage, setTestMessage] = useState('');

  // No localStorage loading — keys are session-only

  const currentProvider = AI_PROVIDERS.find(p => p.id === aiProvider) || AI_PROVIDERS[0];
  const needsConfig = currentProvider.requiresKey;
  const hasModels = currentProvider.models && currentProvider.models.length > 0;

  /**
   * Handle provider change
   */
  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    const providerInfo = AI_PROVIDERS.find(p => p.id === newProvider);
    setAiProvider(newProvider);
    setAiConfig({
      model: providerInfo?.models?.[0]?.id || '',
      baseUrl: providerInfo?.defaultUrl || '',
      apiKey: '', // Clear key when switching providers
    });
    setTestStatus(null);
    setTestMessage('');
  };

  /**
   * Handle model change from dropdown
   */
  const handleModelChange = (e) => {
    setAiConfig(prev => ({ ...prev, model: e.target.value }));
  };

  /**
   * Test connection
   */
  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Testing connection...');

    try {
      const { testConnection } = await import('../engine/aiProviders.js');
      const result = await testConnection(aiProvider, aiConfig.apiKey, {
        model: aiConfig.model,
        baseUrl: aiConfig.baseUrl,
      });

      if (result.success) {
        setTestStatus('success');
        setTestMessage(result.message || 'Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage(result.message || 'Connection failed. Check your API key.');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error.message || 'Connection failed.');
    }
  };

  const getStatusBadge = () => {
    if (!needsConfig) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-green bg-accent-green/10 border border-accent-green/30 rounded-full px-2.5 py-0.5">
          <Check size={12} /> Ready
        </span>
      );
    }
    if (aiConfig.apiKey) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-green bg-accent-green/10 border border-accent-green/30 rounded-full px-2.5 py-0.5">
          <Check size={12} /> Configured
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-yellow bg-accent-yellow/10 border border-accent-yellow/30 rounded-full px-2.5 py-0.5">
        <AlertCircle size={12} /> Key needed
      </span>
    );
  };

  return (
    <div className="card">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-navy-700 rounded-lg flex items-center justify-center group-hover:bg-navy-600 transition-colors">
            <Settings size={18} className="text-gray-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">AI Provider Settings</h3>
            <p className="text-xs text-gray-400 mt-0.5">{currentProvider.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </button>

      {/* Expandable Panel */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-navy-600 space-y-4 animate-slide-down">
          {/* Provider Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">AI Provider</label>
            <select value={aiProvider} onChange={handleProviderChange} className="input-field">
              {AI_PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {needsConfig && (
            <div className="space-y-4 animate-fade-in">
              {/* Model Dropdown (or text input for custom) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                {hasModels ? (
                  <select value={aiConfig.model} onChange={handleModelChange} className="input-field">
                    {currentProvider.models.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., llama-3.1-70b-versatile"
                    className="input-field"
                  />
                )}
              </div>

              {/* Base URL (only show for custom provider) */}
              {aiProvider === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
                  <input
                    type="url"
                    value={aiConfig.baseUrl}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://api.provider.com/v1"
                    className="input-field"
                  />
                </div>
              )}

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder={currentProvider.id === 'groq' ? 'gsk_...' : currentProvider.id === 'gemini' ? 'AIza...' : 'sk-...'}
                    className="input-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  🔒 Key is session-only — cleared when you close or refresh the page.
                </p>
              </div>
            </div>
          )}

          {/* Test connection */}
          {needsConfig && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleTestConnection}
                disabled={!aiConfig.apiKey || testStatus === 'testing'}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                {testStatus === 'testing' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : testStatus === 'success' ? (
                  <Check size={16} className="text-accent-green" />
                ) : testStatus === 'error' ? (
                  <AlertCircle size={16} className="text-accent-red" />
                ) : null}
                Test connection
              </button>
            </div>
          )}

          {/* Test result */}
          {testMessage && (
            <p className={`text-sm break-words ${
              testStatus === 'success' ? 'text-accent-green' : 
              testStatus === 'error' ? 'text-accent-red' : 'text-gray-400'
            }`}>
              {testMessage}
            </p>
          )}

          {/* Privacy Note */}
          <div className="flex items-start gap-2 pt-2 border-t border-navy-600">
            <Shield size={16} className="text-accent-green mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400">
              <span className="text-gray-300 font-medium">Privacy:</span>{' '}
              Your API keys stay in your browser only — never sent to our servers. Keys are cleared on page refresh.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AISettings;
