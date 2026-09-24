import { api } from '@/shared/api/api';
import type { CreateReportPayload } from '../model/types';

export const reportApi = {
    async create(payload: CreateReportPayload) {
        await api.post('reports', { json: payload });
    },
};
