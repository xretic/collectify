'use client';

import Link from 'next/link';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import type { NavItem } from './navItems';
import { NavItemIcon } from './NavItemIcon';
import styles from './index.module.css';

type NavDrawerProps = {
    open: boolean;
    items: NavItem[];
    pathname: string;
    onClose: () => void;
};

export function NavDrawer({ open, items, pathname, onClose }: NavDrawerProps) {
    return (
        <Drawer open={open} onClose={onClose} classes={{ paper: styles.drawer }}>
            <List className={styles.drawerList}>
                {items.map((item) => (
                    <ListItem key={item.href} disablePadding>
                        <ListItemButton component={Link} href={item.href} onClick={onClose}>
                            <ListItemIcon>
                                <NavItemIcon item={item} active={pathname === item.href} />
                            </ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
}
