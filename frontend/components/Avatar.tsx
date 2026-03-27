import { getInitials, getAvatarColor } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Avatar({ name, size = 'md' }: AvatarProps) {
  const bgColor = getAvatarColor(name || 'Unknown User');
  const initials = getInitials(name || 'U U').slice(0, 2);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-32 h-32 text-4xl'
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-white/20 uppercase tracking-wider string shrink-0 ${sizeClasses[size]}`}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
}
