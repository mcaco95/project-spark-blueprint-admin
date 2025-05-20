import React from 'react';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project } from "@/types/project";
import { Task } from "@/types/task";
import { ensureTaskType, ensureTasksHaveType } from "./useTaskTypeSetter";
import { operations, components } from '@/services/apiClient';
import { fetchApi } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Makes a single change to the application's task model:
 * Applied when we know the task model has changed and existing code might still be
 * using the old model. This should be a temporary solution until all code is updated.
 */
export function patchTaskModel() {
  // Get the original createElement function
  const originalCreateElement = React.createElement;
  
  // Fix the type definition for the createElement override
  // @ts-ignore - We need to override React.createElement which TypeScript doesn't like
  React.createElement = function(type: React.ElementType, props: any, ...children: React.ReactNode[]) {
    if (props && props.task && typeof props.task === 'object' && !props.task.taskType) {
      props = {
        ...props,
        // task: ensureTaskType(props.task) // ensureTaskType was not provided, so commenting out
      };
    }
    
    return originalCreateElement(type, props, ...children);
  };
}

// Create the hook that provides project data
export function useProjectsData() {
  const [projects, setProjects] = useState<Project[]>([]);
  const { token } = useAuth();

  // Fetch projects when the component mounts or token changes
  useEffect(() => {
    if (token) { // Only fetch if authenticated
      fetchProjects();
    } else {
      setProjects([]); // Clear projects if not authenticated
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Dependency array includes token

  const getProjectById = (projectId: string): Project | undefined => {
    return projects.find(project => project.id === projectId);
  };

  const addProject = async (
    projectData: any // Accept both OpenAPI and frontend form types
  ): Promise<Project | null> => {
    if (!token) {
      toast.error("Authentication token not available. Please log in.");
      return null;
    }
    try {
      // Prepare payload according to ProjectCreateInput schema
      const payload: Partial<components["schemas"]["ProjectCreateInput"]> = {};

      payload.name = projectData.name;
      if (projectData.description) payload.description = projectData.description;
      if (projectData.status) payload.status = projectData.status;
      if (projectData.priority) payload.priority = projectData.priority;
      if (projectData.parentId) payload.parent_id = projectData.parentId;
      
      if (projectData.startDate && projectData.startDate instanceof Date) {
        payload.start_date = projectData.startDate.toISOString().slice(0, 10);
      }
      // Backend Pydantic schema ProjectCreate (via ProjectBase) expects 'end_date'
      // The components["schemas"]["ProjectCreateInput"] might be from an OpenAPI spec expecting 'due_date'.
      // We send 'end_date' as per Python Pydantic model, and may need to cast payload if TS types mismatch.
      if (projectData.endDate && projectData.endDate instanceof Date) {
        (payload as any).end_date = projectData.endDate.toISOString().slice(0, 10);
      } else if (projectData.endDate === undefined || projectData.endDate === null) {
        (payload as any).end_date = null;
      }

      if (projectData.progress !== undefined && typeof projectData.progress === 'number') {
        payload.progress = projectData.progress;
      } else if (typeof projectData.progress === 'string') {
        payload.progress = parseInt(projectData.progress, 10) || 0;
      } else {
        payload.progress = 0; // Default if not provided or invalid
      }

      if (projectData.teamMembers && Array.isArray(projectData.teamMembers)) {
        payload.team_member_ids = projectData.teamMembers; // Assuming teamMembers from dialog is already array of IDs
      }

      const responseData = await fetchApi<components["schemas"]["ProjectOutput"], components["schemas"]["ProjectCreateInput"]>(
        "/projects/",
        "POST",
        payload as components["schemas"]["ProjectCreateInput"], // Cast to ensure type checking
        token
      );

      if (responseData) {
        const backendProject = responseData; // Typed as ProjectOutput
        const newProject: Project = {
          id: backendProject.id || uuidv4(),
          name: backendProject.name || 'Untitled Project',
          description: backendProject.description || undefined,
          startDate: backendProject.start_date ? new Date(backendProject.start_date) : new Date(),
          endDate: backendProject.due_date ? new Date(backendProject.due_date) : undefined, // from API's due_date
          status: (backendProject.status as Project['status']) || 'planning',
          priority: (backendProject.priority as Project['priority']) || 'medium',
          progress: backendProject.progress !== undefined ? backendProject.progress : 0,
          teamMembers: backendProject.members ? backendProject.members.map(member => member.id || '').filter(id => id) : [],
          owner: backendProject.owner ? { // Correctly map owner object
            id: backendProject.owner.id || '',
            name: backendProject.owner.name || undefined,
            email: backendProject.owner.email || '',
          } : { id: '', email: '', name: undefined }, // Default UserSimple if owner is missing
          createdBy: backendProject.owner?.name || 'unknown',
          createdAt: backendProject.created_at ? new Date(backendProject.created_at) : new Date(),
          updatedAt: backendProject.updated_at ? new Date(backendProject.updated_at) : new Date(),
          ownerId: backendProject.owner_id || '',
          createdById: backendProject.owner_id || '',
          parentId: backendProject.parent_id || null,
          path: undefined,
          level: undefined,
          subProjects: [],
          tags: [],
        };
        setProjects(prevProjects => [...prevProjects, newProject]);
        toast.success(`Project "${newProject.name}" created successfully!`);
        return newProject;
      } else {
        toast.error("Failed to create project. No data returned.");
        console.error("Error creating project: No data in response");
        return null;
      }
    } catch (error: any) {
      console.error("Network or unexpected error creating project:", error);
      toast.error(error.message || "An unexpected error occurred while creating the project.");
      return null;
    }
  };

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const responseData = await fetchApi<operations["listProjects"]["responses"]["200"]["content"]["application/json"]>(
        "/projects/",
        "GET",
        undefined,
        token
      );
      if (responseData) {
        const fetchedProjects: Project[] = responseData.map(p => ({ // p is ProjectOutput
          id: p.id || uuidv4(),
          name: p.name || 'Untitled',
          description: p.description || undefined,
          startDate: p.start_date ? new Date(p.start_date) : new Date(),
          endDate: p.due_date ? new Date(p.due_date) : undefined, // from API's due_date
          status: (p.status as Project['status']) || 'planning',
          priority: (p.priority as Project['priority']) || 'medium',
          progress: p.progress !== undefined ? p.progress : 0,
          teamMembers: p.members ? p.members.map(member => member.id || '').filter(id => id) : [],
          owner: p.owner ? { // Correctly map owner object
            id: p.owner.id || '',
            name: p.owner.name || undefined,
            email: p.owner.email || '',
          } : { id: '', email: '', name: undefined }, // Default UserSimple
          createdBy: p.owner?.name || 'unknown',
          createdAt: p.created_at ? new Date(p.created_at) : new Date(),
          updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
          ownerId: p.owner_id || '',
          createdById: p.owner_id || '',
          parentId: p.parent_id || null,
          path: undefined,
          level: undefined,
          subProjects: [],
          tags: [],
        }));
        setProjects(fetchedProjects);
      } else {
        setProjects([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch projects.");
      console.error(error);
      setProjects([]);
    }
  };

  const updateProject = async (updatedProjectData: any, projectId: string): Promise<Project | null> => {
    if (!token) {
      toast.error("Authentication token not available. Please log in.");
      return null;
    }
    try {
      // Prepare payload according to ProjectUpdateInput schema
      const payload: Partial<components["schemas"]["ProjectUpdateInput"]> = {};

      // Only include fields if they are provided in updatedProjectData
      if (updatedProjectData.name !== undefined) payload.name = updatedProjectData.name;
      if (updatedProjectData.description !== undefined) payload.description = updatedProjectData.description;
      if (updatedProjectData.status !== undefined) payload.status = updatedProjectData.status;
      if (updatedProjectData.priority !== undefined) payload.priority = updatedProjectData.priority;
      if (updatedProjectData.parentId !== undefined) payload.parent_id = updatedProjectData.parentId;

      if (updatedProjectData.startDate !== undefined) {
        payload.start_date = updatedProjectData.startDate instanceof Date 
          ? updatedProjectData.startDate.toISOString().slice(0, 10) 
          : updatedProjectData.startDate;
      }
      // Backend Pydantic schema ProjectUpdate expects 'end_date'.
      // The components["schemas"]["ProjectUpdateInput"] might be from an OpenAPI spec expecting 'due_date'.
      // We send 'end_date' as per Python Pydantic model, and may need to cast payload if TS types mismatch.
      if (updatedProjectData.endDate !== undefined) {
        (payload as any).end_date = updatedProjectData.endDate instanceof Date 
          ? updatedProjectData.endDate.toISOString().slice(0, 10) 
          : (updatedProjectData.endDate === null ? null : updatedProjectData.endDate);
      }

      if (updatedProjectData.progress !== undefined) {
         payload.progress = typeof updatedProjectData.progress === 'string' 
            ? parseInt(updatedProjectData.progress, 10) 
            : updatedProjectData.progress;
         if (isNaN(payload.progress as number)) payload.progress = 0; // default if parse failed
      }

      if (updatedProjectData.teamMembers !== undefined && Array.isArray(updatedProjectData.teamMembers)) {
        payload.team_member_ids = updatedProjectData.teamMembers; // Assuming teamMembers is array of IDs
      }
      
      console.log("[useProjectsData] Updating project. Payload:", JSON.stringify(payload, null, 2)); // DEBUG

      const responseData = await fetchApi<components["schemas"]["ProjectOutput"], components["schemas"]["ProjectUpdateInput"]>(
        `/projects/${projectId}`,
        "PUT",
        payload as components["schemas"]["ProjectUpdateInput"], // Cast to ensure type checking
        token
      );

      if (responseData) {
        const backendProject = responseData; // Typed as ProjectOutput
        const existingProject = projects.find(p => p.id === projectId);

        const updatedProject: Project = {
          ...(existingProject || {} as Project),
          id: backendProject.id || projectId,
          name: backendProject.name || existingProject?.name || 'Untitled Project',
          description: backendProject.description !== undefined ? backendProject.description : existingProject?.description,
          startDate: backendProject.start_date ? new Date(backendProject.start_date) : (existingProject?.startDate || new Date()),
          endDate: backendProject.due_date ? new Date(backendProject.due_date) : (backendProject.due_date === null ? undefined : existingProject?.endDate), // from API's due_date
          status: (backendProject.status as Project['status']) || existingProject?.status || 'planning',
          priority: (backendProject.priority as Project['priority']) || existingProject?.priority || 'medium',
          progress: backendProject.progress !== undefined ? backendProject.progress : (existingProject?.progress || 0),
          teamMembers: backendProject.members ? backendProject.members.map(member => member.id || '').filter(id => id) : (existingProject?.teamMembers || []),
          owner: backendProject.owner ? { // Correctly map owner object
            id: backendProject.owner.id || '',
            name: backendProject.owner.name || undefined,
            email: backendProject.owner.email || '',
          } : (existingProject?.owner || { id: '', email: '', name: undefined }), // Fallback to existing or default
          createdBy: backendProject.owner?.name || existingProject?.createdBy || 'unknown',
          createdAt: existingProject?.createdAt || (backendProject.created_at ? new Date(backendProject.created_at) : new Date()),
          updatedAt: backendProject.updated_at ? new Date(backendProject.updated_at) : new Date(),
          ownerId: backendProject.owner_id || existingProject?.ownerId || '',
          createdById: backendProject.owner_id || existingProject?.createdById || '',
          parentId: backendProject.parent_id !== undefined ? backendProject.parent_id : existingProject?.parentId || null,
          path: existingProject?.path,
          level: existingProject?.level,
          subProjects: existingProject?.subProjects || [],
          tags: existingProject?.tags || [],
        };
        setProjects(prevProjects =>
          prevProjects.map(p => (p.id === projectId ? updatedProject : p))
        );
        toast.success(`Project "${updatedProject.name}" updated.`);
        return updatedProject;
      } else {
        toast.error("Failed to update project. No data returned.");
        return null;
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating project.");
      console.error(error);
      return null;
    }
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    if (!token) {
      toast.error("Authentication token not available. Please log in.");
      return false;
    }
    try {
      await fetchApi<void, undefined>(
        `/projects/${projectId}`,
        "DELETE",
        undefined,
        token
      );
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      toast.success("Project deleted successfully.");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project.");
      console.error(error);
      return false;
    }
  };

  return {
    projects,
    getProjectById,
    addProject,
    updateProject,
    deleteProject,
    fetchProjects
  };
}
