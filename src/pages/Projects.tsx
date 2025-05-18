
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Project, ProjectStatus } from '@/types/project';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock projects data for demo
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
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Build native mobile apps for iOS and Android platforms',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-06-30'),
    status: 'planning',
    priority: 'high',
    progress: 20,
    teamMembers: ['User 2', 'User 4'],
    createdBy: 'Admin User',
    createdAt: new Date('2025-01-15'),
  },
  {
    id: '3',
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
  },
  {
    id: '4',
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
  },
  {
    id: '5',
    name: 'Product Launch',
    description: 'Prepare and execute launch of new product line',
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-06-15'),
    status: 'on-hold',
    priority: 'high',
    progress: 45,
    teamMembers: ['User 1', 'User 5', 'User 7'],
    createdBy: 'Regular User',
    createdAt: new Date('2025-02-28'),
    updatedAt: new Date('2025-04-10'),
  },
];

const Projects = () => {
  const { t } = useTranslation(['common', 'projects']);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [projects, setProjects] = useState(mockProjects);

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
    setProjects(projects.filter(p => p.id !== projectId));
    toast.success(t('projectDeleted', { ns: 'projects' }));
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
          <Button className="w-full sm:w-auto">
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">{t('noProjectsFound', { ns: 'projects' })}</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Projects;
