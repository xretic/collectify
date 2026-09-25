import { Tooltip } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ControlCameraOutlinedIcon from '@mui/icons-material/ControlCameraOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import type { UserRole } from '@/entities/user/model/types';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

const ICONS = {
    Verified: VerifiedIcon,
    Moderator: GavelOutlinedIcon,
    Admin: ControlCameraOutlinedIcon,
} as const;

export function UserBadge({ role }: { role: UserRole }) {
    const t = useTranslations('roles');
    const Icon = ICONS[role];

    return (
        <Tooltip title={t(role)}>
            <Icon className={`${styles.badge} ${styles[role]}`} />
        </Tooltip>
    );
}

export function UserBadges({ roles }: { roles: readonly UserRole[] }) {
    return roles.map((role) => <UserBadge key={role} role={role} />);
}
