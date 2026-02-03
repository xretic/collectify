'use client';

import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled } from '@mui/material/styles';

const steps = ['Create Collection', 'Add First Item'];

const CustomConnector = styled(StepConnector)(() => ({
    [`&.${stepConnectorClasses.root}`]: {
        top: 20,
    },

    [`& .${stepConnectorClasses.line}`]: {
        borderColor: '#E0E0E0',
        borderTopWidth: 2,
        width: 40,
        margin: '0 auto',
    },
}));

export function CollectionStepper({ skip = 0 }: { skip?: number }) {
    return (
        <Box
            sx={{
                maxWidth: 400,
                mx: 'auto',
                mt: 4,
            }}
        >
            <Stepper
                activeStep={skip}
                connector={<CustomConnector />}
                sx={{
                    '& .MuiStepLabel-root .MuiStepIcon-root': {
                        width: 40,
                        height: 40,
                    },
                    '& .MuiStepLabel-label': {
                        fontSize: '15px',
                        color: 'var(--text-color)',
                    },
                    '& .MuiStepLabel-label.Mui-active': {
                        fontWeight: 'bold',
                        color: 'var(--text-color)',
                    },
                    '& .MuiStepLabel-label.Mui-completed': {
                        color: 'var(--text-color)',
                    },
                }}
            >
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>
    );
}
