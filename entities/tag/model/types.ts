export type TagRef = {
    id: number;
    name: string;
};

export type Tag = TagRef & {
    categoryId: number;
    usageCount: number;
};
