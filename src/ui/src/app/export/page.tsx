'use client';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export default function ExportPage() {
  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Export approved messages</h1>
      <p className="text-gray-600 text-sm">Download a CSV for human review or manual sending. No automation is triggered.</p>
      <a className="px-3 py-2 bg-blue-600 text-white rounded inline-block" href={`${apiBase}/export/approved`}>
        Download CSV
      </a>
    </main>
  );
}
