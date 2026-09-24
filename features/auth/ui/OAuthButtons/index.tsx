import Image from 'next/image';
import { Button } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { authApi } from '@/entities/auth/api/authApi';
import styles from './index.module.css';

/** Plain links: the server sets the CSRF `state` cookie and redirects to the provider. */
export function OAuthButtons() {
    return (
        <div className={styles.buttons}>
            <Button
                href={authApi.oauthUrl('github')}
                variant="contained"
                className={styles.github}
                startIcon={<GitHubIcon />}
            >
                GitHub
            </Button>

            <Button
                href={authApi.oauthUrl('google')}
                variant="contained"
                className={styles.google}
                startIcon={<Image src="/images/GoogleIcon.png" alt="" width={20} height={20} />}
            >
                Google
            </Button>
        </div>
    );
}
