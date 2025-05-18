
import React from 'react';
import { TaskCard } from './TaskCard';
import { Task, Column } from '@/types/task';
import { useTaskContext } from '@/contexts/TaskContext';

interface TaskColumnProps {
  column: Column;
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

export function TaskColumn({ column, tasks, onEditTask }: TaskColumnProps) {
  const { moveTask } = useTaskContext();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceColumnId', column.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Set a half-second timeout to add a class to the dragged element
    setTimeout(() => {
      const element = document.querySelector(`[data-task-id="${taskId}"]`);
      if (element) {
        element.classList.add('opacity-50', 'border-dashed');
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId');
    
    // Clear dragging classes
    const element = document.querySelector(`[data-task-id="${taskId}"]`);
    if (element) {
      element.classList.remove('opacity-50', 'border-dashed');
    }
    
    // Don't do anything if we're dropping onto the same column
    if (sourceColumnId !== column.id) {
      moveTask(taskId, sourceColumnId, column.id);
    }
  };

  return (
    <div 
      className="kanban-column flex-1 min-w-[250px] border rounded-md bg-background overflow-hidden flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-4 font-medium border-b bg-secondary/20">
        <h3>{column.title} <span className="ml-2 text-xs rounded-full bg-secondary px-2 py-0.5">{tasks.length}</span></h3>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto max-h-[600px]">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            draggable 
            onDragStart={(e) => handleDragStart(e, task.id)}
          >
            <TaskCard 
              task={task} 
              onEdit={() => onEditTask(task)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
