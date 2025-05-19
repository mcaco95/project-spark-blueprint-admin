import React from 'react';
import { Task } from "@/types/task";

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
