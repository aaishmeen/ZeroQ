import { apiClient } from './client';
import type { User } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  reg_no?: string | null;
  phone_no: string;
  password: string;
  role?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const loginApi = async (email: string, password: string): Promise<TokenResponse> => {
  const formData = new URLSearchParams();
  formData.append('username', email.trim().toLowerCase());
  formData.append('password', password);

  const response = await apiClient.post<TokenResponse>('/users/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const registerApi = async (data: RegisterPayload): Promise<User> => {
  const sanitizedData = {
    ...data,
    email: data.email.trim().toLowerCase(),
  };
  const response = await apiClient.post<User>('/users/', sanitizedData);
  return response.data;
};

export const getMeApi = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me');
  return response.data;
};

export const getUsersApi = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users/');
  return response.data;
};

export const updateUserApi = async (userId: number, data: RegisterPayload): Promise<User> => {
  const response = await apiClient.put<User>(`/users/${userId}`, data);
  return response.data;
};

export const getHealthApi = async (): Promise<{ status: string }> => {
  const response = await apiClient.get<{ status: string }>('/health');
  return response.data;
};

export const uploadAvatarApi = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<User>('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteAvatarApi = async (): Promise<User> => {
  const response = await apiClient.delete<User>('/users/me/avatar');
  return response.data;
};

export const updateUserBioApi = async (bio: string): Promise<User> => {
  const response = await apiClient.put<User>('/users/me/bio', { bio });
  return response.data;
};

export const approveAdminApi = async (userId: number): Promise<User> => {
  const response = await apiClient.patch<User>(`/users/${userId}/approve-admin`);
  return response.data;
};

export const rejectAdminApi = async (userId: number): Promise<User> => {
  const response = await apiClient.patch<User>(`/users/${userId}/reject-admin`);
  return response.data;
};

export const changePasswordApi = async (currentPassword: string, newPassword: string): Promise<User> => {
  const response = await apiClient.put<User>('/users/me/password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
};

export const updateUserProfileApi = async (data: { name?: string; phone?: string; bio?: string }): Promise<User> => {
  const response = await apiClient.put<User>('/users/me/profile', data);
  return response.data;
};

