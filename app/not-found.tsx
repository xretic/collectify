'use client';

import { Box, Typography, Button, Stack } from '@mui/material';
import { Home, ArrowBack, SearchOff } from '@mui/icons-material';
import { keyframes } from '@emotion/react';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export default function NotFoundPage() {
    return (
        <Box
            sx={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#fff',
                padding: 3,
                backgroundColor: 'var(--background-color)',
            }}
        >
            <Stack spacing={4} alignItems="center" sx={{ maxWidth: 600 }}>
                <Box
                    sx={{
                        animation: `${float} 3s ease-in-out infinite`,
                    }}
                >
                    <SearchOff
                        sx={{
                            fontSize: { xs: 100, md: 140 },
                            color: 'var(--accent)',
                            opacity: 0.9,
                        }}
                    />
                </Box>

                <Typography
                    sx={{
                        fontSize: { xs: '4rem', sm: '5rem', md: '6rem' },
                        fontWeight: 700,
                        lineHeight: 1,
                        color: 'var(--text-color)',
                        letterSpacing: '-0.02em',
                        animation: `${fadeIn} 0.6s ease-out`,
                    }}
                >
                    404
                </Typography>

                <Stack
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                        animation: `${fadeIn} 0.6s ease-out 0.2s backwards`,
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 600,
                            color: 'var(--text-color)',
                            fontSize: { xs: '1.5rem', md: '2rem' },
                            textAlign: 'center',
                        }}
                    >
                        Page Not Found
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: 'var(--soft-text)',
                            textAlign: 'center',
                            maxWidth: 450,
                            fontSize: { xs: '0.95rem', md: '1.05rem' },
                            lineHeight: 1.6,
                        }}
                    >
                        The page you're looking for doesn't exist or has been moved.
                    </Typography>
                </Stack>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{
                        mt: 2,
                        animation: `${fadeIn} 0.6s ease-out 0.4s backwards`,
                    }}
                >
                    <Button
                        variant="contained"
                        startIcon={<Home />}
                        onClick={() => (window.location.href = '/')}
                        sx={{
                            bgcolor: 'var(--accent)',
                            color: '#fff',
                            px: 3.5,
                            py: 1.3,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 500,
                            borderRadius: 1.5,
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: 'var(--accent)',
                                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                            },
                        }}
                    >
                        Go Home
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => window.history.back()}
                        sx={{
                            borderColor: 'var(--border)',
                            color: 'var(--text-color)',
                            px: 3.5,
                            py: 1.3,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 500,
                            borderRadius: 1.5,
                            '&:hover': {
                                borderColor: 'var(--accent)',
                                color: 'var(--accent)',
                            },
                        }}
                    >
                        Go Back
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
