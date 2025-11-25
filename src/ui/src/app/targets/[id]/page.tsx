'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function TargetDetailsPage() {
  const params = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      // For demo, we just pass a mock URL based on ID or something
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: params.id, url: 'profile1' }) // Hardcoded for demo
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || 'Failed to generate outreach'}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setProfile(data.profile);
      setDraft(data.draft);
    } catch (error) {
      console.error('Error generating outreach:', error);
      alert('Failed to generate outreach. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Target {params.id}</h1>

      {!profile && (
        <button onClick={generate} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? 'Generating...' : 'Load Profile & Generate Draft'}
        </button>
      )}

      {profile && (
        <div className="grid grid-cols-2 gap-8 mt-8">
          <div className="border p-4 rounded">
            <h2 className="font-bold mb-4">Profile Data</h2>
            <div className="space-y-2">
              <div><span className="font-semibold">Headline:</span> {profile.headline}</div>
              <div><span className="font-semibold">Role:</span> {profile.currentRole}</div>
              <div><span className="font-semibold">Company:</span> {profile.company}</div>
              <div><span className="font-semibold">Location:</span> {profile.location}</div>
              <div className="mt-4 p-2 bg-gray-50 text-sm">{profile.about}</div>
            </div>
          </div>

          <div className="border p-4 rounded">
            <h2 className="font-bold mb-4">Outreach Draft</h2>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-64 p-2 border rounded"
            />
            <div className="mt-4 flex gap-2">
              <button className="bg-green-600 text-white px-4 py-2 rounded">Approve</button>
              <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded">Regenerate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
