'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Mic, SendHorizonal, Siren, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCompanion } from '@/hooks/api';
import { useClientValue } from '@/hooks/use-mounted';
import { errorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type Turn = { role: 'user' | 'assistant'; text: string; suggestSos?: boolean };

const SUGGESTIONS = ['What day is it?', "What's my next medicine?", 'What is my son’s name?', "What's next today?"];

type SpeechRecognitionLike = {
  lang: string;
  onresult: (e: { results: { 0: { transcript: string } }[] }) => void;
  onend: () => void;
  start: () => void;
};

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9; // slightly slower speech is easier to follow
  window.speechSynthesis.speak(u);
}

export function Companion({ patientId, onSos }: { patientId: string; onSos?: () => void }) {
  const ask = useCompanion(patientId);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [readAloud, setReadAloud] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  // Browser-only API: resolved after mount so server and client markup match.
  const recognitionCtor = useClientValue(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  });

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  const send = (question: string) => {
    const q = question.trim();
    if (!q) return;
    setTurns((t) => [...t, { role: 'user', text: q }]);
    setText('');
    ask.mutate(q, {
      onSuccess: (r) => {
        setTurns((t) => [...t, { role: 'assistant', text: r.answer, suggestSos: r.suggestSos }]);
        if (readAloud) speak(r.answer);
      },
      onError: (e) =>
        setTurns((t) => [...t, { role: 'assistant', text: `Sorry, I couldn't answer just now. (${errorMessage(e)})` }]),
    });
  };

  const listen = () => {
    if (!recognitionCtor) return;
    const r = new recognitionCtor();
    r.lang = 'en-IN';
    r.onresult = (e) => send(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    setListening(true);
    r.start();
  };

  return (
    <Card className="rounded-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Bot /> Ask me anything
        </CardTitle>
        <CardDescription>I know your plan for today, your medicine and your family.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          ref={scroller}
          className="max-h-80 min-h-[8rem] space-y-3 overflow-y-auto rounded-xl border bg-background p-3"
          aria-live="polite"
        >
          {turns.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} variant="secondary" onClick={() => send(s)}>
                  {s}
                </Button>
              ))}
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className={cn('flex flex-col', t.role === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2 text-lg',
                  t.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                )}
              >
                {t.text}
              </div>
              {t.suggestSos && onSos && (
                <Button variant="destructive" size="lg" className="mt-2" onClick={onSos}>
                  <Siren className="mr-2 h-5 w-5" /> Call for help
                </Button>
              )}
            </div>
          ))}
          {ask.isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
          className="flex gap-2"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your question…"
            className="h-12 text-base"
            aria-label="Your question"
            maxLength={500}
          />
          {recognitionCtor && (
            <Button
              type="button"
              size="icon"
              variant={listening ? 'destructive' : 'outline'}
              className="h-12 w-12"
              onClick={listen}
              aria-label="Speak your question"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12"
            disabled={!text.trim() || ask.isPending}
            aria-label="Ask"
          >
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </form>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={readAloud} onChange={(e) => setReadAloud(e.target.checked)} />{' '}
          <Volume2 className="h-4 w-4" /> Read answers aloud
        </label>
      </CardContent>
    </Card>
  );
}
