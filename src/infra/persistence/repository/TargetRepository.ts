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
    await prisma.target.createMany({ data: targets, skipDuplicates: true });
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
