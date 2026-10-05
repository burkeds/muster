import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputSliderRangeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Slider label */
  label?: string;
  /** Lowest possible value */
  min: number;
  /** Greatest possible value */
  max: number;
  /** Current value of slider */
  value: [number, number];
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
  /** Is it allowed to have the min value equal the max value? */
  allowValueOverlap?: boolean;
  /** A function that is called with the newest value */
  onChange?: (value: [number, number]) => void;
  /** Should the slider be disabled? */
  isDisabled?: boolean;
}

/** A range slider with two thumbs for selecting a min-max interval. */
export function InputSliderRange({
  label,
  min,
  max,
  value,
  units,
  shorthandUnits,
  marks,
  step = 1,
  allowValueOverlap = false,
  showSideInput = true,
  onChange = () => {},
  isDisabled = false,
  className = '',
  ...props
}: InputSliderRangeProps) {
  const thumbWidth = 16; // pixels

  const handleInputChange = (index: 0 | 1, newValue: number) => {
    let clampedValue = newValue;
    if (clampedValue < min) clampedValue = min;
    if (clampedValue > max) clampedValue = max;
    
    const newRange: [number, number] = [...value];
    newRange[index] = clampedValue;
    
    if (allowValueOverlap) {
      if (newRange[0] > newRange[1]) return;
    } else {
      if (newRange[0] >= newRange[1]) return;
    }
    
    onChange(newRange);
  };

  const handleDrag = (index: 0 | 1, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    handleInputChange(index, Number(e.target.value));
  };

  const handleChange = (index: 0 | 1, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    handleInputChange(index, Number(e.target.value));
  };

  const calculatePositionStyle = (val: number) => {
    return `calc(${((val - min) / (max - min)) * 100}% + ${-((val - min) / (max - min)) * thumbWidth + thumbWidth / 2}px)`;
  };

  const calculateTrackWidthStyle = (range: [number, number]) => {
    const maxValue = Math.max(range[0], range[1]);
    const minValue = Math.min(range[0], range[1]);
    return `calc(${((maxValue - minValue) / (max - min)) * 100}% + ${-((maxValue - minValue) / (max - min)) * thumbWidth}px)`;
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
        'flex items-center pt-4 pb-4 pr-2 min-h-12 group w-full min-w-96',
        className,
      )}
      {...props}
    >
      {label && <label className="font-medium text-gray-700 w-fit pr-2">{label}</label>}

      {showSideInput && (
        <div className="w-fit pl-2 text-gray-700 flex justify-center items-center">
          <input
            type="number"
            value={value[0]}
            className="text-center text-md w-12 border appearance-none bg-white/50"
            onChange={(e) => handleChange(0, e)}
            disabled={isDisabled}
          />
          {units && <p className="pl-1">{units}</p>}
        </div>
      )}

      <div className="relative flex-grow mx-2">
        <div className="w-full absolute top-0 left-0">
          <div className="flex-grow flex items-center relative">
            <input
              type="range"
              min={min}
              max={max}
              value={value[0]}
              step={step}
              onChange={(e) => handleDrag(0, e)}
              disabled={isDisabled}
              style={{ pointerEvents: 'none' }}
              className="range-slider appearance-none w-full absolute z-10 hover:cursor-pointer bg-slate-400/50 h-2 rounded-lg focus:outline-none"
            />
            <div
              className="absolute z-0 -top-8 w-12 h-24"
              style={{ left: calculatePositionStyle(value[0]) }}
            >
              <div className="relative">
                <div className="absolute w-[0] h-4 top-1 bg-gray-400"></div>
                <div className="absolute -translate-x-1/2 left-2 -top-0">
                  <input
                    type="number"
                    value={value[0]}
                    className="w-16 text-center text-xs appearance-none bg-transparent py-[1px] group-hover:border border-slate-400"
                    onChange={(e) => handleChange(0, e)}
                    disabled={isDisabled}
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
        </div>

        <div className="w-full absolute top-0 left-0">
          <div className="flex-grow flex items-center relative">
            <input
              type="range"
              min={min}
              max={max}
              value={value[1]}
              step={step}
              onChange={(e) => handleDrag(1, e)}
              disabled={isDisabled}
              style={{ pointerEvents: 'none' }}
              className="range-slider appearance-none w-full absolute z-10 hover:cursor-pointer bg-transparent h-2 rounded-lg focus:outline-none"
            />
            <style>{`
              .range-slider::-webkit-slider-thumb {
                pointer-events: auto;
              }
              .range-slider::-moz-range-thumb {
                pointer-events: auto;
              }
            `}</style>
            <div
              className="absolute z-0 -top-8 w-12 h-24"
              style={{ left: calculatePositionStyle(value[1]) }}
            >
              <div className="relative">
                <div className="absolute w-[0] h-4 top-1 bg-gray-400"></div>
                <div className="absolute -translate-x-1/2 left-2 -top-0">
                  <input
                    type="number"
                    value={value[1]}
                    className="w-16 text-center text-xs appearance-none bg-transparent py-[1px] group-hover:border border-slate-400"
                    onChange={(e) => handleChange(1, e)}
                    disabled={isDisabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <span
          className="absolute z-0 top-0 h-2 bg-blue-700/80 -translate-y-1/2"
          style={{
            left: calculatePositionStyle(Math.min(value[0], value[1])),
            width: calculateTrackWidthStyle(value),
          }}
        ></span>
      </div>

      {showSideInput && (
        <div className="w-fit pl-2 text-gray-700 flex justify-center items-center">
          <input
            type="number"
            value={value[1]}
            className="text-center text-md w-12 border appearance-none bg-white/50"
            onChange={(e) => handleChange(1, e)}
            disabled={isDisabled}
          />
          {units && <p className="pl-1">{units}</p>}
        </div>
      )}
    </div>
  );
}
