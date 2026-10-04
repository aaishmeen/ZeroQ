import { apiClient } from './client';
import type {
  VolunteerOpening,
  VolunteerApplication,
  ApprovedVolunteerWithAssignment,
  VolunteerAssignment,
  MyVolunteerAssignment,
  AvailableVolunteerEvent,
} from '../types';

export interface VolunteerSignupData {
  name: string;
  email: string;
  phone_no: string;
  password: string;
  event_id?: number;
}

export interface VolunteerOpeningCreateData {
  event_id: number;
  role: string;
  volunteers_needed: number;
  description?: string;
  deadline?: string;
  gate_area?: string;
}

export interface VolunteerOpeningUpdateData {
  role?: string;
  volunteers_needed?: number;
  description?: string;
  deadline?: string;
  gate_area?: string;
  status?: 'open' | 'closed';
}

export const volunteerSignupApi = async (data: VolunteerSignupData) => {
  const response = await apiClient.post('/volunteers/signup', data);
  return response.data;
};

// ==========================================
// 1. OPENINGS API
// ==========================================

export const createVolunteerOpeningApi = async (data: VolunteerOpeningCreateData): Promise<VolunteerOpening> => {
  const response = await apiClient.post('/volunteers/openings', data);
  return response.data;
};

export const getVolunteerOpeningsApi = async (eventId?: number, status?: string): Promise<VolunteerOpening[]> => {
  const params: Record<string, any> = {};
  if (eventId) params.event_id = eventId;
  if (status) params.status = status;
  const response = await apiClient.get('/volunteers/openings', { params });
  return response.data;
};

export const updateOpeningStatusApi = async (openingId: number, data: VolunteerOpeningUpdateData): Promise<VolunteerOpening> => {
  const response = await apiClient.patch(`/volunteers/openings/${openingId}/status`, data);
  return response.data;
};

export const deleteVolunteerOpeningApi = async (openingId: number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/volunteers/openings/${openingId}`);
  return response.data;
};

// ==========================================
// 2. APPLICATIONS API
// ==========================================

export const applyAsVolunteerApi = async (eventId: number, openingId?: number, experience?: string) => {
  const response = await apiClient.post('/volunteers/apply', {
    event_id: eventId,
    opening_id: openingId || null,
    experience: experience || null,
  });
  return response.data;
};

export const getAvailableVolunteerEventsApi = async (): Promise<AvailableVolunteerEvent[]> => {
  const response = await apiClient.get('/volunteers/available-events');
  return response.data;
};

export const getMyVolunteerApplicationsApi = async (): Promise<VolunteerApplication[]> => {
  const response = await apiClient.get('/volunteers/my-applications');
  return response.data;
};

export const getVolunteerRequestsApi = async (eventId?: number): Promise<VolunteerApplication[]> => {
  const params = eventId ? { event_id: eventId } : {};
  const response = await apiClient.get('/volunteers/requests', { params });
  return response.data;
};

export const approveVolunteerApplicationApi = async (applicationId: number) => {
  const response = await apiClient.post(`/volunteers/${applicationId}/approve`);
  return response.data;
};

export const rejectVolunteerApplicationApi = async (applicationId: number) => {
  const response = await apiClient.post(`/volunteers/${applicationId}/reject`);
  return response.data;
};

// ==========================================
// 3. APPROVED VOLUNTEERS & ASSIGNMENTS API
// ==========================================

export const getApprovedVolunteersApi = async (eventId?: number): Promise<ApprovedVolunteerWithAssignment[]> => {
  const params = eventId ? { event_id: eventId } : {};
  const response = await apiClient.get('/volunteers/approved', { params });
  return response.data;
};

export const createVolunteerAssignmentApi = async (volunteerId: number, eventId: number, position: string): Promise<VolunteerAssignment> => {
  const response = await apiClient.post('/volunteers/assignments', {
    volunteer_id: volunteerId,
    event_id: eventId,
    position: position,
  });
  return response.data;
};

export const getVolunteerAssignmentsApi = async (eventId?: number): Promise<VolunteerAssignment[]> => {
  const params = eventId ? { event_id: eventId } : {};
  const response = await apiClient.get('/volunteers/assignments', { params });
  return response.data;
};

export const deleteVolunteerAssignmentApi = async (assignmentId: number) => {
  const response = await apiClient.delete(`/volunteers/assignments/${assignmentId}`);
  return response.data;
};

export const getMyVolunteerAssignmentsApi = async (): Promise<VolunteerAssignment[]> => {
  const response = await apiClient.get('/volunteers/my-assignments');
  return response.data;
};

export const getMyVolunteerAssignmentApi = async (): Promise<MyVolunteerAssignment> => {
  const response = await apiClient.get('/volunteers/my-assignment');
  return response.data;
};

// ==========================================
// 4. NOTIFICATIONS API
// ==========================================

export const sendVolunteerNotificationApi = async (eventId: number, title: string, message: string) => {
  const response = await apiClient.post('/volunteers/notifications', {
    event_id: eventId,
    title,
    message,
  });
  return response.data;
};

export const getVolunteerNotificationsApi = async () => {
  const response = await apiClient.get('/volunteers/notifications');
  return response.data;
};
