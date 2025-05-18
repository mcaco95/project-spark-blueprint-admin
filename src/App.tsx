
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskProvider } from "@/contexts/TaskContext";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import TaskKanban from "./pages/TaskKanban";
import TaskTimeline from "./pages/TaskTimeline";
import FileManager from "./pages/FileManager";
import AdminConsole from "./pages/AdminConsole";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrap App in a function component to ensure hooks work correctly
const App = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TaskProvider>
          {/* Move TooltipProvider inside other providers */}
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/tasks/kanban" element={<TaskKanban />} />
              <Route path="/tasks/timeline" element={<TaskTimeline />} />
              <Route path="/files" element={<FileManager />} />
              <Route path="/admin" element={<AdminConsole />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </TaskProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
