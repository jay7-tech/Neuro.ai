'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api-client';
import { useTheme } from './theme-provider';

export function UserMenu({ name, email, roleLabel }: { name: string; email: string; roleLabel: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();

  const signOut = async () => {
    await api.post('/auth/logout').catch(() => undefined);
    qc.clear();
    router.replace('/');
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2" aria-label="Account menu">
          <UserRound className="h-5 w-5" />
          <span className="hidden max-w-[10rem] truncate sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="truncate">{name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{email} · {roleLabel}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LiveDot({ state }: { state: 'connecting' | 'live' | 'offline' }) {
  const color = state === 'live' ? 'bg-emerald-500' : state === 'connecting' ? 'bg-amber-400' : 'bg-muted-foreground';
  const label = state === 'live' ? 'Live' : state === 'connecting' ? 'Connecting' : 'Offline';
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground" title={`Realtime updates: ${label}`}>
      <span className={`h-2 w-2 rounded-full ${color} ${state === 'live' ? 'animate-pulse' : ''}`} /> {label}
    </span>
  );
}
