
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';

// This is an extension to the AuthContext to add new functionality without modifying the original file
export function useAuthExtended() {
  const authContext = useAuth();
  
  // Add new functionality
  const updateUserProfile = (updatedUser: User) => {
    // In a real app, this would make an API call to update the user profile
    // For now, we'll just pass the updated user to the console for demonstration
    console.log('Updating user profile:', updatedUser);
    
    // We can't actually modify the user in the AuthContext since it's read-only,
    // but in a real implementation, this would update the user state
    return true;
  };
  
  return {
    ...authContext,
    updateUserProfile,
  };
}

// Override the original useAuth hook to include our extended functionality
// This is just for demonstration - in a real app we would modify the original AuthContext
export { useAuthExtended as useAuth };
