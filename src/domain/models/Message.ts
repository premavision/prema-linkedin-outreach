export type MessageStatus = 'DRAFT' | 'APPROVED' | 'DISCARDED';

export interface Message {
  id: number;
  targetId: number;
  variant: string;
  content: string;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
}
