import * as React from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface WidgetProps {
  /** Content to be displayed below the header */
  children?: React.ReactNode;
  /** The title of the widget */
  title?: string;
  /** An icon that can be any valid jsx (SVG, PNG, etc) */
  icon?: React.ReactNode;
  /** Tailwind ClassName only applied when expand icon is not active*/
  defaultHeight?: string;
  /** Tailwind ClassName */
  minHeight?: string;
  /** Tailwind ClassName */
  maxHeight?: string;
  /** Tailwind ClassName */
  minWidth?: string;
  /** Tailwind ClassName */
  width?: string;
  /** Tailwind ClassName */
  maxWidth?: string;
  /** Tailwind ClassName applied only when user clicks expand icon */
  expandedWidth?: string;
  /** Additional Tailwind ClassName styles applied only to the content */
  contentStyles?: string;
  /** Additional CSS classes for the root container. */
  className?: string;
}

/** A framed dashboard widget with a header, icon, title, and expand/collapse control. */
export function Widget({
  children,
  title = '',
  icon,
  defaultHeight = 'h-64',
  minHeight = 'min-h-64',
  maxHeight = 'max-h-3/4',
  minWidth = 'min-w-64',
  width = 'w-1/4',
  maxWidth = 'max-w-full',
  expandedWidth = 'w-full',
  contentStyles = '',
  className,
  ...props
}: WidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const arrowsPointingIn = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
      />
    </svg>
  );

  const arrowsPointingOut = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );

  return (
    <div
      className={cn(
        'p-2 rounded-md transition-all duration-300',
        defaultHeight,
        minHeight,
        maxHeight,
        minWidth,
        isExpanded ? expandedWidth : `${width} ${maxWidth}`,
        className
      )}
      {...props}
    >
      <div className="w-full h-full shadow-md bg-white rounded-md border flex flex-col overflow-hidden text-slate-800">
        <header className="bg-sky-950 h-10 shrink-0 flex items-center px-4 justify-between text-white">
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="h-5 w-5 flex items-center justify-center shrink-0">{icon}</div>}
            <h3 className="text-sm font-semibold truncate uppercase tracking-tight">{title}</h3>
          </div>
          <button
            type="button"
            className="hover:text-sky-300 transition-colors focus:outline-none"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? arrowsPointingIn : arrowsPointingOut}
          </button>
        </header>

        <div className={cn('flex-1 min-h-0 overflow-auto p-4', contentStyles)}>
          {children}
        </div>
      </div>
    </div>
  );
}
