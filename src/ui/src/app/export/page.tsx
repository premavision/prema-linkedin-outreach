'use client';

import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export default function ExportPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md bg-blue-50 p-4 border border-blue-100">
            <h3 className="font-medium text-blue-900 mb-2">Export Approved Messages</h3>
            <p className="text-sm text-blue-700 mb-4">
              Download a CSV file containing all approved messages. This file is ready for human review or manual sending. 
              The system does not send messages automatically.
            </p>
            <a href={`${apiBase}/export/approved`}>
              <Button className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </a>
          </div>
          
          <div className="text-xs text-slate-500 pt-4 border-t">
            <p>Note: Only messages marked as "Approved" will be included in the export.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
