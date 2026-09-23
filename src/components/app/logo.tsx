import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('h-6 w-6 text-primary', className)} aria-hidden>
      <path d="M12 2a10 10 0 0 0-10 10c0 5 4.5 9 10 9s10-4 10-9A10 10 0 0 0 12 2Z" />
      <path d="M12 12a5 5 0 0 0-5 5" />
      <path d="M12 7a5 5 0 0 1 5 5" />
    </svg>
  );
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-lg font-bold">
      <LogoMark />
      <span>Neuro-AI</span>
    </Link>
  );
}
