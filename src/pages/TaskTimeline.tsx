
import { MainLayout } from '@/components/layout/MainLayout';

const TaskTimeline = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timeline</h1>
          <p className="text-muted-foreground mt-2">
            Weekly overview of tasks and deadlines
          </p>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Timeline view coming soon</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default TaskTimeline;
