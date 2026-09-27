'use client';

import { useState, type MouseEvent } from 'react';
import { Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import IosShareIcon from '@mui/icons-material/IosShare';
import LinkIcon from '@mui/icons-material/Link';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { toast } from '@/shared/model/toastStore';
import { copyText } from '@/shared/lib/copyText';
import { SHARE_TARGETS } from '../../lib/shareTargets';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type ShareButtonProps = {
    /** Path of the page to share, e.g. `/collections/42`. */
    path: string;
    /** Text that goes with the link ("“Retro games” on Collectify"). */
    text: string;
    /** `pill` sits next to Like / Save, `icon` among the profile actions. */
    variant?: 'pill' | 'icon';
};

const canShareNatively = () => typeof navigator !== 'undefined' && 'share' in navigator;

/** Phones get the system share sheet; elsewhere a menu with "Copy link" and popular apps. */
function prefersNativeSheet() {
    return canShareNatively() && window.matchMedia('(pointer: coarse)').matches;
}

export function ShareButton({ path, text, variant = 'pill' }: ShareButtonProps) {
    const t = useTranslations('share');
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    // Built on open: the menu items are created on every render, the server's included.
    const [url, setUrl] = useState('');

    const absoluteUrl = () => new URL(path, window.location.origin).toString();
    const close = () => setAnchorEl(null);

    const shareNatively = async () => {
        try {
            await navigator.share({ title: text, text, url: absoluteUrl() });
        } catch {
            // Dismissed by the user.
        }
    };

    const copyLink = async () => {
        // Copy before closing: the menu still holds the focus the fallback needs.
        const copied = await copyText(url);
        close();

        if (copied) toast.success(t('copied'));
        else toast.error(t('copyFailed'));
    };

    const open = (event: MouseEvent<HTMLElement>) => {
        if (prefersNativeSheet()) {
            void shareNatively();
            return;
        }

        setUrl(absoluteUrl());
        setAnchorEl(event.currentTarget);
    };

    return (
        <>
            {variant === 'pill' ? (
                <button type="button" className={styles.pill} onClick={open} aria-haspopup="menu">
                    <IosShareIcon />
                    <span>{t('label')}</span>
                </button>
            ) : (
                <Tooltip title={t('label')}>
                    <IconButton
                        color="inherit"
                        onClick={open}
                        aria-label={t('label')}
                        aria-haspopup="menu"
                    >
                        <IosShareIcon />
                    </IconButton>
                </Tooltip>
            )}

            <Menu
                anchorEl={anchorEl}
                open={anchorEl !== null}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                <MenuItem onClick={copyLink}>
                    <ListItemIcon>
                        <LinkIcon fontSize="small" />
                    </ListItemIcon>
                    {t('copyLink')}
                </MenuItem>

                <Divider />

                {SHARE_TARGETS.map((target) => (
                    <MenuItem
                        key={target.name}
                        component="a"
                        href={target.href(url, text)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={close}
                    >
                        <ListItemIcon>
                            <target.icon fontSize="small" />
                        </ListItemIcon>
                        {target.name}
                    </MenuItem>
                ))}

                {canShareNatively() && (
                    <MenuItem
                        onClick={() => {
                            close();
                            void shareNatively();
                        }}
                    >
                        <ListItemIcon>
                            <MoreHorizIcon fontSize="small" />
                        </ListItemIcon>
                        {t('more')}
                    </MenuItem>
                )}
            </Menu>
        </>
    );
}
