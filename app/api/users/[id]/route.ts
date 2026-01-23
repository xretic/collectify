import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const intId = Number(id);

    if (Number.isNaN(id)) {
        return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { id: intId },
    });

    if (!user) {
        return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json(
        {
            user: {
                id: user.id,
                avatarUrl: user.avatarUrl,
                bannerUrl: user.bannerUrl,
                username: user.username,
                fullName: user.fullName,
                description: user.description,
            },
        },
        { status: 200 },
    );
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const token = req.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const { id: idStr } = await context.params;
    const id = Number(idStr);

    if (isNaN(id)) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const data = await req.json();

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.token !== token) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const safeData = filterAllowedFields(data);

    if (Object.keys(safeData).length === 0) {
        return NextResponse.json({ message: 'No allowed fields to update' }, { status: 400 });
    }

    if (safeData?.username.length === 0) {
        return NextResponse.json({ message: 'Username not set' }, { status: 400 });
    }

    if (safeData?.fullName.length === 0) {
        return NextResponse.json({ message: 'Fullname not set' }, { status: 400 });
    }

    const usernameCheck = await prisma.user.findFirst({
        where: {
            username: safeData?.username,
        },
    });

    if (usernameCheck && usernameCheck.id !== id) {
        return NextResponse.json(
            { message: 'User with this username already exists.' },
            { status: 409 },
        );
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: safeData,
        });

        return NextResponse.json(
            {
                message: `User ${id} updated.`,
                user: {
                    id: updatedUser.id,
                    avatarUrl: updatedUser.avatarUrl,
                    bannerUrl: updatedUser.bannerUrl,
                    username: updatedUser.username,
                    fullName: updatedUser.fullName,
                    description: updatedUser.description,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json({ message: 'User does not exist.' }, { status: 404 });
    }
}

const BANNED_FIELDS = new Set(['id', 'email', 'passwordHash', 'token', 'sessions']);

function filterAllowedFields<T extends Record<string, any>>(data: T) {
    return Object.fromEntries(Object.entries(data).filter(([key]) => !BANNED_FIELDS.has(key)));
}
