'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, SendHorizonal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMarkRead, useMessages, useSendMessage } from '@/hooks/api';
import { EmptyState, QueryState } from '@/components/common/query-state';
import { when } from '@/components/common/format';
import { errorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';

/** Care-team group chat. New messages arrive over SSE (see usePatientEvents). */
export function ChatPanel({ patientId, meId, large = false, title = 'Care team chat' }: { patientId: string; meId: string; large?: boolean; title?: string }) {
  const q = useMessages(patientId);
  const send = useSendMessage(patientId);
  const markRead = useMarkRead(patientId);
  const { toast } = useToast();
  const [text, setText] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const count = q.data?.items.length ?? 0;

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
    if (count) markRead.mutate();
    // markRead is stable enough; re-run only when the message count changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    send.mutate(body, { onError: (err) => { setText(body); toast({ title: 'Not sent', description: errorMessage(err), variant: 'destructive' }); } });
  };

  return (
    <Card className={cn(large && 'rounded-2xl shadow-xl')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquare /> {title}</CardTitle>
        <CardDescription>Everyone on the care team sees these messages.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[420px] flex-col">
          <div className="mb-3 flex-1 space-y-3 overflow-y-auto rounded-lg border bg-background p-3" aria-live="polite">
            <QueryState query={q}>
              {(page) =>
                page.items.length === 0 ? (
                  <EmptyState title="No messages yet" />
                ) : (
                  <>
                    {page.items.map((m) => {
                      const mine = m.senderId === meId;
                      return (
                        <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
                          <div className={cn('max-w-[80%] rounded-2xl px-4 py-2', mine ? 'bg-primary text-primary-foreground' : 'bg-muted', large && 'text-lg')}>{m.body}</div>
                          <span className="mt-1 text-xs text-muted-foreground">
                            {mine ? 'You' : `${m.senderName}${m.senderRole ? ` · ${m.senderRole}` : ''}`} · {when(m.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={bottom} />
                  </>
                )
              }
            </QueryState>
          </div>
          <form onSubmit={submit} className="flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" className={cn(large && 'h-12 text-base')} maxLength={2000} aria-label="Message" />
            <Button type="submit" size="icon" className={cn(large && 'h-12 w-12')} disabled={!text.trim()} aria-label="Send"><SendHorizonal className="h-5 w-5" /></Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
