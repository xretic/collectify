'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Step,
    StepLabel,
    Stepper,
} from '@mui/material';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { CATEGORIES, type Category } from '@/shared/lib/constants';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import {
    emptyCollectionDraft,
    emptyItemDraft,
    toCollectionPayload,
    toItemPayload,
    type CollectionDraft,
    type ItemDraft,
} from '@/entities/collection/model/drafts';
import { CollectionDetailsFields } from '@/entities/collection/ui/CollectionDetailsFields';
import { ItemFormFields } from '@/entities/collection/ui/ItemFormFields';
import styles from './CreateCollectionPage.module.css';

const STEPS = ['Create Collection', 'Add First Item'];

export default function CreateCollectionPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [step, setStep] = useState(0);
    const [details, setDetails] = useState<CollectionDraft>(emptyCollectionDraft);
    const [category, setCategory] = useState<Category | ''>('');
    const [item, setItem] = useState<ItemDraft>(emptyItemDraft);

    const detailsPayload = toCollectionPayload(details);
    const itemPayload = toItemPayload(item);

    const create = useMutation({
        mutationFn: () =>
            collectionApi.create({
                ...detailsPayload!,
                category: category as Category,
                item: itemPayload!,
            }),
        onSuccess: (id) => {
            queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() });
            router.push(`/collections/${id}`);
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    return (
        <section className={styles.page}>
            <Stepper activeStep={step} className={styles.stepper}>
                {STEPS.map((label) => (
                    <Step key={label}>
                        <StepLabel classes={{ label: styles.stepLabel }}>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <header className={styles.header}>
                <h1 className={styles.title}>
                    {step === 0 ? 'Create New Collection' : 'Add the first item'}
                </h1>
                <p className={styles.subtitle}>
                    {step === 0
                        ? 'Add a new collection to organize your content.'
                        : 'Every collection starts with at least one item.'}
                </p>
            </header>

            <div className={styles.card}>
                {step === 0 ? (
                    <>
                        <CollectionDetailsFields value={details} onChange={setDetails} />

                        <FormControl fullWidth required className={styles.category}>
                            <InputLabel id="collection-category">Category</InputLabel>
                            <Select
                                labelId="collection-category"
                                label="Category"
                                value={category}
                                onChange={(event) => setCategory(event.target.value as Category)}
                            >
                                {CATEGORIES.map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </>
                ) : (
                    <ItemFormFields value={item} onChange={setItem} />
                )}

                <div className={styles.actions}>
                    {step === 0 ? (
                        <>
                            <Button onClick={() => router.back()}>Cancel</Button>
                            <Button
                                variant="contained"
                                disabled={!detailsPayload || !category}
                                onClick={() => setStep(1)}
                            >
                                Next
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={() => setStep(0)} disabled={create.isPending}>
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                disabled={!itemPayload || create.isPending}
                                onClick={() => create.mutate()}
                            >
                                Create collection
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
