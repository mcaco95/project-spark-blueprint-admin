
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types/auth';
import { toast } from 'sonner';
import i18n from '@/i18n';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUserPreference: (language: 'en' | 'es') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demo purposes
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin' as const,
    language: 'en' as const,
    createdAt: new Date(),
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'user123',
    name: 'Regular User',
    role: 'user' as const,
    language: 'es' as const,
    createdAt: new Date(),
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check for saved token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user');
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser) as User;
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // Set the user's language preference
          if (user.language) {
            i18n.changeLanguage(user.language);
          }
        } catch (error) {
          localStorage.removeItem('user');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Invalid session',
          });
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user with matching credentials
      const user = mockUsers.find(u => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Remove password from user object
      const { password: _, ...safeUser } = user;
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(safeUser));
      
      // Update state
      setAuthState({
        user: safeUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      // Set the user's language preference
      i18n.changeLanguage(safeUser.language);
      
      toast.success('Login successful');
      
    } catch (error: any) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Login failed',
      });
      toast.error(error.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    toast.info('Logged out successfully');
  };

  const register = async (name: string, email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      if (mockUsers.some(u => u.email === email)) {
        throw new Error('Email already registered');
      }
      
      // Create new user (in a real app, this would be an API call)
      const newUser = {
        id: `${mockUsers.length + 1}`,
        email,
        name,
        role: 'user' as const,
        language: 'en' as const,
        createdAt: new Date(),
      };
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Update state
      setAuthState({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      toast.success('Registration successful');
      
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev, 
        isLoading: false,
        error: error.message || 'Registration failed',
      }));
      toast.error(error.message || 'Registration failed');
    }
  };

  const updateUserPreference = (language: 'en' | 'es') => {
    if (authState.user) {
      const updatedUser = {
        ...authState.user,
        language,
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAuthState(prev => ({ ...prev, user: updatedUser }));
      
      // Update language
      i18n.changeLanguage(language);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        register,
        updateUserPreference,
      }}
    >
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
