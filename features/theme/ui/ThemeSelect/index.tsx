'use client';

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useThemeStore, type ThemeMode } from '@/shared/model/themeStore';
import styles from './index.module.css';

export function ThemeSelect() {
    const mode = useThemeStore((state) => state.mode);
    const setMode = useThemeStore((state) => state.setMode);

    return (
        <FormControl size="small" className={styles.control}>
            <InputLabel id="theme-select">Theme</InputLabel>
            <Select
                labelId="theme-select"
                label="Theme"
                value={mode}
                onChange={(event) => setMode(event.target.value as ThemeMode)}
            >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
            </Select>
        </FormControl>
    );
}
