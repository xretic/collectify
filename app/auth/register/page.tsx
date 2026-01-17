'use client';

import { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useUser } from '@/context/UserProvider';

type RegisterFormData = {
    email: string;
    password: string;
};

export default function RegisterPage() {
    const { control, handleSubmit } = useForm<RegisterFormData>();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const { setUser } = useUser();

    const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include',
            });

            setLoading(false);

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
                    setErrorMsg('User with this email already exists.');
                    break;

                case 500:
                    setErrorMsg('Something went wrong.');
                    break;
            }
        } catch (error) {
            setLoading(false);
            setErrorMsg('Network error. Please try again.');
        }
    };

    return (
        <Box
            className="auth-page"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
            }}
        >
            <h1 className="auth-header">Registration</h1>
            <p className="auth-paragraph">In order to use the site fully, you must register.</p>

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
                            id="email"
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
                            id="password"
                            variant="standard"
                            error={!!fieldState.error}
                            helperText={fieldState.error ? fieldState.error.message : ' '}
                            sx={{ mt: 2 }}
                        />
                    )}
                />

                {(emailError && (
                    <Alert variant="filled" severity="error" sx={{ mt: 2 }}>
                        Your email is invalid!
                    </Alert>
                )) ||
                    (errorMsg !== '' && (
                        <Alert variant="filled" severity="error" sx={{ mt: 2 }}>
                            {errorMsg}
                        </Alert>
                    ))}

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 3 }}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Submit'}
                </Button>
            </form>
        </Box>
    );
}
