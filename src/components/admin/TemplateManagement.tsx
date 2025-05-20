import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Copy, ArrowRight } from 'lucide-react';
import { ProjectTemplate } from '@/types/project';

// Mock data
const mockTemplates: ProjectTemplate[] = [];

export const TemplateManagement = () => {
  const { t } = useTranslation(['admin', 'projects', 'common']);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter templates based on search term
  const filteredTemplates = mockTemplates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchTemplates', { ns: 'admin' })}
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="sm:w-auto w-full">
          <Plus className="mr-2 h-4 w-4" />
          {t('createTemplate', { ns: 'admin' })}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">{t('includedTasks', { ns: 'admin' })}</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {template.tasks.slice(0, 3).map((task, index) => (
                      <li key={index}>{task.name}</li>
                    ))}
                    {template.tasks.length > 3 && (
                      <li>+{template.tasks.length - 3} {t('moreTasks', { ns: 'admin' })}</li>
                    )}
                  </ul>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {t('createdBy', { ns: 'admin' })}: {template.createdBy}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <Button variant="outline" size="sm">
                <Copy className="mr-2 h-3 w-3" />
                {t('duplicate', { ns: 'admin' })}
              </Button>
              <Button size="sm">
                {t('useTemplate', { ns: 'projects' })}
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">{t('noTemplatesFound', { ns: 'admin' })}</p>
        </div>
      )}
    </div>
  );
};
