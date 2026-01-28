import { clsx } from 'clsx';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  className?: string;
}

export function Avatar({ src, name, size = 'md', isOnline, className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={clsx('relative inline-flex', className)}>
      <div
        className={clsx(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 text-white font-semibold',
          {
            'w-8 h-8 text-xs': size === 'sm',
            'w-10 h-10 text-sm': size === 'md',
            'w-14 h-14 text-lg': size === 'lg',
          }
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            isOnline ? 'bg-green-500' : 'bg-gray-400',
            {
              'w-2.5 h-2.5': size === 'sm',
              'w-3 h-3': size === 'md',
              'w-4 h-4': size === 'lg',
            }
          )}
        />
      )}
    </div>
  );
}
