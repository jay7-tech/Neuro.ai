'use client';

import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAcceptInvite } from '@/hooks/api';
import { errorMessage } from '@/lib/api-client';

export function JoinTeamForm({ onJoined }: { onJoined?: () => void }) {
  const [code, setCode] = useState('');
  const accept = useAcceptInvite();
  const { toast } = useToast();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    accept.mutate(code, {
      onSuccess: (r) => {
        toast({ title: 'Joined care team', description: `You are now on ${r.patient.displayName}'s care team.` });
        setCode('');
        onJoined?.();
      },
      onError: (err) => toast({ title: 'Could not join', description: errorMessage(err), variant: 'destructive' }),
    });
  };

  return (
    <form onSubmit={submit} className="flex max-w-sm gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ABCD-1234"
        aria-label="Invite code"
        className="font-mono tracking-widest"
        maxLength={9}
      />
      <Button type="submit" disabled={code.replace(/-/g, '').length !== 8 || accept.isPending}>
        {accept.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}{' '}
        Join
      </Button>
    </form>
  );
}
