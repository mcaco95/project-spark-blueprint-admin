
import { MainLayout } from '@/components/layout/MainLayout';

const TaskKanban = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground mt-2">
            Drag and drop tasks between columns
          </p>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Kanban board coming soon</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default TaskKanban;
