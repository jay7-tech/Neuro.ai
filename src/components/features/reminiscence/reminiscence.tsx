'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Album, ChevronLeft, ChevronRight, Loader2, Music, Pencil, Phone, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useDeleteResource, useResource, useSaveResource } from '@/hooks/api';
import { EmptyState, QueryState } from '@/components/common/query-state';
import { FamilyMemberInput, MemoryInput, TrackInput } from '@/lib/contracts';
import { errorMessage } from '@/lib/api-client';
import type { FamilyMember, Memory, Track } from '@/lib/api-types';

type Kind = 'family' | 'memories' | 'playlist';

const FIELDS: Record<Kind, { name: string; label: string; type?: 'textarea' | 'date' | 'url' }[]> = {
  family: [
    { name: 'name', label: 'Name' },
    { name: 'relation', label: 'Relation (e.g. Son)' },
    { name: 'phone', label: 'Phone' },
    { name: 'photoUrl', label: 'Photo URL', type: 'url' },
    { name: 'message', label: 'A message for them to read', type: 'textarea' },
  ],
  memories: [
    { name: 'title', label: 'Title' },
    { name: 'occurredOn', label: 'Date', type: 'date' },
    { name: 'photoUrl', label: 'Photo URL', type: 'url' },
    { name: 'description', label: 'Story', type: 'textarea' },
  ],
  playlist: [
    { name: 'title', label: 'Song' },
    { name: 'artist', label: 'Artist' },
    { name: 'url', label: 'Audio URL', type: 'url' },
  ],
};
const SCHEMA = { family: FamilyMemberInput, memories: MemoryInput, playlist: TrackInput };

