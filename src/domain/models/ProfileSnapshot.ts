export interface ProfileSnapshot {
  id: number;
  targetId: number;
  headline?: string | null;
  about?: string | null;
  currentRole?: string | null;
  company?: string | null;
  location?: string | null;
  industry?: string | null;
  rawHtml?: string | null;
  createdAt: Date;
}
