import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project } from "@/types/project";
import { Task, UserSimple } from "@/types/task";
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

  // Wrap fetchProjects with useCallback
  const fetchProjects = useCallback(async () => {
    if (!token) {
      setProjects([]); // Clear projects if no token
      return;
    }
    try {
      const responseData = await fetchApi<operations["listProjects"]["responses"]["200"]["content"]["application/json"]>(
        "/projects/",
        "GET",
        undefined,
        token
      );
      if (responseData) {
        const fetchedProjects: Project[] = responseData.map(p => {
          // Map backend members (UserSimpleOutput[]) to frontend members (ProjectUserSimple[])
          const projectMembers: UserSimple[] = p.members ? p.members.map(m => ({
            id: m.id || uuidv4(), // Ensure ID exists
            name: m.name || null,
            email: m.email || '' 
          })) : [];

          return {
            id: p.id || uuidv4(),
            name: p.name || 'Untitled',
            description: p.description || undefined,
            startDate: p.start_date ? new Date(p.start_date) : new Date(),
            endDate: p.due_date ? new Date(p.due_date) : undefined, 
            status: (p.status as Project['status']) || 'planning',
            priority: (p.priority as Project['priority']) || 'medium',
            progress: p.progress !== undefined ? p.progress : 0,
            teamMembers: projectMembers.map(m => m.id), // Keep original teamMembers as array of IDs for now
            members: projectMembers, // Populate the new members field with full UserSimple objects
            owner: p.owner ? { 
              id: p.owner.id || '',
              name: p.owner.name || undefined,
              email: p.owner.email || '',
            } : undefined, // Make owner optional if backend can omit it
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
          };
        });
        setProjects(fetchedProjects);
      } else {
        setProjects([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch projects.");
      console.error(error);
      setProjects([]);
    }
  }, [token]); // useCallback dependency array includes token

  useEffect(() => {
    fetchProjects(); // Call the memoized fetchProjects
  }, [fetchProjects]); // Now this effect correctly depends on the memoized fetchProjects

  const getProjectById = useCallback((projectId: string): Project | undefined => {
    return projects.find(project => project.id === projectId);
  }, [projects]);

  const addProject = useCallback(async (
    projectData: any 
  ): Promise<Project | null> => {
    if (!token) {
      toast.error("Authentication token not available. Please log in.");
      return null;
    }
    try {
      const payload: Partial<components["schemas"]["ProjectCreateInput"]> = {};
      payload.name = projectData.name;
      if (projectData.description) payload.description = projectData.description;
      if (projectData.status) payload.status = projectData.status;
      if (projectData.priority) payload.priority = projectData.priority;
      if (projectData.parentId) payload.parent_id = projectData.parentId;
      if (projectData.startDate && projectData.startDate instanceof Date) {
        payload.start_date = projectData.startDate.toISOString().slice(0, 10);
      }
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
        payload.progress = 0;
      }
      if (projectData.teamMembers && Array.isArray(projectData.teamMembers)) {
        payload.team_member_ids = projectData.teamMembers;
      }

      const responseData = await fetchApi<components["schemas"]["ProjectOutput"], components["schemas"]["ProjectCreateInput"]>(
        "/projects/",
        "POST",
        payload as components["schemas"]["ProjectCreateInput"],
        token
      );

      if (responseData) {
        const backendProject = responseData;
        const projectMembers: UserSimple[] = backendProject.members ? backendProject.members.map(m => ({
            id: m.id || uuidv4(),
            name: m.name || null,
            email: m.email || '' 
          })) : [];

        const newProject: Project = {
          id: backendProject.id || uuidv4(),
          name: backendProject.name || 'Untitled Project',
          description: backendProject.description || undefined,
          startDate: backendProject.start_date ? new Date(backendProject.start_date) : new Date(),
          endDate: backendProject.due_date ? new Date(backendProject.due_date) : undefined,
          status: (backendProject.status as Project['status']) || 'planning',
          priority: (backendProject.priority as Project['priority']) || 'medium',
          progress: backendProject.progress !== undefined ? backendProject.progress : 0,
          teamMembers: projectMembers.map(m => m.id), // Keep as IDs
          members: projectMembers, // Add full member objects
          owner: backendProject.owner ? { 
            id: backendProject.owner.id || '',
            name: backendProject.owner.name || undefined,
            email: backendProject.owner.email || '',
          } : undefined,
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
  }, [token, setProjects]); // Added setProjects to dependency array as it's used for state update

  const updateProject = useCallback(async (updatedProjectData: any, projectId: string): Promise<Project | null> => {
    if (!token) {
      toast.error("Authentication token not available. Please log in.");
      return null;
    }
    try {
      const payload: Partial<components["schemas"]["ProjectUpdateInput"]> = {};
      if (updatedProjectData.name) payload.name = updatedProjectData.name;
      if (updatedProjectData.description) payload.description = updatedProjectData.description;
      if (updatedProjectData.status) payload.status = updatedProjectData.status;
      if (updatedProjectData.priority) payload.priority = updatedProjectData.priority;
      if (updatedProjectData.parentId) payload.parent_id = updatedProjectData.parentId;
      if (updatedProjectData.startDate && updatedProjectData.startDate instanceof Date) {
        payload.start_date = updatedProjectData.startDate.toISOString().slice(0, 10);
      }
      if (updatedProjectData.endDate && updatedProjectData.endDate instanceof Date) {
        (payload as any).end_date = updatedProjectData.endDate.toISOString().slice(0, 10); 
      } else if (updatedProjectData.endDate === null) {
        (payload as any).end_date = null;
      }
      if (updatedProjectData.progress !== undefined && typeof updatedProjectData.progress === 'number') {
        payload.progress = updatedProjectData.progress;
      }
      if (updatedProjectData.teamMembers && Array.isArray(updatedProjectData.teamMembers)) {
        (payload as any).team_member_ids = updatedProjectData.teamMembers;
      }

      const responseData = await fetchApi<components["schemas"]["ProjectOutput"], Partial<components["schemas"]["ProjectUpdateInput"]>>(
        `/projects/${projectId}`,
        "PUT",
        payload,
        token
      );

      if (responseData) {
        const backendProject = responseData;
        const existingProject = projects.find(p => p.id === projectId);
        
        const projectMembers: UserSimple[] = backendProject.members ? backendProject.members.map(m => ({
            id: m.id || uuidv4(),
            name: m.name || null,
            email: m.email || '' 
          })) : (existingProject?.members || []); // Fallback to existing members if API doesn't return them on PUT

        const updatedProject: Project = {
          ...(existingProject || {} as Project),
          id: backendProject.id || projectId,
          name: backendProject.name || existingProject?.name || 'Untitled Project',
          description: backendProject.description !== undefined ? backendProject.description : existingProject?.description,
          startDate: backendProject.start_date ? new Date(backendProject.start_date) : existingProject?.startDate || new Date(),
          endDate: backendProject.due_date ? new Date(backendProject.due_date) : existingProject?.endDate,
          status: (backendProject.status as Project['status']) || existingProject?.status || 'planning',
          priority: (backendProject.priority as Project['priority']) || existingProject?.priority || 'medium',
          progress: backendProject.progress !== undefined ? backendProject.progress : existingProject?.progress || 0,
          teamMembers: projectMembers.map(m => m.id), // Keep as IDs
          members: projectMembers, // Add full member objects
          owner: backendProject.owner ? { 
            id: backendProject.owner.id || '',
            name: backendProject.owner.name || undefined,
            email: backendProject.owner.email || '',
          } : existingProject?.owner, // Fallback to existing owner
          createdBy: backendProject.owner?.name || existingProject?.createdBy || 'unknown',
          createdAt: backendProject.created_at ? new Date(backendProject.created_at) : existingProject?.createdAt || new Date(),
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
  }, [token, projects, setProjects]); // Added projects and setProjects to dependency array

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
