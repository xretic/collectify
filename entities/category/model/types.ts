/** What collections and tags carry about their category. */
export type CategoryRef = {
    id: number;
    slug: string;
    name: string;
};

export type Category = CategoryRef & {
    description: string;
    position: number;
};

/** Admin view: archived categories and usage are visible too. */
export type ManagedCategory = Category & {
    isActive: boolean;
    collections: number;
};

export type CategoryPayload = {
    name: string;
    slug: string;
    description: string;
    position: number;
    isActive: boolean;
};

/** Category with the banner of a random popular collection from it (onboarding). */
export type CategoryShowcase = Category & {
    coverUrl: string | null;
};
