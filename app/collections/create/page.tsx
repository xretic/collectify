'use client';

import { CollectionStepper } from '@/components/CollectionStepper/CollectionStepper';
import { CollectionCreate } from '@/components/CollectionCreate/CollectionCreate';
import { useCollectionCreateStore } from '@/stores/collectionCreateStore';
import { ItemCreate } from '@/components/ItemCreate/ItemCreate';

export default function CreateCollection() {
    const { step } = useCollectionCreateStore();

    return (
        <>
            <CollectionStepper skip={step} />
            {step === 0 ? <CollectionCreate /> : <ItemCreate />}
        </>
    );
}
