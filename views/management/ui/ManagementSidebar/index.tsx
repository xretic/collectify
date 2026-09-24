'use client';

import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import type { ReportFilters } from '@/entities/moderation/api/managementApi';
import type { ManagementTab } from '../../model/useManagementUrl';
import { UsersList } from '../UsersList';
import { ReportsQueue } from '../ReportsQueue';
import styles from './index.module.css';

type ManagementSidebarProps = {
    tab: ManagementTab;
    onTabChange: (tab: ManagementTab) => void;
    userId: number | null;
    onSelectUser: (userId: number) => void;
    reportId: number | null;
    onSelectReport: (reportId: number) => void;
    reportFilters: ReportFilters;
    onReportFiltersChange: (filters: ReportFilters) => void;
};

const TABS = [
    { value: 'users', label: 'Users', icon: <PeopleAltOutlinedIcon fontSize="small" /> },
    {
        value: 'reports',
        label: 'Reports',
        icon: <ReportGmailerrorredOutlinedIcon fontSize="small" />,
    },
] as const;

export function ManagementSidebar(props: ManagementSidebarProps) {
    return (
        <aside className={styles.sidebar}>
            <div>
                <h1 className={styles.title}>Management</h1>
                <p className={styles.subtitle}>Users, reports, sanctions</p>
            </div>

            <div className={styles.tabs} role="tablist">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={props.tab === tab.value}
                        className={`${styles.tab} ${props.tab === tab.value ? styles.tabActive : ''}`}
                        onClick={() => props.onTabChange(tab.value)}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {props.tab === 'users' ? (
                <UsersList selectedId={props.userId} onSelect={props.onSelectUser} />
            ) : (
                <ReportsQueue
                    filters={props.reportFilters}
                    onFiltersChange={props.onReportFiltersChange}
                    selectedId={props.reportId}
                    onSelect={props.onSelectReport}
                />
            )}
        </aside>
    );
}
