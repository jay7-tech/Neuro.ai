'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/lib/api-client';

/** Renders loading / error / data states uniformly for any query. */
export function QueryState<T>({
  query,
  children,
  skeleton = <Skeleton className="h-32 w-full" />,
}: {
  query: UseQueryResult<T>;
  children: (data: T) => React.ReactNode;
  skeleton?: React.ReactNode;
}) {
  if (query.isPending) return <>{skeleton}</>;
  if (query.isError) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
        <span className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" /> {errorMessage(query.error)}
        </span>
        <Button size="sm" variant="ghost" onClick={() => query.refetch()}>
          <RefreshCw className="mr-1 h-3 w-3" /> Retry
        </Button>
      </div>
    );
  }
  return <>{children(query.data)}</>;
}

export function EmptyState({ icon: Icon, title, children }: { icon?: React.ElementType; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
      {Icon && <Icon className="h-8 w-8" />}
      <p className="font-medium text-foreground">{title}</p>
      {children}
    </div>
  );
}
