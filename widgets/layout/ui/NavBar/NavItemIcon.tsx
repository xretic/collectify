import { Badge } from '@mui/material';
import type { NavItem } from './navItems';

export function NavItemIcon({ item, active }: { item: NavItem; active: boolean }) {
    const Icon = active ? item.icon : item.iconOutlined;

    return (
        <Badge badgeContent={item.badge} max={99} color="error" invisible={!item.badge}>
            <Icon fontSize="small" />
        </Badge>
    );
}
