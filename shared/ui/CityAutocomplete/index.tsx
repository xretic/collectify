'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Autocomplete, TextField } from '@mui/material';
import { geoApi, geoQueryKeys } from '@/shared/api/geoApi';
import { CITY_MAX_LENGTH } from '@/shared/lib/constants';
import type { CityOption } from '@/shared/lib/geo/cities';
import { countryName } from '@/shared/lib/geo/countries';
import { useDebounce } from '@/shared/lib/hooks/useDebounce';
import styles from './index.module.css';
import { useLocale } from 'next-intl';

type CityAutocompleteProps = {
    label: string;
    value: string | null;
    /** Narrows suggestions to this ISO country; without it the whole world is searched. */
    country: string | null;
    /** `country` is set when a suggestion is picked (the typed text alone carries none). */
    onChange: (city: string | null, country?: string) => void;
    error?: boolean;
    helperText?: string;
    className?: string;
};

/** City input with suggestions from the world cities list; the server accepts only known cities. */
export function CityAutocomplete({
    label,
    value,
    country,
    onChange,
    error,
    helperText,
    className,
}: CityAutocompleteProps) {
    const locale = useLocale();
    const inputValue = value ?? '';
    const query = useDebounce(inputValue.trim(), 250);

    const { data: cities = [], isFetching } = useQuery({
        queryKey: geoQueryKeys.cities(query, country),
        enabled: query.length > 0,
        staleTime: Infinity,
        placeholderData: keepPreviousData,
        queryFn: () => geoApi.searchCities(query, country),
    });

    return (
        <Autocomplete<CityOption, false, false, true>
            freeSolo
            className={className}
            options={query ? cities : []}
            loading={isFetching}
            filterOptions={(options) => options}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
            getOptionKey={(option) =>
                typeof option === 'string' ? option : `${option.country}:${option.name}`
            }
            value={value}
            inputValue={inputValue}
            onInputChange={(_, text, reason) => {
                if (reason === 'input' || reason === 'clear') onChange(text || null);
            }}
            onChange={(_, option) => {
                if (option && typeof option !== 'string') onChange(option.name, option.country);
                else onChange(option || null);
            }}
            renderOption={(props, option) => {
                const { key, ...rest } = props;

                return (
                    <li key={key} {...rest}>
                        <span className={styles.option}>
                            <span>{option.name}</span>
                            {!country && (
                                <span className={styles.country}>
                                    {countryName(option.country, locale)}
                                </span>
                            )}
                        </span>
                    </li>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={error}
                    helperText={helperText}
                    slotProps={{
                        htmlInput: { ...params.inputProps, maxLength: CITY_MAX_LENGTH },
                    }}
                />
            )}
        />
    );
}
