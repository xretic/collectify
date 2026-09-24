import { Suspense } from 'react';
import HomePage from '@/views/home/ui/HomePage';

export default function HomeRoute() {
    return (
        <Suspense>
            <HomePage />
        </Suspense>
    );
}
