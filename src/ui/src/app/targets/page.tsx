'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Target {
    id: number;
    name: string;
    url: string;
    status: string;
}

export default function TargetsPage() {
    const [targets, setTargets] = useState<Target[]>([]);
    const [newUrl, setNewUrl] = useState('');

    useEffect(() => {
        fetch('/api/targets')
            .then(res => res.json())
            .then(data => setTargets(data));
    }, []);

    const addTarget = async () => {
        const res = await fetch('/api/targets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'New Target', url: newUrl })
        });
        const newTarget = await res.json();
        setTargets([...targets, newTarget]);
        setNewUrl('');
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Outreach Targets</h1>

            <div className="mb-8 flex gap-2">
                <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Enter LinkedIn URL (mock)"
                    className="border p-2 rounded flex-grow"
                />
                <button onClick={addTarget} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Add Target
                </button>
            </div>

            <div className="grid gap-4">
                {targets.map(target => (
                    <div key={target.id} className="border p-4 rounded flex justify-between items-center">
                        <div>
                            <div className="font-bold">{target.name}</div>
                            <div className="text-sm text-gray-500">{target.url}</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 rounded text-xs ${target.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {target.status}
                            </span>
                            <Link href={`/targets/${target.id}`} className="text-blue-600 hover:underline">
                                View
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
