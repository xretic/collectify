import type {
    ActiveSanction,
    SanctionDuration,
    SanctionScope,
} from '@/entities/sanction/model/types';
import type { UserPreview } from '@/entities/user/model/types';

export type ReportReason = 'SPAM' | 'HARASSMENT' | 'HATE' | 'SCAM' | 'ADULT' | 'OTHER';
export type ReportTargetType = 'USER' | 'COMMENT' | 'COLLECTION';
export type ReportStatus = 'OPEN' | 'CLOSED';
export type ReportVerdict =
    | 'PENDING'
    | 'NO_VIOLATION'
    | 'INSUFFICIENT_EVIDENCE'
    | 'DUPLICATE'
    | 'GUILTY';
export type ReviewVerdict = Exclude<ReportVerdict, 'PENDING'>;

export const REPORT_REASONS: readonly ReportReason[] = [
    'SPAM',
    'HARASSMENT',
    'HATE',
    'SCAM',
    'ADULT',
    'OTHER',
];

export const REPORT_TARGET_TYPES: readonly ReportTargetType[] = ['USER', 'COMMENT', 'COLLECTION'];

export const REVIEW_VERDICTS: readonly ReviewVerdict[] = [
    'GUILTY',
    'NO_VIOLATION',
    'INSUFFICIENT_EVIDENCE',
    'DUPLICATE',
];

/** The sanction scope that usually fits a report about this kind of content. */
export const DEFAULT_SCOPE_FOR_TARGET: Record<ReportTargetType, SanctionScope> = {
    USER: 'ACCOUNT',
    COMMENT: 'COMMENTS',
    COLLECTION: 'ACCOUNT',
};

export type ReportTarget =
    | { type: 'USER'; userId: number }
    | { type: 'COMMENT'; commentId: number }
    | { type: 'COLLECTION'; collectionId: number };

export type CreateReportPayload = {
    target: ReportTarget;
    reason: ReportReason;
    details: string;
};

/** Content captured when the report was filed, so deleting it later keeps the evidence. */
export type ReportSnapshot = {
    text?: string;
    name?: string;
    description?: string;
    category?: string;
    createdAt?: string;
    collectionId?: number;
};

export type ReportListItem = {
    id: number;
    targetType: ReportTargetType;
    reason: ReportReason;
    status: ReportStatus;
    verdict: ReportVerdict;
    createdAt: string;
    reporter: UserPreview;
    targetUser: UserPreview;
};

export type ReportsPage = {
    data: ReportListItem[];
    total: number;
    nextCursor: number | null;
};

export type ReportDetails = ReportListItem & {
    details: string;
    resolution: string;
    reviewedAt: string | null;
    reviewedBy: UserPreview | null;
    duplicateOfId: number | null;
    snapshot: ReportSnapshot | null;
    /** Whether the reported content still exists (it may have been deleted). */
    contentExists: boolean;
    contentLink: string | null;
    sanction: ActiveSanction | null;
    context: {
        targetActiveSanctions: ActiveSanction[];
        targetReports: number;
        targetGuiltyReports: number;
        reporterReports: number;
        reporterRejectedReports: number;
    };
};

export type ReviewReportPayload = {
    verdict: ReviewVerdict;
    resolution: string;
    /** Delete the reported comment/collection. Only allowed with GUILTY. */
    removeContent: boolean;
    punishment: { scope: SanctionScope; duration: SanctionDuration } | null;
    duplicateOfId: number | null;
};

export const reportOpenKey = (reporterId: number, type: ReportTargetType, targetId: number) =>
    `${reporterId}:${type}:${targetId}`;
