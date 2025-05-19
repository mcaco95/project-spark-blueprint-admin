import React from 'react';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project } from "@/types/project";
import { Task } from "@/types/task";
import { ensureTaskType } from "./useTaskTypeSetter";

const initialProjects: Project[] = [
  {
    id: "p1",
    name: "Website Redesign",
    description: "Redesign the company website with modern UI/UX principles",
    status: "active",
    priority: "high",
    progress: 65,
    startDate: new Date("2024-02-15"),
    endDate: new Date("2024-07-20"),
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-05-05"),
    createdBy: "Jane Smith",
    teamMembers: ["Jane Smith", "Mike Johnson", "Sarah Lee", "David Kim"],
    tasks: [
      {
        id: "t1",
        title: "Wireframe approval",
        assignees: ["Jane Smith"],
        dueDate: new Date("2024-04-28"),
        status: "completed",
        taskType: "task"
      },
      {
        id: "t2",
        title: "Homepage development",
        assignees: ["Mike Johnson"],
        dueDate: new Date("2024-05-15"),
        status: "in-progress",
        taskType: "task"
      },
      {
        id: "t3",
        title: "Content migration",
        assignees: ["Sarah Lee"],
        dueDate: new Date("2024-06-01"),
        status: "todo",
        taskType: "task"
      }
    ],
    tags: ["design", "development", "high-priority"],
    comments: []
  },
  {
    id: "p2",
    name: "Mobile App Development",
    description: "Create a native mobile app for iOS and Android platforms",
    status: "planning",
    priority: "medium",
    progress: 25,
    startDate: new Date("2024-04-01"),
    endDate: new Date("2024-09-30"),
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-04-10"),
    createdBy: "Robert Chen",
    teamMembers: ["Robert Chen", "Emma Wilson", "James Taylor"],
    tasks: [
      {
        id: "t4",
        title: "Requirements gathering",
        assignees: ["Robert Chen"],
        dueDate: new Date("2024-04-15"),
        status: "completed",
        taskType: "task"
      },
      {
        id: "t5",
        title: "UI design",
        assignees: ["Emma Wilson"],
        dueDate: new Date("2024-05-10"),
        status: "todo",
        taskType: "task"
      }
    ],
    tags: ["mobile", "development"],
    comments: []
  },
  {
    id: "p3",
    name: "Marketing Campaign",
    description: "Q3 digital marketing campaign for product launch",
    status: "active",
    priority: "high",
    progress: 40,
    startDate: new Date("2024-04-15"),
    endDate: new Date("2024-08-15"),
    createdAt: new Date("2024-04-10"),
    updatedAt: new Date("2024-05-01"),
    createdBy: "Lisa Johnson",
    teamMembers: ["Lisa Johnson", "Mark Williams", "Anna Brown"],
    tasks: [
      {
        id: "t6",
        title: "Content strategy",
        assignees: ["Lisa Johnson"],
        dueDate: new Date("2024-05-01"),
        status: "in-progress",
        taskType: "task"
      },
      {
        id: "t7",
        title: "Social media planning",
        assignees: ["Mark Williams"],
        dueDate: new Date("2024-05-15"),
        status: "todo",
        taskType: "task"
      }
    ],
    tags: ["marketing", "high-priority"],
    comments: []
  },
  {
    id: "p4",
    name: "Product Roadmap",
    description: "Strategic planning for product development in the next 12 months",
    status: "planning",
    priority: "medium",
    progress: 15,
    startDate: new Date("2024-05-01"),
    createdAt: new Date("2024-04-25"),
    createdBy: "Michael Davis",
    teamMembers: ["Michael Davis", "Jennifer White", "Daniel Brown"],
    tasks: [
      {
        id: "t8",
        title: "Market research",
        assignees: ["Jennifer White"],
        dueDate: new Date("2024-05-20"),
        status: "todo",
        taskType: "task"
      }
    ],
    tags: ["strategy", "planning"],
    comments: []
  },
  {
    id: "p5",
    name: "Office Renovation",
    description: "Redesign of the main office workspace",
    status: "on-hold",
    priority: "low",
    progress: 10,
    startDate: new Date("2024-06-15"),
    endDate: new Date("2024-08-30"),
    createdAt: new Date("2024-03-20"),
    updatedAt: new Date("2024-04-15"),
    createdBy: "Thomas Moore",
    teamMembers: ["Thomas Moore", "Rebecca Martinez"],
    tasks: [
      {
        id: "t9",
        title: "Budget approval",
        assignees: ["Thomas Moore"],
        dueDate: new Date("2024-05-30"),
        status: "todo",
        taskType: "task"
      },
      {
        id: "t10",
        title: "Contractor selection",
        assignees: ["Rebecca Martinez"],
        dueDate: new Date("2024-06-10"),
        status: "todo",
        taskType: "task"
      }
    ],
    tags: ["facilities", "renovation"],
    comments: []
  },
  {
    id: "p6",
    name: "Annual Report",
    description: "Preparation of the annual financial and performance report",
    status: "completed",
    priority: "high",
    progress: 100,
    startDate: new Date("2024-01-10"),
    endDate: new Date("2024-03-31"),
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-03-31"),
    createdBy: "Catherine Lewis",
    teamMembers: ["Catherine Lewis", "Edward Green", "Olivia King"],
    tasks: [
      {
        id: "t11",
        title: "Financial data compilation",
        assignees: ["Edward Green"],
        dueDate: new Date("2024-02-15"),
        status: "completed",
        taskType: "task"
      },
      {
        id: "t12",
        title: "Executive summary",
        assignees: ["Catherine Lewis"],
        dueDate: new Date("2024-03-15"),
        status: "completed",
        taskType: "task"
      }
    ],
    tags: ["finance", "reporting"],
    comments: []
  }
];

