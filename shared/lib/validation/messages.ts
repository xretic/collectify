import {
    COLLECTION_TAGS_LIMIT,
    MIN_USER_AGE,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    TAG_NAME_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from '@/shared/lib/constants';

/**
 * Schemas carry `validation.*` message keys instead of text; these are the
 * placeholders those translations use ("at least {passwordMin} characters").
 */
export const VALIDATION_VALUES = {
    usernameMin: USERNAME_MIN_LENGTH,
    usernameMax: USERNAME_MAX_LENGTH,
    passwordMin: PASSWORD_MIN_LENGTH,
    passwordMax: PASSWORD_MAX_LENGTH,
    minAge: MIN_USER_AGE,
    tagsMax: COLLECTION_TAGS_LIMIT,
    tagNameMin: TAG_NAME_MIN_LENGTH,
};

export const isValidationKey = (message: string) => message.startsWith('validation.');
