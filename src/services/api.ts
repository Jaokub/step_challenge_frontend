// ============================================================
// Step Challenge Mobile App — API Client
// ============================================================
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ───────────────────────────────────────────

/** AsyncStorage key for the JWT access token */
export const TOKEN_KEY = '@step_challenge_access_token';

/** AsyncStorage key for the JWT refresh token */
export const REFRESH_TOKEN_KEY = '@step_challenge_refresh_token';

// ─── Axios Instance ─────────────────────────────────────────

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/** Pre-configured axios instance pointing at the Step Challenge API */
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Token Helpers ──────────────────────────────────────────

/**
 * Persist an access token and attach it to all future requests.
 * @param token - JWT access token
 */
export const setAuthToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

/**
 * Remove tokens from storage and clear the Authorization header.
 */
export const clearAuthToken = async (): Promise<void> => {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
  delete api.defaults.headers.common['Authorization'];
};

// ─── Flag to prevent concurrent refresh attempts ────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Resolve or reject every request that was queued while a token
 * refresh was in progress.
 */
const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// ─── Request Interceptor ───────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // If no Authorization header is set yet, try loading from storage
    if (!config.headers['Authorization']) {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor (auto-refresh on 401) ────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh for 401s that haven't been retried yet and
    // that are NOT the refresh-token endpoint itself (to avoid loops).
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh-token')
    ) {
      if (isRefreshing) {
        // Another refresh is already in flight — queue this request
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken: string = data.data.accessToken;
        const newRefreshToken: string = data.data.refreshToken;

        await setAuthToken(newAccessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearAuthToken();
        // NOTE: Navigation to login screen should be handled by the auth
        // context / state listener that watches for a cleared token.
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
