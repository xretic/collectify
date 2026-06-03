'use client';

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { Duration } from '../model/types';

type DurationSelectProps = {
    value: Duration;
    setValue: (value: Duration) => void;
    isAdmin: boolean;
};

export function DurationSelect({ value, setValue, isAdmin }: DurationSelectProps) {
    return (
        <FormControl size="small">
            <InputLabel>Duration</InputLabel>
            <Select
                label="Duration"
                value={value}
                onChange={(event) => setValue(event.target.value as Duration)}
            >
                <MenuItem value="1h">1 hour</MenuItem>
                <MenuItem value="1d">1 day</MenuItem>
                <MenuItem value="7d">7 days</MenuItem>
                <MenuItem value="30d">30 days</MenuItem>
                <MenuItem value="permanent" disabled={!isAdmin}>
                    Permanent
                </MenuItem>
            </Select>
        </FormControl>
    );
}
