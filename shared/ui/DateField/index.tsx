'use client';

import { useEffect, useRef, useState } from 'react';
import { IconButton, InputAdornment, Popover, TextField, type TextFieldProps } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import styles from './index.module.css';

type DateFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
    /** `YYYY-MM-DD` or `null`. */
    value: string | null;
    onChange: (value: string | null) => void;
    /** Inclusive bounds, `YYYY-MM-DD`. */
    min?: string;
    max?: string;
};

type View = 'days' | 'months' | 'years';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = Array.from({ length: 12 }, (_, month) =>
    new Date(2000, month, 1).toLocaleString('en', { month: 'short' }),
);
const DEFAULT_MIN = '1900-01-01';

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
const parse = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number);
    return { year, month: month - 1, day };
};
const todayIso = () => {
    const now = new Date();
    return toIso(now.getFullYear(), now.getMonth(), now.getDate());
};
const formatLong = (iso: string) => {
    const { year, month, day } = parse(iso);
    return new Date(year, month, day).toLocaleDateString('en', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

/** Date input with a themed calendar popover: years → months → days. */
export function DateField({
    value,
    onChange,
    min = DEFAULT_MIN,
    max,
    slotProps,
    ...rest
}: DateFieldProps) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const open = anchor !== null;
    const close = () => setAnchor(null);

    return (
        <>
            <TextField
                {...rest}
                value={value ? formatLong(value) : ''}
                placeholder="Pick a date"
                onClick={(event) => setAnchor(event.currentTarget)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
                        event.preventDefault();
                        setAnchor(event.currentTarget);
                    }
                }}
                slotProps={{
                    ...slotProps,
                    inputLabel: { shrink: true },
                    htmlInput: { readOnly: true, className: styles.input },
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                {value && (
                                    <IconButton
                                        size="small"
                                        aria-label="Clear date"
                                        className={styles.adornment}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onChange(null);
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                )}
                                <IconButton
                                    size="small"
                                    aria-label="Open calendar"
                                    className={styles.adornment}
                                >
                                    <CalendarMonthOutlinedIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
            />

            <Popover
                open={open}
                anchorEl={anchor}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{ paper: { className: styles.paper } }}
            >
                <Calendar
                    value={value}
                    min={min}
                    max={max ?? '2100-12-31'}
                    onSelect={(next) => {
                        onChange(next);
                        close();
                    }}
                />
            </Popover>
        </>
    );
}

type CalendarProps = {
    value: string | null;
    min: string;
    max: string;
    onSelect: (value: string) => void;
};

function Calendar({ value, min, max, onSelect }: CalendarProps) {
    const initial = parse(value ?? (todayIso() > max ? max : todayIso()));
    const [year, setYear] = useState(initial.year);
    const [month, setMonth] = useState(initial.month);
    // No date yet: birth dates are years away, so start from the year list.
    const [view, setView] = useState<View>(value ? 'days' : 'years');

    const minYm = min.slice(0, 7);
    const maxYm = max.slice(0, 7);
    const ym = (y: number, m: number) => `${y}-${pad(m + 1)}`;

    const shiftMonth = (delta: number) => {
        const date = new Date(year, month + delta, 1);
        setYear(date.getFullYear());
        setMonth(date.getMonth());
    };

    return (
        <div className={styles.calendar}>
            <div className={styles.header}>
                <button
                    type="button"
                    className={styles.title}
                    onClick={() => setView(view === 'years' ? 'days' : 'years')}
                    aria-label="Choose year"
                >
                    {view === 'days' &&
                        `${new Date(year, month).toLocaleString('en', { month: 'long' })} `}
                    {year}
                    <ExpandMoreIcon
                        fontSize="small"
                        className={`${styles.caret} ${view === 'years' ? styles.caretOpen : ''}`}
                    />
                </button>

                {view === 'days' && (
                    <div className={styles.nav}>
                        <IconButton
                            size="small"
                            aria-label="Previous month"
                            disabled={ym(year, month) <= minYm}
                            onClick={() => shiftMonth(-1)}
                        >
                            <ChevronLeftIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            aria-label="Next month"
                            disabled={ym(year, month) >= maxYm}
                            onClick={() => shiftMonth(1)}
                        >
                            <ChevronRightIcon fontSize="small" />
                        </IconButton>
                    </div>
                )}
            </div>

            {view === 'years' && (
                <YearGrid
                    selected={year}
                    from={parse(min).year}
                    to={parse(max).year}
                    onSelect={(next) => {
                        setYear(next);
                        setView('months');
                    }}
                />
            )}

            {view === 'months' && (
                <div className={styles.months}>
                    {MONTHS.map((label, index) => {
                        const key = ym(year, index);
                        return (
                            <button
                                key={label}
                                type="button"
                                className={`${styles.cell} ${styles.monthCell} ${index === month ? styles.selected : ''}`}
                                disabled={key < minYm || key > maxYm}
                                onClick={() => {
                                    setMonth(index);
                                    setView('days');
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            )}

            {view === 'days' && (
                <DayGrid
                    year={year}
                    month={month}
                    value={value}
                    min={min}
                    max={max}
                    onSelect={onSelect}
                />
            )}
        </div>
    );
}

type YearGridProps = {
    selected: number;
    from: number;
    to: number;
    onSelect: (year: number) => void;
};

function YearGrid({ selected, from, to, onSelect }: YearGridProps) {
    const selectedRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        selectedRef.current?.scrollIntoView({ block: 'center' });
    }, []);

    const years = Array.from({ length: to - from + 1 }, (_, index) => to - index);

    return (
        <div className={styles.years}>
            {years.map((year) => (
                <button
                    key={year}
                    ref={year === selected ? selectedRef : undefined}
                    type="button"
                    className={`${styles.cell} ${styles.yearCell} ${year === selected ? styles.selected : ''}`}
                    onClick={() => onSelect(year)}
                >
                    {year}
                </button>
            ))}
        </div>
    );
}

type DayGridProps = {
    year: number;
    month: number;
    value: string | null;
    min: string;
    max: string;
    onSelect: (value: string) => void;
};

function DayGrid({ year, month, value, min, max, onSelect }: DayGridProps) {
    const today = todayIso();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday-first offset of the 1st.
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;

    return (
        <div className={styles.days}>
            {WEEKDAYS.map((day) => (
                <span key={day} className={styles.weekday}>
                    {day}
                </span>
            ))}
            {Array.from({ length: offset }, (_, index) => (
                <span key={`pad-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
                const iso = toIso(year, month, index + 1);
                return (
                    <button
                        key={iso}
                        type="button"
                        className={`${styles.cell} ${styles.dayCell} ${iso === value ? styles.selected : ''} ${iso === today ? styles.today : ''}`}
                        disabled={iso < min || iso > max}
                        onClick={() => onSelect(iso)}
                    >
                        {index + 1}
                    </button>
                );
            })}
        </div>
    );
}
