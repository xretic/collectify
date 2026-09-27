/** Query parameter that carries a shared theme (see `encodeTheme`). */
export const THEME_PARAM = 'theme';

/** Opening the link shows the theme in the editor, ready to be saved. */
export const themeShareUrl = (code: string) =>
    `${window.location.origin}/settings?${new URLSearchParams({ [THEME_PARAM]: code })}`;
