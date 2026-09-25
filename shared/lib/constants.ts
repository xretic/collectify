export const USERNAME_MAX_LENGTH = 12;
export const USERNAME_MIN_LENGTH = 2;

export const FULLNAME_MAX_LENGTH = 30;

export const DESCRIPTION_MAX_LENGTH = 100;

export const PASSWORD_MAX_LENGTH = 40;
export const PASSWORD_MIN_LENGTH = 8;

export const EMAIL_MAX_LENGTH = 254;
export const URL_MAX_LENGTH = 2048;

export const DEFAULT_DEBOUNCE_DELAY = 400;

export const PAGE_SIZE = 24;

export const CATEGORY_NAME_MAX_LENGTH = 30;
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 200;

export const NOTIFICATIONS_PAGE_SIZE = 30;

export const COLLECTION_NAME_MAX_LENGTH = 50;
export const COLLECTION_DESCRIPTION_MAX_LENGTH = 350;
export const COLLECTION_ITEMS_LIMIT = 100;
export const COLLECTIONS_PER_USER_LIMIT = 200;

export const ITEM_TITLE_MAX_LENGTH = 60;
export const ITEM_DESCRIPTION_MAX_LENGTH = 500;
export const ITEM_SIZES = ['S', 'M', 'L', 'XL'] as const;

/** Max comments a single user may leave on one collection. */
export const COMMENTS_PER_USER_LIMIT = 10;
/** Max replies a single user may leave in the threads of one collection. */
export const REPLIES_PER_USER_LIMIT = 50;
export const COMMENTS_PAGE_SIZE = 10;
export const REPLIES_PAGE_SIZE = 10;
export const COMMENT_MAX_LENGTH = 700;

export const CHATS_PAGE_SIZE = 20;
export const MESSAGES_PAGE_SIZE = 20;

export const DIRECT_MESSAGE_MAX_LENGTH = 2000;

export const SESSION_AGE_IN_DAYS = 14;

export const REPORT_DETAILS_MAX_LENGTH = 1000;
export const MODERATION_NOTE_MAX_LENGTH = 1000;

export const COLLECTION_TAGS_LIMIT = 10;
export const TAG_NAME_MIN_LENGTH = 2;
export const TAG_NAME_MAX_LENGTH = 30;
export const TAG_SEARCH_LIMIT = 15;
/** New tags one user may create per day (tags are global, so this caps spam). */
export const TAGS_PER_USER_DAILY_LIMIT = 30;
/** Tags a feed can be filtered by at once (collections must have all of them). */
export const FEED_TAGS_LIMIT = 5;

export const CITY_MAX_LENGTH = 70;
export const MIN_USER_AGE = 18;
export const MAX_USER_AGE = 120;

export const BOARDS_PER_USER_LIMIT = 50;
export const BOARD_NAME_MAX_LENGTH = 40;

export const FOLLOW_LIST_PAGE_SIZE = 20;
