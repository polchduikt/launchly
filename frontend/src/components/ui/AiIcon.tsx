import React from 'react';

export interface AiIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
}
export const AiIcon: React.FC<AiIconProps> = ({
  size = 24,
  strokeWidth = 2,
  className = '',
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="7" y="7" width="10" height="10" rx="2.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M9 7V3.5" />
      <path d="M15 7V3.5" />
      <path d="M9 20.5V17" />
      <path d="M15 20.5V17" />
      <path d="M7 9H3.5" />
      <path d="M7 15H3.5" />
      <path d="M20.5 9H17" />
      <path d="M20.5 15H17" />
    </svg>
  );
};

export default AiIcon;
