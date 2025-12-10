'use client';

import { Download, FileSpreadsheet, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { useEffect, useState, useCallback } from 'react';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export default function ExportPage() {
  const [approvedCount, setApprovedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/export/stats?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setApprovedCount(data.count);
    } catch (err) {
      console.error('Failed to load export stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      // Add timestamp to prevent caching
      const res = await fetch(`${apiBase}/export/approved?t=${Date.now()}`);
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkedin-outreach-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh stats to disable button
      await fetchStats();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to download export file');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              Export Data
            </div>
            <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading || isExporting} title="Refresh count">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md bg-blue-50 p-4 border border-blue-100">
            <h3 className="font-medium text-blue-900 mb-2">Export Approved Messages</h3>
            <p className="text-sm text-blue-700 mb-4">
              Download a CSV file containing all approved messages. This file is ready for human review or manual sending. 
              The system does not send messages automatically.
            </p>
            {loading ? (
              <Button disabled className="w-full sm:w-auto">
                Checking...
              </Button>
            ) : approvedCount !== null && approvedCount > 0 ? (
              <Button className="w-full sm:w-auto" onClick={handleExport} disabled={isExporting} loading={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : `Download CSV (${approvedCount} new)`}
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button disabled className="w-full sm:w-auto opacity-50 cursor-not-allowed">
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
                {exportSuccess ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle className="h-4 w-4" />
                    Export successful! Targets marked as exported.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                    <AlertCircle className="h-4 w-4" />
                    No new approved messages to export.
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="text-xs text-slate-500 pt-4 border-t">
            <p>Note: Only messages marked as &quot;Approved&quot; will be included in the export. Exported messages will be marked as &quot;Exported&quot; and won&apos;t be included in future exports.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
