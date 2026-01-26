'use client';

import { Suspense, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useUser } from '@/context/UserProvider';
import { useUIStore } from '@/stores/uiStore';
import CircularProgress from '@mui/material/CircularProgress';

type LoginFormData = {
    email: string;
    password: string;
};

export default function LoginPage() {
    const { control, handleSubmit } = useForm<LoginFormData>();
    const router = useRouter();
    const [emailError, setEmailError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const { setUser } = useUser();
    const { startLoading, stopLoading, loadingCount } = useUIStore();

    const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
        startLoading();

        setErrorMsg('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include',
            });

            switch (response.status) {
                case 200:
                    const result = await response.json();
                    setUser(result.user);
                    router.push('/');
                    break;

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
        } catch (err) {
            setErrorMsg('Something went wrong.');
        } finally {
            stopLoading();
        }
    };

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
                <h1 className="auth-header text-black text-[50px] mt-[210px]">Login</h1>
                <p className="text-[rgb(90,90,90)]">
                    Enter your credentials to access your account.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', maxWidth: 400 }}>
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
                                    setEmailError(!e.target.validity.valid);
                                }}
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
                                sx={{ mt: 2 }}
                            />
                        )}
                    />

                    {emailError && (
                        <Alert variant="filled" severity="error" sx={{ mt: 2 }}>
                            Your email is invalid!
                        </Alert>
                    )}
                    {!emailError && errorMsg && (
                        <Alert variant="filled" severity="error" sx={{ mt: 2 }}>
                            {errorMsg}
                        </Alert>
                    )}

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
            </Box>
        </Suspense>
    );
}
