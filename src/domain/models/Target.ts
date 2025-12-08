export type TargetStatus = 'NOT_VISITED' | 'PROFILE_SCRAPED' | 'MESSAGE_DRAFTED' | 'APPROVED' | 'EXPORTED' | 'BROKEN';

export interface Target {
  id: number;
  name: string;
  linkedinUrl: string;
  role?: string | null;
  company?: string | null;
  status: TargetStatus;
  createdAt: Date;
  updatedAt: Date;
}
