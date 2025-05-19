
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '@/types/project';

// Enhanced mock projects data for demo
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website with modern design and improved UX',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-03-30'),
    status: 'active',
    priority: 'high',
    progress: 65,
    teamMembers: ['User 1', 'User 2', 'User 3'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-01-01'),
    parentId: null,
    path: '1',
    level: 0,
    subProjects: ['2', '3'],
    tasks: [
      { id: '1-1', title: 'Create wireframes', assignees: ['User 1'], dueDate: new Date('2025-01-25'), status: 'completed' },
      { id: '1-2', title: 'Design homepage', assignees: ['User 2'], dueDate: new Date('2025-02-10'), status: 'in-progress' },
      { id: '1-3', title: 'Implement responsive layout', assignees: ['User 3'], dueDate: new Date('2025-03-15'), status: 'todo' },
    ],
    comments: [
      { id: '1', text: 'Let\'s focus on mobile-first approach @User2', author: 'User 1', createdAt: new Date('2025-01-05') },
      { id: '2', text: '@User1 I agree, I\'ll update the wireframes', author: 'User 2', createdAt: new Date('2025-01-06') },
    ],
  },
  {
    id: '2',
    name: 'Landing Page',
    description: 'Design and implement main landing page for the website',
    startDate: new Date('2025-01-20'),
    endDate: new Date('2025-02-28'),
    status: 'active',
    priority: 'high',
    progress: 45,
    teamMembers: ['User 2', 'User 4'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-01-15'),
    parentId: '1',
    path: '1/2',
    level: 1,
    tasks: [
      { id: '2-1', title: 'Define landing page requirements', assignees: ['User 2'], dueDate: new Date('2025-02-15'), status: 'completed' },
      { id: '2-2', title: 'Create mockups', assignees: ['User 4'], dueDate: new Date('2025-03-01'), status: 'todo' },
    ],
    comments: [
      { id: '1', text: 'We should include customer testimonials @User4', author: 'User 2', createdAt: new Date('2025-01-20') },
    ],
  },
  {
    id: '3',
    name: 'Blog Section',
    description: 'Design and implement the blog section of the website',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-03-15'),
    status: 'planning',
    priority: 'medium',
    progress: 25,
    teamMembers: ['User 1', 'User 3'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-01-25'),
    parentId: '1',
    path: '1/3',
    level: 1,
    tasks: [
      { id: '3-1', title: 'Design blog layout', assignees: ['User 1'], dueDate: new Date('2025-02-20'), status: 'in-progress' },
      { id: '3-2', title: 'Implement comment system', assignees: ['User 3'], dueDate: new Date('2025-03-10'), status: 'todo' },
    ],
  },
  {
    id: '4',
    name: 'Marketing Campaign',
    description: 'Q2 digital marketing campaign focusing on social media and content marketing',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-06-30'),
    status: 'planning',
    priority: 'medium',
    progress: 10,
    teamMembers: ['User 5'],
    createdBy: 'Regular User',
    createdAt: new Date('2025-03-15'),
    parentId: null,
    path: '4',
    level: 0,
    subProjects: ['5'],
    tasks: [
      { id: '3-1', title: 'Market research', assignees: ['User 5'], dueDate: new Date('2025-04-15'), status: 'todo' },
    ],
  },
  {
    id: '5',
    name: 'Social Media Strategy',
    description: 'Develop and implement social media marketing strategy',
    startDate: new Date('2025-04-15'),
    endDate: new Date('2025-06-15'),
    status: 'planning',
    priority: 'medium',
    progress: 5,
    teamMembers: ['User 5', 'User 6'],
    createdBy: 'Regular User',
    createdAt: new Date('2025-03-20'),
    parentId: '4',
    path: '4/5',
    level: 1,
    tasks: [
      { id: '5-1', title: 'Platform analysis', assignees: ['User 5'], dueDate: new Date('2025-04-30'), status: 'todo' },
      { id: '5-2', title: 'Content calendar', assignees: ['User 6'], dueDate: new Date('2025-05-15'), status: 'todo' },
    ],
  },
  {
    id: '6',
    name: 'Database Migration',
    description: 'Migrate from MySQL to PostgreSQL and optimize queries',
    startDate: new Date('2025-02-15'),
    endDate: new Date('2025-03-15'),
    status: 'completed',
    priority: 'medium',
    progress: 100,
    teamMembers: ['User 3', 'User 6'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-01-30'),
    updatedAt: new Date('2025-03-15'),
    parentId: null,
    path: '6',
    level: 0,
    tasks: [
      { id: '4-1', title: 'Data schema conversion', assignees: ['User 3'], dueDate: new Date('2025-02-25'), status: 'completed' },
      { id: '4-2', title: 'Test data integrity', assignees: ['User 6'], dueDate: new Date('2025-03-10'), status: 'completed' },
    ],
  },
];

export function useProjectsData() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  // Calculate path for a project based on its position in the hierarchy
  const calculateProjectPath = (projectId: string, parentId: string | null, allProjects: Project[]): string => {
    if (!parentId) {
      return projectId;
    }
    
    const parentProject = allProjects.find(p => p.id === parentId);
    if (!parentProject || !parentProject.path) {
      return projectId;
    }
    
    return `${parentProject.path}/${projectId}`;
  };

  // Calculate level based on path
  const calculateProjectLevel = (path: string): number => {
    return path.split('/').length - 1;
  };

  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProjectId = uuidv4();
    
    // Calculate path and level for the new project
    const path = calculateProjectPath(
      newProjectId, 
      projectData.parentId || null, 
      projects
    );
    const level = calculateProjectLevel(path);
    
    const newProject: Project = {
      ...projectData,
      id: newProjectId,
      createdAt: new Date(),
      tasks: projectData.tasks || [],
      comments: projectData.comments || [],
      path,
      level,
      subProjects: [],
    };
    
    // Add project to the list
    setProjects(prevProjects => {
      const updatedProjects = [...prevProjects, newProject];
      
      // Update parent's subProjects array if applicable
      if (newProject.parentId) {
        return updatedProjects.map(project => {
          if (project.id === newProject.parentId) {
            return {
              ...project,
              subProjects: [...(project.subProjects || []), newProjectId],
            };
          }
          return project;
        });
      }
      
      return updatedProjects;
    });
    
    return newProject;
  };

  const updateProject = (projectData: Project) => {
    // Store the old parentId for comparison
    let oldParentId: string | null = null;
    const projectToUpdate = projects.find(p => p.id === projectData.id);
    if (projectToUpdate) {
      oldParentId = projectToUpdate.parentId || null;
    }
    
    // If parent has changed, we need to update the hierarchy
    if (oldParentId !== projectData.parentId) {
      // Calculate new path and level
      const newPath = calculateProjectPath(
        projectData.id, 
        projectData.parentId || null, 
        projects
      );
      const newLevel = calculateProjectLevel(newPath);
      
      // Update project and its descendants
      setProjects(prevProjects => {
        // First, update all descendants to have correct paths
        let updatedProjects = [...prevProjects];
        
        if (projectToUpdate) {
          // Step 1: Remove from old parent's subProjects list
          if (oldParentId) {
            updatedProjects = updatedProjects.map(p => {
              if (p.id === oldParentId) {
                return {
                  ...p,
                  subProjects: (p.subProjects || []).filter(id => id !== projectData.id)
                };
              }
              return p;
            });
          }
          
          // Step 2: Add to new parent's subProjects list
          if (projectData.parentId) {
            updatedProjects = updatedProjects.map(p => {
              if (p.id === projectData.parentId) {
                return {
                  ...p,
                  subProjects: [...(p.subProjects || []), projectData.id]
                };
              }
              return p;
            });
          }
          
          // Step 3: Update this project with new path and other data
          updatedProjects = updatedProjects.map(p => {
            if (p.id === projectData.id) {
              return {
                ...projectData,
                path: newPath,
                level: newLevel,
                updatedAt: new Date()
              };
            }
            
            // Step 4: Update all descendants with new paths
            if (p.path && p.path.startsWith(`${projectToUpdate.path}/`)) {
              // Replace the old path prefix with the new one
              const newChildPath = p.path.replace(
                projectToUpdate.path, 
                newPath
              );
              const newChildLevel = calculateProjectLevel(newChildPath);
              
              return {
                ...p,
                path: newChildPath,
                level: newChildLevel
              };
            }
            
            return p;
          });
        }
        
        return updatedProjects;
      });
      
      return {
        ...projectData,
        updatedAt: new Date()
      };
    } else {
      // Simple update without hierarchy changes
      setProjects(projects.map(project => 
        project.id === projectData.id 
          ? { ...projectData, updatedAt: new Date() } 
          : project
      ));
      
      return {
        ...projectData,
        updatedAt: new Date()
      };
    }
  };

  const deleteProject = (projectId: string) => {
    // Find the project to be deleted
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;
    
    // Get all descendant project IDs (projects that have paths starting with this project's path)
    const descendantIds = projects
      .filter(p => p.path && p.path.startsWith(`${projectToDelete.path}/`))
      .map(p => p.id);
    
    // All IDs to delete (the project and its descendants)
    const idsToDelete = [projectId, ...descendantIds];
    
    // Update the parent's subProjects list
    setProjects(prevProjects => {
      let updatedProjects = [...prevProjects];
      
      if (projectToDelete.parentId) {
        updatedProjects = updatedProjects.map(p => {
          if (p.id === projectToDelete.parentId) {
            return {
              ...p,
              subProjects: (p.subProjects || []).filter(id => id !== projectId)
            };
          }
          return p;
        });
      }
      
      // Filter out the deleted projects
      return updatedProjects.filter(p => !idsToDelete.includes(p.id));
    });
  };

  const getProjectById = (projectId: string) => {
    return projects.find(project => project.id === projectId) || null;
  };

  const getProjectHierarchy = () => {
    // Root projects (without parents)
    const rootProjects = projects.filter(p => !p.parentId);
    
    // Helper function to build the hierarchy tree
    const buildHierarchy = (project: Project) => {
      const children = projects.filter(p => p.parentId === project.id);
      
      return {
        ...project,
        children: children.map(buildHierarchy)
      };
    };
    
    return rootProjects.map(buildHierarchy);
  };

  const getProjectDescendants = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.path) return [];
    
    return projects.filter(p => 
      p.id !== projectId && p.path && p.path.startsWith(`${project.path}/`)
    );
  };

  const getSubProjects = (projectId: string) => {
    return projects.filter(p => p.parentId === projectId);
  };

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectHierarchy,
    getProjectDescendants,
    getSubProjects
  };
}
