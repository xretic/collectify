'use client';

import { useEffect, useRef } from 'react';
import styles from './index.module.css';

/**
 * Underline that slides to the selected tab. Drop it inside a `role="tablist"`
 * element with `position: relative`; it follows `[aria-selected="true"]` (or its
 * closest `[data-tab]` wrapper) through clicks, reorders, drags, resizes and scrolling.
 */
export function TabIndicator() {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const indicator = ref.current;
        const list = indicator?.parentElement;
        if (!indicator || !list) return;

        // Tabs are being dragged or are sliding into place after a reorder.
        const moving = () =>
            list.querySelector('[style*="transform"]') !== null ||
            list
                .getAnimations({ subtree: true })
                .some(
                    (animation) =>
                        animation instanceof CSSTransition &&
                        animation.transitionProperty === 'transform' &&
                        (animation.effect as KeyframeEffect | null)?.target !== indicator,
                );

        let frame = 0;
        // Measures synchronously, so a tab moved by a drag gets its underline in the same frame.
        const place = () => {
            cancelAnimationFrame(frame);

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

            if (moving()) {
                // Stick to the moving tab frame by frame instead of easing after it.
                delete indicator.dataset.ready;
                frame = requestAnimationFrame(place);
            } else if (!('ready' in indicator.dataset)) {
                // The first placement (and the one after a drag) jumps; later ones animate.
                frame = requestAnimationFrame(() => {
                    frame = requestAnimationFrame(() => (indicator.dataset.ready = ''));
                });
            }
        };
        // Resizes are handled a frame later, so moving the underline never re-triggers them.
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(place);
        };

        place();
        const resize = new ResizeObserver(schedule);
        resize.observe(list);
        for (const child of list.children) resize.observe(child);

        const mutation = new MutationObserver((records) => {
            // Skip the indicator's own position updates.
            if (records.some((record) => record.target !== indicator)) place();
        });
        mutation.observe(list, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['aria-selected', 'style'],
        });
        document.fonts?.ready.then(schedule);

        return () => {
            cancelAnimationFrame(frame);
            resize.disconnect();
            mutation.disconnect();
        };
    }, []);

    return <span ref={ref} className={styles.indicator} data-hidden="" aria-hidden />;
}
