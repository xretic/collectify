import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { ElementType } from 'react';
import { UserRole } from '@/types/UserRole';

export const roleIcons: Record<UserRole, ElementType> = {
    Admin: SecurityOutlinedIcon,
    Moderator: GavelOutlinedIcon,
    Verified: VerifiedOutlinedIcon,
};
