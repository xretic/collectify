'use client';

import { IconButton, Tooltip } from '@mui/material';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { useReportDialogStore, type ReportRequest } from '../../model/reportDialogStore';
import { promptSignIn } from '@/features/auth/model/authPromptStore';
import { useTranslations } from 'next-intl';

type ReportButtonProps = ReportRequest & {
    className?: string;
    size?: 'small' | 'medium';
    /** Guests are asked to sign in instead. */
    guest?: boolean;
};

export function ReportButton({
    className,
    size = 'medium',
    guest = false,
    ...request
}: ReportButtonProps) {
    const t = useTranslations('reports');
    const open = useReportDialogStore((state) => state.open);
    const label = t(`reportTarget.${request.target.type}`);

    return (
        <Tooltip title={label}>
            <span>
                <IconButton
                    className={className}
                    size={size}
                    color="inherit"
                    onClick={() => (guest ? promptSignIn('report') : open(request))}
                    aria-label={label}
                >
                    <FlagOutlinedIcon fontSize={size === 'small' ? 'small' : 'medium'} />
                </IconButton>
            </span>
        </Tooltip>
    );
}
