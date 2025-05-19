
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Project, ProjectStatus, ProjectPriority } from '@/types/project';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { useProjectsData } from '@/hooks/useProjectsData';

const Projects = () => {
  const { t } = useTranslation(['common', 'projects']);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const { projects, addProject, updateProject, deleteProject } = useProjectsData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Filter projects based on search term and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
                        
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as ProjectStatus | 'all');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
    toast.success(t('projectDeleted', { ns: 'projects' }));
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('myProjects', { ns: 'projects' })}</h1>
            <p className="text-muted-foreground mt-2">
              {t('manageProjects', { ns: 'projects' })}
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={handleCreateProject}>
            <Plus className="mr-2 h-4 w-4" />
            {t('createProject', { ns: 'projects' })}
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchProjects', { ns: 'projects' })}
              className="pl-8"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <Select defaultValue="all" onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder={t('status', { ns: 'projects' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses', { ns: 'projects' })}</SelectItem>
              <SelectItem value="planning">{t('planning', { ns: 'projects' })}</SelectItem>
              <SelectItem value="active">{t('active', { ns: 'projects' })}</SelectItem>
              <SelectItem value="on-hold">{t('onHold', { ns: 'projects' })}</SelectItem>
              <SelectItem value="completed">{t('completed', { ns: 'projects' })}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={() => handleDeleteProject(project.id)}
                onEdit={() => handleEditProject(project)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">{t('noProjectsFound', { ns: 'projects' })}</p>
          </div>
        )}

        <ProjectDialog 
          isOpen={isDialogOpen} 
          onClose={handleCloseDialog} 
          editingProject={editingProject} 
          projects={projects}
          onSave={(project) => {
            if (editingProject) {
              updateProject(project);
              toast.success(t('projectUpdated', { ns: 'projects' }));
            } else {
              addProject(project);
              toast.success(t('projectCreated', { ns: 'projects' }));
            }
            setIsDialogOpen(false);
          }}
        />
      </div>
    </MainLayout>
  );
};

export default Projects;
