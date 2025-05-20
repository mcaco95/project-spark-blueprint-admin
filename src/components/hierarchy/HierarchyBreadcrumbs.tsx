
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HierarchyBreadcrumbsProps {
  path: string[];
  onNavigate: (path: string[], index: number) => void;
  className?: string;
}

export function HierarchyBreadcrumbs({ path, onNavigate, className }: HierarchyBreadcrumbsProps) {
  return (
    <div className={cn('flex items-center overflow-x-auto', className)}>
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center h-8 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => onNavigate([], -1)}
      >
        <Home className="h-4 w-4 mr-1" />
      </Button>
      
      {path.length > 0 && (
        <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground flex-shrink-0" />
      )}
      
      {path.map((item, index) => (
        <React.Fragment key={index}>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              'h-8 px-2 truncate max-w-[200px]',
              index === path.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onNavigate(path.slice(0, index + 1), index)}
          >
            {item}
          </Button>
          {index < path.length - 1 && (
            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
