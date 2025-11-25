import { NextResponse } from 'next/server';
// We need to instantiate our services here. 
// In a real app, we'd use dependency injection or a singleton container.
// For this demo, we'll instantiate them directly or use a factory.

// Mocks for repositories since we might not have a real DB set up yet or want to keep it simple.
// But wait, the prompt mentioned "Storage: SQLite via Prisma OR simple JSON persistence".
// Let's check if we have Prisma set up.
// I see `src/infra/persistence/prisma` in the file list.

// Let's assume we can use the repositories.
// But first, let's just return some mock data to get the UI working.

const mockTargets = [
    { id: 1, name: 'Alex Rivera', url: 'https://linkedin.com/in/alexrivera', status: 'PENDING' },
    { id: 2, name: 'Sarah Chen', url: 'https://linkedin.com/in/sarahchen', status: 'PENDING' }
];

export async function GET() {
    return NextResponse.json(mockTargets);
}

export async function POST(request: Request) {
    const body = await request.json();
    const newTarget = { id: mockTargets.length + 1, ...body, status: 'PENDING' };
    mockTargets.push(newTarget);
    return NextResponse.json(newTarget);
}
