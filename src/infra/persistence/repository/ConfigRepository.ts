import { prisma } from '../prismaClient.js';

export class ConfigRepository {
  async get(key: string): Promise<string | null> {
    const config = await prisma.config.findUnique({ where: { key } });
    return config?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await prisma.config.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
