import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export default async function GET(req: NextRequest) {
    const categories = await prisma.category.findMany();

    return NextResponse.json(
        {
            data: categories.map((x) => ({
                title: x.title,
            })),
        },
        { status: 200 },
    );
}
