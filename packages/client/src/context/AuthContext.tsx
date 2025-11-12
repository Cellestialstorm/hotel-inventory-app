import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { IClientUser } from '@hotel-inventory/shared';
import apiClient, { storeAccessToken, clearAccessToken } from '@/api/axios';
import { useNavigate } from 'react-router-dom';

interface AuthState {
  isAuthenticated: boolean;
  user: IClientUser | null;
  accessToken: string | null;
  isLoading: boolean;
}


interface AuthContextProps extends AuthState {
  login: (token: string, userData: IClientUser) => void;
  logout: (redirect?: boolean) => void;
  setAccessToken: (token: string | null) => void;
  selectedHotelId: string | null;
  setSelectedHotelId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    isLoading: true,
  });

  const login = (token: string, userData: IClientUser) => {
    storeAccessToken(token);
    localStorage.setItem('refreshMarker', 'true');

    setAuthState({
      isAuthenticated: true,
      user: userData,
      accessToken: token,
      isLoading: false,
    });
  };

  const logout = (redirect = true) => {
    clearAccessToken();
    localStorage.removeItem('refreshMarker');

    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      isLoading: false,
    });

    apiClient.post('/auth/logout').catch(err => console.error('Logout API call failed:', err));

    if (redirect) {
      navigate('/login', { replace: true });
    }
  };

  const setAccessToken = (token: string | null) => {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
    setAuthState(prev => ({ ...prev, accessToken: token }));
  };

  const verifyAuth = async () => {
    const refreshMarker = localStorage.getItem('refreshMarker');
    if (!refreshMarker) {
      console.log('No refreshMarker - skipping refresh request');
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data } = await apiClient.post('/auth/refresh-token', {}, { withCredentials: true });
      const { accessToken, user } = data.data;
      login(accessToken, user);
    } catch (error) {
      console.warn('Refresh token failed, logging out...');
      logout(false);
    }
  };

  useEffect(() => {
    verifyAuth();
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'accessToken' && !event.newValue) {
        if (authState.isAuthenticated) {
          logout(false);
        }
        return;
      }

      if (event.key === 'refreshMarker' && !event.newValue) {
        if (authState.isAuthenticated) {
          logout(false);
        }
        return;
      }

      if (event.key === 'accessToken' && event.newValue) {
        if (!authState.accessToken || authState.accessToken !== event.newValue) {
          verifyAuth();
        }
        return;
      }
      
      if (event.key === 'refreshMarker' && event.newValue) {
        if (!localStorage.getItem('refreshMarker')) {
          verifyAuth();
        }
        return;
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [authState.isAuthenticated, verifyAuth]);

  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(
    localStorage.getItem('selectedHotelId')
  );

  useEffect(() => {
    if (selectedHotelId) {
      localStorage.setItem('selectedHotelId', selectedHotelId);
    } else {
      localStorage.removeItem('selectedHotelId');
    }
  }, [selectedHotelId]);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, setAccessToken, setSelectedHotelId, selectedHotelId }}>
      {!authState.isLoading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};