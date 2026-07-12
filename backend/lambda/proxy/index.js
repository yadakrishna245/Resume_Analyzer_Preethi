const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  };
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    let { messages, provider, apiKey, model, baseUrl, temperature, max_tokens } = body;

    if (!messages) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing messages in request body' }) };
    }

    // Default provider mode: use shared key with fallback
    if (!apiKey || provider === 'default') {
      const SHARED_KEY = process.env.SHARED_API_KEY || '';
      if (!SHARED_KEY) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'No API key provided and no shared key configured. Please add your own API key.' }) };
      }
      apiKey = SHARED_KEY;
      provider = 'openrouter';
      baseUrl = 'https://openrouter.ai/api/v1';
      // Try multiple free models in order
      if (!model) model = 'openrouter/free';
    }

    let targetUrl, reqHeaders, reqBody;

    if (provider === 'gemini') {
      const m = model || 'gemini-2.0-flash';
      targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      reqHeaders = { 'Content-Type': 'application/json' };
      const sysMsg = messages.find(x => x.role === 'system');
      const otherMsgs = messages.filter(x => x.role !== 'system');
      reqBody = JSON.stringify({ contents: otherMsgs.map(x => ({ role: x.role === 'assistant' ? 'model' : 'user', parts: [{ text: x.content }] })), systemInstruction: sysMsg ? { parts: [{ text: sysMsg.content }] } : undefined, generationConfig: { temperature: temperature || 0.7, maxOutputTokens: max_tokens || 2048 } });
    } else if (provider === 'anthropic') {
      const sysMsg = messages.find(x => x.role === 'system');
      const otherMsgs = messages.filter(x => x.role !== 'system');
      targetUrl = 'https://api.anthropic.com/v1/messages';
      reqHeaders = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
      reqBody = JSON.stringify({ model: model || 'claude-sonnet-4-20250514', max_tokens: max_tokens || 2048, system: sysMsg?.content || '', messages: otherMsgs });
    } else {
      const url = baseUrl || 'https://api.groq.com/openai/v1';
      targetUrl = `${url}/chat/completions`;
      reqHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
      if (provider === 'openrouter') { reqHeaders['HTTP-Referer'] = 'https://ai-resume-analyzer.app'; reqHeaders['X-Title'] = 'AI Resume Analyzer'; }
      reqBody = JSON.stringify({ model: model || 'llama-3.3-70b-versatile', messages, temperature: temperature || 0.7, max_tokens: max_tokens || 2048 });
    }

    const res = await fetch(targetUrl, { method: 'POST', headers: reqHeaders, body: reqBody });
    const data = await res.text();
    if (!res.ok) { return { statusCode: res.status, headers, body: data }; }
    const parsed = JSON.parse(data);
    let content = '';
    if (provider === 'gemini') { content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''; }
    else if (provider === 'anthropic') { content = parsed.content?.[0]?.text || ''; }
    else { content = parsed.choices?.[0]?.message?.content || ''; }
    return { statusCode: 200, headers, body: JSON.stringify({ choices: [{ message: { content } }], usage: parsed.usage || null }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
module.exports = { handler };
