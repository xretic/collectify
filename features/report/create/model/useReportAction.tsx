'use client';

import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import type { ActionsMenuItem } from '@/shared/ui/ActionsMenu';
import { useReportDialogStore, type ReportRequest } from './reportDialogStore';
import { useTranslations } from 'next-intl';

/** "Report …" entry for an actions menu. */
export function useReportAction(request: ReportRequest): ActionsMenuItem {
    const t = useTranslations('reports');
    const open = useReportDialogStore((state) => state.open);

    return {
        key: 'report',
        label: t(`reportTarget.${request.target.type}`),
        icon: <FlagOutlinedIcon fontSize="small" />,
        onClick: () => open(request),
        danger: true,
    };
}
