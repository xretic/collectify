'use client';

import { IconButton, Tooltip } from '@mui/material';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { REPORT_TARGET_LABELS } from '@/entities/report/model/types';
import { useReportDialogStore, type ReportRequest } from '../../model/reportDialogStore';

type ReportButtonProps = ReportRequest & {
    className?: string;
    size?: 'small' | 'medium';
    disabled?: boolean;
};

export function ReportButton({
    className,
    size = 'medium',
    disabled,
    ...request
}: ReportButtonProps) {
    const open = useReportDialogStore((state) => state.open);
    const label = `Report ${REPORT_TARGET_LABELS[request.target.type].toLowerCase()}`;

    return (
        <Tooltip title={label}>
            <span>
                <IconButton
                    className={className}
                    size={size}
                    color="inherit"
                    disabled={disabled}
                    onClick={() => open(request)}
                    aria-label={label}
                >
                    <FlagOutlinedIcon fontSize={size === 'small' ? 'small' : 'medium'} />
                </IconButton>
            </span>
        </Tooltip>
    );
}
