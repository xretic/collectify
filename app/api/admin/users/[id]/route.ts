import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await context.params;
    const id = Number(idStr);

    const data = await req.json();

    try {
        const user = await prisma.user.update({
            where: { id },
            data,
        });

        return NextResponse.json({ message: `User ${id} updated.`, user }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'User does not exist.' }, { status: 404 });
    }
}
