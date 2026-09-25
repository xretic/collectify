import OnboardingPage from '@/views/onboarding/ui/OnboardingPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('onboarding');

export default function OnboardingRoute() {
    return <OnboardingPage />;
}
