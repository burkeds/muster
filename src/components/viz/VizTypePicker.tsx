import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface VizTypePickerProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

/** Small segmented control for choosing a visualization type. */
export function VizTypePicker({ options, value, onChange }: VizTypePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map((opt) => (
        <Button
          key={opt}
          type="button"
          size="sm"
          variant={value === opt ? 'default' : 'outline'}
          className={cn('h-7 px-2.5 text-xs', value !== opt && 'text-muted-foreground')}
          onClick={() => onChange(opt)}
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}