function ItemForm({ patientId, kind, item, onDone }: { patientId: string; kind: Kind; item?: Record<string, unknown>; onDone: () => void }) {
  const save = useSaveResource(patientId, kind);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS[kind].map((f) => [f.name, (item?.[f.name] as string | null) ?? ''])),
  );
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim() === '' ? null : v]));
    const parsed = SCHEMA[kind].safeParse(cleaned);
    if (!parsed.success) return setError(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    try {
      await save.mutateAsync({ itemId: item?.id as string | undefined, body: parsed.data });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {FIELDS[kind].map((f) => (
        <div key={f.name} className="space-y-1">
          <Label htmlFor={`f-${f.name}`}>{f.label}</Label>
          {f.type === 'textarea' ? (
            <Textarea id={`f-${f.name}`} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
          ) : (
            <Input id={`f-${f.name}`} type={f.type ?? 'text'} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
          )}
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
    </form>
  );
}

/** Caregiver CRUD for any reminiscence collection. */
export function ReminiscenceManager({ patientId, kind }: { patientId: string; kind: Kind }) {
  const q = useResource(patientId, kind);
  const del = useDeleteResource(patientId, kind);
  const { toast } = useToast();
  const [editing, setEditing] = useState<Record<string, unknown> | 'new' | null>(null);
  const meta = {
    family: { title: 'Family & friends', icon: Users, desc: 'Names, faces and a personal message. The companion uses these to answer "who is my son?".' },
    memories: { title: 'Memory lane', icon: Album, desc: 'Photos and stories for reminiscence therapy.' },
    playlist: { title: 'Music', icon: Music, desc: 'Familiar music can calm agitation and spark recall.' },
  }[kind];
  const Icon = meta.icon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Icon /> {meta.title}</CardTitle>
          <CardDescription>{meta.desc}</CardDescription>
        </div>
        <Button onClick={() => setEditing('new')}><Plus className="mr-2 h-4 w-4" /> Add</Button>
      </CardHeader>
      <CardContent>
        <QueryState query={q}>
          {(items) => items.length === 0 ? <EmptyState icon={Icon} title="Nothing added yet" /> : (
            <ul className="divide-y">
              {(items as ({ id: string } & Record<string, unknown>)[]).map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-2">
                  <span className="flex-1">
                    <span className="font-medium">{String(it.name ?? it.title)}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{String(it.relation ?? it.artist ?? it.occurredOn ?? '')}</span>
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(it)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => del.mutate(it.id, { onError: (e) => toast({ title: 'Failed', description: errorMessage(e), variant: 'destructive' }) })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </QueryState>
      </CardContent>
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === 'new' ? `Add to ${meta.title.toLowerCase()}` : 'Edit'}</DialogTitle></DialogHeader>
          {editing !== null && <ItemForm patientId={patientId} kind={kind} item={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ---------------------- patient-facing views ---------------------- */

export function FamilyGallery({ patientId }: { patientId: string }) {
  const q = useResource(patientId, 'family');
  return (
    <QueryState query={q}>
      {(list: FamilyMember[]) => list.length === 0 ? <EmptyState icon={Users} title="Your family list is empty" /> : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((f) => (
            <Card key={f.id} className="overflow-hidden rounded-2xl shadow-lg">
              {f.photoUrl && <Image src={f.photoUrl} alt={f.name} width={400} height={400} className="aspect-square w-full object-cover" unoptimized />}
              <CardContent className="space-y-2 p-5">
                <p className="text-2xl font-bold">{f.name}</p>
                <p className="text-lg text-primary">Your {f.relation.toLowerCase()}</p>
                {f.message && <p className="italic text-muted-foreground">“{f.message}”</p>}
                {f.phone && <Button asChild size="lg" className="mt-2 w-full"><a href={`tel:${f.phone}`}><Phone className="mr-2 h-5 w-5" /> Call {f.name.split(' ')[0]}</a></Button>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </QueryState>
  );
}

export function MemoryCarousel({ patientId }: { patientId: string }) {
  const q = useResource(patientId, 'memories');
  const [i, setI] = useState(0);
  return (
    <QueryState query={q}>
      {(list: Memory[]) => {
        if (list.length === 0) return <EmptyState icon={Album} title="No memories added yet" />;
        const m = list[i % list.length];
        return (
          <Card className="mx-auto max-w-3xl overflow-hidden rounded-2xl shadow-xl">
            {m.photoUrl && <Image src={m.photoUrl} alt={m.title} width={1200} height={800} className="aspect-[3/2] w-full object-cover" unoptimized />}
            <CardContent className="space-y-3 p-6">
              <p className="text-sm text-muted-foreground">{m.occurredOn && new Date(m.occurredOn).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
              <h2 className="text-3xl font-bold">{m.title}</h2>
              {m.description && <p className="text-lg">{m.description}</p>}
              <p className="text-lg font-medium text-primary">Do you remember this day?</p>
              <div className="flex justify-between pt-2">
                <Button size="lg" variant="outline" onClick={() => setI((i - 1 + list.length) % list.length)}><ChevronLeft className="mr-1" /> Previous</Button>
                <span className="self-center text-muted-foreground">{(i % list.length) + 1} / {list.length}</span>
                <Button size="lg" variant="outline" onClick={() => setI(i + 1)}>Next <ChevronRight className="ml-1" /></Button>
              </div>
            </CardContent>
          </Card>
        );
      }}
    </QueryState>
  );
}

export function MusicPlayer({ patientId }: { patientId: string }) {
  const q = useResource(patientId, 'playlist');
  const [current, setCurrent] = useState<Track | null>(null);
  return (
    <QueryState query={q}>
      {(list: Track[]) => list.length === 0 ? <EmptyState icon={Music} title="No songs yet" /> : (
        <Card className="mx-auto max-w-2xl rounded-2xl shadow-xl">
          <CardContent className="space-y-4 p-6">
            {current && (
              <div className="rounded-xl bg-primary/10 p-4">
                <p className="text-sm text-muted-foreground">Now playing</p>
                <p className="text-xl font-bold">{current.title}</p>
                {/* key forces reload when the track changes */}
                <audio key={current.id} src={current.url} controls autoPlay className="mt-3 w-full" />
              </div>
            )}
            <ul className="space-y-2">
              {list.map((t) => (
                <li key={t.id}>
                  <Button variant={current?.id === t.id ? 'default' : 'outline'} size="lg" className="h-auto w-full justify-start py-3 text-left" onClick={() => setCurrent(t)}>
                    <Music className="mr-3 h-5 w-5" />
                    <span><span className="block text-lg">{t.title}</span>{t.artist && <span className="text-sm opacity-80">{t.artist}</span>}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </QueryState>
  );
}
