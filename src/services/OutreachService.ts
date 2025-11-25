import type { LLMClient } from '../infra/llm/LLMClient.js';
import { ProfileRepository } from '../infra/persistence/repository/ProfileRepository.js';
import { TargetRepository } from '../infra/persistence/repository/TargetRepository.js';

export class OutreachService {
    constructor(
        private llmClient: LLMClient,
        private profileRepo: ProfileRepository,
        private targetRepo: TargetRepository
    ) { }

    async generateDrafts(targetId: number, context?: string) {
        const profile = await this.profileRepo.findByTargetId(targetId);
        if (!profile) {
            throw new Error(`Profile not found for target ${targetId}`);
        }

        // Get target info to extract name
        const target = await this.targetRepo.findById(targetId);
        if (!target) {
            throw new Error(`Target not found for id ${targetId}`);
        }

        // Use the LLMClient's generateOutreachDrafts method
        const drafts = await this.llmClient.generateOutreachDrafts({
            name: target.name,
            role: profile.currentRole ?? null,
            company: profile.company ?? null,
            profileSummary: profile.about || profile.headline || null,
            offerContext: context || 'We help companies scale their engineering teams.',
            count: 2 // Generate 2 variants by default
        });

        // Return the drafts with metadata
        return {
            targetId,
            drafts,
            createdAt: new Date()
        };
    }
}
