import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StateMessage } from '@/components/common/StateMessage';
import {
  buildSliceString,
  firstFrameControls,
  isValidSliceControl,
  sliceControlsInitial,
} from './slice';
import {
  estimateBytes,
  estimateJsonTextBytes,
  estimateElements,
  humanBytes,
  DANGER_BYTES,
  WARN_BYTES,
} from './size';

export interface SliceFormProps {
  ndim: number;
  shape: number[];
  onSubmit: (slice: string | undefined) => void;
  /** Initial per-dimension controls (defaults to the whole array). */
  defaultControls?: string[];
  /** Bytes per element (from the array's data type), used for size estimates. */
  itemsize?: number;
}

/**
 * Inline prompt shown before array data is fetched. The user must choose a
 * slice (per-dimension index or numpy slice) or the entire array; no request is
 * sent until a choice is submitted.
 */
export function SliceForm({ ndim, shape, onSubmit, defaultControls, itemsize = 1 }: SliceFormProps) {
  const [controls, setControls] = useState<string[]>(
    () => defaultControls ?? sliceControlsInitial(ndim),
  );
  const invalidIndex = controls.findIndex((c) => !isValidSliceControl(c));

  const setControl = (i: number, value: string) => {
    setControls(controls.map((v, j) => (j === i ? value : v)));
  };

  const applyControls = (next: string[]) => {
    setControls(next);
    if (next.every((c) => isValidSliceControl(c))) {
      onSubmit(buildSliceString(next, ndim));
    }
  };

  const elements = estimateElements(controls, shape);
  const raw = elements === null ? null : estimateBytes(elements, itemsize);
  const json = elements === null ? null : estimateJsonTextBytes(elements, itemsize);
  const danger = raw !== null && raw >= DANGER_BYTES;
  const warn = raw !== null && !danger && raw >= WARN_BYTES;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">
          Request a slice of the array (or load it all)
        </Label>
        {ndim > 2 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyControls(firstFrameControls(ndim))}
          >
            First frame
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {Array.from({ length: ndim }, (_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">
              dim {i + 1}{shape[i] !== undefined ? ` (≤ ${shape[i] - 1})` : ''}
            </Label>
            <Input
              className="h-8 w-24 font-mono"
              value={controls[i] ?? ''}
              aria-label={`dim ${i + 1} slice`}
              placeholder=":"
              onChange={(e) => setControl(i, e.target.value)}
            />
          </div>
        ))}
      </div>
      {invalidIndex !== -1 ? (
        <StateMessage
          kind="error"
          title={`Invalid slice for dimension ${invalidIndex + 1}`}
          description="Use an index (e.g. 5) or a numpy slice (e.g. 1:8, :10, ::2)."
        />
      ) : null}
      <div className="flex flex-col gap-1">
        {raw !== null ? (
          <p data-testid="size-estimate" className="text-xs text-muted-foreground">
            ≈ {elements?.toLocaleString()} elements · {humanBytes(raw)} raw
            {json !== null ? ` · ~${humanBytes(json)} as JSON` : ''}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Request size unknown while the slice is incomplete.</p>
        )}
        {danger ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <span className="font-medium">Very large request — about {humanBytes(raw)}.</span>{' '}
            This will transfer a lot of data and may be slow or fail.
          </div>
        ) : warn ? (
          <div
            role="alert"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600"
          >
            <span className="font-medium">Large request — about {humanBytes(raw)}.</span> Loading
            this slice will transfer a lot of data.
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={invalidIndex !== -1}
          onClick={() => onSubmit(buildSliceString(controls, ndim))}
        >
          Load
        </Button>
      </div>
    </div>
  );
}

