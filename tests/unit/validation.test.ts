import { describe, expect, it } from 'vitest';
import {
    isHttpUrl,
    optionalHttpUrlSchema,
    passwordSchema,
    usernameSchema,
} from '@/shared/lib/validation/schemas';
import { idSchema } from '@/shared/lib/validation/ids';

describe('isHttpUrl', () => {
    it('accepts http(s) URLs', () => {
        expect(isHttpUrl('https://example.com/a?b=c')).toBe(true);
        expect(isHttpUrl('http://localhost:3000')).toBe(true);
    });

    it('rejects script and data URLs (stored XSS vectors)', () => {
        expect(isHttpUrl('javascript:alert(1)')).toBe(false);
        expect(isHttpUrl('JaVaScRiPt:alert(1)')).toBe(false);
        expect(isHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
        expect(isHttpUrl('vbscript:msgbox')).toBe(false);
    });

    it('rejects garbage and overly long input', () => {
        expect(isHttpUrl('not a url')).toBe(false);
        expect(isHttpUrl(`https://example.com/${'a'.repeat(3000)}`)).toBe(false);
    });
});

describe('optionalHttpUrlSchema', () => {
    it('maps empty values to null', () => {
        expect(optionalHttpUrlSchema.parse('')).toBeNull();
        expect(optionalHttpUrlSchema.parse(null)).toBeNull();
        expect(optionalHttpUrlSchema.parse(undefined)).toBeNull();
    });

    it('rejects javascript: URLs', () => {
        expect(optionalHttpUrlSchema.safeParse('javascript:alert(1)').success).toBe(false);
    });
});

describe('usernameSchema', () => {
    it('normalises to lower case', () => {
        expect(usernameSchema.parse('  Alice_1 ')).toBe('alice_1');
    });

    it('rejects spaces and symbols', () => {
        expect(usernameSchema.safeParse('bad name').success).toBe(false);
        expect(usernameSchema.safeParse('a').success).toBe(false);
        expect(usernameSchema.safeParse('x'.repeat(13)).success).toBe(false);
    });
});

describe('passwordSchema', () => {
    it('enforces length and charset', () => {
        expect(passwordSchema.safeParse('short').success).toBe(false);
        expect(passwordSchema.safeParse('longenough1').success).toBe(true);
        expect(passwordSchema.safeParse('has space 123').success).toBe(false);
    });
});

describe('idSchema', () => {
    it('accepts positive int4 values only', () => {
        expect(idSchema.parse('42')).toBe(42);
        expect(idSchema.safeParse('0').success).toBe(false);
        expect(idSchema.safeParse('-1').success).toBe(false);
        expect(idSchema.safeParse('1.5').success).toBe(false);
        expect(idSchema.safeParse('abc').success).toBe(false);
        expect(idSchema.safeParse('2147483648').success).toBe(false);
    });
});
