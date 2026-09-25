'use client';

import { useState } from 'react';
import Cropper, { type Area, type MediaSize, type Point } from 'react-easy-crop';
import {
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Slider,
    Tooltip,
} from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { cropImage, rotatedSize } from '@/shared/lib/image/cropImage';
import { useImageEditorStore, type ImageCropOptions } from '@/shared/model/imageEditorStore';
import { toast } from '@/shared/model/toastStore';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

// `null` keeps the image's own proportions.
const ASPECTS = [
    { label: null, value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
    { label: '16:9', value: 16 / 9 },
] as const;

/** The editor for `editImage()` requests. Mounted once in the root layout. */
export function ImageEditorHost() {
    const current = useImageEditorStore((state) => state.current);
    const finish = useImageEditorStore((state) => state.finish);

    return (
        <Dialog
            open={current !== null}
            onClose={() => finish(null)}
            fullWidth
            maxWidth="sm"
            classes={{ paper: styles.paper }}
        >
            {current && (
                // Fresh crop state for every image.
                <ImageEditor
                    key={current.id}
                    file={current.file}
                    src={current.src}
                    options={current.options}
                    onDone={finish}
                />
            )}
        </Dialog>
    );
}

type ImageEditorProps = {
    file: File;
    src: string;
    options: ImageCropOptions;
    onDone: (file: File | null) => void;
};

function ImageEditor({ file, src, options, onDone }: ImageEditorProps) {
    const t = useTranslations('imageEditor');
    const tc = useTranslations('common');
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [rotation, setRotation] = useState(0);
    const [media, setMedia] = useState<MediaSize | null>(null);
    const [chosenAspect, setChosenAspect] = useState<number | null>(null);
    const [area, setArea] = useState<Area | null>(null);
    const [saving, setSaving] = useState(false);

    const original = media
        ? rotatedSize(media.naturalWidth, media.naturalHeight, rotation)
        : { width: 1, height: 1 };
    const aspect = options.aspect ?? chosenAspect ?? original.width / original.height;

    const rotate = (delta: number) => setRotation((value) => (value + delta + 360) % 360);

    const save = async () => {
        if (!area) return;
        setSaving(true);

        try {
            onDone(await cropImage(file, area, rotation));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('failed'));
            setSaving(false);
        }
    };

    return (
        <>
            <DialogTitle>{t('title')}</DialogTitle>

            <DialogContent className={styles.content}>
                <div className={styles.stage}>
                    <Cropper
                        image={src}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        minZoom={MIN_ZOOM}
                        maxZoom={MAX_ZOOM}
                        cropShape={options.round ? 'round' : 'rect'}
                        showGrid={!options.round}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        onCropComplete={(_, pixels) => setArea(pixels)}
                        onMediaLoaded={setMedia}
                    />
                </div>

                <div className={styles.controls}>
                    <div className={styles.zoom}>
                        <ZoomOutIcon fontSize="small" className={styles.muted} />
                        <Slider
                            size="small"
                            min={MIN_ZOOM}
                            max={MAX_ZOOM}
                            step={0.01}
                            value={zoom}
                            onChange={(_, value) => setZoom(value)}
                            aria-label={t('zoom')}
                        />
                        <ZoomInIcon fontSize="small" className={styles.muted} />
                    </div>

                    <div className={styles.rotate}>
                        <Tooltip title={t('rotateLeft')}>
                            <IconButton size="small" onClick={() => rotate(-90)}>
                                <RotateLeftIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('rotateRight')}>
                            <IconButton size="small" onClick={() => rotate(90)}>
                                <RotateRightIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </div>
                </div>

                {options.aspect === undefined && (
                    <div className={styles.aspects} role="radiogroup" aria-label={t('aspectRatio')}>
                        {ASPECTS.map((option) => (
                            <Chip
                                key={option.value ?? 'original'}
                                role="radio"
                                aria-checked={chosenAspect === option.value}
                                label={option.label ?? t('original')}
                                size="small"
                                color={chosenAspect === option.value ? 'primary' : 'default'}
                                variant={chosenAspect === option.value ? 'filled' : 'outlined'}
                                onClick={() => setChosenAspect(option.value)}
                            />
                        ))}
                    </div>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={() => onDone(null)} disabled={saving}>
                    {tc('cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={save}
                    disabled={!area || saving}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {tc('save')}
                </Button>
            </DialogActions>
        </>
    );
}
