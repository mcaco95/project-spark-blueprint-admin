import { Link } from 'react-router-dom';
import { Project } from '@/types/project';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  CalendarIcon, 
  Trash2, 
  Edit,
  Clock 
} from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { es, enUS } from 'date-fns/locale';

interface ProjectCardProps {
  project: Project;
  onDelete: () => void;
  onEdit: () => void;
}

const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'on-hold': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function ProjectCard({ project, onDelete, onEdit }: ProjectCardProps) {
  const { t, i18n } = useTranslation(['common', 'projects']);
  const locale = i18n.language === 'es' ? es : enUS;

  const formatDate = (dateInput: Date | string) => {
    if (!dateInput) return '';
    try {
      let dateObj: Date;
      
      if (typeof dateInput === 'string') {
        // Handle string dates
        if (dateInput.includes('T')) {
          // For ISO strings, create a new date using UTC components
          const tempDate = new Date(dateInput);
          dateObj = new Date(
            tempDate.getUTCFullYear(),
            tempDate.getUTCMonth(),
            tempDate.getUTCDate(),
            12 // Set to noon to avoid any timezone issues
          );
        } else {
          // For YYYY-MM-DD format
          dateObj = new Date(dateInput);
        }
      } else {
        // For Date objects, create a new date using UTC components
        dateObj = new Date(
          dateInput.getUTCFullYear(),
          dateInput.getUTCMonth(),
          dateInput.getUTCDate(),
          12 // Set to noon to avoid any timezone issues
        );
      }
      
      return format(dateObj, 'PP', { locale });
    } catch (e) {
      console.error("Error formatting date:", dateInput, e);
      return String(dateInput);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning':
        return t('planning', { ns: 'projects' });
      case 'active':
        return t('active', { ns: 'projects' });
      case 'completed':
        return t('completed', { ns: 'projects' });
      case 'on-hold':
        return t('onHold', { ns: 'projects' });
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low':
        return t('low', { ns: 'projects' });
      case 'medium':
        return t('medium', { ns: 'projects' });
      case 'high':
        return t('high', { ns: 'projects' });
      default:
        return priority;
    }
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge className={statusColors[project.status]}>
            {getStatusLabel(project.status)}
          </Badge>
          <Badge variant="outline" className={priorityColors[project.priority]}>
            {getPriorityLabel(project.priority)}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-2">
          <Link 
            to={`/projects/${project.id}`} 
            className="hover:text-primary transition-colors"
          >
            {project.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description || t('noDescription', { ns: 'projects' })}
        </p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('progress', { ns: 'projects' })}</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        
        <div className="flex flex-col space-y-1.5 text-sm">
          <div className="flex items-center text-muted-foreground">
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            <span>
              {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : t('ongoing', { ns: 'projects' })}
            </span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="mr-2 h-3.5 w-3.5" />
            <span>
              {t('createdOn', { ns: 'projects' })}: {formatDate(project.createdAt)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 flex justify-between items-center">
        <div className="flex -space-x-2">
          {project.teamMembers.slice(0, 3).map((member, index) => (
            <Avatar key={index} className="border-2 border-background h-7 w-7">
              <AvatarFallback className="text-xs">
                {member.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {project.teamMembers.length > 3 && (
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-medium">
              +{project.teamMembers.length - 3}
            </div>
          )}
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
