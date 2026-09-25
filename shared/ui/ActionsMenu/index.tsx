'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
import { IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

export type ActionsMenuItem = {
    key: string;
    label: string;
    icon: ReactNode;
    onClick: () => void;
    danger?: boolean;
};

type ActionsMenuProps = {
    items: ActionsMenuItem[];
    label?: string;
    size?: 'small' | 'medium';
    className?: string;
};

/** "⋯" button with a menu of secondary actions (edit, delete, report…). */
export function ActionsMenu({ items, label, size = 'small', className }: ActionsMenuProps) {
    const t = useTranslations('common');
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    if (items.length === 0) return null;

    const close = () => setAnchorEl(null);

    return (
        <>
            <IconButton
                size={size}
                color="inherit"
                className={className}
                onClick={(event: MouseEvent<HTMLElement>) => {
                    event.stopPropagation();
                    setAnchorEl(event.currentTarget);
                }}
                aria-label={label ?? t('moreActions')}
                aria-haspopup="menu"
            >
                <MoreHorizIcon fontSize={size} />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={anchorEl !== null}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {items.map((item) => (
                    <MenuItem
                        key={item.key}
                        className={item.danger ? styles.danger : undefined}
                        onClick={() => {
                            close();
                            item.onClick();
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        {item.label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
