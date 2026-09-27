import type { SvgIconComponent } from '@mui/icons-material';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import CollectionsBookmarkOutlinedIcon from '@mui/icons-material/CollectionsBookmarkOutlined';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import type { SessionUser } from '@/entities/user/model/types';

export type NavItem = {
    /** Key under `nav` in the messages. */
    labelKey: 'home' | 'collections' | 'notifications';
    href: string;
    icon: SvgIconComponent;
    iconOutlined: SvgIconComponent;
    badge?: number;
};

/** The desktop navbar links; the profile lives in the account menu. */
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
            icon: CollectionsBookmarkIcon,
            iconOutlined: CollectionsBookmarkOutlinedIcon,
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
