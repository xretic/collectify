import type { StaffContext } from '@/features/auth/server/guards';

/** Integration tests run only against an explicit, disposable database. */
export const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

export async function getDb() {
    return (await import('@/shared/server/db')).db;
}

const TABLES = [
    'ModerationAction',
    'Report',
    'AccountSanction',
    'Notification',
    'Message',
    'Chat',
    'Comment',
    'Like',
    'Favorite',
    'Item',
    'Collection',
    'Follow',
    'Session',
    'Admin',
    'Moderator',
    'Verified',
    'User',
];

export async function resetDatabase() {
    const db = await getDb();
    await db.$executeRawUnsafe(
        `TRUNCATE ${TABLES.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
}

let nextUserId = 1000;

export async function createUser(role?: 'Admin' | 'Moderator') {
    const db = await getDb();
    const id = nextUserId++;

    await db.user.create({
        data: {
            id,
            email: `user${id}@test.local`,
            username: `user${id}`,
            fullName: `User ${id}`,
            ...(role === 'Admin' ? { admin: { create: {} } } : {}),
            ...(role === 'Moderator' ? { moderator: { create: {} } } : {}),
        },
    });

    return id;
}

export async function staffContext(userId: number): Promise<StaffContext> {
    const db = await getDb();
    const session = await db.session.create({
        data: {
            id: `session-${userId}-${Date.now()}-${Math.random()}`,
            userId,
            expiresAt: new Date(Date.now() + 86_400_000),
        },
    });
    const { getUserRoles } = await import('@/entities/user/server/roles');
    const roles = await getUserRoles(userId);

    return {
        session: { id: session.id, userId, impersonatorUserId: null, expiresAt: session.expiresAt },
        userId,
        actor: { userId, impersonatorId: null },
        roles,
        isAdmin: roles.includes('Admin'),
        isModerator: roles.includes('Moderator'),
    };
}

export async function createCommentBy(userId: number, text = 'offensive comment') {
    const db = await getDb();
    const owner = await createUser();

    const collection = await db.collection.create({
        data: {
            name: 'C',
            lowerCaseName: 'c',
            bannerUrl: 'https://example.com/b.png',
            category: 'Books',
            userId: owner,
            items: { create: { title: 't', description: 'd', order: 0 } },
        },
    });

    return db.comment.create({ data: { userId, collectionId: collection.id, text } });
}
