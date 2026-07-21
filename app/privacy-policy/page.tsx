import { Metadata } from 'next';
import PrivacyPolicyPage from '@/views/privacy-policy/ui/PrivacyPolicyPage';

export const metadata: Metadata = {
    title: 'Privacy Policy — Collectify',
    description: 'How Collectify collects, uses, and stores your data.',
};

export default function PrivacyPolicyRoute() {
    return <PrivacyPolicyPage />;
}
