'use client';

import { FormEvent, useEffect, useState } from 'react';

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
  const [offerContext, setOfferContext] = useState('We help teams build safe AI automations that keep humans in control.');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTargets = async () => {
    const res = await fetch(`${apiBase}/targets`, { cache: 'no-store' });
    setTargets(await res.json());
  };

  useEffect(() => {
    loadTargets();
  }, []);

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append('file', importFile);
    const res = await fetch(`${apiBase}/targets/import`, { method: 'POST', body: form });
    if (!res.ok) {
      setError('Import failed');
    }
    await loadTargets();
    setLoading(false);
  };

  const triggerScrape = async (id: number) => {
    setLoading(true);
    await fetch(`${apiBase}/targets/${id}/scrape`, { method: 'POST' });
    await loadTargets();
    setLoading(false);
  };

  const triggerGenerate = async (id: number) => {
    setLoading(true);
    await fetch(`${apiBase}/targets/${id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerContext }),
    });
    await loadTargets();
    setLoading(false);
  };

  return (
    <main className="p-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">LinkedIn Outreach Engine</h1>
        <p className="text-gray-600">
          Draft personalized outreach while keeping a human firmly in control. No auto-sending; review every message.
        </p>
      </header>

      <section className="p-4 border rounded space-y-4">
        <h2 className="text-xl font-semibold">Import targets</h2>
        <form onSubmit={handleImport} className="flex gap-4 items-center">
          <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
          <button className="px-3 py-2 bg-blue-600 text-white rounded" disabled={loading} type="submit">
            Upload CSV
          </button>
          {error && <span className="text-red-600">{error}</span>}
        </form>
        <p className="text-sm text-gray-500">CSV columns: name, linkedinUrl, role, company</p>
      </section>

      <section className="p-4 border rounded space-y-3">
        <label className="text-sm font-medium">Offer context</label>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={offerContext}
          onChange={(e) => setOfferContext(e.target.value)}
        />
      </section>

      <section className="p-4 border rounded space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Targets</h2>
          <a className="text-blue-600 underline" href="/export">
            Export approved messages
          </a>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Role</th>
                <th className="p-2">Company</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <a className="text-blue-600 underline" href={`/targets/${t.id}`}>
                      {t.name}
                    </a>
                  </td>
                  <td className="p-2">{t.role}</td>
                  <td className="p-2">{t.company}</td>
                  <td className="p-2">{t.status}</td>
                  <td className="p-2 space-x-2">
                    <button
                      className="px-3 py-1 bg-gray-800 text-white rounded"
                      onClick={() => triggerScrape(t.id)}
                      disabled={loading}
                    >
                      Scrape profile
                    </button>
                    <button
                      className="px-3 py-1 bg-green-700 text-white rounded"
                      onClick={() => triggerGenerate(t.id)}
                      disabled={loading}
                    >
                      Generate drafts
                    </button>
                    <a className="px-3 py-1 bg-white border rounded" href={t.linkedinUrl} target="_blank">
                      Open LinkedIn
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
