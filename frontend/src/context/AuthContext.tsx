import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { getMeApi, loginApi, registerApi, uploadAvatarApi, deleteAvatarApi, updateUserBioApi, type RegisterPayload } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<User>;
  deleteAvatar: () => Promise<User>;
  updateBio: (bio: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sanitizeUserProfile = (profile: User): User => {
  if (profile && (profile.role === 'admin' || profile.role === 'superadmin' || profile.role === 'organizer')) {
    return {
      ...profile,
      is_approved_volunteer: false,
    };
  }
  return profile;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('zeroq_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    const storedToken = localStorage.getItem('zeroq_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await getMeApi();
      setUser(sanitizeUserProfile(profile));
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      localStorage.removeItem('zeroq_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const data = await loginApi(email, pass);
    localStorage.setItem('zeroq_token', data.access_token);
    setToken(data.access_token);
    const rawProfile = await getMeApi();
    const profile = sanitizeUserProfile(rawProfile);
    setUser(profile);
    return profile;
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    const newUser = await registerApi(payload);
    await login(payload.email, payload.password);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('zeroq_token');
    setToken(null);
    setUser(null);
  };

  const uploadAvatar = async (file: File): Promise<User> => {
    const updated = await uploadAvatarApi(file);
    setUser(updated);
    return updated;
  };

  const deleteAvatar = async (): Promise<User> => {
    const updated = await deleteAvatarApi();
    setUser(updated);
    return updated;
  };

  const updateBio = async (bio: string): Promise<User> => {
    const updated = await updateUserBioApi(bio);
    setUser(updated);
    return updated;
  };


  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
      window.location.href = '/';
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        uploadAvatar,
        deleteAvatar,
        updateBio,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
