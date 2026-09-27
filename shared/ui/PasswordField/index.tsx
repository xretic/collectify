'use client';

import { useState } from 'react';
import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslations } from 'next-intl';

/** Password input with a show / hide toggle (typing blind on a phone keyboard is error-prone). */
export function PasswordField({ slotProps, ...props }: Omit<TextFieldProps, 'type'>) {
    const t = useTranslations('auth');
    const [visible, setVisible] = useState(false);
    const label = visible ? t('hidePassword') : t('showPassword');

    return (
        <TextField
            {...props}
            type={visible ? 'text' : 'password'}
            slotProps={{
                ...slotProps,
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => setVisible((value) => !value)}
                                aria-label={label}
                                title={label}
                                edge="end"
                            >
                                {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
}
