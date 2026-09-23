'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCaregiverTip } from '@/hooks/api';

const TOPICS = ['Communication', 'Daily Activities', 'Safety', 'Managing Frustration', 'Self-Care'] as const;

export function CaregiverTip() {
  const tip = useCaregiverTip();
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>(TOPICS[new Date().getDate() % TOPICS.length]);

  useEffect(() => {
    tip.mutate(topic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb /> Tip for today
        </CardTitle>
        <CardDescription>{topic}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tip.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <p className="rounded-lg border-l-4 border-primary bg-accent/40 p-3 italic">
            {tip.data?.tip ?? 'Take a breath — you are doing important work.'}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTopic(TOPICS[(TOPICS.indexOf(topic) + 1) % TOPICS.length])}
          disabled={tip.isPending}
        >
          <RefreshCw className="mr-2 h-3 w-3" /> Another tip
        </Button>
      </CardContent>
    </Card>
  );
}
