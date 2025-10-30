import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { IClientUser } from '@hotel-inventory/shared'; // Import shared types

interface AuthState {
  isAuthenticated: boolean;
  user: IClientUser | null;
  accessToken: string | null;
  isLoading: boolean; // To handle initial check
}

interface AuthContextProps extends AuthState {
  login: (token: string, userData: IClientUser) => void;
  logout: () => void;
  setAccessToken: (token: string | null) => void; // For token refresh
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: sessionStorage.getItem('accessToken'), // Initialize from storage
    isLoading: true, // Start loading initially
  });

  // TODO: Add effect to verify token or fetch user on initial load if token exists
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     if (authState.accessToken) {
  //       try {
  //         // Optionally call GET /api/auth/me to verify token and get fresh user data
  //         // const response = await apiClient.get('/auth/me');
  //         // const userData = response.data.data;
  //         // setAuthState(prev => ({ ...prev, isAuthenticated: true, user: userData, isLoading: false }));
  //         // For now, just assume token means logged in if present (less secure)
  //         setAuthState(prev => ({ ...prev, isAuthenticated: true, isLoading: false })); // Need user data though!
  //       } catch (error) {
  //         console.error("Auth check failed", error);
  //         logout(); // Clear state if token is invalid
  //       }
  //     } else {
  //        setAuthState(prev => ({ ...prev, isLoading: false }));
  //     }
  //   };
  //   checkAuth();
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []); // Run only once on mount

  // Simple initial load check (replace with proper /me call later)
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    const userData = sessionStorage.getItem('user');

    if (token && userData) {
      setAuthState({
        isAuthenticated: true,
        user: JSON.parse(userData),
        accessToken: token,
        isLoading: false,
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);


  const login = (token: string, userData: IClientUser) => {
    sessionStorage.setItem('accessToken', token); // Store token
    sessionStorage.setItem('user', JSON.stringify(userData));
    setAuthState({
      isAuthenticated: true,
      user: userData,
      accessToken: token,
      isLoading: false,
    });
  };

  const logout = () => {
    sessionStorage.removeItem('accessToken'); // Clear token
    // Optionally call POST /api/auth/logout (though its main job is clearing the cookie)
    // apiClient.post('/auth/logout').catch(err => console.error("Logout API call failed:", err));
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      isLoading: false,
    });
     // Optionally redirect here or let calling component handle it
     // window.location.href = '/login';
  };

   const setAccessToken = (token: string | null) => {
       if (token) {
           sessionStorage.setItem('accessToken', token);
       } else {
           sessionStorage.removeItem('accessToken');
       }
       setAuthState(prev => ({ ...prev, accessToken: token }));
   };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};