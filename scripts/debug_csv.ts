import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import { z } from 'zod';

const targetCsvSchema = z.object({
  name: z.string().min(1, "Name is required"),
  linkedinUrl: z.string().url("Invalid LinkedIn URL"),
  role: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
});

const fileContent = fs.readFileSync('data/test_mixed_errors.csv');
console.log('File Content:', fileContent.toString());

const records = parse(fileContent.toString('utf-8'), { columns: true, skip_empty_lines: true });
console.log('Parsed Records:', records);

const errors = [];
records.forEach((record, index) => {
    try {
        targetCsvSchema.parse({
            name: record.name ?? record.Name,
            linkedinUrl: record.linkedinUrl ?? record.LinkedIn ?? record.url,
            role: record.role ?? record.Role,
            company: record.company ?? record.Company,
        });
        console.log(`Row ${index + 2}: Valid`);
    } catch (err) {
        if (err instanceof z.ZodError) {
             const issues = err.issues || err.errors;
             const rowErrors = issues.map(e => {
                const field = e.path ? e.path.join('.') : '';
                return field ? `${field}: ${e.message}` : e.message;
            }).join(', ');
            console.log(`Row ${index + 2}: Error - ${rowErrors}`);
            errors.push(`Row ${index + 2}: ${rowErrors}`);
        } else {
            console.log(`Row ${index + 2}: Unknown error`);
        }
    }
});

console.log(`Total errors: ${errors.length}`);
