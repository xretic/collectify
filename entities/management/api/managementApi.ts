import { api } from '@/shared/api/api';
import { UserRole } from '@/types/UserRole';

export type SanctionScope = 'ACCOUNT' | 'COMMENTS' | 'MESSENGER';
export type ReportStatus = 'OPEN' | 'CLOSED';
export type ReportVerdict =
    | 'PENDING'
    | 'NO_VIOLATION'
    | 'INSUFFICIENT_EVIDENCE'
    | 'DUPLICATE'
    | 'GUILTY';

type LiteUser = { id: number; username: string; avatarUrl: string };

export type ManagementUser = {
    id: number;
    email: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    createdAt: string;
    roles: UserRole[];
    activeSanctions: {
        id: number;
        scope: SanctionScope;
        reason: string;
        expiresAt: string | null;
        createdAt: string;
    }[];
    _count: {
        collections: number;
        Comment: number;
        messages: number;
    };
};

export type AuditAction = {
    id: number;
    action: string;
    reason: string;
    createdAt: string;
    actor: { id: number; username: string; avatarUrl: string } | null;
    targetUser: { id: number; username: string; avatarUrl: string } | null;
};

export type ManagementReport = {
    id: number;
    reporterId: number;
    targetUserId: number;
    messageId: number | null;
    commentId: number | null;
    collectionId: number | null;
    reason: string;
    details: string;
    status: ReportStatus;
    verdict: ReportVerdict;
    resolution: string;
    createdAt: string;
    reviewedAt: string | null;
    reporter: LiteUser;
    targetUser: LiteUser;
    reviewedBy: LiteUser | null;
    message: {
        id: number;
        content: string;
        chatId: number;
        createdAt: string;
    } | null;
    comment: {
        id: number;
        text: string;
        collectionId: number;
        createdAt: string;
        Collection: {
            id: number;
            name: string;
        };
    } | null;
    collection: {
        id: number;
        name: string;
        description: string;
        category: string;
        private: boolean;
        createdAt: string;
    } | null;
};

export type ManagementMessageHistory = {
    user: LiteUser;
    total: number;
    nextSkip: number | null;
    chats: {
        id: number;
        createdAt: string;
        users: LiteUser[];
        messages: {
            id: number;
            userId: number;
            username: string;
            userAvatarUrl: string;
            recipientUserId: number;
            content: string;
            createdAt: string;
            read: boolean;
        }[];
    }[];
};

export type ManagementCollectionHistoryItem = {
    id: number;
    name: string;
    category: string;
    private: boolean;
    createdAt: string;
    _count: {
        items: number;
        comments: number;
        likes: number;
    };
};

export type ManagementCommentHistoryItem = {
    id: number;
    text: string;
    collectionId: number;
    createdAt: string;
    Collection: {
        id: number;
        name: string;
    };
};

type Paginated<T> = {
    data: T[];
    total: number;
    nextSkip: number | null;
};

export const managementApi = {
    users(query: string, skip = 0, userId?: number | null) {
        return api
            .get('api/management/users', {
                searchParams: {
                    query,
                    skip,
                    ...(userId ? { userId } : {}),
                },
            })
            .json<{ data: ManagementUser[]; total: number }>();
    },

    audit() {
        return api.get('api/management/audit').json<{ data: AuditAction[] }>();
    },

    reports(status: ReportStatus = 'OPEN') {
        return api
            .get('api/management/reports', {
                searchParams: { status },
            })
            .json<{ data: ManagementReport[] }>();
    },

    reviewReport(
        reportId: number,
        payload: {
            verdict: Exclude<ReportVerdict, 'PENDING'>;
            resolution: string;
            punishment: {
                scope: SanctionScope;
                expiresAt: string | null;
                reason: string;
            } | null;
        },
    ) {
        return api.patch(`api/management/reports/${reportId}`, { json: payload });
    },

    messageHistory(userId: number, skip = 0) {
        return api
            .get(`api/management/users/${userId}/messages`, { searchParams: { skip } })
            .json<ManagementMessageHistory>();
    },

    collectionHistory(userId: number, skip = 0) {
        return api
            .get(`api/management/users/${userId}/collections`, { searchParams: { skip } })
            .json<Paginated<ManagementCollectionHistoryItem>>();
    },

    commentHistory(userId: number, skip = 0) {
        return api
            .get(`api/management/users/${userId}/comments`, { searchParams: { skip } })
            .json<Paginated<ManagementCommentHistoryItem>>();
    },

    setRole(userId: number, role: UserRole, enabled: boolean, reason?: string) {
        return api.patch(`api/management/users/${userId}/roles`, {
            json: { role, enabled, reason },
        });
    },

    createSanction(userId: number, scope: SanctionScope, expiresAt: string | null, reason: string) {
        return api.post(`api/management/users/${userId}/sanctions`, {
            json: { scope, expiresAt, reason },
        });
    },

    revokeSanction(sanctionId: number) {
        return api.delete(`api/management/sanctions/${sanctionId}`);
    },

    deleteUser(userId: number) {
        return api.delete(`api/management/users/${userId}`);
    },

    impersonate(userId: number) {
        return api.post(`api/management/users/${userId}/impersonate`);
    },
};
