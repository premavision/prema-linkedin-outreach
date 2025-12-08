import OpenAI from 'openai';
import type { LLMClient, MessageDraft } from './LLMClient.js';
import { outreachPrompt } from './promptTemplates.js';

export class OpenAILLMClient implements LLMClient {
  private client: OpenAI;

  constructor(apiKey: string, private model: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateOutreachDrafts(input: {
    name: string;
    role?: string | null;
    company?: string | null;
    profileSummary?: string | null;
    offerContext: string;
    count?: number;
  }): Promise<MessageDraft[]> {
    const count = input.count ?? 2;
    const prompt = outreachPrompt({ ...input, count });
    console.log('--- OpenAI Prompt ---');
    console.log(prompt);
    console.log('---------------------');
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'system', content: 'You draft concise LinkedIn outreach messages that sound human and kind.' }, { role: 'user', content: prompt }],
      temperature: 0.8,
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const variants = text.split('---MESSAGE_SEPARATOR---').map((v) => v.trim()).filter((v) => v.length > 0);
    const drafts = variants.slice(0, count).map((content, idx) => ({ variant: `V${idx + 1}`, content }));
    return drafts.length ? drafts : [{ variant: 'V1', content: text.trim() }];
  }
}
