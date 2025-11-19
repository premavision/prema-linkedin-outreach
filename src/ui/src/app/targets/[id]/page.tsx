'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type Message = {
  id: number;
  variant: string;
  content: string;
  status: string;
};

type TargetDetail = {
  id: number;
  name: string;
  linkedinUrl: string;
  role?: string | null;
  company?: string | null;
  profile?: {
    headline?: string | null;
    about?: string | null;
    currentRole?: string | null;
    company?: string | null;
    location?: string | null;
    industry?: string | null;
  } | null;
};

export default function TargetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [target, setTarget] = useState<TargetDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const targetId = Number(params?.id);

  const load = async () => {
    const targetRes = await fetch(`${apiBase}/targets/${targetId}`, { cache: 'no-store' });
    if (targetRes.status === 404) {
      router.push('/');
      return;
    }
    setTarget(await targetRes.json());
    const msgRes = await fetch(`${apiBase}/targets/${targetId}/messages`, { cache: 'no-store' });
    setMessages(await msgRes.json());
  };

  useEffect(() => {
    if (!Number.isNaN(targetId)) {
      load();
    }
  }, [targetId]);

  const updateMessage = async (id: number, data: Partial<Pick<Message, 'content' | 'status'>>) => {
    await fetch(`${apiBase}/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setStatusMessage('Saved');
    await load();
  };

  if (!target) return <main className="p-8">Loading...</main>;

  return (
    <main className="p-8 space-y-6">
      <button className="text-blue-600 underline" onClick={() => router.push('/')}>
        ← Back to dashboard
      </button>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{target.name}</h1>
        <p className="text-gray-600">{target.role} @ {target.company}</p>
        <a className="text-blue-600 underline" href={target.linkedinUrl} target="_blank" rel="noreferrer">
          Open LinkedIn profile
        </a>
      </header>

      <section className="p-4 border rounded space-y-2">
        <h2 className="text-xl font-semibold">Profile snapshot</h2>
        {target.profile ? (
          <div className="space-y-2 text-sm">
            <p><strong>Headline:</strong> {target.profile.headline}</p>
            <p><strong>About:</strong> {target.profile.about}</p>
            <p><strong>Current role:</strong> {target.profile.currentRole}</p>
            <p><strong>Company:</strong> {target.profile.company}</p>
            <p><strong>Location:</strong> {target.profile.location}</p>
            <p><strong>Industry:</strong> {target.profile.industry}</p>
          </div>
        ) : (
          <p className="text-gray-500">Scrape the profile to see details.</p>
        )}
      </section>

      <section className="p-4 border rounded space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Message drafts</h2>
          {statusMessage && <span className="text-green-700 text-sm">{statusMessage}</span>}
        </div>
        {messages.length === 0 && <p className="text-gray-500">Generate drafts to see them here.</p>}
        <div className="space-y-4">
          {messages.map((m) => (
            <article key={m.id} className="border rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <strong>{m.variant}</strong>
                <select
                  value={m.status}
                  onChange={(e) => updateMessage(m.id, { status: e.target.value })}
                  className="border rounded p-1 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="APPROVED">Approved</option>
                  <option value="DISCARDED">Discarded</option>
                </select>
              </div>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows={4}
                value={m.content}
                onChange={(e) => updateMessage(m.id, { content: e.target.value })}
              />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
