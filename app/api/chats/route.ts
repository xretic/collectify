import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { ChatInResponse } from '@/types/ChatInResponse';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const skipRaw = searchParams.get('skip');

        if (skipRaw === null) {
            return NextResponse.json({ message: 'skip is required.' }, { status: 400 });
        }

        const skip = Number(searchParams.get('skip'));

        if (!isProperInteger(skip)) {
            return NextResponse.json(
                {
                    message: 'skip option is required.',
                },
                { status: 400 },
            );
        }

        const chats = await prisma.chat.findMany({
            where: {
                users: {
                    some: {
                        id: {
                            in: [session.userId],
                        },
                    },
                },
            },

            include: {
                messages: true,
                users: true,
            },
        });

        if (chats.length === 0) {
            return NextResponse.json({ data: [] }, { status: 200 });
        }

        const response: ChatInResponse[] = chats.map((x) => {
            const user = x.users.filter((x) => x.id !== session.userId)[0];

            return {
                id: x.id,
                userId: user.id,
                userAvatarUrl: user.avatarUrl,
                username: user.username,
                previewContent: x.messages.slice(-1)[0].content,
                createdAt: x.createdAt,
            };
        });

        return NextResponse.json({ data: response }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
