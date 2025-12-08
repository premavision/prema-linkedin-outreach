import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import type { TargetStatus } from '../models/Target.js';
import type { CreateTargetInput } from '../../infra/persistence/repository/TargetRepository.js';
import { TargetRepository } from '../../infra/persistence/repository/TargetRepository.js';

const targetCsvSchema = z.object({
  name: z.string().min(1, "Name is required"),
  linkedinUrl: z.string()
    .url("Invalid URL format")
    .refine((val) => val.includes('linkedin.com/'), { message: "Must be a valid LinkedIn URL (e.g. https://www.linkedin.com/in/...)" }),
  role: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
});

export class TargetService {
  constructor(private targetRepo: TargetRepository) {}

  async importCsv(buffer: Buffer) {
    const records = parse(buffer.toString('utf-8'), { columns: true, skip_empty_lines: true }) as Record<string, string>[];
    
    const parsed: CreateTargetInput[] = [];
    const errors: string[] = [];

    records.forEach((record, index) => {
      const rawData = {
          name: record.name ?? record.Name,
          linkedinUrl: record.linkedinUrl ?? record.LinkedIn ?? record.url,
          role: record.role ?? record.Role,
          company: record.company ?? record.Company,
      };

      const result = targetCsvSchema.safeParse(rawData);

      if (result.success) {
          parsed.push({ ...result.data, status: 'NOT_VISITED' });
      } else {
          // Check if we can save as BROKEN
          // We need at least name and linkedinUrl to satisfy DB constraints
          if (rawData.name && rawData.linkedinUrl) {
              parsed.push({
                  name: rawData.name,
                  linkedinUrl: rawData.linkedinUrl,
                  role: rawData.role || null,
                  company: rawData.company || null,
                  status: 'BROKEN'
              });
          } else {
              const issues = result.error.issues;
              const rowErrors = issues.map(e => {
                  const field = e.path ? e.path.join('.') : '';
                  return field ? `${field}: ${e.message}` : e.message;
              }).join(', ');
              errors.push(`Row ${index + 2}: ${rowErrors}`);
          }
      }
    });

    if (errors.length > 0) {
        // Return a structured error message that's easy to read
        const summary = `Import failed. Found errors in ${errors.length} row(s):`;
        // Limit to first 10 errors to avoid huge messages
        const details = errors.slice(0, 10).join('\n');
        const more = errors.length > 10 ? `\n...and ${errors.length - 10} more errors.` : '';
        throw new Error(`${summary}\n${details}${more}`);
    }

    if (parsed.length === 0) {
        throw new Error('No valid records found in CSV');
    }

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
