type UploadcareFileInfo = {
    cdnUrl: string;
};

type UploadcareFile = {
    done: (callback: (info: UploadcareFileInfo) => void) => void;
};

type UploadcareDialog = {
    done: (callback: (file: UploadcareFile) => void) => void;
};

type UploadcareClient = {
    openDialog: (
        file: null,
        options: { imagesOnly: boolean; multiple: boolean; crop: string },
    ) => UploadcareDialog;
};

type WindowWithUploadcare = Window & {
    uploadcare?: UploadcareClient;
};

const waitForUploadcare = (): Promise<UploadcareClient> =>
    new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(() => {
            const uploadcare = (window as WindowWithUploadcare).uploadcare;

            if (uploadcare) {
                clearInterval(interval);
                resolve(uploadcare);
            } else if (++attempts >= 10) {
                clearInterval(interval);
                reject(new Error('Uploadcare failed to load.'));
            }
        }, 10);
    });

export const handleUpload = async (setUrl: (url: string) => void) => {
    try {
        const uploadcare = await waitForUploadcare();
        uploadcare
            .openDialog(null, { imagesOnly: true, multiple: false, crop: 'free' })
            .done((file) => {
                file.done((info) => setUrl(info.cdnUrl));
            });
    } catch (err) {
        console.error(err);
    }
};
