'use client';

import { CollectionStepper } from '@/components/features/collections/CollectionStepper';
import { CollectionCreate } from '@/components/features/collections/CollectionCreate';
import { useCollectionCreateStore } from '@/stores/collectionCreateStore';
import { ItemCreate } from '@/components/features/items/ItemCreate';

export default function CreateCollection() {
    const { step } = useCollectionCreateStore();

    return (
        <>
            <CollectionStepper skip={step} />
            {step === 0 ? <CollectionCreate /> : <ItemCreate />}
        </>
    );
}
