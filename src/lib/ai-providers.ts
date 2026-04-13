// AI Provider abstraction — supports multiple vendors for different task types
//
// Task categories:
//   vision  — reading nutrition labels, identifying food in photos
//   text    — parsing pasted nutrition text, structured extraction
//
// Providers:
//   anthropic — Claude Haiku (good vision + text, moderate cost)
//   groq      — Llama models (fast text, very cheap, no vision)
//   gemini    — Gemini Flash (good vision + text, free tier available)

export type AITask = 'vision' | 'text';

export interface AIProvider {
  name: string;
  parseText(text: string, systemPrompt: string): Promise<string>;
  parseImage?(base64: string, mediaType: string, systemPrompt: string, userPrompt: string): Promise<string>;
}

// Provider selection: pick the cheapest provider that supports the task
export function getProvider(task: AITask): AIProvider {
  if (task === 'vision') {
    // Vision requires image support: gemini > anthropic
    if (process.env.GEMINI_API_KEY) return createGeminiProvider();
    if (process.env.ANTHROPIC_API_KEY) return createAnthropicProvider();
    throw new Error('No AI provider configured for vision. Set GEMINI_API_KEY or ANTHROPIC_API_KEY.');
  }

  // Text parsing: groq > gemini > anthropic (cheapest first)
  if (process.env.GROQ_API_KEY) return createGroqProvider();
  if (process.env.GEMINI_API_KEY) return createGeminiProvider();
  if (process.env.ANTHROPIC_API_KEY) return createAnthropicProvider();
  throw new Error('No AI provider configured. Set GROQ_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY.');
}

function createAnthropicProvider(): AIProvider {
  return {
    name: 'anthropic',
    async parseText(text: string, systemPrompt: string) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
      });
      const block = response.content[0];
      return block.type === 'text' ? block.text : '';
    },
    async parseImage(base64: string, mediaType: string, systemPrompt: string, userPrompt: string) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType as 'image/jpeg', data: base64 } },
            { type: 'text', text: userPrompt },
          ],
        }],
      });
      const block = response.content[0];
      return block.type === 'text' ? block.text : '';
    },
  };
}

function createGroqProvider(): AIProvider {
  return {
    name: 'groq',
    async parseText(text: string, systemPrompt: string) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          max_tokens: 1024,
          temperature: 0.1,
        }),
      });
      if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    },
    // No vision support for Groq
  };
}

function createGeminiProvider(): AIProvider {
  return {
    name: 'gemini',
    async parseText(text: string, systemPrompt: string) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
          }),
        },
      );
      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    },
    async parseImage(base64: string, mediaType: string, systemPrompt: string, userPrompt: string) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{
              parts: [
                { inline_data: { mime_type: mediaType, data: base64 } },
                { text: userPrompt },
              ],
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
          }),
        },
      );
      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    },
  };
}
