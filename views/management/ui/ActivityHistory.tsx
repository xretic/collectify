'use client';

import styles from '@/app/management/management.module.css';
import { Button } from '@mui/material';
import {
    ManagementCollectionHistoryItem,
    ManagementCommentHistoryItem,
} from '@/entities/management/api/managementApi';
import { formatDateTime } from '../lib/format';

type ActivityHistoryProps = {
    busy: boolean;
    collectionHistory: ManagementCollectionHistoryItem[];
    commentHistory: ManagementCommentHistoryItem[];
    collectionNextSkip: number | null;
    commentNextSkip: number | null;
    onLoadCollections: () => void;
    onLoadComments: () => void;
};

export function ActivityHistory({
    busy,
    collectionHistory,
    commentHistory,
    collectionNextSkip,
    commentNextSkip,
    onLoadCollections,
    onLoadComments,
}: ActivityHistoryProps) {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Activity history</h3>
                <span className={styles.sectionHint}>Loads 10 records at a time</span>
            </div>

            <div className={styles.activityGrid}>
                <div className={styles.activityColumn}>
                    <div className={styles.historyChatHeader}>
                        Collections
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={busy || collectionNextSkip === null}
                            onClick={onLoadCollections}
                            sx={{ textTransform: 'none' }}
                        >
                            {collectionHistory.length === 0 ? 'Load' : 'Load more'}
                        </Button>
                    </div>

                    <div className={styles.activityList}>
                        {collectionHistory.length === 0 ? (
                            <span className={styles.emptyState}>No collections loaded</span>
                        ) : (
                            collectionHistory.map((collection) => (
                                <a
                                    key={collection.id}
                                    className={styles.activityItem}
                                    href={`/collections/${collection.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span className={styles.username}>{collection.name}</span>
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
                            onClick={onLoadComments}
                            sx={{ textTransform: 'none' }}
                        >
                            {commentHistory.length === 0 ? 'Load' : 'Load more'}
                        </Button>
                    </div>

                    <div className={styles.activityList}>
                        {commentHistory.length === 0 ? (
                            <span className={styles.emptyState}>No comments loaded</span>
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
    );
}
