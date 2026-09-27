'use client';

import type { MouseEvent } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTranslations } from 'next-intl';
import type { ThemeColors, ThemeToken } from '@/shared/config/themes';
import { themeStyle } from '../../lib/palette';
import styles from './ThemePreview.module.css';

type ThemePreviewProps = {
    colors: ThemeColors;
    /** Outlines every part painted with this color. */
    highlight: ThemeToken | null;
    onPick: (token: ThemeToken) => void;
};

/**
 * A small copy of the app painted with the draft colors. Every part carries
 * `data-token`, so a click opens the color it is painted with. Mouse only:
 * the same colors are listed as regular controls next to it.
 */
export function ThemePreview({ colors, highlight, onPick }: ThemePreviewProps) {
    const t = useTranslations('themeEditor.sample');

    const pick = (event: MouseEvent<HTMLDivElement>) => {
        const target = (event.target as HTMLElement).closest<HTMLElement>('[data-token]');
        if (target?.dataset.token) onPick(target.dataset.token as ThemeToken);
    };

    return (
        <div
            className={styles.preview}
            style={themeStyle(colors)}
            data-highlight={highlight ?? undefined}
            data-token="bg-color"
            onClick={pick}
            aria-hidden
        >
            <div className={styles.nav} data-token="container-color">
                <span className={styles.logo} data-token="text-color">
                    Collectify
                </span>
                <span className={styles.search} data-token="border-color">
                    <SearchIcon className={styles.searchIcon} data-token="muted-icon" />
                    <span data-token="soft-text">{t('search')}</span>
                </span>
                <span className={styles.bell} data-token="muted-icon">
                    <NotificationsNoneIcon />
                    <span className={styles.badge} data-token="danger">
                        <span data-token="on-danger">3</span>
                    </span>
                </span>
                <span className={styles.avatar} data-token="accent">
                    <span data-token="on-accent">A</span>
                </span>
            </div>

            <div className={styles.body}>
                <div>
                    <p className={styles.heading} data-token="text-color">
                        {t('title')}
                    </p>
                    <p className={styles.meta} data-token="soft-text">
                        {t('meta')}
                    </p>
                </div>

                <div className={styles.card} data-token="container-color">
                    <div className={styles.cover} data-token="accent" />
                    <div className={styles.cardBody}>
                        <p className={styles.cardTitle} data-token="text-color">
                            {t('itemTitle')}
                        </p>
                        <p className={styles.soft} data-token="soft-text">
                            {t('description')}
                        </p>
                        <div className={styles.tags}>
                            <span className={styles.tag} data-token="border-color">
                                <span data-token="soft-text">#{t('tag1')}</span>
                            </span>
                            <span className={styles.tag} data-token="border-color">
                                <span data-token="soft-text">#{t('tag2')}</span>
                            </span>
                        </div>
                        <div className={styles.stats}>
                            <span className={styles.liked} data-token="danger">
                                <FavoriteIcon /> 128
                            </span>
                            <span className={styles.saved} data-token="favorite">
                                <BookmarkIcon /> 42
                            </span>
                            <span className={styles.comments} data-token="muted-icon">
                                <ChatBubbleOutlineIcon /> 9
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.field} data-token="border-color">
                    <span className={styles.fieldLabel} data-token="soft-text">
                        {t('fieldLabel')}
                    </span>
                    <span data-token="text-color">{t('fieldValue')}</span>
                </div>
                <p className={styles.error} data-token="danger">
                    <ErrorOutlineIcon /> {t('error')}
                </p>

                <div className={styles.actions}>
                    <span className={styles.primary} data-token="accent">
                        <span data-token="on-accent">{t('follow')}</span>
                    </span>
                    <span className={styles.outlined} data-token="border-color">
                        <span data-token="text-color">{t('share')}</span>
                    </span>
                    <span className={styles.dangerButton} data-token="danger">
                        <span data-token="on-danger">{t('delete')}</span>
                    </span>
                    <span className={styles.link} data-token="accent">
                        {t('link')}
                    </span>
                </div>
            </div>
        </div>
    );
}
