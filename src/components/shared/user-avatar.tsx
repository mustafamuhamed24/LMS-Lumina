import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, initials, initialsColor } from '@/lib/utils';

export function UserAvatar({
  name,
  avatarUrl,
  id,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  id?: string;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className={cn('text-xs font-semibold', initialsColor(id ?? name))}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
