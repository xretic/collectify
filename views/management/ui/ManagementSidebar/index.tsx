'use client';

import type { ReportFilters } from '@/entities/moderation/api/managementApi';
import type { ManagementTab } from '../../model/useManagementUrl';
import { UsersList } from '../UsersList';
import { ReportsQueue } from '../ReportsQueue';
import { CategoriesList } from '../CategoriesList';
import { TabIndicator } from '@/shared/ui/TabIndicator';
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
    categoryId: number | 'new' | null;
    onSelectCategory: (categoryId: number | 'new') => void;
    isAdmin: boolean;
};

const TABS = [
    { value: 'users', label: 'Users' },
    { value: 'reports', label: 'Reports' },
    { value: 'categories', label: 'Categories', adminOnly: true },
] as const;

export function ManagementSidebar(props: ManagementSidebarProps) {
    return (
        <aside className={styles.sidebar}>
            <div>
                <h1 className={styles.title}>Management</h1>
                <p className={styles.subtitle}>Users, reports, sanctions, categories</p>
            </div>

            <div className={styles.tabs} role="tablist">
                {TABS.filter((tab) => !('adminOnly' in tab) || props.isAdmin).map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={props.tab === tab.value}
                        className={`${styles.tab} ${props.tab === tab.value ? styles.tabActive : ''}`}
                        onClick={() => props.onTabChange(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
                <TabIndicator />
            </div>

            {props.tab === 'users' && (
                <UsersList selectedId={props.userId} onSelect={props.onSelectUser} />
            )}

            {props.tab === 'reports' && (
                <ReportsQueue
                    filters={props.reportFilters}
                    onFiltersChange={props.onReportFiltersChange}
                    selectedId={props.reportId}
                    onSelect={props.onSelectReport}
                />
            )}

            {props.tab === 'categories' && props.isAdmin && (
                <CategoriesList selectedId={props.categoryId} onSelect={props.onSelectCategory} />
            )}
        </aside>
    );
}
