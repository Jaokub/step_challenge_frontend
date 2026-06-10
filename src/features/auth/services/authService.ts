// ============================================================
// Step Challenge Mobile App — Auth Service
// ============================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, {
  setAuthToken,
  clearAuthToken,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '../../../services/api';
import type { ApiResponse, User } from '../../../types';

interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface MePayload {
  user: User;
}

const authService = {
  async login(email: string, password: string): Promise<ApiResponse<AuthPayload>> {
    try {
      const { data } = await api.post<ApiResponse<AuthPayload>>('/auth/login', {
        email,
        password,
      });

      if (data.success) {
        await setAuthToken(data.data.accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);
      }

      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async register(
    email: string,
    password: string,
    fullName: string,
    nickname: string,
    department: string,
  ): Promise<ApiResponse<AuthPayload>> {
    try {
      const { data } = await api.post<ApiResponse<AuthPayload>>('/auth/register', {
        email,
        password,
        fullName,
        nickname,
        department,
      });

      if (data.success) {
        await setAuthToken(data.data.accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);
      }

      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async refreshToken(
    token: string,
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    try {
      const { data } = await api.post<
        ApiResponse<{ accessToken: string; refreshToken: string }>
      >('/auth/refresh-token', { refreshToken: token });

      if (data.success) {
        await setAuthToken(data.data.accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);
      }

      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async getMe(): Promise<ApiResponse<MePayload>> {
    try {
      const { data } = await api.get<ApiResponse<MePayload>>('/auth/me');
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },

  async logout(): Promise<void> {
    await clearAuthToken();
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    try {
      const { data } = await api.put<ApiResponse<null>>('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return data;
    } catch (error: any) {
      throw error.response?.data ?? error;
    }
  },
};

export default authService;
