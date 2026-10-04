import { apiClient } from './client';
import type { Payment } from '../types';

export const getPaymentsApi = async (): Promise<Payment[]> => {
  const response = await apiClient.get<Payment[]>('/payments/');
  return response.data;
};

export const getMyPaymentsApi = async (): Promise<Payment[]> => {
  const response = await apiClient.get<Payment[]>('/payments/me');
  return response.data;
};

export const getPendingPaymentsApi = async (): Promise<Payment[]> => {
  const response = await apiClient.get<Payment[]>('/payments/pending');
  return response.data;
};

export const uploadPaymentApi = async (
  registrationId: number,
  screenshot: File,
  transactionId?: string
): Promise<Payment> => {
  const formData = new FormData();
  formData.append('screenshot', screenshot);
  if (transactionId) {
    formData.append('transaction_id', transactionId);
  }

  const response = await apiClient.post<Payment>(
    `/payments/registrations/${registrationId}/payment`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const approvePaymentApi = async (paymentId: number): Promise<Payment> => {
  const response = await apiClient.post<Payment>(`/payments/${paymentId}/approve`);
  return response.data;
};

export const rejectPaymentApi = async (paymentId: number, reason: string): Promise<Payment> => {
  const response = await apiClient.post<Payment>(`/payments/${paymentId}/reject`, { reason });
  return response.data;
};

export const getPaymentScreenshotUrl = (screenshotPath: string): string => {
  const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000';
  const normalizedPath = screenshotPath.replace(/\\/g, '/');
  return `${baseURL}/${normalizedPath}`;
};
