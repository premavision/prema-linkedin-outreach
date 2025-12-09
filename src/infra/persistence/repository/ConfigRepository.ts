import { prisma } from '../prismaClient.js';

export class ConfigRepository {
  async get(key: string, sessionId: string = 'default'): Promise<string | null> {
    const config = await prisma.config.findUnique({ 
        where: { 
            key_sessionId: { key, sessionId }
        } 
    });
    return config?.value ?? null;
  }

  async set(key: string, value: string, sessionId: string = 'default'): Promise<void> {
    await prisma.config.upsert({
      where: { 
          key_sessionId: { key, sessionId } 
      },
      update: { value },
      create: { key, value, sessionId },
    });
  }
}
