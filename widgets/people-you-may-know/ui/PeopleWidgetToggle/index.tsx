'use client';

import { FormControlLabel, Switch } from '@mui/material';
import { usePeopleWidgetVisibility } from '../../model/visibilityStore';

/** Settings switch that brings back (or hides) the home page suggestions. */
export function PeopleWidgetToggle() {
    const hidden = usePeopleWidgetVisibility((state) => state.hidden);
    const setHidden = usePeopleWidgetVisibility((state) => state.setHidden);

    return (
        <FormControlLabel
            control={
                <Switch checked={!hidden} onChange={(event) => setHidden(!event.target.checked)} />
            }
            label="Show “People you may know” on the home page"
        />
    );
}
