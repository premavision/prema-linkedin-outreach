import type { TargetStatus } from '../../../domain/models/Target.js';
import { prisma } from '../prismaClient.js';

export interface CreateTargetInput {
  name: string;
  linkedinUrl: string;
  role?: string | null | undefined;
  company?: string | null | undefined;
  status?: TargetStatus;
  sessionId?: string;
}

export class TargetRepository {
  async createMany(targets: CreateTargetInput[]) {
    // SQLite doesn't support skipDuplicates in createMany
    // Use individual creates with error handling to skip duplicates
    const results = await Promise.allSettled(
      targets.map((target) =>
        prisma.target.create({ 
          data: {
            name: target.name,
            linkedinUrl: target.linkedinUrl,
            role: target.role ?? null,
            company: target.company ?? null,
            status: target.status ?? 'NOT_VISITED',
            sessionId: target.sessionId ?? 'default',
          }
        })
      )
    );
    
    // Log any errors but don't fail - duplicates are expected
    const errors = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    if (errors.length > 0) {
      const duplicateErrors = errors.filter((e) => {
        const reason = e.reason as { code?: string; message?: string } | undefined;
        return reason?.code === 'P2002' || reason?.message?.includes('UNIQUE constraint');
      });
      if (duplicateErrors.length < errors.length) {
        // Some non-duplicate errors occurred
        const otherErrors = errors.filter((e) => {
          const reason = e.reason as { code?: string; message?: string } | undefined;
          return reason?.code !== 'P2002' && !reason?.message?.includes('UNIQUE constraint');
        });
        const errorMessages = otherErrors
          .map((e) => {
            const reason = e.reason as { message?: string } | undefined;
            return reason?.message || 'Unknown error';
          })
          .join(', ');
        throw new Error(`Failed to create some targets: ${errorMessages}`);
      }
      // All errors were duplicates, which is fine
    }
  }

  async list(skip?: number, take?: number, status?: string, sessionId: string = 'default') {
    const where: any = { sessionId };
    if (status && status !== 'ALL') {
        where.status = status;
    }
    
    const [items, total, statsData] = await Promise.all([
      prisma.target.findMany({ 
        where,
        orderBy: { createdAt: 'desc' },
        ...(skip !== undefined ? { skip } : {}),
        ...(take !== undefined ? { take } : {}),
      }),
      prisma.target.count({ where }),
      prisma.target.groupBy({
        by: ['status'],
        where, // Apply session filter to stats too
        _count: { status: true }
      })
    ]);
    
    const stats: Record<string, number> = {};
    statsData.forEach(g => { stats[g.status] = g._count.status });
    
    return { items, total, stats };
  }

  async findById(id: number) {
    return prisma.target.findUnique({ where: { id }, include: { profile: true, messages: true } });
  }

  async updateStatus(id: number, status: TargetStatus) {
    return prisma.target.update({ where: { id }, data: { status } });
  }
}
