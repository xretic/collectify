'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useUser } from '@/context/UserProvider';
import { useUIStore } from '@/stores/uiStore';
import CircularProgress from '@mui/material/CircularProgress';
import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from '@/lib/constans';
import styles from '../auth.module.css';
import { IconButton, Snackbar, SnackbarCloseReason, Tooltip, useMediaQuery } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import Image from 'next/image';
import { githubAuth, googleAuth } from '@/lib/authMethods';
import CloseIcon from '@mui/icons-material/Close';

type RegisterFormData = {
    email: string;
    password: string;
    username: string;
};

export default function RegisterPage() {
    const { control, handleSubmit } = useForm<RegisterFormData>();
    const router = useRouter();
    const [errorMsg, setErrorMsg] = useState('');
    const { startLoading, stopLoading, loadingCount } = useUIStore();
    const { user, setUser } = useUser();

    useEffect(() => {
        if (user) router.replace('/');
    }, [user]);

    const inputStyle = {
        '& .MuiInputBase-input': {
            color: 'var(--text-color)',
        },

        '& .MuiInputBase-input::placeholder': {
            color: 'var(--soft-text)',
            opacity: 1,
        },
        '& .MuiInputLabel-root': {
            color: 'var(--text-color)',
        },

        '& .MuiInput-underline:before': {
            borderBottomColor: 'var(--border-color) !important',
        },

        '& .MuiInput-underline:hover:before': {
            borderBottomColor: 'var(--border-color) !important',
        },

        '& .MuiInput-underline:after': {
            borderBottomColor: 'var(--border-color) !important',
        },

        '& .MuiInputBase-input:not(:focus)': {
            color: 'var(--text-color)',
        },

        '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px var(--background-color) inset',
            WebkitTextFillColor: 'var(--text-color)',
            transition: 'background-color 5000s ease-in-out 0s',
        },
    };

    const isMobile = useMediaQuery('(max-width:1000px)');

    const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
        startLoading();

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include',
            });

            switch (response.status) {
                case 200: {
                    const resData = await response.json();
                    setUser(resData.user);
                    router.push('/');
                    break;
                }

                case 400:
                    setErrorMsg('Password is too short.');
                    break;

                case 405:
                    setErrorMsg('The password contains prohibited characters.');
                    break;

                case 409:
                    const resData = await response.json();
                    setErrorMsg(resData.message);
                    break;

                case 500:
                    setErrorMsg('Something went wrong.');
                    break;
            }
        } catch (error) {
            setErrorMsg('Network error. Please try again.');
        } finally {
            stopLoading();
        }
    };

    const handleClose = (_: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') {
            return;
        }

        setErrorMsg('');
    };

    const action = (
        <React.Fragment>
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </React.Fragment>
    );

    return (
        <Suspense
            fallback={
                <Box
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.3)',
                        zIndex: 1300,
                    }}
                >
                    <CircularProgress size={48} />
                </Box>
            }
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <h1 className={styles.header}>Registration</h1>
                <p className={styles.paragraph}>
                    In order to use the site fully, you must register.
                </p>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    style={{ width: '100%', maxWidth: isMobile ? 300 : 400 }}
                >
                    <Controller
                        name="email"
                        control={control}
                        defaultValue=""
                        rules={{
                            required: 'Email is required',
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'Please enter a valid email address',
                            },
                            maxLength: {
                                value: 100,
                                message: 'Email cannot be that long',
                            },
                        }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                type="email"
                                label="Email"
                                placeholder="Write your email"
                                fullWidth
                                id="email"
                                variant="standard"
                                error={!!fieldState.error}
                                helperText={fieldState.error ? fieldState.error.message : ' '}
                                onChange={(e) => {
                                    field.onChange(e);
                                }}
                                sx={inputStyle}
                            />
                        )}
                    />

                    <Controller
                        name="username"
                        control={control}
                        defaultValue=""
                        rules={{
                            required: 'Username is required',
                            minLength: {
                                value: USERNAME_MIN_LENGTH,
                                message: 'Username too short',
                            },
                            maxLength: { value: USERNAME_MAX_LENGTH, message: 'Username too long' },
                        }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                type="text"
                                label="Username"
                                placeholder="Write your username"
                                fullWidth
                                id="username"
                                variant="standard"
                                error={!!fieldState.error}
                                helperText={fieldState.error ? fieldState.error.message : ' '}
                                sx={{ mt: 2, ...inputStyle }}
                            />
                        )}
                    />

                    <Controller
                        name="password"
                        control={control}
                        defaultValue=""
                        rules={{
                            required: 'Password is required',
                            minLength: {
                                value: PASSWORD_MIN_LENGTH,
                                message: 'Password too short',
                            },
                            maxLength: { value: PASSWORD_MAX_LENGTH, message: 'Password too long' },
                        }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                type="password"
                                label="Password"
                                placeholder="Write your password"
                                fullWidth
                                id="password"
                                variant="standard"
                                error={!!fieldState.error}
                                helperText={fieldState.error ? fieldState.error.message : ' '}
                                sx={{
                                    mt: 2,
                                    ...inputStyle,
                                }}
                            />
                        )}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ mt: 3 }}
                        disabled={loadingCount > 0}
                    >
                        {loadingCount > 0 ? 'Loading...' : 'Submit'}
                    </Button>
                </form>

                <div className={styles['social-media']}>
                    <Tooltip title="Register via GitHub">
                        <Button
                            onClick={githubAuth}
                            variant="contained"
                            sx={{
                                p: '6px',
                                borderRadius: 6,
                                backgroundColor: 'black',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: '#333',
                                },
                            }}
                            aria-label="GitHub"
                        >
                            <GitHubIcon />
                            <span className={styles['social-media-btn']}>GitHub</span>
                        </Button>
                    </Tooltip>

                    <Tooltip title="Register via Google">
                        <Button
                            onClick={googleAuth}
                            variant="contained"
                            sx={{
                                p: '6px',
                                borderRadius: 6,
                                backgroundColor: 'white',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: '#fff',
                                },
                            }}
                            aria-label="Google"
                        >
                            <Image
                                src="/images/GoogleIcon.png"
                                alt="google-icon"
                                width={20}
                                height={20}
                            />
                            <span className={styles['social-media-btn']} style={{ color: 'black' }}>
                                Google
                            </span>
                        </Button>
                    </Tooltip>
                </div>
            </Box>
            <Snackbar
                open={errorMsg !== ''}
                autoHideDuration={5000}
                onClose={handleClose}
                message={errorMsg}
                action={action}
            />
        </Suspense>
    );
}
