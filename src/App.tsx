
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import Tasks from '@/pages/Tasks';
import TaskDetail from '@/pages/TaskDetail';
import TaskKanban from '@/pages/TaskKanban';
import TaskTimeline from '@/pages/TaskTimeline';
import FileManager from '@/pages/FileManager';
import Messaging from '@/pages/Messaging';
import Settings from '@/pages/Settings';
import AdminConsole from '@/pages/AdminConsole';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/tasks/TaskContext';
import { FileProvider } from '@/contexts/files/FileContext';
import { NotificationProvider } from '@/contexts/notifications/NotificationContext';
import PomodoroTasksPage from '@/pages/PomodoroTasksPage';

import './App.css';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TaskProvider>
          <FileProvider>
            <NotificationProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                  <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                  <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
                  <Route path="/kanban" element={<ProtectedRoute><TaskKanban /></ProtectedRoute>} />
                  <Route path="/timeline" element={<ProtectedRoute><TaskTimeline /></ProtectedRoute>} />
                  <Route path="/files" element={<ProtectedRoute><FileManager /></ProtectedRoute>} />
                  <Route path="/messaging" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/pomodoro" element={<ProtectedRoute><PomodoroTasksPage /></ProtectedRoute>} />
                  
                  <Route path="/admin" element={<ProtectedRoute><AdminConsole /></ProtectedRoute>} />
                  
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
              
              <SonnerToaster position="top-right" />
              <Toaster />
            </NotificationProvider>
          </FileProvider>
        </TaskProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
