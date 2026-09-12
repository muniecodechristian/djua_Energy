import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
  size?: 'normal' | 'sm';
}

export function Button({
  title,
  variant = 'primary',
  isLoading,
  disabled,
  icon,
  size = 'normal',
  className = '',
  ...props
}: ButtonProps) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <span
          className="spinner"
          style={
            variant !== 'primary' ? { borderTopColor: 'var(--brand)', borderColor: 'rgba(255,92,0,.2)' } : {}
          }
        />
      ) : (
        <>
          {icon && <span style={{ display: 'flex' }}>{icon}</span>}
          {title}
        </>
      )}
    </button>
  );
}
