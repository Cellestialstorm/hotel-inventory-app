import axios from "axios";
import { toast } from "sonner";

/**
 * Axios instance with default config.
 * Adjust baseURL to match your backend server.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.defaults.withCredentials = true;

//--- Access Token Storage ---

export const storeAccessToken = (token: string) => {
  localStorage.setItem('accessToken', token);
};

export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

export const clearAccessToken = () => {
  return localStorage.removeItem('accessToken');
};

// --- Request Interceptors ---

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void; }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url.includes('/auth/refresh-token') &&
      !originalRequest.url.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post('/auth/refresh-token');
        const newAccessToken = data.data.accessToken;

        storeAccessToken(newAccessToken);
        isRefreshing= false;
        processQueue(null, newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        isRefreshing = false;
        processQueue(refreshError, null);

        clearAccessToken();

        toast.error(refreshError.response?.data?.message || 'Session expired. Please log in again.');

        return Promise.reject(refreshError);
      }
    }

    console.error('Api Error:', error.response?.data || error.message);
    if (error.response?.status !== 401) {
      toast.error(error.response?.data?.message || 'An error occurred. Please try again later.');
    }

    return Promise.reject(error);
  }
)

export default apiClient;
