import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type VisibilityState = {
    hidden: boolean;
    setHidden: (hidden: boolean) => void;
};

/** Remembers on this device whether the viewer closed the "People you may know" widget. */
export const usePeopleWidgetVisibility = create<VisibilityState>()(
    persist(
        (set) => ({
            hidden: false,
            setHidden: (hidden) => set({ hidden }),
        }),
        { name: 'people-you-may-know' },
    ),
);
