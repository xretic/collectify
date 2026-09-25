import type { Metadata } from 'next';
import OnboardingPage from '@/views/onboarding/ui/OnboardingPage';

export const metadata: Metadata = { title: 'Choose your interests' };

export default function OnboardingRoute() {
    return <OnboardingPage />;
}
