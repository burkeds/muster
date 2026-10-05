import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonWithIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Text content displayed inside the button alongside the icon */
  text?: string;
  /** JSX element displayed as an icon */
  icon: React.ReactNode;
  /** Controls whether the icon appears on the left or right side of the text */
  iconPosition?: 'left' | 'right';
  /** Controls the overall size of the button */
  size?: 'small' | 'medium' | 'large';
  /** Changes button style to transparent background with border and black text when true */
  isSecondary?: boolean;
  /** Renders the button in a pressed/active state */
  active?: boolean;
  /** Additional CSS classes applied to the button text element */
  classNameText?: string;
  /** Additional CSS classes applied to the icon element */
  classNameIcon?: string;
  /** Legacy callback function, use onClick instead */
  cb?: () => void;
}

const buttonVariants = {
  primary: 'bg-sky-500 hover:bg-sky-600 text-white',
  primaryActive: 'bg-sky-700 text-white hover:bg-sky-800',
  secondary: 'bg-white/50 hover:bg-slate-200 text-black border',
  secondaryActive: 'bg-slate-200 text-black border hover:bg-slate-300',
};

const getButtonClasses = (active: boolean | undefined, isSecondary: boolean | undefined) => {
  if (active && isSecondary) return buttonVariants.secondaryActive;
  if (active) return buttonVariants.primaryActive;
  if (isSecondary) return buttonVariants.secondary;
  return buttonVariants.primary;
};

const textSizes = {
  small: 'text-sm',
  medium: 'text-md',
  large: 'text-2xl',
};

const iconSizes = {
  small: 'w-4',
  medium: 'w-6',
  large: 'w-8',
};

const paddingSizes = {
  small: 'px-3 py-1',
  medium: 'px-3 py-2',
  large: 'px-6 py-3',
};

const spacingSizes = {
  small: 'space-x-1',
  medium: 'space-x-2',
  large: 'space-x-4',
};

/** Button containing an icon and optional text. */
export function ButtonWithIcon({
  cb,
  onClick,
  text = '',
  disabled = false,
  icon,
  iconPosition = 'left',
  size = 'medium',
  isSecondary,
  active,
  className,
  classNameText,
  classNameIcon,
  ...props
}: ButtonWithIconProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (cb) cb();
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  const Icon = (
    <div
      className={cn(
        `${iconSizes[size]} ${isSecondary ? 'text-black' : 'text-white'} aspect-square flex items-center justify-center`,
        classNameIcon,
      )}
    >
      {icon}
    </div>
  );

  return (
    <button
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        `${getButtonClasses(active, isSecondary)} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${textSizes[size]} ${paddingSizes[size]} rounded-lg font-medium w-fit`,
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      <div className={cn('flex justify-center items-center', spacingSizes[size])}>
        {iconPosition === 'left' ? Icon : null}
        <span className={classNameText}>{text}</span>
        {iconPosition === 'right' ? Icon : null}
      </div>
    </button>
  );
}
