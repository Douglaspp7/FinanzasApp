import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string | null; name?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-xl',
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return <img src={src} alt={name ?? 'avatar'} className={cn('rounded-full object-cover', sizeMap[size], className)} />
  }
  return (
    <div className={cn('flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary', sizeMap[size], className)}>
      {name ? getInitials(name) : '?'}
    </div>
  )
}
