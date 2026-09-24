import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface VizTypePickerProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  /** Optional map of option label -> tooltip text to render as disabled buttons. */
  disabledOptions?: Record<string, string>;
}

/** Small segmented control for choosing a visualization type. */
export function VizTypePicker({ options, value, onChange, disabledOptions }: VizTypePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map((opt) => {
        const disabled = opt in (disabledOptions ?? {});
        return (
          <Button
            key={opt}
            type="button"
            size="sm"
            variant={value === opt ? 'default' : 'outline'}
            className={cn(
              'h-7 px-2.5 text-xs disabled:pointer-events-none disabled:opacity-50',
              value !== opt && !disabled && 'text-muted-foreground',
            )}
            disabled={disabled}
            title={disabled ? disabledOptions?.[opt] : undefined}
            onClick={() => onChange(opt)}
          >
            {opt}
          </Button>
        );
      })}
    </div>
  );
}
