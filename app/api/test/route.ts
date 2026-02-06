import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
    await redis.set('hello', 'world', { ex: 60 });
    const value = await redis.get('hello');

    return NextResponse.json({ value });
}
