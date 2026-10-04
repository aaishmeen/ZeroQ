import { apiClient } from './client';
import type { Dispute } from '../types';

export interface CreateDisputeData {
  category: string;
  description: string;
  registration_id?: number | null;
}

export const createDisputeApi = async (data: CreateDisputeData): Promise<Dispute> => {
  const response = await apiClient.post('/disputes/', data);
  return response.data;
};

export const getDisputesApi = async (): Promise<Dispute[]> => {
  const response = await apiClient.get('/disputes/');
  return response.data;
};

export const updateDisputeStatusApi = async (disputeId: number, status: string): Promise<Dispute> => {
  const response = await apiClient.patch(`/disputes/${disputeId}/status`, { status });
  return response.data;
};
