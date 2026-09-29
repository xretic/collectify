/** A gap smaller than this is browser chrome (toolbars), not the on-screen keyboard. */
const KEYBOARD_MIN_HEIGHT = 120;

/**
 * Callback ref for full-height layouts with a text field at the bottom (chats).
 *
 * iOS ignores `interactive-widget=resizes-content`: the keyboard covers the page instead of
 * shrinking it, and Safari scrolls the page to keep the field in view, leaving a gap under it.
 * While the keyboard is open this sets `data-keyboard` on the element and publishes the part of
 * the screen still visible as `--visible-top` / `--visible-height`, so CSS can pin the layout to it.
 * Browsers that do resize the layout (Chrome on Android) never report the keyboard here.
 */
export function trackVisibleViewport(element: HTMLElement | null) {
    const viewport = window.visualViewport;
    if (!element || !viewport) return;

    const update = () => {
        const keyboard =
            viewport.scale <= 1 && window.innerHeight - viewport.height > KEYBOARD_MIN_HEIGHT;

        element.toggleAttribute('data-keyboard', keyboard);
        element.style.setProperty('--visible-top', `${viewport.offsetTop}px`);
        element.style.setProperty('--visible-height', `${viewport.height}px`);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    return () => {
        viewport.removeEventListener('resize', update);
        viewport.removeEventListener('scroll', update);
    };
}
