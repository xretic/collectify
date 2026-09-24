'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Avatar,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
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
    USERNAME_MAX_LENGTH,
} from '@/shared/lib/constants';
import { fullNameSchema, usernameSchema } from '@/shared/lib/validation/schemas';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import { useImagePicker } from '@/shared/lib/hooks/useImagePicker';
import styles from './index.module.css';

type EditProfileDialogProps = {
    open: boolean;
    user: SessionUser;
    onClose: () => void;
};

type Draft = Pick<SessionUser, 'fullName' | 'username' | 'description' | 'avatarUrl' | 'bannerUrl'>;

const pickDraft = (user: SessionUser): Draft => ({
    fullName: user.fullName,
    username: user.username,
    description: user.description,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
});

export function EditProfileDialog({ open, user, onClose }: EditProfileDialogProps) {
    const { setUser } = useSessionUser();
    const [draft, setDraft] = useState<Draft>(() => pickDraft(user));

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
        setDraft((prev) => ({ ...prev, [key]: value }));

    const avatarPicker = useImagePicker((url) => set('avatarUrl', url));
    const bannerPicker = useImagePicker((url) => set('bannerUrl', url));

    const usernameCheck = usernameSchema.safeParse(draft.username);
    const fullNameValid = fullNameSchema.safeParse(draft.fullName).success;

    const changes = Object.fromEntries(
        (Object.keys(draft) as (keyof Draft)[])
            .filter((key) => draft[key] !== user[key])
            .map((key) => [key, draft[key]]),
    );

    const save = useMutation({
        mutationFn: () => userApi.updateProfile(changes),
        onSuccess: (updated) => {
            setUser(updated);
            toast.success('Profile updated.');
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
            <DialogTitle>Edit profile</DialogTitle>

            <DialogContent className={styles.content}>
                <div className={styles.media}>
                    <button
                        type="button"
                        className={styles.banner}
                        onClick={bannerPicker.pick}
                        disabled={bannerPicker.pending}
                        aria-label="Change banner"
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
                            Change banner
                        </span>
                    </button>

                    {draft.bannerUrl && (
                        <Tooltip title="Remove banner">
                            <IconButton
                                size="small"
                                className={`${styles.remove} ${styles.removeBanner}`}
                                onClick={() => set('bannerUrl', '')}
                                aria-label="Remove banner"
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
                            aria-label="Change avatar"
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
                            <Tooltip title="Remove avatar">
                                <IconButton
                                    size="small"
                                    className={`${styles.remove} ${styles.removeAvatar}`}
                                    onClick={() => set('avatarUrl', '')}
                                    aria-label="Remove avatar"
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                </div>

                <div className={styles.fields}>
                    <CountedTextField
                        label="Full name"
                        value={draft.fullName}
                        onChange={(value) => set('fullName', value)}
                        maxLength={FULLNAME_MAX_LENGTH}
                        error={!fullNameValid}
                        fullWidth
                    />

                    <CountedTextField
                        label="Username"
                        value={draft.username}
                        onChange={(value) => set('username', value.toLowerCase())}
                        maxLength={USERNAME_MAX_LENGTH}
                        error={!usernameCheck.success}
                        helperText={
                            usernameCheck.success
                                ? undefined
                                : usernameCheck.error.issues[0]?.message
                        }
                        fullWidth
                    />

                    <CountedTextField
                        label="Bio"
                        value={draft.description}
                        onChange={(value) => set('description', value)}
                        maxLength={DESCRIPTION_MAX_LENGTH}
                        multiline
                        minRows={2}
                        fullWidth
                    />
                </div>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={save.isPending}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => save.mutate()}
                    disabled={
                        save.isPending ||
                        !usernameCheck.success ||
                        !fullNameValid ||
                        Object.keys(changes).length === 0
                    }
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
