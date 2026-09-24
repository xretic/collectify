'use client';

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { HTTPError } from 'ky';
import { IconButton, Tooltip } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import { useCollectionDetails } from '@/entities/collection/model/useCollectionDetails';
import { CollectionHero, CollectionHeroSkeleton } from '@/entities/collection/ui/CollectionHero';
import { isStaff } from '@/entities/user/model/types';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { CollectionEditDialog } from '@/features/collection/edit/ui/CollectionEditDialog';
import { DeleteCollectionButton } from '@/features/collection/delete/ui/DeleteCollectionButton';
import { CollectionStatsDialog } from '@/features/collection/stats/ui/CollectionStatsDialog';
import { EngagementButtons } from '@/features/collection/engage/ui/EngagementButtons';
import { ReportButton } from '@/features/report/create/ui/ReportButton';
import { CollectionItemsGrid } from '@/widgets/collection-items/ui/CollectionItemsGrid';
import { CommentsSection } from '@/widgets/collection-comments/ui/CommentsSection';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './CollectionDetailsPage.module.css';

export function CollectionDetailsPage() {
    const collectionId = Number(useParams<{ id: string }>().id);
    const { user } = useSessionUser();
    const { data: collection, error, isPending } = useCollectionDetails(collectionId);

    const [editing, setEditing] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);

    if (!Number.isInteger(collectionId) || collectionId <= 0) notFound();
    if (error instanceof HTTPError && error.response.status === 404) notFound();

    if (isPending || !collection) {
        return (
            <>
                <CollectionHeroSkeleton />
                <Spinner />
            </>
        );
    }

    const isOwner = user?.id === collection.author.id;
    const canModerate = Boolean(user && !isOwner && isStaff(user.roles));

    return (
        <>
            <CollectionHero collection={collection} />

            <section className={styles.panel}>
                <header className={styles.header}>
                    <h2>Description</h2>

                    <div className={styles.toolbar}>
                        {(isOwner || canModerate) && (
                            <DeleteCollectionButton
                                collectionId={collection.id}
                                name={collection.name}
                                asModerator={canModerate}
                            />
                        )}

                        {isOwner && (
                            <Tooltip title="Edit collection">
                                <IconButton
                                    color="inherit"
                                    onClick={() => setEditing(true)}
                                    aria-label="Edit collection"
                                >
                                    <EditOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {isOwner && !collection.isPrivate && (
                            <Tooltip title="Collection statistics">
                                <IconButton
                                    color="inherit"
                                    onClick={() => setStatsOpen(true)}
                                    aria-label="Statistics"
                                >
                                    <InsertChartOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {user && !isOwner && (
                            <ReportButton
                                target={{ type: 'COLLECTION', collectionId: collection.id }}
                                username={collection.author.username}
                                preview={collection.name}
                            />
                        )}
                    </div>
                </header>

                <p className={styles.description}>{collection.description}</p>

                {!collection.isPrivate && (
                    <EngagementButtons collection={collection} disabled={!user} />
                )}
            </section>

            <CollectionItemsGrid collection={collection} isOwner={isOwner} />

            {!collection.isPrivate && (
                <CommentsSection
                    collectionId={collection.id}
                    total={collection.comments}
                    viewer={user}
                />
            )}

            {editing && (
                <CollectionEditDialog collection={collection} onClose={() => setEditing(false)} />
            )}

            {isOwner && !collection.isPrivate && (
                <CollectionStatsDialog
                    collectionId={collection.id}
                    open={statsOpen}
                    onClose={() => setStatsOpen(false)}
                />
            )}
        </>
    );
}
