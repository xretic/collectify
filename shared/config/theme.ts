'use client';

import { createTheme } from '@mui/material/styles';

/**
 * One MUI theme for the whole app. Colours come from the theme tokens in
 * `app/themes.css`, so switching themes is a single `data-theme` attribute and
 * never re-renders React. `nativeColor` makes MUI derive hover/disabled shades
 * with CSS relative colors, which is what allows `var(...)` in the palette.
 */
export const theme = createTheme({
    cssVariables: { nativeColor: true },
    palette: {
        primary: { main: 'var(--accent)', contrastText: 'var(--on-accent)' },
        error: { main: 'var(--danger)', contrastText: '#ffffff' },
        text: { primary: 'var(--text-color)', secondary: 'var(--soft-text)' },
        background: { default: 'var(--bg-color)', paper: 'var(--container-color)' },
        divider: 'var(--border-color)',
    },
    typography: {
        fontFamily: 'inherit',
        button: { textTransform: 'none' },
    },
    shape: { borderRadius: 8 },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    borderRadius: 'var(--radius-pill)',
                    // MUI's default disabled colours come from the light palette and vanish on dark.
                    '&.Mui-disabled': { color: 'var(--soft-text)', opacity: 0.6 },
                },
                text: { color: 'var(--text-color)' },
                outlined: { color: 'var(--text-color)', borderColor: 'var(--border-color)' },
                contained: {
                    '&.Mui-disabled': { backgroundColor: 'var(--border-color)' },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: { color: 'var(--muted-icon)' },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    color: 'var(--text-color)',
                    backgroundColor: 'var(--container-color)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-color)' },
                    // MUI defaults these to its light palette (black), not our CSS variables.
                    '&:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--soft-text)',
                    },
                    '&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--accent)',
                    },
                    '&.Mui-disabled': { opacity: 0.6 },
                    '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--border-color)',
                    },
                },
                input: {
                    '&::placeholder': { color: 'var(--soft-text)', opacity: 1 },
                    '&.Mui-disabled': { WebkitTextFillColor: 'var(--soft-text)' },
                },
            },
        },
        // `variant="standard"`: the underline defaults to MUI's light palette (black).
        MuiInput: {
            styleOverrides: {
                root: {
                    color: 'var(--text-color)',
                    '&::before': { borderBottomColor: 'var(--border-color)' },
                    '&:hover:not(.Mui-disabled):not(.Mui-error)::before': {
                        borderBottomColor: 'var(--soft-text)',
                    },
                    '&.Mui-disabled::before': { borderBottomStyle: 'solid', opacity: 0.6 },
                },
                input: {
                    '&::placeholder': { color: 'var(--soft-text)', opacity: 1 },
                    '&.Mui-disabled': { WebkitTextFillColor: 'var(--soft-text)' },
                },
            },
        },
        MuiInputAdornment: {
            styleOverrides: { root: { color: 'var(--soft-text)' } },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: 'var(--soft-text)',
                    '&.Mui-focused:not(.Mui-error)': { color: 'var(--accent)' },
                    '&.Mui-disabled': { color: 'var(--soft-text)' },
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: { root: { color: 'var(--soft-text)' } },
        },
        MuiAutocomplete: {
            styleOverrides: {
                popupIndicator: { color: 'var(--soft-text)' },
                clearIndicator: { color: 'var(--soft-text)' },
                noOptions: { color: 'var(--soft-text)' },
                loading: { color: 'var(--soft-text)' },
            },
        },
        MuiFormHelperText: {
            styleOverrides: { root: { color: 'var(--soft-text)' } },
        },
        MuiSelect: {
            styleOverrides: { icon: { color: 'var(--soft-text)' } },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    color: 'var(--text-color)',
                    backgroundColor: 'var(--container-color)',
                    backgroundImage: 'none',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: { root: { color: 'var(--text-color)' } },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: { root: { color: 'var(--text-color)' } },
        },
        MuiListItemIcon: {
            styleOverrides: { root: { color: 'inherit' } },
        },
        MuiChip: {
            styleOverrides: {
                root: { color: 'var(--text-color)', borderColor: 'var(--border-color)' },
            },
        },
        MuiTab: {
            styleOverrides: { root: { color: 'var(--soft-text)' } },
        },
        MuiSkeleton: {
            styleOverrides: { root: { backgroundColor: 'var(--border-color)' } },
        },
        MuiBadge: {
            styleOverrides: {
                badge: { minWidth: 16, height: 16, padding: '0 4px', fontSize: 10 },
            },
        },
        MuiTooltip: {
            defaultProps: { arrow: true },
        },
    },
});
