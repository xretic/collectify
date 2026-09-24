export const USERNAME_MAX_LENGTH = 12;
export const USERNAME_MIN_LENGTH = 2;

export const FULLNAME_MAX_LENGTH = 30;

export const DESCRIPTION_MAX_LENGTH = 100;

export const PASSWORD_MAX_LENGTH = 40;
export const PASSWORD_MIN_LENGTH = 8;

export const EMAIL_MAX_LENGTH = 254;
export const URL_MAX_LENGTH = 2048;

export const DEFAULT_DEBOUNCE_DELAY = 400;

export const PAGE_SIZE = 10;

export const CATEGORIES = [
    'Books',
    'Movies',
    'Games',
    'Recipes',
    'Apps',
    'Travel',
    'Music',
    'Sport',
    'Custom',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const NOTIFICATIONS_PAGE_SIZE = 30;

export const COLLECTION_NAME_FIELD_MAX_LENGTH = 20;
export const COLLECTION_NAME_MAX_LENGTH = 50;
export const COLLECTION_DESCRIPTION_MAX_LENGTH = 350;
export const COLLECTION_ITEMS_LIMIT = 100;
export const COLLECTIONS_PER_USER_LIMIT = 200;

export const ITEM_TITLE_MAX_LENGTH = 22;
export const ITEM_DESCRIPTION_MAX_LENGTH = 200;

/** Max comments a single user may leave on one collection. */
export const COMMENTS_PER_USER_LIMIT = 10;
export const COMMENTS_PAGE_SIZE = 10;
export const COMMENT_MAX_LENGTH = 700;

export const CHATS_PAGE_SIZE = 8;
export const MESSAGES_PAGE_SIZE = 20;

export const DIRECT_MESSAGE_MAX_LENGTH = 2000;
export const MAX_PREVIEW_MESSAGE_LENGTH = 30;

export const SESSION_AGE_IN_DAYS = 14;

export const REPORT_DETAILS_MAX_LENGTH = 1000;
export const MODERATION_NOTE_MAX_LENGTH = 1000;
