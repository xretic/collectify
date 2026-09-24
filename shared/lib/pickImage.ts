// Uploadcare returns jQuery-style promises: `done` on success, `fail` on
// cancel/error. Both must be handled or a closed dialog never settles.
type UploadcarePromise<T> = {
    done: (callback: (value: T) => void) => UploadcarePromise<T>;
    fail: (callback: (error?: unknown) => void) => UploadcarePromise<T>;
};
type UploadcareFile = UploadcarePromise<{ cdnUrl: string }>;
type UploadcareDialog = UploadcarePromise<UploadcareFile | null>;
type UploadcareClient = {
    openDialog: (
        file: null,
        options: { imagesOnly: boolean; multiple: boolean; crop: string },
    ) => UploadcareDialog;
};

const WIDGET_SRC = 'https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js';
const LOAD_TIMEOUT_MS = 15_000;

let loading: Promise<UploadcareClient> | null = null;

/** Loads the Uploadcare widget on first use instead of blocking every page. */
function loadUploadcare(): Promise<UploadcareClient> {
    const existing = (window as Window & { uploadcare?: UploadcareClient }).uploadcare;
    if (existing) return Promise.resolve(existing);

    loading ??= new Promise<UploadcareClient>((resolve, reject) => {
        (window as Window & { UPLOADCARE_PUBLIC_KEY?: string }).UPLOADCARE_PUBLIC_KEY =
            process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY;

        const script = document.createElement('script');
        script.src = WIDGET_SRC;
        script.async = true;

        const timeout = setTimeout(
            () => reject(new Error('Uploadcare took too long to load.')),
            LOAD_TIMEOUT_MS,
        );

        script.onload = () => {
            clearTimeout(timeout);
            const client = (window as Window & { uploadcare?: UploadcareClient }).uploadcare;
            if (client) resolve(client);
            else reject(new Error('Uploadcare failed to initialise.'));
        };
        script.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Uploadcare failed to load.'));
        };

        document.body.appendChild(script);
    }).catch((error) => {
        loading = null;
        throw error;
    });

    return loading;
}

/** Opens the image picker; resolves with the CDN URL, or `null` if cancelled. */
export async function pickImage(): Promise<string | null> {
    const uploadcare = await loadUploadcare();

    return new Promise((resolve, reject) => {
        uploadcare
            .openDialog(null, { imagesOnly: true, multiple: false, crop: 'free' })
            .done((file) => {
                if (!file) {
                    resolve(null);
                    return;
                }

                file.done((info) => resolve(info.cdnUrl)).fail(() =>
                    reject(new Error('Image upload failed.')),
                );
            })
            // Closing the dialog without choosing a file lands here.
            .fail(() => resolve(null));
    });
}
