import { apiClient } from './client';
import type { Registration } from '../types';

export const getRegistrationsApi = async (): Promise<Registration[]> => {
  const response = await apiClient.get<Registration[]>('/registrations/');
  return response.data;
};

export const getMyRegistrationsApi = async (): Promise<Registration[]> => {
  const response = await apiClient.get<Registration[]>('/registrations/me');
  return response.data;
};

export const getRegistrationApi = async (registrationId: number): Promise<Registration> => {
  const response = await apiClient.get<Registration>(`/registrations/${registrationId}`);
  return response.data;
};

export const getRegistrationQRUrl = (registrationId: number): string => {
  const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000';
  const token = localStorage.getItem('zeroq_token');
  return `${baseURL}/registrations/${registrationId}/qr${token ? `?token=${token}` : ''}`;
};

export const fetchRegistrationQRBlob = async (registrationId: number): Promise<string> => {
  const response = await apiClient.get(`/registrations/${registrationId}/qr`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(response.data);
};

export const checkInRegistrationApi = async (
  registration_id?: number | null,
  token?: string | null
): Promise<{ message: string; registration_id: number; student_name?: string; event_title?: string; checked_in_at: string }> => {
  const response = await apiClient.post('/registrations/check-in', {
    registration_id,
    token,
  });
  return response.data;
};

export const deleteRegistrationApi = async (registrationId: number): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/registrations/${registrationId}`);
  return response.data;
};
