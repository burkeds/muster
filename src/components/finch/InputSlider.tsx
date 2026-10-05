import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputSliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Slider label */
  label?: string;
  /** Lowest possible value */
  min: number;
  /** Greatest possible value */
  max: number;
  /** Current value of slider */
  value: number;
  /** Unit type */
  units?: string;
  /** An extra unit label underneath the min/max tickmark value */
  shorthandUnits?: string;
  /** Should we show the input box on the right of the slider? */
  showSideInput?: boolean;
  /** An array representing where vertical tick marks should be */
  marks?: number[];
  /** The spacing between snap points for the slider thumb, defaults to 1 */
  step?: number;
  /** Should the input bar be filled up with blue color up to the thumb? */
  showFill?: boolean;
  /** A function that is called with the newest value */
  onChange?: (value: number) => void;
}

/** A slider input with optional labels, tick marks, and side numeric input. */
export function InputSlider({
  label,
  min,
  max,
  value,
  units,
  shorthandUnits,
  marks,
  step = 1,
  showFill = false,
  showSideInput = true,
  onChange = () => {},
  className = '',
  ...props
}: InputSliderProps) {
  const thumbWidth = 16; // pixels

  const handleInputChange = (newValue: number) => {
    let clampedValue = newValue;
    if (clampedValue < min) clampedValue = min;
    if (clampedValue > max) clampedValue = max;
    onChange(clampedValue);
  };

  const handleDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(Number(e.target.value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(Number(e.target.value));
  };

  const generateLeftOffsetString = (mark: number) => {
    return `calc(${((mark - min) / (max - min)) * 100}% + ${-((mark - min) / (max - min)) * thumbWidth + thumbWidth / 2}px)`;
  };

  const isIndexFirstOrLast = (array: number[], index: number): boolean => {
    return index === 0 || index === array.length - 1;
  };

  return (
    <div
      className={cn(
        'flex items-center pt-4 pb-4 pr-2 min-h-12 group min-w-96 w-full',
        className,
      )}
      {...props}
    >
      {label && <label className="font-medium text-gray-700 w-fit pr-2">{label}</label>}

      <div className="flex-grow flex items-center relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          step={step}
          onChange={handleDrag}
          className={cn(
            'w-full absolute z-10 hover:cursor-pointer bg-slate-400/50 h-2 rounded-lg focus:outline-none appearance-none',
            showFill && 'appearance-auto'
          )}
        />
        <div
          className="absolute z-0 -top-8 w-12 h-24"
          style={{ left: generateLeftOffsetString(value) }}
        >
          <div className="relative">
            <div className="absolute w-[0] h-4 top-1 bg-gray-400"></div>
            <div className="absolute -translate-x-1/2 left-2 -top-0">
              <input
                type="number"
                value={value}
                className="w-16 text-center text-xs appearance-none bg-transparent py-[1px] group-hover:border border-slate-400"
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        {marks && (
          <div className="absolute z-0 w-full">
            {marks.map((mark, index) => (
              <div
                key={index}
                className="absolute -top-2 w-[1px] h-4 bg-gray-400"
                style={{ left: generateLeftOffsetString(mark) }}
              >
                {isIndexFirstOrLast(marks, index) && (
                  <p className="absolute text-center text-xs top-2 -translate-x-1/2 translate-y-full whitespace-nowrap">
                    {mark} {shorthandUnits}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {(!marks || !marks.includes(min)) && (
          <div
            className="absolute -top-2 w-[1px] h-4 bg-gray-400"
            style={{ left: generateLeftOffsetString(min) }}
          >
            <p className="absolute text-center text-xs top-2 -translate-x-1/2 translate-y-full whitespace-nowrap">
              {min} {shorthandUnits}
            </p>
          </div>
        )}
        {(!marks || !marks.includes(max)) && (
          <div
            className="absolute -top-2 w-[1px] h-4 bg-gray-400"
            style={{ left: generateLeftOffsetString(max) }}
          >
            <p className="absolute text-center text-xs top-2 -translate-x-1/2 translate-y-full whitespace-nowrap">
              {max} {shorthandUnits}
            </p>
          </div>
        )}
      </div>

      {showSideInput && (
        <div className="w-fit pl-2 text-gray-700 flex justify-center items-center">
          <input
            type="number"
            value={value}
            className="text-center text-md w-12 border appearance-none bg-white/50"
            onChange={handleChange}
          />
          {units && <p className="pl-1">{units}</p>}
        </div>
      )}
    </div>
  );
}
