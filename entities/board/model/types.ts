export type Board = {
    id: number;
    name: string;
    /** Public collections on the board. */
    collections: number;
    /** Banners of the latest collections, for the board preview. */
    covers: string[];
};
