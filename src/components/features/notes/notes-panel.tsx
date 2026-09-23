'use client';

import { useState } from 'react';
import { FileText, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useDeleteNote, useNotes, useSaveNote } from '@/hooks/api';
import { EmptyState, QueryState } from '@/components/common/query-state';
import { when } from '@/components/common/format';
import { errorMessage } from '@/lib/api-client';

export function NotesPanel({ patientId, canWrite, meId }: { patientId: string; canWrite: boolean; meId: string }) {
  const notes = useNotes(patientId);
  const save = useSaveNote(patientId);
  const del = useDeleteNote(patientId);
  const { toast } = useToast();
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    save.mutate(
      { noteId: editing ?? undefined, body: draft.trim() },
      {
        onSuccess: () => {
          setDraft('');
          setEditing(null);
          toast({ title: editing ? 'Note updated' : 'Note saved', description: 'Shared with the care team.' });
        },
        onError: (err) => toast({ title: 'Could not save', description: errorMessage(err), variant: 'destructive' }),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText /> Clinical notes
        </CardTitle>
        <CardDescription>
          {canWrite
            ? 'Visible to caregivers on this care team. Only the author can edit; deletions are kept in the audit trail.'
            : 'Written by the clinician on this care team.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canWrite && (
          <form onSubmit={submit} className="space-y-2">
            <Textarea
              rows={4}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Observations, assessment, plan…"
              maxLength={10_000}
              aria-label="Note"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={!draft.trim() || save.isPending}>
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Update note' : 'Save note'}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(null);
                    setDraft('');
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
        <QueryState query={notes}>
          {(list) =>
            list.length === 0 ? (
              <EmptyState icon={FileText} title="No notes yet" />
            ) : (
              <ul className="space-y-3">
                {list.map((n) => (
                  <li key={n.id} className="rounded-xl border p-4">
                    <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {n.authorName} · {when(n.createdAt)}
                        {n.updatedAt !== n.createdAt && ' (edited)'}
                      </span>
                      {canWrite && n.authorId === meId && (
                        <span className="flex">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditing(n.id);
                              setDraft(n.body);
                            }}
                            aria-label="Edit note"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => del.mutate(n.id)}
                            aria-label="Delete note"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryState>
      </CardContent>
    </Card>
  );
}
