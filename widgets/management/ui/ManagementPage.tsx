'use client';

import styles from '@/app/management/management.module.css';
import {
    Avatar,
    Button,
    Chip,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
} from '@mui/material';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import { ElementType, useCallback, useEffect, useMemo, useState } from 'react';
import {
    AuditAction,
    managementApi,
    ManagementCollectionHistoryItem,
    ManagementCommentHistoryItem,
    ManagementMessageHistory,
    ManagementReport,
    ManagementUser,
    ReportVerdict,
    SanctionScope,
} from '@/entities/management/api/managementApi';
import { useUser } from '@/context/UserProvider';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { UserRole } from '@/types/UserRole';

type Duration = '1h' | '1d' | '7d' | '30d' | 'permanent';
type ViewMode = 'users' | 'reports';
type ReviewVerdict = Exclude<ReportVerdict, 'PENDING'>;

const roleIcons: Record<UserRole, ElementType> = {
    Admin: SecurityOutlinedIcon,
    Moderator: GavelOutlinedIcon,
    Verified: VerifiedOutlinedIcon,
};

const durations: Record<Duration, number | null> = {
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    permanent: null,
};

const sanctionScopeLabels: Record<SanctionScope, string> = {
    ACCOUNT: 'Account ban',
    COMMENTS: 'Comments mute',
    MESSENGER: 'Messenger mute',
};

const formatDateTime = (value: string | Date) =>
    new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

const formatSanction = (sanction: ManagementUser['activeSanctions'][number]) => {
    const label = sanctionScopeLabels[sanction.scope];

    if (!sanction.expiresAt) return `${label} · permanent`;

    return `${label} · until ${formatDateTime(sanction.expiresAt)}`;
};

