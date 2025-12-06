import type { TargetStatus } from '../../../domain/models/Target.js';
import { prisma } from '../prismaClient.js';

export interface CreateTargetInput {
  name: string;
  linkedinUrl: string;
  role?: string | null | undefined;
  company?: string | null | undefined;
}

export class TargetRepository {
  async createMany(targets: CreateTargetInput[]) {
    // SQLite doesn't support skipDuplicates in createMany
    // Use individual creates with error handling to skip duplicates
    const results = await Promise.allSettled(
      targets.map((target) =>
        prisma.target.create({ data: target })
      )
    );
    
    // Log any errors but don't fail - duplicates are expected
    const errors = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    if (errors.length > 0) {
      const duplicateErrors = errors.filter((e) => 
        e.reason?.code === 'P2002' || e.reason?.message?.includes('UNIQUE constraint')
      );
      if (duplicateErrors.length < errors.length) {
        // Some non-duplicate errors occurred
        const otherErrors = errors.filter((e) => 
          e.reason?.code !== 'P2002' && !e.reason?.message?.includes('UNIQUE constraint')
        );
        throw new Error(`Failed to create some targets: ${otherErrors.map((e) => e.reason?.message).join(', ')}`);
      }
      // All errors were duplicates, which is fine
    }
  }

  async list() {
    return prisma.target.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: number) {
    return prisma.target.findUnique({ where: { id }, include: { profile: true, messages: true } });
  }

  async updateStatus(id: number, status: TargetStatus) {
    return prisma.target.update({ where: { id }, data: { status } });
  }
}
