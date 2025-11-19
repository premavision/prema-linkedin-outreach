import { ProfileSnapshot } from '../../../domain/models/ProfileSnapshot';
import { prisma } from '../prismaClient';

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
  async upsertProfile(data: UpsertProfileInput): Promise<ProfileSnapshot> {
    return prisma.profileSnapshot.upsert({
      where: { targetId: data.targetId },
      update: data,
      create: data,
    });
  }
}
