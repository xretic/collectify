'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Autocomplete,
    Avatar,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { userApi } from '@/entities/user/api/userApi';
import type { SessionUser } from '@/entities/user/model/types';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import {
    DESCRIPTION_MAX_LENGTH,
    FULLNAME_MAX_LENGTH,
    MIN_USER_AGE,
    USERNAME_MAX_LENGTH,
} from '@/shared/lib/constants';
import { countryOptions } from '@/shared/lib/geo/countries';
import {
    birthDateSchema,
    citySchema,
    fullNameSchema,
    usernameSchema,
} from '@/shared/lib/validation/schemas';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { CityAutocomplete } from '@/shared/ui/CityAutocomplete';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import { DateField } from '@/shared/ui/DateField';
import { useImagePicker } from '@/shared/lib/hooks/useImagePicker';
import styles from './index.module.css';
import { useLocale, useTranslations } from 'next-intl';
import { useValidationMessage } from '@/shared/i18n/useValidationMessage';

type EditProfileDialogProps = {
    open: boolean;
    user: SessionUser;
    onClose: () => void;
};

type Draft = Pick<
    SessionUser,
    | 'fullName'
    | 'username'
    | 'description'
    | 'avatarUrl'
    | 'bannerUrl'
    | 'country'
    | 'city'
    | 'birthDate'
>;

const pickDraft = (user: SessionUser): Draft => ({
    fullName: user.fullName,
    username: user.username,
    description: user.description,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    country: user.country,
    city: user.city,
    birthDate: user.birthDate,
});

/** Latest allowed birth date: exactly `MIN_USER_AGE` years ago. */
function latestBirthDate() {
    const today = new Date();
    return new Date(
        Date.UTC(today.getUTCFullYear() - MIN_USER_AGE, today.getUTCMonth(), today.getUTCDate()),
    )
        .toISOString()
        .slice(0, 10);
}

