'use client';

import styles from '@/app/management/management.module.css';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import { Avatar, Button, IconButton, TextField, Tooltip } from '@mui/material';
import { ManagementReport, ManagementUser } from '@/entities/management/api/managementApi';
import { reportKind } from '../lib/format';
import { ViewMode } from '../model/types';

type ManagementSidebarProps = {
    busy: boolean;
    users: ManagementUser[];
    reports: ManagementReport[];
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    selected: ManagementUser | null;
    selectedReport: ManagementReport | null;
    query: string;
    setQuery: (value: string) => void;
    onRefresh: () => void;
    onSelectUser: (id: number) => void;
    onSelectReport: (id: number) => void;
};

export function ManagementSidebar({
    busy,
    users,
    reports,
    viewMode,
    setViewMode,
    selected,
    selectedReport,
    query,
    setQuery,
    onRefresh,
    onSelectUser,
    onSelectReport,
}: ManagementSidebarProps) {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Management</h1>
                    <p className={styles.muted}>Users, reports, sanctions</p>
                </div>

                <Tooltip title="Refresh">
                    <IconButton
                        onClick={onRefresh}
                        disabled={busy}
                        sx={{ color: 'var(--text-color)' }}
                    >
                        <RefreshOutlinedIcon />
                    </IconButton>
                </Tooltip>
            </div>

            <div className={styles.modeSwitch}>
                <button
                    type="button"
                    className={`${styles.modeButton} ${
                        viewMode === 'users' ? styles.modeButtonActive : ''
                    }`}
                    onClick={() => setViewMode('users')}
                >
                    <PeopleAltOutlinedIcon fontSize="small" />
                    Users
                </button>
                <button
                    type="button"
                    className={`${styles.modeButton} ${
                        viewMode === 'reports' ? styles.modeButtonActive : ''
                    }`}
                    onClick={() => setViewMode('reports')}
                >
                    <ReportGmailerrorredOutlinedIcon fontSize="small" />
                    Reports
                    {reports.length > 0 && (
                        <span className={styles.countBadge}>{reports.length}</span>
                    )}
                </button>
            </div>

            <form
                className={styles.search}
                onSubmit={(event) => {
                    event.preventDefault();
                    onRefresh();
                }}
            >
                <TextField
                    label="Search users"
                    size="small"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    fullWidth
                />
                <Button
                    variant="contained"
                    type="submit"
                    disabled={busy}
                    sx={{ textTransform: 'none' }}
                >
                    Find
                </Button>
            </form>

            <div className={styles.userList}>
                {viewMode === 'users' &&
                    users.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`${styles.userRow} ${
                                selected?.id === item.id ? styles.userRowActive : ''
                            }`}
                            onClick={() => onSelectUser(item.id)}
                        >
                            <Avatar src={item.avatarUrl} alt={item.username} />
                            <span className={styles.userMeta}>
                                <span className={styles.username}>
                                    {item.fullName || item.username}
                                </span>
                                <span className={styles.muted}>@{item.username}</span>
                            </span>
                        </button>
                    ))}

                {viewMode === 'reports' &&
                    (reports.length === 0 ? (
                        <span className={styles.emptyState}>No open reports</span>
                    ) : (
                        reports.map((report) => (
                            <button
                                key={report.id}
                                type="button"
                                className={`${styles.userRow} ${
                                    selectedReport?.id === report.id ? styles.userRowActive : ''
                                }`}
                                onClick={() => onSelectReport(report.id)}
                            >
                                <Avatar
                                    src={report.targetUser.avatarUrl}
                                    alt={report.targetUser.username}
                                />
                                <span className={styles.userMeta}>
                                    <span className={styles.username}>
                                        @{report.targetUser.username}
                                    </span>
                                    <span className={styles.muted}>
                                        {reportKind(report)} · {report.reason}
                                    </span>
                                </span>
                            </button>
                        ))
                    ))}
            </div>
        </aside>
    );
}
