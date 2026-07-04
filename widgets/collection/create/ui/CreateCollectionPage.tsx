'use client';

import { CollectionStepper } from '@/features/collection/create/ui/CollectionStepper';
import { CollectionCreate } from '@/features/collection/create/ui/CollectionCreate';
import { useCollectionCreateStore } from '@/features/collection/create/model/collectionCreateStore';
import { ItemCreate } from '@/features/item/create/ui/ItemCreate';

export default function CreateCollection() {
    const { step } = useCollectionCreateStore();

    return (
        <>
            <CollectionStepper skip={step} />
            {step === 0 ? <CollectionCreate /> : <ItemCreate />}
        </>
    );
}