/**
 * Helper function to ensure all task objects have the required taskType property
 * @param task A task object that might be missing the taskType field
 * @returns The same task with a taskType field added if it was missing
 */
export function ensureTaskType(task: Partial<Task>): Task {
  // If the task already has a taskType, use it
  if (task.taskType) {
    return task as Task;
  }
  
  // Determine the task type based on properties
  let taskType: 'task' | 'meeting' = 'task';
  
  // If the task has date, time and duration, it's likely a meeting
  if (task.date && task.time && task.duration) {
    taskType = 'meeting';
  } 
  // If it has a dueDate, it's a regular task
  else if (task.dueDate) {
    taskType = 'task';
  }
  
  return {
    ...task,
    taskType,
    assignees: task.assignees || []
  } as Task;
}

/**
 * Adds taskType to each task in an array
 * @param tasks Array of tasks that might be missing taskType field
 * @returns The same array with taskType added to each task
 */
export function ensureTasksHaveType(tasks: Partial<Task>[]): Task[] {
  return tasks.map(task => ensureTaskType(task));
}

/**
 * Makes a single change to the application's task model:
 * Applied when we know the task model has changed and existing code might still be
 * using the old model. This should be a temporary solution until all code is updated.
 */
export function patchTaskModel() {
  // Get the Task interface from the type system
  const originalCreateElement = React.createElement;
  
  // Override createElement to patch task objects before they're passed to components
  React.createElement = function(type: any, props: any, ...children: any[]) {
    if (props && props.task && typeof props.task === 'object' && !props.task.taskType) {
      props = {
        ...props,
        task: ensureTaskType(props.task)
      };
    }
    
    return originalCreateElement(type, props, ...children);
  };
}

// Create the hook that provides project data
export function useProjectsData() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const getProjectById = (projectId: string): Project | undefined => {
    return projects.find(project => project.id === projectId);
  };

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
      comments: [],
      progress: 0
    };

    setProjects(prevProjects => [...prevProjects, newProject]);
    return newProject;
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === updatedProject.id 
          ? { ...updatedProject, updatedAt: new Date() } 
          : project
      )
    );
  };

  const deleteProject = (projectId: string) => {
    setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
  };

  return {
    projects,
    getProjectById,
    addProject,
    updateProject,
    deleteProject
  };
}
