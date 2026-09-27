'use client';

import Link from 'next/link';
import { Button } from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import { useCategoryShowcase } from '@/entities/category/model/useCategoryShowcase';
import { useCategoryName } from '@/entities/category/model/useCategoryName';
import { ScrollRow } from '@/shared/ui/ScrollRow';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

const POINTS = [
    { key: 'save', Icon: BookmarkBorderIcon },
    { key: 'follow', Icon: PeopleOutlineIcon },
    { key: 'create', Icon: AutoAwesomeOutlinedIcon },
] as const;

/** What Collectify is, for first-time visitors: pitch, sign-up, and a way into the categories. */
export function GuestHero() {
    const t = useTranslations('landing');
    const categoryName = useCategoryName();
    const { data: categories = [] } = useCategoryShowcase();
    const covers = categories.flatMap((category) => category.coverUrl ?? []).slice(0, 3);

    return (
        <>
            <section className={styles.hero}>
                <div className={styles.copy}>
                    <h1 className={styles.title}>{t('title')}</h1>
                    <p className={styles.subtitle}>{t('subtitle')}</p>

                    <div className={styles.actions}>
                        <Button
                            variant="contained"
                            size="large"
                            component={Link}
                            href="/auth/register"
                        >
                            {t('start')}
                        </Button>
                        <Button size="large" href="#feed">
                            {t('explore')}
                        </Button>
                    </div>

                    <ul className={styles.points}>
                        {POINTS.map(({ key, Icon }) => (
                            <li key={key} className={styles.point}>
                                <Icon fontSize="small" />
                                {t(`points.${key}`)}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.collage} aria-hidden>
                    {covers.map((src, index) => (
                        <img key={src} src={src} alt="" className={styles[`card${index}`]} />
                    ))}
                </div>
            </section>

            {categories.length > 0 && (
                <section className={styles.categories} aria-labelledby="browse-categories">
                    <h2 id="browse-categories" className={styles.heading}>
                        {t('browse')}
                    </h2>
                    <ScrollRow itemsLabel={t('categoriesLabel')} className={styles.row}>
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/?category=${category.slug}`}
                                className={styles.tile}
                            >
                                {category.coverUrl ? (
                                    <img className={styles.cover} src={category.coverUrl} alt="" />
                                ) : (
                                    <span className={`${styles.cover} ${styles.placeholder}`} />
                                )}
                                <span className={styles.shade} />
                                <span className={styles.name}>{categoryName(category)}</span>
                            </Link>
                        ))}
                    </ScrollRow>
                </section>
            )}
        </>
    );
}
