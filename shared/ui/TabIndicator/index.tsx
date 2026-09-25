'use client';

import { useEffect, useRef } from 'react';
import styles from './index.module.css';

/**
 * Underline that slides to the selected tab. Drop it inside a `role="tablist"`
 * element with `position: relative`; it follows `[aria-selected="true"]` (or its
 * closest `[data-tab]` wrapper) through clicks, reorders, resizes and scrolling.
 */
export function TabIndicator() {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const indicator = ref.current;
        const list = indicator?.parentElement;
        if (!indicator || !list) return;

        let frame = 0;
        const place = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const selected = list.querySelector<HTMLElement>('[aria-selected="true"]');
                const target = selected?.closest<HTMLElement>('[data-tab]') ?? selected;

                if (!target || !list.contains(target)) {
                    indicator.dataset.hidden = '';
                    return;
                }

                const listBox = list.getBoundingClientRect();
                const box = target.getBoundingClientRect();
                // Measured on screen, so drag offsets and scrolling are included.
                const left = box.left - listBox.left + list.scrollLeft - list.clientLeft;
                const top = box.bottom - listBox.top + list.scrollTop - list.clientTop;

                indicator.style.setProperty('--x', `${left}px`);
                indicator.style.setProperty('--y', `${top}px`);
                indicator.style.setProperty('--w', `${box.width}px`);
                delete indicator.dataset.hidden;
                // The first placement jumps; later ones animate.
                requestAnimationFrame(() => (indicator.dataset.ready = ''));
            });
        };

        place();
        const resize = new ResizeObserver(place);
        resize.observe(list);
        for (const child of list.children) resize.observe(child);

        const mutation = new MutationObserver(place);
        mutation.observe(list, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['aria-selected'],
        });
        document.fonts?.ready.then(place);

        return () => {
            cancelAnimationFrame(frame);
            resize.disconnect();
            mutation.disconnect();
        };
    }, []);

    return <span ref={ref} className={styles.indicator} data-hidden="" aria-hidden />;
}
