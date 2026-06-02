import { UserRole } from '@/types/UserRole';
import { Tooltip } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ControlCameraOutlinedIcon from '@mui/icons-material/ControlCameraOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';

interface UserBadgeProps {
    role: UserRole;
}

const icons = {
    Verified: VerifiedIcon,
    Moderator: GavelOutlinedIcon,
    Admin: ControlCameraOutlinedIcon,
} as const;

const colors = {
    Verified: '#208fff',
    Moderator: '#14b8a6',
    Admin: '#f59e0b',
} as const;

const sizes = {
    Verified: 2,
    Moderator: 3,
    Admin: 1,
} as const;

export default function UserBadge({ role }: UserBadgeProps) {
    const Icon = icons[role];
    const color = colors[role];
    const size = sizes[role];

    return (
        <Tooltip title={role}>
            <Icon
                sx={{
                    backgroundColor: color,
                    color: 'white',
                    borderRadius: '50%',
                    padding: `${size}px`,
                    fontSize: 22,
                }}
            />
        </Tooltip>
    );
}
