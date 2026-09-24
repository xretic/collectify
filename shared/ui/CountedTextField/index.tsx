import { TextField, type TextFieldProps } from '@mui/material';

type CountedTextFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
};

/** TextField with a live "n / max" counter and a hard length limit. */
export function CountedTextField({
    value,
    onChange,
    maxLength,
    helperText,
    slotProps,
    ...rest
}: CountedTextFieldProps) {
    const counter = `${value.length} / ${maxLength}`;

    return (
        <TextField
            {...rest}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            helperText={helperText ? `${helperText} · ${counter}` : counter}
            slotProps={{ ...slotProps, htmlInput: { maxLength } }}
        />
    );
}