export function EditProfileDialog({ open, user, onClose }: EditProfileDialogProps) {
    const t = useTranslations('profile.edit');
    const tc = useTranslations('common');
    const locale = useLocale();
    const validationMessage = useValidationMessage();
    const countries = countryOptions(locale);
    const { setUser } = useSessionUser();
    const [draft, setDraft] = useState<Draft>(() => pickDraft(user));

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
        setDraft((prev) => ({ ...prev, [key]: value }));

    const avatarPicker = useImagePicker((url) => set('avatarUrl', url), {
        aspect: 1,
        round: true,
    });
    const bannerPicker = useImagePicker((url) => set('bannerUrl', url), { aspect: 4 });

    const usernameCheck = usernameSchema.safeParse(draft.username);
    const fullNameValid = fullNameSchema.safeParse(draft.fullName).success;
    const cityValid = citySchema.safeParse(draft.city).success;
    const birthDateCheck = birthDateSchema.safeParse(draft.birthDate);

    const changes = Object.fromEntries(
        (Object.keys(draft) as (keyof Draft)[])
            .filter((key) => draft[key] !== user[key])
            .map((key) => [key, draft[key]]),
    );

    const save = useMutation({
        mutationFn: () => userApi.updateProfile(changes),
        onSuccess: (updated) => {
            setUser(updated);
            toast.success(t('updated'));
            onClose();
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const handleClose = () => {
        if (save.isPending) return;
        setDraft(pickDraft(user));
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>{t('title')}</DialogTitle>

            <DialogContent className={styles.content}>
                <div className={styles.media}>
                    <button
                        type="button"
                        className={styles.banner}
                        onClick={bannerPicker.pick}
                        disabled={bannerPicker.pending}
                        aria-label={t('changeBanner')}
                    >
                        {draft.bannerUrl && (
                            <img src={draft.bannerUrl} alt="" className={styles.bannerImage} />
                        )}
                        <span className={styles.overlay}>
                            {bannerPicker.pending ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                <PhotoCameraOutlinedIcon />
                            )}
                            {t('changeBanner')}
                        </span>
                    </button>

                    {draft.bannerUrl && (
                        <Tooltip title={t('removeBanner')}>
                            <IconButton
                                size="small"
                                className={`${styles.remove} ${styles.removeBanner}`}
                                onClick={() => set('bannerUrl', '')}
                                aria-label={t('removeBanner')}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}

                    <div className={styles.avatarWrap}>
                        <button
                            type="button"
                            className={styles.avatarButton}
                            onClick={avatarPicker.pick}
                            disabled={avatarPicker.pending}
                            aria-label={t('changeAvatar')}
                        >
                            <Avatar
                                src={draft.avatarUrl}
                                alt={draft.username}
                                className={styles.avatar}
                            />
                            <span className={`${styles.overlay} ${styles.avatarOverlay}`}>
                                {avatarPicker.pending ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    <PhotoCameraOutlinedIcon />
                                )}
                            </span>
                        </button>

                        {draft.avatarUrl && (
                            <Tooltip title={t('removeAvatar')}>
                                <IconButton
                                    size="small"
                                    className={`${styles.remove} ${styles.removeAvatar}`}
                                    onClick={() => set('avatarUrl', '')}
                                    aria-label={t('removeAvatar')}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                </div>

                <div className={styles.fields}>
                    <CountedTextField
                        label={t('fullName')}
                        value={draft.fullName}
                        onChange={(value) => set('fullName', value)}
                        maxLength={FULLNAME_MAX_LENGTH}
                        error={!fullNameValid}
                        fullWidth
                    />

                    <CountedTextField
                        label={t('username')}
                        value={draft.username}
                        onChange={(value) => set('username', value.toLowerCase())}
                        maxLength={USERNAME_MAX_LENGTH}
                        error={!usernameCheck.success}
                        helperText={
                            usernameCheck.success
                                ? undefined
                                : validationMessage(usernameCheck.error.issues[0]?.message)
                        }
                        fullWidth
                    />

                    <CountedTextField
                        label={t('bio')}
                        value={draft.description}
                        onChange={(value) => set('description', value)}
                        maxLength={DESCRIPTION_MAX_LENGTH}
                        multiline
                        minRows={2}
                        fullWidth
                    />

                    <div className={styles.row}>
                        <Autocomplete
                            options={countries}
                            value={
                                countries.find((country) => country.code === draft.country) ?? null
                            }
                            onChange={(_, country) => {
                                const code = country?.code ?? null;
                                if (code === draft.country) return;
                                // The city most likely belongs to the old country.
                                setDraft((prev) => ({ ...prev, country: code, city: null }));
                            }}
                            getOptionLabel={(country) => country.name}
                            isOptionEqualToValue={(option, value) => option.code === value.code}
                            renderInput={(params) => <TextField {...params} label={t('country')} />}
                            className={styles.grow}
                        />

                        <CityAutocomplete
                            label={t('city')}
                            value={draft.city}
                            country={draft.country}
                            onChange={(city, country) =>
                                setDraft((prev) => ({
                                    ...prev,
                                    city,
                                    country: country ?? prev.country,
                                }))
                            }
                            error={!cityValid}
                            className={styles.grow}
                        />
                    </div>

                    <DateField
                        label={t('birthDate')}
                        value={draft.birthDate}
                        onChange={(value) => set('birthDate', value)}
                        max={latestBirthDate()}
                        error={!birthDateCheck.success}
                        helperText={
                            birthDateCheck.success
                                ? undefined
                                : validationMessage(birthDateCheck.error.issues[0]?.message)
                        }
                        fullWidth
                    />
                </div>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={save.isPending}>
                    {tc('cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => save.mutate()}
                    disabled={
                        save.isPending ||
                        !usernameCheck.success ||
                        !fullNameValid ||
                        !cityValid ||
                        !birthDateCheck.success ||
                        Object.keys(changes).length === 0
                    }
                >
                    {tc('save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
