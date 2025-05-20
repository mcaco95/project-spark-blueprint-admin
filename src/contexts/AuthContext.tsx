import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import i18n from '@/i18n';
import { components, paths } from '@/services/apiClient'; // Generated API client types

// Define User type based on API spec
type User = components["schemas"]["UserPublic"];
type LoginRequest = components["schemas"]["LoginRequest"];
type RegisterRequest = components["schemas"]["RegisterRequest"];
// The backend returns a LoginResponse for both login and successful registration
type AuthResponseData = components["schemas"]["LoginResponse"];

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to construct API URLs
const getApiUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  // Ensure V1 prefix is handled correctly if API client paths don't include it
  // Our apiClient.ts paths are like /auth/login, and backend has /v1/auth/login
  // So, if VITE_API_BASE_URL is http://localhost:5000, path should be /v1/auth/login
  // Let's assume VITE_API_BASE_URL includes /v1 if necessary, or adjust here.
  // For now, assuming VITE_API_BASE_URL is like 'http://localhost:5000' and paths need /v1
  // The openapi.yaml server URL is http://localhost:5000/v1, which openapi-typescript might use
  // Let's ensure the fetchApi correctly uses the base.
  // The paths from apiClient.ts are like '/auth/login'.
  // Flask-RESTX Api is at / (e.g. /v1/auth from app.py)
  // The openapi.yaml server URL is `http://localhost:5000/v1`.
  // `openapi-typescript` does not prefix paths with server URL base path.
  // So if VITE_API_BASE_URL = http://localhost:5000, we need to add /v1
  
  let apiPath = path as string;
  if (!baseUrl.endsWith('/v1') && !path.startsWith('/v1/')) {
    apiPath = `/v1${path}`;
  } else if (baseUrl.endsWith('/v1') && path.startsWith('/v1/')) {
    // Prevent double /v1/v1 if VITE_API_BASE_URL already has /v1 and path also has it (unlikely with current setup)
    apiPath = path.substring(3);
  }

  return `${baseUrl}${apiPath}`;
};

// Generic API fetch helper
// Export this function so other parts of the app can use it for authenticated calls
export async function fetchApi<T_Response, T_Request = undefined>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: T_Request,
  token?: string | null
): Promise<T_Response> {
  const url = getApiUrl(path);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON, use status text
      errorData = { message: response.statusText };
    }
    console.error('API Error:', response.status, errorData);
    throw new Error(errorData?.message || `Request failed with status ${response.status}`);
  }

  // For 204 No Content or similar cases where response body might be empty
  if (response.status === 204) {
    return undefined as unknown as T_Response; // Or handle as per API contract for 204
  }
  
  return response.json() as Promise<T_Response>;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(true); // Start loading until initial auth check is done

  useEffect(() => {
    const attemptToLoadUser = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser: User = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
          if (parsedUser.language) {
            i18n.changeLanguage(parsedUser.language);
          }
          // TODO: Optionally, verify token with a /auth/me endpoint here
          // For now, trusting localStorage. If token is invalid, subsequent API calls will fail.
        } catch (error) {
          console.error("Failed to parse stored user or token is invalid:", error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    attemptToLoadUser();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const data = await fetchApi<AuthResponseData, LoginRequest>('/auth/login', 'POST', credentials);
      if (data.access_token && data.user) {
        localStorage.setItem('accessToken', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.access_token);
        if (data.user.language) {
          i18n.changeLanguage(data.user.language);
        }
      } else {
        throw new Error('Login failed: No token or user data received.');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial login artifacts
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      throw error; // Re-throw to be caught by UI
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    try {
      // Assuming registration also returns AuthResponseData upon success (token + user)
      const data = await fetchApi<AuthResponseData, RegisterRequest>('/auth/register', 'POST', userData);
      if (data.access_token && data.user) {
        localStorage.setItem('accessToken', data.access_token);
         if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.access_token);
        if (data.user.language) {
          i18n.changeLanguage(data.user.language);
        }
      } else {
        throw new Error('Registration failed: No token or user data received.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      // No need to clear tokens here as registration wouldn't have set them if failed
      throw error; // Re-throw
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Optionally, redirect to login page or reset i18n language to default
    // i18n.changeLanguage('en'); // Or your default language
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token && !!user, user, token, login, register, logout, isLoading }}>
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
