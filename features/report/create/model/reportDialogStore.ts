import { create } from 'zustand';
import type { ReportTarget } from '@/entities/report/model/types';

export type ReportRequest = {
    target: ReportTarget;
    /** Who is being reported (for the dialog header). */
    username: string;
    /** Text/name of the reported content, shown as a quote. */
    preview?: string;
};

type ReportDialogState = {
    request: ReportRequest | null;
    open: (request: ReportRequest) => void;
    close: () => void;
};

/** One report dialog for the whole app instead of one per comment. */
export const useReportDialogStore = create<ReportDialogState>((set) => ({
    request: null,
    open: (request) => set({ request }),
    close: () => set({ request: null }),
}));
