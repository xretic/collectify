import { create } from 'zustand';

export type ImageCropOptions = {
    /** Fixed width / height ratio; without it the user picks one (the original by default). */
    aspect?: number;
    /** Round mask for avatars (the saved image stays square). */
    round?: boolean;
};

type EditRequest = {
    id: number;
    file: File;
    /** Object URL of `file` for the preview, revoked when the request finishes. */
    src: string;
    options: ImageCropOptions;
    resolve: (file: File | null) => void;
};

type ImageEditorState = {
    current: EditRequest | null;
    finish: (file: File | null) => void;
};

let nextId = 1;

export const useImageEditorStore = create<ImageEditorState>((set, get) => ({
    current: null,
    finish: (file) => {
        const { current } = get();
        if (!current) return;

        URL.revokeObjectURL(current.src);
        current.resolve(file);
        set({ current: null });
    },
}));

/**
 * Opens the image editor (mounted once in the root layout) for `file`.
 * Resolves with the edited file, or `null` when the user cancels.
 */
export function editImage(file: File, options: ImageCropOptions = {}): Promise<File | null> {
    const { current, finish } = useImageEditorStore.getState();
    if (current) finish(null);

    return new Promise((resolve) =>
        useImageEditorStore.setState({
            current: { id: nextId++, file, src: URL.createObjectURL(file), options, resolve },
        }),
    );
}
