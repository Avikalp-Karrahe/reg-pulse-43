import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const PresenterPanel = lazy(() => import('./PresenterPanel').then(module => ({ default: module.PresenterPanel })));

interface LazyPresenterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PresenterPanelLoadingSkeleton = () => (
  <div className="fixed right-0 top-0 h-full w-96 bg-background/95 backdrop-blur-sm border-l border-border shadow-2xl z-50 overflow-y-auto">
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-6 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export const LazyPresenterPanel = ({ isOpen, onClose }: LazyPresenterPanelProps) => {
  if (!isOpen) return null;
  
  return (
    <Suspense fallback={<PresenterPanelLoadingSkeleton />}>
      <PresenterPanel isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
};