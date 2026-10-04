import { apiClient } from './client';
import type { EventItem, RegistrationDetails } from '../types';

export interface CreateEventPayload {
  title: string;
  description: string;
  venue: string;
  date: string;
  capacity: number;
  price: number;
  volunteers_limit?: number;
}

export const getEventsApi = async (): Promise<EventItem[]> => {
  const response = await apiClient.get<EventItem[]>('/events/');
  return response.data;
};

export const getPendingEventsApi = async (): Promise<EventItem[]> => {
  const response = await apiClient.get<EventItem[]>('/events/pending');
  return response.data;
};

export const getMyEventsApi = async (): Promise<EventItem[]> => {
  const response = await apiClient.get<EventItem[]>('/events/my-events');
  return response.data;
};

export const getEventApi = async (eventId: number): Promise<EventItem> => {
  const response = await apiClient.get<EventItem>(`/events/${eventId}`);
  return response.data;
};

export const createEventApi = async (payload: CreateEventPayload): Promise<EventItem> => {
  const response = await apiClient.post<EventItem>('/events/', payload);
  return response.data;
};

export const updateEventApi = async (eventId: number, payload: CreateEventPayload): Promise<EventItem> => {
  const response = await apiClient.put<EventItem>(`/events/${eventId}`, payload);
  return response.data;
};

export const deleteEventApi = async (eventId: number): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/events/${eventId}`);
  return response.data;
};

export const submitEventApi = async (eventId: number): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(`/events/${eventId}/submit`);
  return response.data;
};

export const approveEventApi = async (eventId: number): Promise<{ message: string }> => {
  const response = await apiClient.patch<{ message: string }>(`/events/${eventId}/approve`);
  return response.data;
};

export const activateEventApi = async (eventId: number): Promise<EventItem> => {
  const response = await apiClient.post<EventItem>(`/events/${eventId}/activate`);
  return response.data;
};

export const completeEventApi = async (eventId: number): Promise<EventItem> => {
  const response = await apiClient.post<EventItem>(`/events/${eventId}/complete`);
  return response.data;
};

export const rejectEventApi = async (eventId: number, reason: string): Promise<{ message: string }> => {
  const response = await apiClient.patch<{ message: string }>(`/events/${eventId}/reject`, { reason });
  return response.data;
};

export const registerForEventApi = async (eventId: number): Promise<{ message: string; registration_id: number }> => {
  const response = await apiClient.post<{ message: string; registration_id: number }>(`/events/${eventId}/register`);
  return response.data;
};

export const getEventRegistrationsApi = async (eventId: number): Promise<RegistrationDetails[]> => {
  const response = await apiClient.get<RegistrationDetails[]>(`/events/${eventId}/registrations`);
  return response.data;
};

export const uploadEventBannerApi = async (eventId: number, file: File): Promise<{ message: string; banner_url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<{ message: string; banner_url: string }>(`/events/${eventId}/upload-banner`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadEventQrApi = async (eventId: number, file: File): Promise<{ message: string; payment_qr_url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<{ message: string; payment_qr_url: string }>(`/events/${eventId}/upload-qr`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  const rawBase = apiClient.defaults.baseURL || 'http://localhost:8000';
  const baseURL = rawBase.replace(/\/+$/, '');
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (normalizedPath.startsWith('/')) {
    return `${baseURL}${normalizedPath}`;
  }
  return `${baseURL}/${normalizedPath}`;
};

