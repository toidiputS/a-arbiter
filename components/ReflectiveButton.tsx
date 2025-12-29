import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export const ReflectiveButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  className = '',
  disabled,
  ...props
}) => {
  let variantClass = '';
  switch(variant) {
    case 'primary':
      variantClass = 'btn-reflect-primary';
      break;
    case 'secondary':
      variantClass = 'btn-reflect-secondary';
      break;
    case 'ghost':
      variantClass = 'btn-reflect-ghost';
      break;
    default:
      variantClass = 'btn-reflect-primary';
  }

  // Combine base class + variant class + any custom classes
  const finalClass = variant === 'ghost'
    ? `${variantClass} ${className}`
    : `btn-reflect-base ${variantClass} ${className}`;

  return (
    <button
      className={finalClass}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          {/* Simple Loading Spinner SVG */}
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          PROCESSING
        </span>
      ) : children}
    </button>
  );
};