'use client';

import type { ReportFilters } from '@/entities/moderation/api/managementApi';
import type { ManagementTab } from '../../model/useManagementUrl';
import { UsersList } from '../UsersList';
import { ReportsQueue } from '../ReportsQueue';
import { CategoriesList } from '../CategoriesList';
import { TabIndicator } from '@/shared/ui/TabIndicator';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

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
    { value: 'users' },
    { value: 'reports' },
    { value: 'categories', adminOnly: true },
] as const;

export function ManagementSidebar(props: ManagementSidebarProps) {
    const t = useTranslations('management');

    return (
        <aside className={styles.sidebar}>
            <div>
                <h1 className={styles.title}>{t('title')}</h1>
                <p className={styles.subtitle}>{t('subtitle')}</p>
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
                        {t(`tabs.${tab.value}`)}
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