export default function ManagementPage() {
    const { user, loading } = useUser();
    const [users, setUsers] = useState<ManagementUser[]>([]);
    const [audit, setAudit] = useState<AuditAction[]>([]);
    const [reports, setReports] = useState<ManagementReport[]>([]);
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
    const [messageHistory, setMessageHistory] = useState<ManagementMessageHistory | null>(null);
    const [collectionHistory, setCollectionHistory] = useState<ManagementCollectionHistoryItem[]>(
        [],
    );
    const [commentHistory, setCommentHistory] = useState<ManagementCommentHistoryItem[]>([]);
    const [collectionNextSkip, setCollectionNextSkip] = useState<number | null>(0);
    const [commentNextSkip, setCommentNextSkip] = useState<number | null>(0);
    const [messageNextSkip, setMessageNextSkip] = useState<number | null>(0);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('users');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [scope, setScope] = useState<SanctionScope>('ACCOUNT');
    const [duration, setDuration] = useState<Duration>('1d');
    const [reason, setReason] = useState('');
    const [reportVerdict, setReportVerdict] = useState<ReviewVerdict>('GUILTY');
    const [reportPunishmentScope, setReportPunishmentScope] = useState<SanctionScope>('MESSENGER');
    const [reportPunishmentDuration, setReportPunishmentDuration] = useState<Duration>('1d');
    const [reportResolution, setReportResolution] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const isAdmin = !!user?.roles.includes('Admin');
    const canManage = !!user?.roles.some((role) => role === 'Admin' || role === 'Moderator');
    const selected = users.find((item) => item.id === selectedId) ?? users[0] ?? null;
    const selectedReport =
        reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null;

    const selectedRoles = useMemo(() => new Set(selected?.roles ?? []), [selected?.roles]);

    const load = useCallback(async () => {
        setBusy(true);
        setError('');

        try {
            const [usersData, auditData, reportsData] = await Promise.all([
                managementApi.users(query),
                managementApi.audit(),
                managementApi.reports('OPEN'),
            ]);

            setUsers(usersData.data);
            setAudit(auditData.data);
            setReports(reportsData.data);
            setSelectedId((current) =>
                usersData.data.some((item) => item.id === current)
                    ? current
                    : (usersData.data[0]?.id ?? null),
            );
            setSelectedReportId((current) =>
                reportsData.data.some((report) => report.id === current)
                    ? current
                    : (reportsData.data[0]?.id ?? null),
            );
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    }, [query]);

    useEffect(() => {
        if (!loading && canManage) void load();
    }, [loading, canManage, load]);

    useEffect(() => {
        setCollectionHistory([]);
        setCommentHistory([]);
        setCollectionNextSkip(0);
        setCommentNextSkip(0);
        setMessageHistory(null);
        setMessageNextSkip(0);
        setHistoryOpen(false);
    }, [selected?.id]);

    const reloadAfterAction = async () => {
        await load();
    };

    const handleRole = async (role: UserRole, enabled: boolean) => {
        if (!selected) return;
        setBusy(true);
        setError('');

        try {
            await managementApi.setRole(selected.id, role, enabled, reason);
            await reloadAfterAction();
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const handleSanction = async () => {
        if (!selected) return;
        setBusy(true);
        setError('');

        try {
            const durationMs = durations[duration];
            const expiresAt = durationMs ? new Date(Date.now() + durationMs).toISOString() : null;

            await managementApi.createSanction(selected.id, scope, expiresAt, reason);
            setReason('');
            await reloadAfterAction();
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const handleRevokeSanction = async (sanctionId: number) => {
        setBusy(true);
        setError('');

        try {
            await managementApi.revokeSanction(sanctionId);
            await reloadAfterAction();
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selected) return;
        const confirmed = window.confirm(`Delete ${selected.username}? This cannot be undone.`);

        if (!confirmed) return;

        setBusy(true);
        setError('');

        try {
            await managementApi.deleteUser(selected.id);
            setSelectedId(null);
            await reloadAfterAction();
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const handleImpersonate = async () => {
        if (!selected || !isAdmin) return;
        const confirmed = window.confirm(`Sign in as ${selected.username}?`);

        if (!confirmed) return;

        setBusy(true);
        setError('');

        try {
            await managementApi.impersonate(selected.id);
            window.location.href = '/';
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const handleLoadMessageHistory = async () => {
        if (!selected || !isAdmin) return;
        setBusy(true);
        setError('');

        try {
            const data = await managementApi.messageHistory(selected.id, 0);
            setMessageHistory(data);
            setMessageNextSkip(data.nextSkip);
            setHistoryOpen(true);
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const handleLoadMoreMessages = async () => {
        if (!selected || !isAdmin || messageNextSkip === null) return;
        setBusy(true);
        setError('');

        try {
            const data = await managementApi.messageHistory(selected.id, messageNextSkip);
            setMessageHistory((prev) =>
                prev
                    ? {
                          ...data,
                          chats: [...prev.chats, ...data.chats],
                      }
                    : data,
            );
            setMessageNextSkip(data.nextSkip);
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const handleLoadCollections = async () => {
        if (!selected || collectionNextSkip === null) return;
        setBusy(true);
        setError('');

        try {
            const data = await managementApi.collectionHistory(selected.id, collectionNextSkip);
            setCollectionHistory((prev) => [...prev, ...data.data]);
            setCollectionNextSkip(data.nextSkip);
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const handleLoadComments = async () => {
        if (!selected || commentNextSkip === null) return;
        setBusy(true);
        setError('');

        try {
            const data = await managementApi.commentHistory(selected.id, commentNextSkip);
            setCommentHistory((prev) => [...prev, ...data.data]);
            setCommentNextSkip(data.nextSkip);
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const handleCopyUsername = async () => {
        if (!selected) return;
        await navigator.clipboard.writeText(selected.username);
    };

    const handleReviewReport = async () => {
        if (!selectedReport) return;
        setBusy(true);
        setError('');

        try {
            const durationMs = durations[reportPunishmentDuration];
            const expiresAt = durationMs ? new Date(Date.now() + durationMs).toISOString() : null;

            await managementApi.reviewReport(selectedReport.id, {
                verdict: reportVerdict,
                resolution: reportResolution,
                punishment:
                    reportVerdict === 'GUILTY'
                        ? {
                              scope: reportPunishmentScope,
                              expiresAt,
                              reason: reportResolution || selectedReport.reason,
                          }
                        : null,
            });

            setReportResolution('');
            setSelectedReportId(null);
            await reloadAfterAction();
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    if (loading) return null;

    if (!canManage) {
        return (
            <main className={styles.page}>
                <section className={styles.panel}>
                    <h1 className={styles.title}>Management</h1>
                    <p className={styles.muted}>You do not have access to this page.</p>
                </section>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <aside className={styles.sidebar}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Management</h1>
                        <p className={styles.muted}>Users, reports, sanctions</p>
                    </div>

                    <Tooltip title="Refresh">
                        <IconButton
                            onClick={load}
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
                        void load();
                    }}
                >
                    <TextField
                        label={viewMode === 'users' ? 'Search users' : 'Search users'}
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
                                onClick={() => setSelectedId(item.id)}
                            >
                                <Avatar src={item.avatarUrl} alt={item.username} />
                                <span className={styles.userMeta}>
                                    <span className={styles.username}>{item.username}</span>
                                    <span className={styles.muted}>{item.email}</span>
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
                                    onClick={() => setSelectedReportId(report.id)}
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
                                            {report.comment
                                                ? 'Comment report'
                                                : report.message
                                                  ? 'Message report'
                                                  : 'User report'}{' '}
                                            · {report.reason}
                                        </span>
                                    </span>
                                </button>
                            ))
                        ))}
                </div>
            </aside>

            <section className={styles.panel}>
                {error && <div className={styles.error}>{error}</div>}

                {viewMode === 'reports' ? (
                    !selectedReport ? (
                        <p className={styles.muted}>No reports to review.</p>
                    ) : (
                        <div className={styles.reportReview}>
                            <div className={styles.profileHeader}>
                                <Avatar
                                    src={selectedReport.targetUser.avatarUrl}
                                    alt={selectedReport.targetUser.username}
                                    sx={{ width: 58, height: 58 }}
                                />
                                <div>
                                    <h2 className={styles.subtitle}>
                                        Report on @{selectedReport.targetUser.username}
                                    </h2>
                                    <p className={styles.muted}>
                                        Reported by @{selectedReport.reporter.username} ·{' '}
                                        {formatDateTime(selectedReport.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div className={styles.reportGrid}>
                                <div className={styles.reportBox}>
                                    <span className={styles.sectionHint}>Reason</span>
                                    <strong>{selectedReport.reason}</strong>
                                    {selectedReport.details && <p>{selectedReport.details}</p>}
                                </div>

                                {selectedReport.message && (
                                    <div className={styles.reportBox}>
                                        <span className={styles.sectionHint}>Reported message</span>
                                        <p>{selectedReport.message.content}</p>
                                        <span className={styles.muted}>
                                            Chat #{selectedReport.message.chatId} ·{' '}
                                            {formatDateTime(selectedReport.message.createdAt)}
                                        </span>
                                    </div>
                                )}

                                {selectedReport.comment && (
                                    <div className={styles.reportBox}>
                                        <span className={styles.sectionHint}>Reported comment</span>
                                        <p>{selectedReport.comment.text}</p>
                                        <span className={styles.muted}>
                                            {selectedReport.comment.Collection.name} ·{' '}
                                            {formatDateTime(selectedReport.comment.createdAt)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <h3 className={styles.sectionTitle}>Verdict</h3>
                                    <span className={styles.sectionHint}>
                                        Choose outcome and punishment if guilty
                                    </span>
                                </div>

                                <div className={styles.sanctionForm}>
                                    <FormControl size="small">
                                        <InputLabel>Verdict</InputLabel>
                                        <Select
                                            label="Verdict"
                                            value={reportVerdict}
                                            onChange={(event) =>
                                                setReportVerdict(
                                                    event.target.value as ReviewVerdict,
                                                )
                                            }
                                        >
                                            <MenuItem value="GUILTY">Guilty</MenuItem>
                                            <MenuItem value="NO_VIOLATION">No violation</MenuItem>
                                            <MenuItem value="INSUFFICIENT_EVIDENCE">
                                                Insufficient evidence
                                            </MenuItem>
                                            <MenuItem value="DUPLICATE">Duplicate</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {reportVerdict === 'GUILTY' && (
                                        <>
                                            <FormControl size="small">
                                                <InputLabel>Punishment</InputLabel>
                                                <Select
                                                    label="Punishment"
                                                    value={reportPunishmentScope}
                                                    onChange={(event) =>
                                                        setReportPunishmentScope(
                                                            event.target.value as SanctionScope,
                                                        )
                                                    }
                                                >
                                                    <MenuItem value="ACCOUNT">Account ban</MenuItem>
                                                    <MenuItem value="COMMENTS">
                                                        Comments mute
                                                    </MenuItem>
                                                    <MenuItem value="MESSENGER">
                                                        Messenger mute
                                                    </MenuItem>
                                                </Select>
                                            </FormControl>

                                            <FormControl size="small">
                                                <InputLabel>Duration</InputLabel>
                                                <Select
                                                    label="Duration"
                                                    value={reportPunishmentDuration}
                                                    onChange={(event) =>
                                                        setReportPunishmentDuration(
                                                            event.target.value as Duration,
                                                        )
                                                    }
                                                >
                                                    <MenuItem value="1h">1 hour</MenuItem>
                                                    <MenuItem value="1d">1 day</MenuItem>
                                                    <MenuItem value="7d">7 days</MenuItem>
                                                    <MenuItem value="30d">30 days</MenuItem>
                                                    <MenuItem value="permanent" disabled={!isAdmin}>
                                                        Permanent
                                                    </MenuItem>
                                                </Select>
                                            </FormControl>
                                        </>
                                    )}

                                    <TextField
                                        label="Resolution note"
                                        size="small"
                                        value={reportResolution}
                                        onChange={(event) =>
                                            setReportResolution(event.target.value)
                                        }
                                    />

                                    <Button
                                        variant="contained"
                                        disabled={busy}
                                        onClick={handleReviewReport}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Close report
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                ) : !selected ? (
                    <p className={styles.muted}>No users found.</p>
                ) : (
                    <>
                        <div className={styles.profileHeader}>
                            <Avatar
                                src={selected.avatarUrl}
                                alt={selected.username}
                                sx={{ width: 58, height: 58 }}
                            />
                            <div>
                                <button
                                    type="button"
                                    className={styles.copyName}
                                    onClick={handleCopyUsername}
                                    title="Copy username"
                                >
                                    <h2 className={styles.subtitle}>{selected.username}</h2>
                                </button>
                                <a
                                    className={styles.profileLink}
                                    href={`/users/${selected.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {selected.fullName}
                                </a>
                            </div>
                        </div>

                        <div className={styles.chips}>
                            {selected.roles.length === 0 && <Chip label="User" size="small" />}
                            {selected.roles.map((role) => {
                                const Icon = roleIcons[role];
                                return (
                                    <Chip key={role} icon={<Icon />} label={role} size="small" />
                                );
                            })}
                            {selected.activeSanctions.map((sanction) => (
                                <Chip
                                    key={sanction.id}
                                    color="error"
                                    size="small"
                                    label={formatSanction(sanction)}
                                />
                            ))}
                        </div>

                        <div className={styles.stats}>
                            <span className={styles.statItem}>
                                <strong>{selected._count.collections}</strong>
                                Collections
                            </span>
                            <span className={styles.statItem}>
                                <strong>{selected._count.Comment}</strong>
                                Comments
                            </span>
                            <span className={styles.statItem}>
                                <strong>{selected._count.messages}</strong>
                                Messages
                            </span>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3 className={styles.sectionTitle}>Activity history</h3>
                                <span className={styles.sectionHint}>
                                    Loads 10 records at a time
                                </span>
                            </div>

                            <div className={styles.activityGrid}>
                                <div className={styles.activityColumn}>
                                    <div className={styles.historyChatHeader}>
                                        Collections
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            disabled={busy || collectionNextSkip === null}
                                            onClick={handleLoadCollections}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            {collectionHistory.length === 0 ? 'Load' : 'Load more'}
                                        </Button>
                                    </div>

                                    <div className={styles.activityList}>
                                        {collectionHistory.length === 0 ? (
                                            <span className={styles.emptyState}>
                                                No collections loaded
                                            </span>
                                        ) : (
                                            collectionHistory.map((collection) => (
                                                <a
                                                    key={collection.id}
                                                    className={styles.activityItem}
                                                    href={`/collections/${collection.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <span className={styles.username}>
                                                        {collection.name}
                                                    </span>
                                                    <span className={styles.muted}>
                                                        {collection.category} ·{' '}
                                                        {formatDateTime(collection.createdAt)}
                                                    </span>
                                                    <span className={styles.muted}>
                                                        {collection._count.items} items ·{' '}
                                                        {collection._count.comments} comments ·{' '}
                                                        {collection._count.likes} likes
                                                        {collection.private ? ' · private' : ''}
                                                    </span>
                                                </a>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className={styles.activityColumn}>
                                    <div className={styles.historyChatHeader}>
                                        Comments
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            disabled={busy || commentNextSkip === null}
                                            onClick={handleLoadComments}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            {commentHistory.length === 0 ? 'Load' : 'Load more'}
                                        </Button>
                                    </div>

                                    <div className={styles.activityList}>
                                        {commentHistory.length === 0 ? (
                                            <span className={styles.emptyState}>
                                                No comments loaded
                                            </span>
                                        ) : (
                                            commentHistory.map((comment) => (
                                                <a
                                                    key={comment.id}
                                                    className={styles.activityItem}
                                                    href={`/collections/${comment.Collection.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <span className={styles.username}>
                                                        {comment.Collection.name}
                                                    </span>
                                                    <span className={styles.muted}>
                                                        {formatDateTime(comment.createdAt)}
                                                    </span>
                                                    <p>{comment.text}</p>
                                                </a>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3 className={styles.sectionTitle}>Roles</h3>
                                <span className={styles.sectionHint}>
                                    Access badges for this user
                                </span>
                            </div>
                            <div className={styles.actions}>
                                {(['Verified', 'Moderator', 'Admin'] as UserRole[]).map((role) => {
                                    const enabled = selectedRoles.has(role);
                                    const disabled =
                                        busy ||
                                        ((role === 'Admin' || role === 'Moderator') && !isAdmin);

                                    return (
                                        <Button
                                            key={role}
                                            variant={enabled ? 'outlined' : 'contained'}
                                            disabled={disabled}
                                            onClick={() => handleRole(role, !enabled)}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            {enabled ? `Revoke ${role}` : `Grant ${role}`}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3 className={styles.sectionTitle}>Sanctions</h3>
                                <span className={styles.sectionHint}>
                                    Bans and feature-specific mutes
                                </span>
                            </div>
                            <div className={styles.sanctionForm}>
                                <FormControl size="small">
                                    <InputLabel>Scope</InputLabel>
                                    <Select
                                        label="Scope"
                                        value={scope}
                                        onChange={(event) =>
                                            setScope(event.target.value as SanctionScope)
                                        }
                                    >
                                        <MenuItem value="ACCOUNT">Account ban</MenuItem>
                                        <MenuItem value="COMMENTS">Comments mute</MenuItem>
                                        <MenuItem value="MESSENGER">Messenger mute</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl size="small">
                                    <InputLabel>Duration</InputLabel>
                                    <Select
                                        label="Duration"
                                        value={duration}
                                        onChange={(event) =>
                                            setDuration(event.target.value as Duration)
                                        }
                                    >
                                        <MenuItem value="1h">1 hour</MenuItem>
                                        <MenuItem value="1d">1 day</MenuItem>
                                        <MenuItem value="7d">7 days</MenuItem>
                                        <MenuItem value="30d">30 days</MenuItem>
                                        <MenuItem value="permanent" disabled={!isAdmin}>
                                            Permanent
                                        </MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Reason"
                                    size="small"
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                />

                                <Button
                                    variant="contained"
                                    startIcon={<BlockOutlinedIcon />}
                                    disabled={busy}
                                    onClick={handleSanction}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Apply
                                </Button>
                            </div>

                            <div className={styles.sanctions}>
                                {selected.activeSanctions.length === 0 ? (
                                    <span className={styles.emptyState}>No active sanctions</span>
                                ) : (
                                    selected.activeSanctions.map((sanction) => (
                                        <div key={sanction.id} className={styles.sanctionRow}>
                                            <span>{formatSanction(sanction)}</span>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                disabled={busy}
                                                onClick={() => handleRevokeSanction(sanction.id)}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Revoke
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className={styles.danger}>
                            <Button
                                variant="contained"
                                startIcon={<LoginOutlinedIcon />}
                                disabled={!isAdmin || busy}
                                onClick={handleImpersonate}
                                sx={{ textTransform: 'none', mr: 1 }}
                            >
                                Sign in as user
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<HistoryOutlinedIcon />}
                                disabled={!isAdmin || busy}
                                onClick={handleLoadMessageHistory}
                                sx={{ textTransform: 'none', mr: 1 }}
                            >
                                Message history
                            </Button>
                            <Button
                                color="error"
                                variant="outlined"
                                startIcon={<DeleteOutlinedIcon />}
                                disabled={!isAdmin || busy}
                                onClick={handleDeleteUser}
                                sx={{ textTransform: 'none' }}
                            >
                                Delete account
                            </Button>
                        </div>

                        {isAdmin && historyOpen && messageHistory && (
                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <h3 className={styles.sectionTitle}>
                                        @{messageHistory.user.username} conversations
                                    </h3>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => setHistoryOpen(false)}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Hide
                                    </Button>
                                </div>

                                <div className={styles.historyList}>
                                    {messageHistory.chats.length === 0 ? (
                                        <span className={styles.emptyState}>No messages yet</span>
                                    ) : (
                                        <>
                                            {messageHistory.chats.map((chat) => {
                                                const otherUsers = chat.users.filter(
                                                    (chatUser) =>
                                                        chatUser.id !== messageHistory.user.id,
                                                );

                                                return (
                                                    <div
                                                        key={chat.id}
                                                        className={styles.historyChat}
                                                    >
                                                        <div className={styles.historyChatHeader}>
                                                            <ChatBubbleOutlineOutlinedIcon fontSize="small" />
                                                            <span>
                                                                Chat #{chat.id} with{' '}
                                                                {otherUsers
                                                                    .map(
                                                                        (chatUser) =>
                                                                            chatUser.username,
                                                                    )
                                                                    .join(', ') || 'unknown'}
                                                            </span>
                                                        </div>

                                                        <div className={styles.historyMessages}>
                                                            {chat.messages.map((message) => (
                                                                <div
                                                                    key={message.id}
                                                                    className={
                                                                        styles.historyMessage
                                                                    }
                                                                >
                                                                    <Avatar
                                                                        src={message.userAvatarUrl}
                                                                        alt={message.username}
                                                                        sx={{
                                                                            width: 28,
                                                                            height: 28,
                                                                        }}
                                                                    />
                                                                    <div>
                                                                        <span
                                                                            className={
                                                                                styles.username
                                                                            }
                                                                        >
                                                                            {message.username}
                                                                        </span>
                                                                        <span
                                                                            className={styles.muted}
                                                                        >
                                                                            {' '}
                                                                            {formatDateTime(
                                                                                message.createdAt,
                                                                            )}
                                                                        </span>
                                                                        <p>{message.content}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {messageNextSkip !== null && (
                                                <Button
                                                    variant="outlined"
                                                    disabled={busy}
                                                    onClick={handleLoadMoreMessages}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Load more chats
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>

            <section className={styles.audit}>
                <h2 className={styles.subtitle}>Audit</h2>
                <div className={styles.auditList}>
                    {audit.length === 0 ? (
                        <span className={styles.emptyState}>No audit records yet</span>
                    ) : (
                        audit.map((action) => (
                            <div key={action.id} className={styles.auditRow}>
                                <span className={styles.username}>{action.action}</span>
                                <span className={styles.muted}>
                                    {action.actor?.username ?? 'system'}
                                    {' -> '}
                                    {action.targetUser?.username ?? 'content'}
                                    {' | '}
                                    {formatDateTime(action.createdAt)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </main>
    );
}
