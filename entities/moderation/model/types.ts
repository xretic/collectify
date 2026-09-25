import type { ActiveSanction } from '@/entities/sanction/model/types';
import type { UserPreview, UserRole } from '@/entities/user/model/types';

export type ManagementUser = {
    id: number;
    email: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    createdAt: string;
    roles: UserRole[];
    activeSanctions: ActiveSanction[];
    counts: { collections: number; comments: number; messages: number; reportsReceived: number };
};

export type ManagementUsersPage = {
    data: ManagementUser[];
    total: number;
    nextPage: number | null;
};

export type AuditRecord = {
    id: number;
    action: string;
    reason: string;
    createdAt: string;
    actor: UserPreview | null;
    impersonator: UserPreview | null;
    targetUser: UserPreview | null;
};

export type AuditPage = { data: AuditRecord[]; nextCursor: number | null };

export type ManagedCollection = {
    id: number;
    name: string;
    category: string;
    isPrivate: boolean;
    createdAt: string;
    counts: { items: number; comments: number; likes: number };
};

export type ManagedComment = {
    id: number;
    text: string;
    createdAt: string;
    collection: { id: number; name: string };
};

export type HistoryPage<T> = { data: T[]; total: number; nextSkip: number | null };
