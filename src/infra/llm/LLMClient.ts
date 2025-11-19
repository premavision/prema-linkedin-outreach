export interface MessageDraft {
  variant: string;
  content: string;
}

export interface LLMClient {
  generateOutreachDrafts(input: {
    name: string;
    role?: string | null;
    company?: string | null;
    profileSummary?: string | null;
    offerContext: string;
    count?: number;
  }): Promise<MessageDraft[]>;
}
