'use client';

import styles from '@/app/management/management.module.css';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import {
    Avatar,
    Button,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import {
    ManagementCollectionHistoryItem,
    ManagementCommentHistoryItem,
    ManagementMessageHistory,
    ManagementUser,
    SanctionScope,
} from '@/entities/management/api/managementApi';
import { UserRole } from '@/types/UserRole';
import { formatSanction } from '../lib/format';
import { roleIcons } from '../lib/roleIcons';
import { Duration } from '../model/types';
import { ActivityHistory } from './ActivityHistory';
import { DurationSelect } from './DurationSelect';
import { MessageHistory } from './MessageHistory';

type UsersPanelProps = {
    busy: boolean;
    isAdmin: boolean;
    selected: ManagementUser | null;
    selectedRoles: Set<UserRole>;
    collectionHistory: ManagementCollectionHistoryItem[];
    commentHistory: ManagementCommentHistoryItem[];
    collectionNextSkip: number | null;
    commentNextSkip: number | null;
    messageHistory: ManagementMessageHistory | null;
    messageNextSkip: number | null;
    historyOpen: boolean;
    setHistoryOpen: (value: boolean) => void;
    onCopyUsername: () => void;
    onRole: (role: UserRole, enabled: boolean) => void;
    onSanction: () => void;
    onRevokeSanction: (sanctionId: number) => void;
    onDeleteUser: () => void;
    onImpersonate: () => void;
    onLoadCollections: () => void;
    onLoadComments: () => void;
    onLoadMessageHistory: () => void;
    onLoadMoreMessages: () => void;
    scope: SanctionScope;
    setScope: (value: SanctionScope) => void;
    duration: Duration;
    setDuration: (value: Duration) => void;
    reason: string;
    setReason: (value: string) => void;
};

export function UsersPanel({
    busy,
    isAdmin,
    selected,
    selectedRoles,
    collectionHistory,
    commentHistory,
    collectionNextSkip,
    commentNextSkip,
    messageHistory,
    messageNextSkip,
    historyOpen,
    setHistoryOpen,
    onCopyUsername,
    onRole,
    onSanction,
    onRevokeSanction,
    onDeleteUser,
    onImpersonate,
    onLoadCollections,
    onLoadComments,
    onLoadMessageHistory,
    onLoadMoreMessages,
    scope,
    setScope,
    duration,
    setDuration,
    reason,
    setReason,
}: UsersPanelProps) {
    if (!selected) return <p className={styles.muted}>No users found.</p>;

    return (
        <>
            <div className={styles.profileHeader}>
                <Avatar
                    src={selected.avatarUrl}
                    alt={selected.username}
                    sx={{ width: 58, height: 58 }}
                />
                <div>
                    <a
                        className={styles.profileTitleLink}
                        href={`/users/${selected.id}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <h2 className={styles.subtitle}>
                            {selected.fullName || selected.username}
                        </h2>
                    </a>
                    <button
                        type="button"
                        className={styles.copyName}
                        onClick={onCopyUsername}
                        title="Copy username"
                    >
                        @{selected.username}
                    </button>
                </div>
            </div>

            <div className={styles.chips}>
                {selected.roles.length === 0 && <Chip label="User" size="small" />}
                {selected.roles.map((role) => {
                    const Icon = roleIcons[role];
                    return <Chip key={role} icon={<Icon />} label={role} size="small" />;
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

            <ActivityHistory
                busy={busy}
                collectionHistory={collectionHistory}
                commentHistory={commentHistory}
                collectionNextSkip={collectionNextSkip}
                commentNextSkip={commentNextSkip}
                onLoadCollections={onLoadCollections}
                onLoadComments={onLoadComments}
            />

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Roles</h3>
                    <span className={styles.sectionHint}>Access badges for this user</span>
                </div>
                <div className={styles.actions}>
                    {(['Verified', 'Moderator', 'Admin'] as UserRole[]).map((role) => {
                        const enabled = selectedRoles.has(role);
                        const disabled =
                            busy || ((role === 'Admin' || role === 'Moderator') && !isAdmin);

                        return (
                            <Button
                                key={role}
                                variant={enabled ? 'outlined' : 'contained'}
                                disabled={disabled}
                                onClick={() => onRole(role, !enabled)}
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
                    <span className={styles.sectionHint}>Bans and feature-specific mutes</span>
                </div>
                <div className={styles.sanctionForm}>
                    <FormControl size="small">
                        <InputLabel>Scope</InputLabel>
                        <Select
                            label="Scope"
                            value={scope}
                            onChange={(event) => setScope(event.target.value as SanctionScope)}
                        >
                            <MenuItem value="ACCOUNT">Account ban</MenuItem>
                            <MenuItem value="COMMENTS">Comments mute</MenuItem>
                            <MenuItem value="MESSENGER">Messenger mute</MenuItem>
                        </Select>
                    </FormControl>

                    <DurationSelect value={duration} setValue={setDuration} isAdmin={isAdmin} />

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
                        onClick={onSanction}
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
                                    onClick={() => onRevokeSanction(sanction.id)}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Revoke
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className={styles.danger}>
                    <Button
                        variant="contained"
                        startIcon={<LoginOutlinedIcon />}
                        disabled={busy}
                        onClick={onImpersonate}
                        sx={{ textTransform: 'none', mr: 1 }}
                    >
                        Sign in as user
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<HistoryOutlinedIcon />}
                        disabled={busy}
                        onClick={onLoadMessageHistory}
                        sx={{ textTransform: 'none', mr: 1 }}
                    >
                        Message history
                    </Button>
                    <Button
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlinedIcon />}
                        disabled={busy}
                        onClick={onDeleteUser}
                        sx={{ textTransform: 'none' }}
                    >
                        Delete account
                    </Button>
                </div>
            )}

            {isAdmin && historyOpen && messageHistory && (
                <MessageHistory
                    busy={busy}
                    messageHistory={messageHistory}
                    messageNextSkip={messageNextSkip}
                    setHistoryOpen={setHistoryOpen}
                    onLoadMoreMessages={onLoadMoreMessages}
                />
            )}
        </>
    );
}
