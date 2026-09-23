'use client';

import { History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAudit } from '@/hooks/api';
import { EmptyState, QueryState } from '@/components/common/query-state';
import { when } from '@/components/common/format';

const LABEL: Record<string, string> = {
  'patient.created': 'Created patient profile',
  'patient.updated': 'Updated profile',
  'medication.created': 'Added medication',
  'medication.updated': 'Changed medication',
  'medication.discontinued': 'Discontinued medication',
  'dose.taken': 'Recorded dose taken',
  'dose.skipped': 'Recorded dose skipped',
  'note.created': 'Wrote clinical note',
  'note.updated': 'Edited clinical note',
  'note.deleted': 'Deleted clinical note',
  'alert.acknowledged': 'Acknowledged alert',
  'alert.resolved': 'Resolved alert',
  'alert.sos': 'Pressed help button',
  'invite.created': 'Created invite code',
  'team.joined': 'Joined care team',
  'team.member_removed': 'Removed team member',
  'geofence.configured': 'Changed safe zone',
};

export function AuditLog({ patientId }: { patientId: string }) {
  const q = useAudit(patientId);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History /> Activity log
        </CardTitle>
        <CardDescription>
          Append-only record of every change to this patient&apos;s data, written in the same transaction as the change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QueryState query={q}>
          {(rows) =>
            rows.length === 0 ? (
              <EmptyState title="No activity yet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Who</TableHead>
                    <TableHead>What</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-sm">{when(r.createdAt)}</TableCell>
                      <TableCell className="text-sm">{r.actorName ?? 'System'}</TableCell>
                      <TableCell className="text-sm">{LABEL[r.action] ?? r.action}</TableCell>
                      <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground">
                        {Object.keys(r.metadata ?? {}).length ? JSON.stringify(r.metadata) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          }
        </QueryState>
      </CardContent>
    </Card>
  );
}
