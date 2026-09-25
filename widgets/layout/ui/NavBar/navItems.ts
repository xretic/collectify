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
    /** Key under `nav` in the messages. */
    labelKey: 'home' | 'collections' | 'profile' | 'notifications';
    href: string;
    icon: SvgIconComponent;
    iconOutlined: SvgIconComponent;
    badge?: number;
};

export function getNavItems(user: SessionUser | null): NavItem[] {
    const home: NavItem = {
        labelKey: 'home',
        href: '/',
        icon: HomeIcon,
        iconOutlined: HomeOutlinedIcon,
    };
    if (!user) return [home];

    return [
        home,
        {
            labelKey: 'collections',
            href: '/collections/my',
            icon: EggAltIcon,
            iconOutlined: EggAltOutlinedIcon,
        },
        {
            labelKey: 'profile',
            href: '/users/me',
            icon: AccountCircleIcon,
            iconOutlined: AccountCircleOutlinedIcon,
        },
        {
            labelKey: 'notifications',
            href: '/notifications',
            icon: NotificationsIcon,
            iconOutlined: NotificationsOutlinedIcon,
            badge: user.notifications,
        },
    ];
}
