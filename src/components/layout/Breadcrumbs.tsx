import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbsProps {
  segments: string[];
  /** Base path the breadcrumb links resolve under (e.g. /browse). */
  base?: string;
  /** Current path is not a link (e.g. when viewing a node detail). */
  currentIsLeaf?: boolean;
}

/** Navigation breadcrumbs for a browse path. */
export function Breadcrumbs({ segments, base = '/browse', currentIsLeaf }: BreadcrumbsProps) {
  const crumbs = segments.map((seg, i) => {
    const path = segments.slice(0, i + 1).join('/');
    return { label: seg, path };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to={base} className="inline-flex items-center gap-1 hover:text-foreground">
        <Home className="h-4 w-4" />
        Home
      </Link>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.path} className="inline-flex items-center gap-1">
            <ChevronRight className="h-4 w-4" />
            {isLast && currentIsLeaf ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                to={`${base}/${crumb.path}`}
                className={cn('hover:text-foreground', isLast && 'font-medium text-foreground')}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
