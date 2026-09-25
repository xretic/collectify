'use client';

import { FormControlLabel, Switch } from '@mui/material';
import { usePeopleWidgetVisibility } from '../../model/visibilityStore';
import { useTranslations } from 'next-intl';

/** Settings switch that brings back (or hides) the home page suggestions. */
export function PeopleWidgetToggle() {
    const t = useTranslations('settings.home');
    const hidden = usePeopleWidgetVisibility((state) => state.hidden);
    const setHidden = usePeopleWidgetVisibility((state) => state.setHidden);

    return (
        <FormControlLabel
            control={
                <Switch checked={!hidden} onChange={(event) => setHidden(!event.target.checked)} />
            }
            label={t('showPeopleWidget')}
        />
    );
}
