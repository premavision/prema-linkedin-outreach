import { LLMClient, MessageDraft } from './LLMClient';
import { outreachPrompt } from './promptTemplates';

export class LocalLLMClient implements LLMClient {
  async generateOutreachDrafts(input: {
    name: string;
    role?: string | null;
    company?: string | null;
    profileSummary?: string | null;
    offerContext: string;
    count?: number;
  }): Promise<MessageDraft[]> {
    const count = input.count ?? 2;
    const base = outreachPrompt({ ...input, count });
    return Array.from({ length: count }).map((_, idx) => ({
      variant: `V${idx + 1}`,
      content: `Hi ${input.name}, I was impressed by your ${input.role ?? 'work'} at ${input.company ?? 'your company'}. ${
        input.offerContext
      }\n\n(Generated locally, prompt reference: ${base.slice(0, 80)}...)`,
    }));
  }
}
