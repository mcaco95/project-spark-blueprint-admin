import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskProvider } from "@/contexts/TaskContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PomodoroProvider } from "@/contexts/PomodoroContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import TaskKanban from "./pages/TaskKanban";
import TaskTimeline from "./pages/TaskTimeline";
import TaskDetail from "./pages/TaskDetail";
import FileManager from "./pages/FileManager";
import AdminConsole from "./pages/AdminConsole";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";
import Messaging from "./pages/Messaging";
import PomodoroTasksPage from "./pages/PomodoroTasksPage";

const queryClient = new QueryClient();

// Wrap App in a function component to ensure hooks work correctly
const App = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TaskProvider>
            <PomodoroProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  
                  {/* Protected routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/projects" element={
                    <ProtectedRoute>
                      <Projects />
                    </ProtectedRoute>
                  } />
                  <Route path="/projects/:id" element={
                    <ProtectedRoute>
                      <ProjectDetail />
                    </ProtectedRoute>
                  } />
                  {/* New unified tasks page */}
                  <Route path="/tasks" element={
                    <ProtectedRoute>
                      <Tasks />
                    </ProtectedRoute>
                  } />
                  {/* Keep old routes for backward compatibility */}
                  <Route path="/tasks/kanban" element={
                    <ProtectedRoute>
                      <TaskKanban />
                    </ProtectedRoute>
                  } />
                  <Route path="/tasks/timeline" element={
                    <ProtectedRoute>
                      <TaskTimeline />
                    </ProtectedRoute>
                  } />
                  <Route path="/tasks/:id" element={
                    <ProtectedRoute>
                      <TaskDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/pomodoro" element={
                    <ProtectedRoute>
                      <PomodoroTasksPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/messaging" element={
                    <ProtectedRoute>
                      <Messaging />
                    </ProtectedRoute>
                  } />
                  <Route path="/messaging/:channelId" element={
                    <ProtectedRoute>
                      <Messaging />
                    </ProtectedRoute>
                  } />
                  <Route path="/files" element={
                    <ProtectedRoute>
                      <FileManager />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute requiredRoles={['admin']}>
                      <AdminConsole />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </PomodoroProvider>
          </TaskProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
