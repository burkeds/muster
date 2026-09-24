import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  offset: number;
  limit: number;
  total: number;
  onOffsetChange: (offset: number) => void;
}

/** Offset/limit pagination with previous/next and a summary. */
export function Pagination({ offset, limit, total, onOffsetChange }: PaginationProps) {
  const maxOffset = Math.max(0, total - 1);
  const page = offset === 0 ? 1 : Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
      <span>
        Showing {offset + 1}–{Math.min(offset + limit, total)} of {total} · page {page}/{totalPages}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          disabled={!hasPrev}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOffsetChange(Math.min(maxOffset, offset + limit))}
          disabled={!hasNext}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
