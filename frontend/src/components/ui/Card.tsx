import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  value?: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'gray';
  children?: ReactNode;
  className?: string;
}

const colorClasses = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-50 text-gray-600'
};

export default function Card({ title, value, subtitle, icon, color = 'emerald', children, className = '' }: CardProps) {
  if (children) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
        {children}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
