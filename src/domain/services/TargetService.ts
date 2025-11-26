import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import type { TargetStatus } from '../models/Target.js';
import type { CreateTargetInput } from '../../infra/persistence/repository/TargetRepository.js';
import { TargetRepository } from '../../infra/persistence/repository/TargetRepository.js';

const targetCsvSchema = z.object({
  name: z.string(),
  linkedinUrl: z.string(),
  role: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
});

export class TargetService {
  constructor(private targetRepo: TargetRepository) {}

  async importCsv(buffer: Buffer) {
    const records = parse(buffer.toString('utf-8'), { columns: true, skip_empty_lines: true }) as Record<string, string>[];
    const parsed: CreateTargetInput[] = records.map((record) => {
      const validated = targetCsvSchema.parse({
        name: record.name ?? record.Name,
        linkedinUrl: record.linkedinUrl ?? record.LinkedIn ?? record.url,
        role: record.role ?? record.Role,
        company: record.company ?? record.Company,
      });
      return validated;
    });
    await this.targetRepo.createMany(parsed);
    return this.targetRepo.list();
  }

  listTargets() {
    return this.targetRepo.list();
  }

  getTarget(id: number) {
    return this.targetRepo.findById(id);
  }

  updateStatus(id: number, status: TargetStatus) {
    return this.targetRepo.updateStatus(id, status);
  }
}
