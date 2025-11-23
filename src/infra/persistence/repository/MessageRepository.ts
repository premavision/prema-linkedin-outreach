import { MessageStatus } from '../../../domain/models/Message';
import { prisma } from '../prismaClient';

export interface CreateMessageInput {
  targetId: number;
  variant: string;
  content: string;
}

export class MessageRepository {
  async createMany(messages: CreateMessageInput[]) {
    await prisma.message.createMany({ data: messages });
  }

  async listByTarget(targetId: number) {
    return prisma.message.findMany({ where: { targetId }, orderBy: { createdAt: 'asc' } });
  }

  async updateMessage(id: number, data: { content?: string; status?: MessageStatus }) {
    return prisma.message.update({ where: { id }, data });
  }

  async listApproved() {
    return prisma.message.findMany({ where: { status: 'APPROVED' }, include: { target: true } });
  }
}
