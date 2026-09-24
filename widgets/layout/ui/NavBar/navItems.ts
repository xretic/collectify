import type { SvgIconComponent } from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import EggAltIcon from '@mui/icons-material/EggAlt';
import EggAltOutlinedIcon from '@mui/icons-material/EggAltOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import type { SessionUser } from '@/entities/user/model/types';

export type NavItem = {
    label: string;
    href: string;
    icon: SvgIconComponent;
    iconOutlined: SvgIconComponent;
    badge?: number;
};

export function getNavItems(user: SessionUser | null): NavItem[] {
    const home: NavItem = {
        label: 'Home',
        href: '/',
        icon: HomeIcon,
        iconOutlined: HomeOutlinedIcon,
    };
    if (!user) return [home];

    return [
        home,
        {
            label: 'Collections',
            href: '/collections/my',
            icon: EggAltIcon,
            iconOutlined: EggAltOutlinedIcon,
        },
        {
            label: 'Profile',
            href: '/users/me',
            icon: AccountCircleIcon,
            iconOutlined: AccountCircleOutlinedIcon,
        },
        {
            label: 'Notifications',
            href: '/notifications',
            icon: NotificationsIcon,
            iconOutlined: NotificationsOutlinedIcon,
            badge: user.notifications,
        },
    ];
}
