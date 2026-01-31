import { useDialogStore } from '@/stores/dialogStore';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import styles from './DeleteAccountDialog.module.css';
import { Input } from 'antd';
import { PASSWORD_MAX_LENGTH } from '@/lib/constans';

export default function DeleteAccountDialog() {
    const { open, setOpen } = useDialogStore();

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle className={styles.title}>
                <WarningAmberOutlinedIcon sx={{ color: 'red', marginRight: 1 }} />
                Delete Account
            </DialogTitle>
            <DialogContent>
                <DialogContentText className={styles.description}>
                    This action cannot be undone. This will permanently delete your account, all
                    your collections, and remove your data from our servers.
                </DialogContentText>

                <p className={styles.confirmText}>Type your password to confirm</p>

                <Input.Password
                    className={styles.password}
                    placeholder="Write your password"
                    maxLength={PASSWORD_MAX_LENGTH}
                    showCount
                />
            </DialogContent>

            <DialogActions>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClose}
                    sx={{ marginTop: 3, borderRadius: 6, textTransform: 'none' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleClose}
                    sx={{
                        marginTop: 3,
                        borderRadius: 6,
                        textTransform: 'none',
                        backgroundColor: '#ff4649',
                    }}
                >
                    Delete account
                </Button>
            </DialogActions>
        </Dialog>
    );
}
