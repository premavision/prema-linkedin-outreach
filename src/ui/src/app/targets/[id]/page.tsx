'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Briefcase, Linkedin, Check, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Textarea } from '@/components/Textarea';

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
  const [savingId, setSavingId] = useState<number | null>(null);

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
    setSavingId(id);
    await fetch(`${apiBase}/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await load();
    setSavingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'DISCARDED': return <Badge variant="destructive">Discarded</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

  if (!target) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading target details...
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4 sm:px-0">
      <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-slate-600 hover:text-slate-900" onClick={() => router.push('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Profile Section */}
        <div className="space-y-8 lg:col-span-1">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Profile Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{target.name}</h2>
                <div className="space-y-1">
                  <p className="text-base text-slate-700 font-medium">{target.role}</p>
                  <p className="text-sm text-slate-500">{target.company}</p>
                </div>
              </div>
              
              <div className="pt-6 border-t space-y-4 text-sm">
                {target.profile ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Headline</label>
                      <p className="text-slate-700 leading-relaxed">{target.profile.headline || '—'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</label>
                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {target.profile.location || '—'}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Industry</label>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        {target.profile.industry || '—'}
                      </div>
                    </div>
                    {target.profile.about && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">About</label>
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-6 hover:line-clamp-none transition-all">
                          {target.profile.about}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                    No profile data scraped yet.
                  </div>
                )}
              </div>

              <div className="pt-4">
                <a href={target.linkedinUrl} target="_blank" rel="noreferrer" className="w-full">
                  <Button variant="outline" className="w-full h-10">
                    <Linkedin className="mr-2 h-4 w-4 text-blue-600" />
                    View on LinkedIn
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages Section */}
        <div className="space-y-8 lg:col-span-2">
          <Card className="h-full border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-5">
              <CardTitle>Message Drafts</CardTitle>
              <Badge variant="outline" className="px-3 py-1 text-xs font-medium">{messages.length} Generated</Badge>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <div className="rounded-full bg-slate-100 p-6 mb-6">
                    <Briefcase className="h-10 w-10 text-slate-400" />
                  </div>
                  <p className="text-xl font-medium text-slate-900">No drafts yet</p>
                  <p className="text-slate-500 mt-2">Generate drafts from the dashboard to get started.</p>
                </div>
              )}
              
              {messages.map((m) => (
                <div key={m.id} className={`rounded-xl border p-6 transition-all shadow-sm ${
                  m.status === 'APPROVED' ? 'border-green-200 bg-green-50/50' : 
                  m.status === 'DISCARDED' ? 'border-red-200 bg-red-50/50 opacity-75' : 
                  'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                }`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">{m.variant}</span>
                      {getStatusBadge(m.status)}
                    </div>
                    <div className="flex gap-2">
                      {m.status !== 'APPROVED' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-100 font-medium"
                          onClick={() => updateMessage(m.id, { status: 'APPROVED' })}
                          disabled={savingId === m.id}
                        >
                          <Check className="h-4 w-4 mr-1.5" /> Approve
                        </Button>
                      )}
                      {m.status !== 'DISCARDED' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 font-medium"
                          onClick={() => updateMessage(m.id, { status: 'DISCARDED' })}
                          disabled={savingId === m.id}
                        >
                          <X className="h-4 w-4 mr-1.5" /> Discard
                        </Button>
                      )}
                      {m.status !== 'DRAFT' && (
                         <Button 
                           size="sm" 
                           variant="ghost"
                           className="text-slate-500"
                           onClick={() => updateMessage(m.id, { status: 'DRAFT' })}
                           disabled={savingId === m.id}
                         >
                           Reset
                         </Button>
                      )}
                    </div>
                  </div>
                  
                  <Textarea
                    className={`min-h-[180px] text-base leading-relaxed p-4 ${
                      m.status === 'APPROVED' ? 'bg-white border-green-200 focus:border-green-400 focus:ring-green-200' : 
                      m.status === 'DISCARDED' ? 'bg-white border-red-200' : 'bg-slate-50 border-slate-200 focus:bg-white'
                    }`}
                    value={m.content}
                    onChange={(e) => updateMessage(m.id, { content: e.target.value })}
                    placeholder="Draft content..."
                  />
                  
                  {savingId === m.id && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 animate-pulse">
                      <div className="h-2 w-2 bg-slate-400 rounded-full" />
                      Saving changes...
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
