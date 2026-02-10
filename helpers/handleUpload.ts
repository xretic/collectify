const waitForUploadcare = (): Promise<any> =>
    new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(() => {
            if ((window as any).uploadcare) {
                clearInterval(interval);
                resolve((window as any).uploadcare);
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
            .done((file: any) => {
                file.done((info: any) => setUrl(info.cdnUrl));
            });
    } catch (err) {
        console.error(err);
    }
};
