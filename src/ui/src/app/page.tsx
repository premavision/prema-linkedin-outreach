'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Upload, User, Building, FileText, Linkedin, Wand2, Loader2, Trash2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import Link from 'next/link';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type Target = {
  id: number;
  name: string;
  linkedinUrl: string;
  role?: string | null;
  company?: string | null;
  status: string;
};

export default function DashboardPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [offerContext, setOfferContext] = useState('We help teams build safe AI automations that keep humans in control.');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [testFiles, setTestFiles] = useState<string[]>([]);
  const [selectedTestFile, setSelectedTestFile] = useState<string>('');

  const LIMIT = 50;

  const getHeaders = () => {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('session_id', sessionId);
    }
    return {
        'x-session-id': sessionId
    };
  };

  const loadTargets = async (currentPage = 1, status: string | null = statusFilter) => {
    try {
      // Load config first
      const configRes = await fetch(`${apiBase}/config/offerContext`, { 
          cache: 'no-store',
          headers: getHeaders()
      });
      if (configRes.ok) {
        const { value } = await configRes.json();
        if (value) setOfferContext(value);
      }

      let url = `${apiBase}/targets?page=${currentPage}&limit=${LIMIT}`;
      if (status && status !== 'ALL') {
        url += `&status=${status}`;
      }

      const res = await fetch(url, { 
          cache: 'no-store',
          headers: getHeaders()
      });
      if (!res.ok) {
        console.error('Failed to load targets:', res.status, res.statusText);
        setTargets([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        // Handle legacy response if backend hasn't updated
        setTargets(data);
        setTotalItems(data.length);
        setGrandTotal(data.length);
        setTotalPages(1);
        setStats({});
      } else {
        setTargets(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / LIMIT) || 1);
        setStats(data.stats || {});
        // Calculate grand total from stats if filtering, or use total if no filter
        if (status) {
             const allCount = Object.values(data.stats || {}).reduce((a, b) => (a as number) + (b as number), 0);
             setGrandTotal(allCount as number);
        } else {
             setGrandTotal(data.total || 0);
        }
      }
    } catch (error) {
      console.error('Error loading targets:', error);
      setTargets([]);
      setError('Unable to connect to API server. Make sure the backend is running on port 4000.');
    }
  };

  useEffect(() => {
    loadTargets(page, statusFilter);
  }, [page, statusFilter]);

  useEffect(() => {
    fetch(`${apiBase}/test-files`)
      .then(res => res.json())
      .then(files => {
         if (Array.isArray(files)) setTestFiles(files);
      })
      .catch(err => console.error('Error loading test files:', err));
  }, []);

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
    setPage(1);
    // useEffect will trigger loadTargets
  };

  const handleSaveConfig = async () => {
    try {
      setSaveStatus('Saving...');
      await fetch(`${apiBase}/config/offerContext`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...getHeaders()
        },
        body: JSON.stringify({ value: offerContext }),
      });
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Error saving config:', error);
      setSaveStatus('Error saving');
    }
  };

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', importFile);
      const res = await fetch(`${apiBase}/targets/import`, { 
          method: 'POST', 
          body: form,
          headers: getHeaders()
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Import failed' }));
        setError(errorData.error || 'Import failed');
      } else {
        setPage(1);
        await loadTargets(1);
      }
    } catch (error) {
      console.error('Error importing targets:', error);
      setError('Unable to connect to API server. Make sure the backend is running.');
    } finally {
      setLoading(false);
      setImportFile(null);
    }
  };

  const handleLoadTestFile = async () => {
    if (!selectedTestFile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/targets/import-test-file`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...getHeaders()
        },
        body: JSON.stringify({ filename: selectedTestFile })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Import failed' }));
        setError(errorData.error || 'Import failed');
      } else {
        setPage(1);
        await loadTargets(1);
        setSelectedTestFile('');
      }
    } catch (error) {
      console.error('Error importing test file:', error);
      setError('Unable to connect to API server.');
    } finally {
      setLoading(false);
    }
  };

    const handleReset = async () => {
    if (!confirm('Are you sure you want to delete all data? This cannot be undone.')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/reset`, { 
          method: 'POST',
          headers: getHeaders()
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Reset failed' }));
        setError(errorData.error || 'Reset failed');
      } else {
        setPage(1);
        await loadTargets(1);
      }
    } catch (error) {
      console.error('Error resetting database:', error);
      setError('Unable to connect to API server.');
    } finally {
      setLoading(false);
    }
  };

  const triggerScrape = async (id: number) => {
    setLoadingId(id);
    try {
      const res = await fetch(`${apiBase}/targets/${id}/scrape`, { 
          method: 'POST',
          headers: getHeaders()
      });
      if (res.ok) {
        await loadTargets(page);
      }
    } catch (error) {
      console.error('Error scraping profile:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const triggerGenerate = async (id: number) => {
    setLoadingId(id);
    try {
      const res = await fetch(`${apiBase}/targets/${id}/generate`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...getHeaders()
        },
        body: JSON.stringify({ offerContext }),
      });
      if (res.ok) {
        await loadTargets(page);
      }
    } catch (error) {
      console.error('Error generating messages:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadge = (rawStatus: string) => {
    const status = rawStatus?.toUpperCase() ?? '';

    const styles: Record<string, string> = {
      NOT_VISITED: 'bg-orange-50 text-orange-700 border-orange-200',
      PROFILE_SCRAPED: 'bg-blue-50 text-blue-700 border-blue-200',
      MESSAGE_DRAFTED: 'bg-purple-50 text-purple-700 border-purple-200',
      APPROVED: 'bg-green-50 text-green-700 border-green-200',
      EXPORTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      BROKEN: 'bg-red-50 text-red-700 border-red-200',
      default: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    const labels: Record<string, string> = {
      NOT_VISITED: 'Not Visited',
      PROFILE_SCRAPED: 'Profile Scraped',
      MESSAGE_DRAFTED: 'Drafts Ready',
      APPROVED: 'Ready to Export',
      EXPORTED: 'Exported',
      BROKEN: 'Broken',
    };

    const style = styles[status] ?? styles.default;
    const label = labels[status] ?? rawStatus ?? 'Unknown';

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
        {label}
      </span>
    );
  };

  // Render dashboard content
  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4 sm:px-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Campaign Dashboard</h1>
          <p className="text-slate-500 mt-3 text-lg">
            Manage targets and generate personalized outreach.
          </p>
        </div>
        <div className="flex items-center gap-3">
                     <Button 
            variant="outline" 
            onClick={handleReset} 
            disabled={loading}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset DB
          </Button>
          <Link href="/export">
            <Button variant="outline">
              Export Approved
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-3">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Upload className="h-5 w-5 text-slate-500" />
              Import Targets
            </CardTitle>
            <CardDescription className="mt-2">Upload a CSV with target details.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleImport} className="space-y-6">
              <div className="grid w-full max-w-sm items-center gap-2">
                <Input 
                  type="file" 
                  accept=".csv" 
                  className="cursor-pointer file:bg-slate-50 file:text-slate-700 file:border-0 file:mr-4 file:py-2.5 file:px-5 file:rounded-full hover:file:bg-slate-100 transition-all h-12"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} 
                />
              </div>
              <Button className="w-full h-11" type="submit" disabled={loading || !importFile} loading={loading}>
                {loading ? 'Uploading...' : 'Upload CSV'}
              </Button>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="whitespace-pre-wrap font-mono text-xs">{error}</div>
                </div>
              )}
              <p className="text-xs text-slate-400 pt-1">
                Columns: name, linkedinUrl, role, company
              </p>
            </form>

            {testFiles.length > 0 && (
                <>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-500">Or load test data</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <select
                            className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            value={selectedTestFile}
                            onChange={(e) => setSelectedTestFile(e.target.value)}
                        >
                            <option value="">Select a test file...</option>
                            {testFiles.map(file => (
                                <option key={file} value={file}>{file}</option>
                            ))}
                        </select>
                        <Button 
                            className="w-full h-11" 
                            variant="secondary"
                            onClick={handleLoadTestFile} 
                            disabled={loading || !selectedTestFile}
                        >
                            Load Selected File
                        </Button>
                    </div>
                </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <FileText className="h-5 w-5 text-slate-500" />
              Offer Context
            </CardTitle>
            <CardDescription className="mt-2 flex items-center justify-between">
              Define the value proposition for your outreach.
              {saveStatus && <span className="text-sm text-blue-600 font-medium">{saveStatus}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              <Textarea
                rows={5}
                className="resize-none focus:ring-blue-500/20 min-h-[140px] text-base"
                value={offerContext}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOfferContext(e.target.value)}
                onBlur={handleSaveConfig}
                placeholder="Describe your offer..."
              />
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5" />
                Used by AI to personalize message drafts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-3">
              <User className="h-6 w-6 text-slate-500" />
              Target List
            </span>
            <div className="flex flex-wrap gap-2 ml-2">
              <button 
                onClick={() => handleStatusFilter(null)}
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                  !statusFilter ? 'bg-slate-800 text-white border-slate-900 shadow-sm' : 'text-slate-600 bg-slate-100 border-slate-200 hover:bg-slate-200 hover:border-slate-300'
                }`}
              >
                {grandTotal} Total
              </button>
              <button 
                onClick={() => handleStatusFilter('NOT_VISITED')}
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                  statusFilter === 'NOT_VISITED' ? 'bg-orange-600 text-white border-orange-700 shadow-sm' : 'text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100'
                }`}
              >
                {stats['NOT_VISITED'] || 0} Not Visited
              </button>
              <button 
                onClick={() => handleStatusFilter('BROKEN')}
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                  statusFilter === 'BROKEN' ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                }`}
              >
                {stats['BROKEN'] || 0} Broken
              </button>
              <button 
                onClick={() => handleStatusFilter('PROFILE_SCRAPED')}
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                  statusFilter === 'PROFILE_SCRAPED' ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
                }`}
              >
                {stats['PROFILE_SCRAPED'] || 0} Scraped
              </button>
              <button 
                onClick={() => handleStatusFilter('MESSAGE_DRAFTED')}
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                  statusFilter === 'MESSAGE_DRAFTED' ? 'bg-purple-600 text-white border-purple-700 shadow-sm' : 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100'
                }`}
              >
                {stats['MESSAGE_DRAFTED'] || 0} Drafts
              </button>
              <button 
                onClick={() => handleStatusFilter('APPROVED')}
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                  statusFilter === 'APPROVED' ? 'bg-green-600 text-white border-green-700 shadow-sm' : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                }`}
              >
                {stats['APPROVED'] || 0} Ready
              </button>
              <button 
                onClick={() => handleStatusFilter('EXPORTED')}
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                  statusFilter === 'EXPORTED' ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                {stats['EXPORTED'] || 0} Exported
              </button>
            </div>
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white shadow-2xl ring-1 ring-slate-100 overflow-hidden">
          <div className="hidden md:grid md:grid-cols-12 bg-slate-50/70 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider font-medium">
            <div className="col-span-3 px-8 lg:px-10 py-5">Name</div>
            <div className="col-span-4 px-8 lg:px-10 py-5">Role & Company</div>
            <div className="col-span-5 px-8 lg:px-10 py-5">Status</div>
          </div>
          <div className="divide-y divide-slate-100">
            {targets.map((t) => (
              <div key={t.id} className="group md:grid md:grid-cols-12 md:items-center odd:bg-white even:bg-slate-50/40 hover:bg-slate-100/60 transition-colors p-5 md:p-0">
                <div className="md:col-span-3 md:px-8 md:lg:px-10 md:py-5 flex justify-between items-start mb-2 md:mb-0">
                  <Link href={`/targets/${t.id}`} className="font-semibold text-base text-slate-900 hover:text-blue-600 hover:underline decoration-blue-200 underline-offset-4 transition-all">
                    {t.name}
                  </Link>
                  <div className="md:hidden">
                    {getStatusBadge(t.status)}
                  </div>
                </div>
                <div className="md:col-span-4 md:px-8 md:lg:px-10 md:py-5 mb-4 md:mb-0">
                  <div className="space-y-1.5">
                    <div className="font-medium text-slate-700 text-sm">{t.role || '—'}</div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Building className="h-3.5 w-3.5" />
                      {t.company || '—'}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-5 md:px-8 md:lg:px-10 md:py-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="hidden md:block">
                    {getStatusBadge(t.status)}
                  </div>
                  <div className="flex justify-end items-center gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {t.status === 'NOT_VISITED' || t.status === 'BROKEN' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200"
                        onClick={() => triggerScrape(t.id)}
                        loading={loadingId === t.id}
                        disabled={loadingId === t.id || t.status === 'BROKEN'}
                      >
                        Scrape
                      </Button>
                    ) : t.status !== 'APPROVED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-500 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200"
                        onClick={() => triggerGenerate(t.id)}
                        loading={loadingId === t.id}
                      >
                        Draft
                      </Button>
                    ) : null}
                    <div className="w-px h-5 bg-slate-200 mx-1 hidden md:block" />
                    {t.status === 'BROKEN' ? (
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-300" disabled>
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    ) : (
                      <a href={t.linkedinUrl} target="_blank" rel="noopener noreferrer" title="Open LinkedIn">
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-[#0077b5] hover:bg-[#0077b5]/10">
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {targets.length === 0 && (
              <div className="p-16 text-center bg-white">
                <div className="flex flex-col items-center gap-4 text-slate-500">
                  <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="h-7 w-7 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-lg text-slate-900">No targets yet</p>
                    <p className="text-slate-500">Upload a CSV file to get started.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Showing <span className="font-medium">{Math.min((page - 1) * LIMIT + 1, totalItems)}</span> to <span className="font-medium">{Math.min(page * LIMIT, totalItems)}</span> of <span className="font-medium">{totalItems}</span> results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium text-slate-700">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
