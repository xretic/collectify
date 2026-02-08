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
import styles from '../auth.module.css';
import Image from 'next/image';
import { IconButton, Snackbar, SnackbarCloseReason, Tooltip, useMediaQuery } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { githubAuth, googleAuth } from '@/lib/authMethods';
import CloseIcon from '@mui/icons-material/Close';
import { api } from '@/lib/api';
import { SessionUserInResponse } from '@/types/UserInResponse';

type LoginFormData = {
    email: string;
    password: string;
};

export default function LoginPage() {
    const { control, handleSubmit } = useForm<LoginFormData>();
    const router = useRouter();
    const [errorMsg, setErrorMsg] = useState('');
    const { user, setUser } = useUser();
    const { startLoading, stopLoading, loadingCount } = useUIStore();

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

    useEffect(() => {
        if (user) router.replace('/');
    }, [user]);

    const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
        try {
            startLoading();
            setErrorMsg('');

            const response = await api.post('api/auth/login', {
                json: data,
                throwHttpErrors: false,
            });

            switch (response.status) {
                case 200: {
                    const result = await response.json<{ user: SessionUserInResponse }>();
                    setUser(result.user);
                    router.push('/');
                    break;
                }
                case 400:
                case 401:
                    setErrorMsg('Invalid email or password.');
                    break;
                case 500:
                    setErrorMsg('Something went wrong.');
                    break;

                default:
                    setErrorMsg('Unknown error occurred.');
            }
        } catch {
            setErrorMsg('Something went wrong.');
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
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <h1 className={styles.header}>Login</h1>
                <p className={styles.paragraph}>Enter your credentials to access your account.</p>

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
                        }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                type="email"
                                label="Email"
                                placeholder="Write your email"
                                fullWidth
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
                        name="password"
                        control={control}
                        defaultValue=""
                        rules={{
                            required: 'Password is required',
                            minLength: { value: 8, message: 'Password too short' },
                        }}
                        render={({ field, fieldState }) => (
                            <TextField
                                {...field}
                                type="password"
                                label="Password"
                                placeholder="Write your password"
                                fullWidth
                                variant="standard"
                                error={!!fieldState.error}
                                helperText={fieldState.error ? fieldState.error.message : ' '}
                                sx={{ mt: 2, ...inputStyle }}
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
                        {loadingCount > 0 ? 'Loading...' : 'Login'}
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
