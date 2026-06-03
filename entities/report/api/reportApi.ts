import { api } from '@/shared/api/api';

export type ReportReason = 'spam' | 'harassment' | 'hate' | 'scam' | 'adult' | 'other';

export const reportApi = {
    create(payload: {
        targetUserId?: number;
        messageId?: number;
        commentId?: number;
        collectionId?: number;
        reason: ReportReason;
        details: string;
    }) {
        return api.post('api/reports', { json: payload });
    },
};
