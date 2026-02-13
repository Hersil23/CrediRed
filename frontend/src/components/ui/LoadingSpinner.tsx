export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-3 border-gray-300 border-t-emerald-500`} />
    </div>
  );
}
