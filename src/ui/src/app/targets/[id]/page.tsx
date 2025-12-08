'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Check, RotateCw, Loader2, AlertCircle, Search, Wand2, User, Building, MapPin, Trash2, Undo2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/Card';
import { Textarea } from '../../../components/Textarea';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type MessageStatus = 'DRAFT' | 'APPROVED' | 'DISCARDED';

interface Message {
  id: number;
  targetId: number;
  variant: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
}

interface Profile {
  headline?: string;
  currentRole?: string;
  company?: string;
  location?: string;
  about?: string;
}

interface Target {
  id: number;
  name: string;
  linkedinUrl: string;
  role?: string;
  company?: string;
  status: string;
  profile?: Profile | null;
  messages?: Message[];
}

export default function TargetDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [target, setTarget] = useState<Target | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // 'scrape', 'generate', 'save-ID', 'approve-ID'
  const [offerContext, setOfferContext] = useState('We help teams build safe AI automations that keep humans in control.');
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  
  // New error states
  const [offerContextError, setOfferContextError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [targetRes, configRes] = await Promise.all([
        fetch(`${apiBase}/targets/${id}`),
        fetch(`${apiBase}/config/offerContext`, { cache: 'no-store' }),
      ]);

      if (!targetRes.ok) throw new Error('Failed to load target');
      const data = await targetRes.json();
      setTarget(data);
      if (data.messages) {
        setMessages(data.messages);
      }

      if (configRes.ok) {
        const { value } = await configRes.json();
        if (value) setOfferContext(value);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load data. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    setActionLoading('scrape');
    setOperationError(null);
    try {
      const res = await fetch(`${apiBase}/targets/${id}/scrape`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Scrape failed');
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      setOperationError((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerate = async () => {
    setOfferContextError(null);
    setOperationError(null);

    if (!offerContext.trim()) {
      setOfferContextError('Please enter an offer context before generating drafts.');
      return;
    }
    setActionLoading('generate');
    try {
      const res = await fetch(`${apiBase}/targets/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerContext, count: 2 })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }
      const newMessages = await res.json();
      setMessages(newMessages);
      // Refresh target to update status
      const targetRes = await fetch(`${apiBase}/targets/${id}`);
      if (targetRes.ok) {
        const t = await targetRes.json();
        setTarget(t);
      }
    } catch (err) {
      console.error(err);
      setOperationError((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveDraft = async (messageId: number) => {
    const content = edits[messageId];
    if (content === undefined) return; // No changes

    setActionLoading(`save-${messageId}`);
    setOperationError(null);
    try {
      const res = await fetch(`${apiBase}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, status: 'DRAFT' })
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      setMessages(messages.map(m => m.id === messageId ? updated : m));
      // Clear edit state for this message
      setEdits(prev => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
    } catch (err) {
      console.error(err);
      setOperationError('Failed to save draft');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (messageId: number) => {
    setActionLoading(`approve-${messageId}`);
    setOperationError(null);
    try {
      const res = await fetch(`${apiBase}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' })
      });
      if (!res.ok) throw new Error('Approval failed');
      // Re-fetch all messages to ensure we have the correct state for all drafts (e.g. others unapproved)
      const messagesRes = await fetch(`${apiBase}/targets/${id}/messages`);
      if (messagesRes.ok) {
        setMessages(await messagesRes.json());
      }
      // Refresh target to update status badge
      const targetRes = await fetch(`${apiBase}/targets/${id}`);
      if (targetRes.ok) {
        const t = await targetRes.json();
        setTarget(t);
      }
    } catch (err) {
      console.error(err);
      setOperationError('Failed to approve message');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnapprove = async (messageId: number) => {
    setActionLoading(`unapprove-${messageId}`);
    setOperationError(null);
    try {
      const res = await fetch(`${apiBase}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' })
      });
      if (!res.ok) throw new Error('Unapprove failed');
      // Re-fetch all messages to ensure consistent state
      const messagesRes = await fetch(`${apiBase}/targets/${id}/messages`);
      if (messagesRes.ok) {
        setMessages(await messagesRes.json());
      }
      // Refresh target to update status badge
      const targetRes = await fetch(`${apiBase}/targets/${id}`);
      if (targetRes.ok) {
        const t = await targetRes.json();
        setTarget(t);
      }
    } catch (err) {
      console.error(err);
      setOperationError('Failed to unapprove message');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDiscard = async (messageId: number) => {
    // if (!confirm('Are you sure you want to discard this draft?')) return; // Optional confirmation
    setActionLoading(`discard-${messageId}`);
    setOperationError(null);
    try {
      const res = await fetch(`${apiBase}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISCARDED' })
      });
      if (!res.ok) throw new Error('Discard failed');
      // Remove from view by marking discarded
      setMessages(messages.map(m => m.id === messageId ? { ...m, status: 'DISCARDED' } : m));
    } catch (err) {
      console.error(err);
      setOperationError('Failed to discard message');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartOver = async () => {
    if (!confirm('This will discard all current drafts. You will be able to update the context and generate new ones. Continue?')) return;
    setActionLoading('start-over');
    setOperationError(null);
    try {
      const res = await fetch(`${apiBase}/targets/${id}/discard-all`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to discard drafts');
      
      // Refresh messages (should be all discarded/filtered out)
      const messagesRes = await fetch(`${apiBase}/targets/${id}/messages`);
      if (messagesRes.ok) {
        setMessages(await messagesRes.json());
      }
      
      // Refresh target status
      const targetRes = await fetch(`${apiBase}/targets/${id}`);
      if (targetRes.ok) {
        const t = await targetRes.json();
        setTarget(t);
      }
    } catch (err) {
      console.error(err);
      setOperationError('Failed to start over');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTextChange = (id: number, val: string) => {
    setEdits(prev => ({ ...prev, [id]: val }));
  };

  const handleOfferContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOfferContext(e.target.value);
    if (e.target.value.trim()) {
      setOfferContextError(null);
    }
  };

  const getStatusBadge = (rawStatus: string) => {
    const status = rawStatus?.toUpperCase() ?? '';

    const styles: Record<string, string> = {
      NOT_VISITED: 'bg-orange-50 text-orange-700 border-orange-200',
      PROFILE_SCRAPED: 'bg-blue-50 text-blue-700 border-blue-200',
      MESSAGE_DRAFTED: 'bg-purple-50 text-purple-700 border-purple-200',
      APPROVED: 'bg-green-50 text-green-700 border-green-200',
      default: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    const labels: Record<string, string> = {
      NOT_VISITED: 'Not Visited',
      PROFILE_SCRAPED: 'Profile Scraped',
      MESSAGE_DRAFTED: 'Drafts Ready',
      APPROVED: 'Approved',
    };

    const style = styles[status] ?? styles.default;
    let label = labels[status] ?? rawStatus ?? 'Unknown';

    // Override label for APPROVED status
    if (status === 'APPROVED') {
      label = 'Ready to Export';
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Target</h2>
        <p className="text-slate-500 mb-6">{error || 'Target not found'}</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 sm:px-0 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full h-10 w-10 p-0">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{target.name}</h1>
              {getStatusBadge(target.status)}
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
              <Building className="h-3.5 w-3.5" />
              <span>{target.company || 'Unknown Company'}</span>
              <span className="text-slate-300">•</span>
              <span>{target.role || 'Unknown Role'}</span>
            </div>
          </div>
        </div>
        <a href={target.linkedinUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
            View on LinkedIn
          </Button>
        </a>
      </div>

      {operationError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-800 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p>{operationError}</p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Profile Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-slate-500" />
                Profile Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              {target.profile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 block text-xs uppercase tracking-wider font-medium mb-1">Headline</span>
                      <div className="font-medium text-slate-900">{target.profile.headline}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 block text-xs uppercase tracking-wider font-medium mb-1">Location</span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-900">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {target.profile.location}
                      </div>
                    </div>
                    {target.profile.about && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 block text-xs uppercase tracking-wider font-medium mb-1">About</span>
                        <div className="text-slate-700 whitespace-pre-wrap">{target.profile.about}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <Search className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">No profile data yet</p>
                    <p className="text-sm text-slate-500 mt-1">Scrape the LinkedIn profile to get started.</p>
                  </div>
                  <Button 
                    onClick={handleScrape} 
                    disabled={actionLoading === 'scrape'} 
                    loading={actionLoading === 'scrape'}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Scrape Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Outreach Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-slate-500" />
                Outreach Drafts
              </CardTitle>
              <CardDescription>Generated messages based on profile and offer.</CardDescription>
            </CardHeader>
            <CardContent>
              {messages.filter(m => m.status !== 'DISCARDED').length > 0 ? (
                <div className="space-y-8">
                  {messages.filter(m => m.status !== 'DISCARDED').map((msg, idx) => (
                    <div key={msg.id} className="relative group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Option {idx + 1}
                          {msg.status === 'APPROVED' && <span className="ml-2 text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Approved</span>}
                        </span>
                      </div>
                      
                      <Textarea
                        value={edits[msg.id] ?? msg.content}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTextChange(msg.id, e.target.value)}
                        className={`min-h-[200px] text-base leading-relaxed p-4 transition-colors ${
                          msg.status === 'APPROVED' ? 'border-green-200 bg-green-50/30' : ''
                        }`}
                      />
                      
                      <div className="flex items-center justify-end gap-3 mt-3">
                        {edits[msg.id] !== undefined && edits[msg.id] !== msg.content && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSaveDraft(msg.id)}
                            disabled={actionLoading === `save-${msg.id}`}
                            loading={actionLoading === `save-${msg.id}`}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                          </Button>
                        )}
                        
                        {msg.status === 'APPROVED' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-slate-500 hover:text-slate-900"
                            onClick={() => handleUnapprove(msg.id)}
                            disabled={actionLoading === `unapprove-${msg.id}`}
                            loading={actionLoading === `unapprove-${msg.id}`}
                          >
                            <Undo2 className="h-4 w-4 mr-2" />
                            Undo Approve
                          </Button>
                        )}

                        {msg.status !== 'APPROVED' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleDiscard(msg.id)}
                              disabled={actionLoading === `discard-${msg.id}`}
                              loading={actionLoading === `discard-${msg.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Discard
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApprove(msg.id)}
                              disabled={actionLoading === `approve-${msg.id}`}
                              loading={actionLoading === `approve-${msg.id}`}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-6 border-t border-slate-100">
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-slate-500 hover:text-blue-600"
                        onClick={handleStartOver}
                        disabled={actionLoading === 'start-over'}
                        loading={actionLoading === 'start-over'}
                      >
                        <RotateCw className="h-4 w-4 mr-2" />
                        Start Over
                      </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Offer Context</label>
                    <Textarea
                      value={offerContext}
                      onChange={handleOfferContextChange}
                      rows={3}
                      className={`resize-none ${offerContextError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                    />
                    {offerContextError && (
                      <p className="text-sm text-red-600">{offerContextError}</p>
                    )}
                  </div>
                  
                  {target.profile ? (
                    <Button 
                      className="w-full" 
                      onClick={handleGenerate}
                      disabled={actionLoading === 'generate'}
                      loading={actionLoading === 'generate'}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Drafts
                    </Button>
                  ) : (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg text-sm text-orange-800 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
                      <p>You need to scrape the profile first before generating messages.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
