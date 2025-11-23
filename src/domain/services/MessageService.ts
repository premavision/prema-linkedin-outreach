import { LLMClient } from '../../infra/llm/LLMClient';
import { MessageRepository } from '../../infra/persistence/repository/MessageRepository';
import { TargetRepository } from '../../infra/persistence/repository/TargetRepository';

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

  updateMessage(id: number, data: { content?: string; status?: 'DRAFT' | 'APPROVED' | 'DISCARDED' }) {
    return this.messageRepo.updateMessage(id, data);
  }

  exportApproved() {
    return this.messageRepo.listApproved();
  }
}

export { MessageService };
