import { describe, expect, it } from 'vitest';
import { createReportSchema } from '@/features/report/create/model/schema';
import { reviewReportSchema } from '@/features/report/review/model/schema';
import { updateProfileSchema } from '@/features/auth/model/schemas';
import { createCollectionSchema } from '@/entities/collection/model/schemas';

describe('createReportSchema', () => {
    it('accepts a typed target', () => {
        const parsed = createReportSchema.parse({
            target: { type: 'COMMENT', commentId: '5' },
            reason: 'SPAM',
        });

        expect(parsed).toEqual({
            target: { type: 'COMMENT', commentId: 5 },
            reason: 'SPAM',
            details: '',
        });
    });

    it('rejects unknown reasons and malformed ids', () => {
        expect(
            createReportSchema.safeParse({ target: { type: 'USER', userId: 1 }, reason: 'spam' })
                .success,
        ).toBe(false);
        expect(
            createReportSchema.safeParse({
                target: { type: 'MESSAGE', messageId: 'abc' },
                reason: 'SPAM',
            }).success,
        ).toBe(false);
    });
});

describe('reviewReportSchema', () => {
    it('forbids punishment without a guilty verdict', () => {
        const result = reviewReportSchema.safeParse({
            verdict: 'NO_VIOLATION',
            punishment: { scope: 'ACCOUNT', duration: '1d' },
        });

        expect(result.success).toBe(false);
    });

    it('requires the original report for duplicates', () => {
        expect(reviewReportSchema.safeParse({ verdict: 'DUPLICATE' }).success).toBe(false);
        expect(
            reviewReportSchema.safeParse({ verdict: 'DUPLICATE', duplicateOfId: 3 }).success,
        ).toBe(true);
    });

    it('fills safe defaults', () => {
        expect(reviewReportSchema.parse({ verdict: 'INSUFFICIENT_EVIDENCE' })).toEqual({
            verdict: 'INSUFFICIENT_EVIDENCE',
            resolution: '',
            removeContent: false,
            punishment: null,
            duplicateOfId: null,
        });
    });
});

describe('updateProfileSchema', () => {
    it('rejects fields outside the whitelist (mass assignment)', () => {
        const result = updateProfileSchema.safeParse({
            fullName: 'Me',
            moderator: { create: {} },
            sanctions: { updateMany: {} },
        });

        expect(result.success).toBe(false);
    });

    it('allows partial updates', () => {
        expect(updateProfileSchema.parse({ description: 'hi' })).toEqual({ description: 'hi' });
    });

    it('rejects script URLs for images', () => {
        expect(updateProfileSchema.safeParse({ avatarUrl: 'javascript:alert(1)' }).success).toBe(
            false,
        );
    });
});

describe('createCollectionSchema', () => {
    const valid = {
        name: 'Books',
        description: 'Good ones',
        category: 'Books',
        bannerUrl: 'https://ucarecdn.com/x/',
        isPrivate: false,
        item: { title: 'Dune', description: 'Sci-fi', sourceUrl: '', imageUrl: null },
    };

    it('accepts a valid collection', () => {
        expect(createCollectionSchema.parse(valid).item.sourceUrl).toBeNull();
    });

    it('rejects unknown categories and unsafe banners', () => {
        expect(createCollectionSchema.safeParse({ ...valid, category: 'Weapons' }).success).toBe(
            false,
        );
        expect(
            createCollectionSchema.safeParse({ ...valid, bannerUrl: 'javascript:x' }).success,
        ).toBe(false);
    });
});
