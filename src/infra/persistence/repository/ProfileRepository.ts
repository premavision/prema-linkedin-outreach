import type { ProfileSnapshot } from '../../../domain/models/ProfileSnapshot.js';
import { prisma } from '../prismaClient.js';

export interface UpsertProfileInput {
  targetId: number;
  headline?: string | null;
  about?: string | null;
  currentRole?: string | null;
  company?: string | null;
  location?: string | null;
  industry?: string | null;
  rawHtml?: string | null;
}

export class ProfileRepository {
  async findByTargetId(targetId: number): Promise<ProfileSnapshot | null> {
    return prisma.profileSnapshot.findUnique({
      where: { targetId },
    });
  }

  async upsertProfile(data: UpsertProfileInput): Promise<ProfileSnapshot> {
    return prisma.profileSnapshot.upsert({
      where: { targetId: data.targetId },
      update: data,
      create: data,
    });
  }
}
