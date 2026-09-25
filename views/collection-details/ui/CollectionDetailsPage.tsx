'use client';

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { HTTPError } from 'ky';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useCollectionDetails } from '@/entities/collection/model/useCollectionDetails';
import { CollectionHero, CollectionHeroSkeleton } from '@/entities/collection/ui/CollectionHero';
import { isStaff } from '@/entities/user/model/types';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { CollectionEditDialog } from '@/features/collection/edit/ui/CollectionEditDialog';
import { DeleteCollectionDialog } from '@/features/collection/delete/ui/DeleteCollectionDialog';
import { CollectionStatsDialog } from '@/features/collection/stats/ui/CollectionStatsDialog';
import { EngagementButtons } from '@/features/collection/engage/ui/EngagementButtons';
import { SaveMenu } from '@/features/board/ui/SaveMenu';
import { useReportAction } from '@/features/report/create/model/useReportAction';
import { CollectionItemsGrid } from '@/widgets/collection-items/ui/CollectionItemsGrid';
import { CommentsSection } from '@/widgets/collection-comments/ui/CommentsSection';
import { ActionsMenu, type ActionsMenuItem } from '@/shared/ui/ActionsMenu';
import { Spinner } from '@/shared/ui/Spinner';
import type { CollectionDetails } from '@/entities/collection/model/types';
import { TagChips } from '@/entities/tag/ui/TagChips';
import styles from './CollectionDetailsPage.module.css';
import { useTranslations } from 'next-intl';
import { useFormatters } from '@/shared/lib/format/useFormatters';

export function CollectionDetailsPage() {
    const t = useTranslations('collection');
    const format = useFormatters();
    const collectionId = Number(useParams<{ id: string }>().id);
    const { user } = useSessionUser();
    const { data: collection, error, isPending } = useCollectionDetails(collectionId);

    const [editing, setEditing] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

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

            <div className={styles.page}>
                <section className={styles.panel}>
                    <header className={styles.header}>
                        <h2 className={styles.heading}>{t('description')}</h2>

                        {user && (
                            <CollectionActions
                                collection={collection}
                                isOwner={isOwner}
                                canModerate={canModerate}
                                onEdit={() => setEditing(true)}
                                onStats={() => setStatsOpen(true)}
                                onDelete={() => setDeleting(true)}
                            />
                        )}
                    </header>

                    <p className={styles.description}>{collection.description}</p>

                    <TagChips tags={collection.tags} className={styles.tags} />

                    <footer className={styles.footer}>
                        {!collection.isPrivate && (
                            <EngagementButtons collection={collection} disabled={!user}>
                                <SaveMenu collection={collection} disabled={!user} />
                            </EngagementButtons>
                        )}

                        <span className={styles.meta}>
                            {t('meta', {
                                count: collection.items.length,
                                date: format.date(collection.createdAt),
                            })}
                            {collection.isPrivate && ` · ${t('private')}`}
                        </span>
                    </footer>
                </section>

                <CollectionItemsGrid collection={collection} isOwner={isOwner} />

                {!collection.isPrivate && (
                    <CommentsSection
                        collectionId={collection.id}
                        owner={collection.author}
                        total={collection.comments}
                        viewer={user}
                    />
                )}
            </div>

            {editing && (
                <CollectionEditDialog collection={collection} onClose={() => setEditing(false)} />
            )}

            {(isOwner || canModerate) && (
                <DeleteCollectionDialog
                    open={deleting}
                    onClose={() => setDeleting(false)}
                    collectionId={collection.id}
                    name={collection.name}
                    asModerator={canModerate}
                />
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

type CollectionActionsProps = {
    collection: CollectionDetails;
    isOwner: boolean;
    canModerate: boolean;
    onEdit: () => void;
    onStats: () => void;
    onDelete: () => void;
};

function CollectionActions({
    collection,
    isOwner,
    canModerate,
    onEdit,
    onStats,
    onDelete,
}: CollectionActionsProps) {
    const t = useTranslations('collection');
    const report = useReportAction({
        target: { type: 'COLLECTION', collectionId: collection.id },
        username: collection.author.username,
        preview: collection.name,
    });

    const items: ActionsMenuItem[] = [];

    if (isOwner) {
        items.push({
            key: 'edit',
            label: t('edit.title'),
            icon: <EditOutlinedIcon fontSize="small" />,
            onClick: onEdit,
        });

        if (!collection.isPrivate) {
            items.push({
                key: 'stats',
                label: t('stats.title'),
                icon: <InsertChartOutlinedIcon fontSize="small" />,
                onClick: onStats,
            });
        }
    }

    if (isOwner || canModerate) {
        items.push({
            key: 'delete',
            label: canModerate ? t('deleteAsModerator') : t('deleteCollection'),
            icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
            onClick: onDelete,
            danger: true,
        });
    }

    if (!isOwner) items.push(report);

    return <ActionsMenu items={items} label={t('actions')} size="medium" />;
}
