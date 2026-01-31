import OpenAI from 'openai';
import { EasyInputMessage } from 'openai/resources/responses/responses.mjs';

export const systemPrompt = `You are an ERP incident triage assistant.
Classify incidents into severity (P1, P2, P3) and category (CONFIGURATION, DATA, INTEGRATION, SECURITY, UNKNOWN).
Provide a short summary and a suggested next step.
Use P1 for outages or severe business impact, P2 for major degradation, P3 for minor issues.
Return ONLY valid JSON with keys: severity, category, summary, suggestion.
No extra text, no markdown, no code fences.`;

export const createUserPrompt = (title: string, description: string) => {
  return [`Title: ${title}`, `Description: ${description}`].join('\n');
};

export const createMessages = (userPrompt: string): EasyInputMessage[] => [
  {
    role: 'system',
    content: systemPrompt,
    type: 'message',
  },
  {
    role: 'user',
    content: userPrompt,
    type: 'message',
  },
];

export const createOpenAIClient = (apiKey: string) => new OpenAI({ apiKey });

export const runEnrichment = async (
  client: OpenAI,
  model: string,
  userPrompt: string,
) => {
  const completion = await client.responses.create({
    model,
    input: createMessages(userPrompt),
    temperature: 0.2,
  });

  return completion.output_text ?? '';
};
