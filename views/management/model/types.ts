import { ReportVerdict } from '@/entities/management/api/managementApi';

export type Duration = '1h' | '1d' | '7d' | '30d' | 'permanent';
export type ViewMode = 'users' | 'reports';
export type ReviewVerdict = Exclude<ReportVerdict, 'PENDING'>;
