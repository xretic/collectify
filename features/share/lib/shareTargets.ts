import type { SvgIconComponent } from '@mui/icons-material';
import FacebookIcon from '@mui/icons-material/Facebook';
import RedditIcon from '@mui/icons-material/Reddit';
import TelegramIcon from '@mui/icons-material/Telegram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import XIcon from '@mui/icons-material/X';

export type ShareTarget = {
    /** Brand name, shown as is in every language. */
    name: string;
    icon: SvgIconComponent;
    href: (url: string, text: string) => string;
};

const encode = encodeURIComponent;

export const SHARE_TARGETS: ShareTarget[] = [
    {
        name: 'Telegram',
        icon: TelegramIcon,
        href: (url, text) => `https://t.me/share/url?url=${encode(url)}&text=${encode(text)}`,
    },
    {
        name: 'WhatsApp',
        icon: WhatsAppIcon,
        href: (url, text) => `https://wa.me/?text=${encode(`${text} ${url}`)}`,
    },
    {
        name: 'X',
        icon: XIcon,
        href: (url, text) => `https://x.com/intent/post?url=${encode(url)}&text=${encode(text)}`,
    },
    {
        name: 'Reddit',
        icon: RedditIcon,
        href: (url, text) =>
            `https://www.reddit.com/submit?url=${encode(url)}&title=${encode(text)}`,
    },
    {
        name: 'Facebook',
        icon: FacebookIcon,
        href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`,
    },
];
