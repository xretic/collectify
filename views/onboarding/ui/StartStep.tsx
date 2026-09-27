'use client';

import CheckIcon from '@mui/icons-material/Check';
import type { Messages } from '@/shared/i18n/types';
import styles from './OnboardingPage.module.css';
import { useTranslations } from 'next-intl';

type IdeaKey = keyof Messages['onboarding']['ideas'];

/** Collection ideas per category slug (keys under `onboarding.ideas`). */
const IDEAS_BY_CATEGORY: Record<string, IdeaKey> = {
    books: 'books',
    movies: 'movies',
    games: 'games',
    music: 'music',
    travel: 'travel',
    recipes: 'recipes',
    anime: 'anime',
    'tv-shows': 'tvShows',
    tech: 'tech',
    fashion: 'fashion',
    art: 'art',
    fitness: 'fitness',
};
const GENERIC_IDEAS: IdeaKey[] = ['topTen', 'thisYear', 'gifts'];
const IDEAS_LIMIT = 6;

export type CollectionIdea = { key: IdeaKey; categorySlug?: string };

/** Ideas for the picked categories first, then general ones. */
export function ideasFor(categorySlugs: string[]): CollectionIdea[] {
    const specific = categorySlugs
        .filter((slug) => slug in IDEAS_BY_CATEGORY)
        .map((slug) => ({ key: IDEAS_BY_CATEGORY[slug], categorySlug: slug }));
    return [...specific, ...GENERIC_IDEAS.map((key) => ({ key }))].slice(0, IDEAS_LIMIT);
}

type StartStepProps = {
    ideas: CollectionIdea[];
    selected: CollectionIdea | null;
    onSelect: (idea: CollectionIdea) => void;
};

/** Last step: a nudge to create something, starting from an idea instead of a blank page. */
export function StartStep({ ideas, selected, onSelect }: StartStepProps) {
    const t = useTranslations('onboarding.ideas');

    return (
        <div className={styles.ideas} role="radiogroup">
            {ideas.map((idea) => {
                const active = selected?.key === idea.key;

                return (
                    <button
                        key={idea.key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`${styles.idea} ${active ? styles.ideaActive : ''}`}
                        onClick={() => onSelect(idea)}
                    >
                        {active && <CheckIcon fontSize="small" />}
                        {t(idea.key)}
                    </button>
                );
            })}
        </div>
    );
}
