import type { MessageStatus } from '../../../domain/models/Message.js';
import { prisma } from '../prismaClient.js';

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

  async deleteMessage(id: number) {
    return prisma.message.delete({ where: { id } });
  }

  async listApproved() {
    return prisma.message.findMany({ where: { status: 'APPROVED' }, include: { target: true } });
  }

  async listNewApproved() {
    return prisma.message.findMany({
      where: {
        status: 'APPROVED',
        target: {
          status: {
            not: 'EXPORTED'
          }
        }
      },
      include: { target: true }
    });
  }

  async countNewApproved() {
    return prisma.message.count({
      where: {
        status: 'APPROVED',
        target: {
          status: {
            not: 'EXPORTED'
          }
        }
      }
    });
  }
}
