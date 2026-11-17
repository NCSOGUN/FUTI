const completeChat = async ({ system, messages, temperature = 0.15, maxTokens = 800 }) => {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = (process.env.AI_API_URL || 'https://api.z.ai/api/paas/v4/').replace(/\/$/, '');
  
  if (!apiKey) throw new Error('AI API Key is missing.');

  const modelsToTry = [
    process.env.AI_MODEL || 'glm-4.5-flash',
    ...(process.env.AI_FALLBACK_MODELS || 'glm-4-flash').split(',').map(m => m.trim())
  ];
  
  let lastError = new Error('No models were available.');

  for (const model of modelsToTry) {
    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'system', content: system }, ...messages],
          temperature: temperature,
          max_tokens: maxTokens
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }

      const errorText = await response.text();
      console.log(`[AI Debug] Model ${model} failed:`, errorText);
      throw new Error(errorText);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

module.exports = { completeChat };