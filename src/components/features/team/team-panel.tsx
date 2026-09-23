'use client';

import { useState } from 'react';
import { Copy, Loader2, UserMinus, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useCreateInvite, useRemoveMember, useTeam } from '@/hooks/api';
import { QueryState } from '@/components/common/query-state';
import { day } from '@/components/common/format';
import { errorMessage } from '@/lib/api-client';
import type { Invite } from '@/lib/api-types';

type Role = 'patient' | 'caregiver' | 'clinician';

/** Invite rules mirror the server policy; the server remains the authority. */
const CAN_INVITE: Record<Role, ('caregiver' | 'clinician')[]> = {
  patient: ['caregiver'],
  caregiver: ['caregiver', 'clinician'],
  clinician: ['clinician'],
};

export function TeamPanel({ patientId, myRole, myUserId }: { patientId: string; myRole: Role; myUserId: string }) {
  const team = useTeam(patientId);
  const invite = useCreateInvite(patientId);
  const remove = useRemoveMember(patientId);
  const { toast } = useToast();
  const [issued, setIssued] = useState<Invite | null>(null);

  const createInvite = (role: 'caregiver' | 'clinician') =>
    invite.mutate(role, {
      onSuccess: setIssued,
      onError: (e) => toast({ title: 'Could not create invite', description: errorMessage(e), variant: 'destructive' }),
    });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Everyone who can see or act on this patient&apos;s care information.</CardDescription>
        </CardHeader>
        <CardContent>
          <QueryState query={team}>
            {(members) => (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Since</TableHead><TableHead /></TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.userId}>
                      <TableCell>
                        <p className="font-medium">{m.name}{m.userId === myUserId && ' (you)'}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{m.role}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{day(m.since)}</TableCell>
                      <TableCell className="text-right">
                        {m.role !== 'patient' && (myRole === 'caregiver' || m.userId === myUserId) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${m.name}`}
                            onClick={() => remove.mutate(m.userId, { onError: (e) => toast({ title: 'Could not remove', description: errorMessage(e), variant: 'destructive' }) })}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </QueryState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite someone</CardTitle>
          <CardDescription>Codes are single-use and expire after 72 hours. Only a hash is stored.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CAN_INVITE[myRole].map((role) => (
              <Button key={role} variant="outline" onClick={() => createInvite(role)} disabled={invite.isPending}>
                {invite.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Invite a {role}
              </Button>
            ))}
          </div>
          {issued && (
            <div className="rounded-lg border bg-muted/40 p-4 text-center">
              <p className="text-xs uppercase text-muted-foreground">{issued.role} invite code</p>
              <p className="my-2 font-mono text-3xl font-bold tracking-widest">{issued.code}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(issued.code).then(() => toast({ title: 'Copied' }))}
              >
                <Copy className="mr-2 h-3 w-3" /> Copy
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">This code won&apos;t be shown again.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
