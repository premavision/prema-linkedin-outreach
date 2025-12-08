import type { LLMClient } from '../../infra/llm/LLMClient.js';
import { MessageRepository } from '../../infra/persistence/repository/MessageRepository.js';
import { TargetRepository } from '../../infra/persistence/repository/TargetRepository.js';

class MessageService {
  constructor(private llmClient: LLMClient, private messageRepo: MessageRepository, private targetRepo: TargetRepository) {}

  async generate(targetId: number, offerContext: string, count = 2) {
    const target = await this.targetRepo.findById(targetId);
    if (!target) throw new Error('Target not found');
    const profileSummary = target.profile?.about ?? target.profile?.headline ?? null;
    const drafts = await this.llmClient.generateOutreachDrafts({
      name: target.name,
      role: target.role,
      company: target.company,
      profileSummary,
      offerContext,
      count,
    });
    await this.messageRepo.createMany(drafts.map((d) => ({ ...d, targetId })));
    await this.targetRepo.updateStatus(targetId, 'MESSAGE_DRAFTED');
    return this.messageRepo.listByTarget(targetId);
  }

  list(targetId: number) {
    return this.messageRepo.listByTarget(targetId);
  }

  async updateMessage(id: number, data: { content?: string; status?: 'DRAFT' | 'APPROVED' | 'DISCARDED' }) {
    const message = await this.messageRepo.updateMessage(id, data);

    if (data.status === 'APPROVED') {
      // Unapprove others
      const allMessages = await this.messageRepo.listByTarget(message.targetId);
      const others = allMessages.filter((m) => m.id !== id && m.status === 'APPROVED');
      for (const other of others) {
        await this.messageRepo.updateMessage(other.id, { status: 'DRAFT' });
      }
      
      await this.targetRepo.updateStatus(message.targetId, 'APPROVED');
    } else if (data.status === 'DRAFT') {
      // If unapproving, check if there are any other approved messages
      const messages = await this.messageRepo.listByTarget(message.targetId);
      const hasApproved = messages.some((m) => m.status === 'APPROVED');
      if (!hasApproved) {
        await this.targetRepo.updateStatus(message.targetId, 'MESSAGE_DRAFTED');
      }
    }

    return message;
  }

  async discardAll(targetId: number) {
    const messages = await this.messageRepo.listByTarget(targetId);
    for (const msg of messages) {
      if (msg.status !== 'DISCARDED') {
        await this.messageRepo.updateMessage(msg.id, { status: 'DISCARDED' });
      }
    }
    
    // Also update target status back to PROFILE_SCRAPED if it was MESSAGE_DRAFTED or APPROVED
    const target = await this.targetRepo.findById(targetId);
    if (target && (target.status === 'MESSAGE_DRAFTED' || target.status === 'APPROVED')) {
       await this.targetRepo.updateStatus(targetId, 'PROFILE_SCRAPED');
    }
  }

  async regenerate(targetId: number, offerContext: string, count = 2) {
    // Mark all existing as DISCARDED
    const existing = await this.messageRepo.listByTarget(targetId);
    for (const msg of existing) {
      if (msg.status !== 'DISCARDED') {
        await this.messageRepo.updateMessage(msg.id, { status: 'DISCARDED' });
      }
    }
    
    // Generate new ones
    return this.generate(targetId, offerContext, count);
  }

  deleteMessage(id: number) {
    return this.messageRepo.deleteMessage(id);
  }

  exportApproved() {
    return this.messageRepo.listApproved();
  }
}

export { MessageService };
