'use client';

import { useParams } from 'next/navigation';

export default function CollectionPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    return <div></div>;
}
