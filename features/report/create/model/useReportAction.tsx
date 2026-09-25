'use client';

import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { REPORT_TARGET_LABELS } from '@/entities/report/model/types';
import type { ActionsMenuItem } from '@/shared/ui/ActionsMenu';
import { useReportDialogStore, type ReportRequest } from './reportDialogStore';

/** "Report …" entry for an actions menu. */
export function useReportAction(request: ReportRequest): ActionsMenuItem {
    const open = useReportDialogStore((state) => state.open);

    return {
        key: 'report',
        label: `Report ${REPORT_TARGET_LABELS[request.target.type].toLowerCase()}`,
        icon: <FlagOutlinedIcon fontSize="small" />,
        onClick: () => open(request),
        danger: true,
    };
}
