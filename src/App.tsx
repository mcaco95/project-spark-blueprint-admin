
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
import ProtectedRoute from '@/components/auth/ProtectedRoute';
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
                  
                  <Route element={<ProtectedRoute />}>
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/tasks/:id" element={<TaskDetail />} />
                    <Route path="/kanban" element={<TaskKanban />} />
                    <Route path="/timeline" element={<TaskTimeline />} />
                    <Route path="/files" element={<FileManager />} />
                    <Route path="/messaging" element={<Messaging />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/pomodoro" element={<PomodoroTasksPage />} />
                    
                    <Route path="/admin" element={<AdminConsole />} />
                  </Route>
                  
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
