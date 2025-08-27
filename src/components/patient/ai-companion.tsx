'use client';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizonal } from 'lucide-react';
import { answerQuestion, type AnswerQuestionOutput } from '@/ai/flows/ai-companion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';

export function AiCompanion() {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<{ type: 'user' | 'ai'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      const isScrolledToBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 1;
      
      if (isScrolledToBottom) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [conversation]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = question;
    setConversation(prev => [...prev, { type: 'user', text: userMessage }]);
    setLoading(true);
    setQuestion('');

    try {
      const result: AnswerQuestionOutput = await answerQuestion({ question: userMessage });
      setConversation(prev => [...prev, { type: 'ai', text: result.answer }]);
    } catch (error) {
      console.error(error);
      setConversation(prev => [...prev, { type: 'ai', text: 'Sorry, I am having trouble thinking right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[400px] min-h-[400px]">
      <ScrollArea className="flex-grow p-4 border rounded-lg mb-4" viewportRef={viewportRef}>
        <div className="space-y-4">
          {conversation.length === 0 && (
            <div className="text-center text-muted-foreground p-8">
              <p>Ask me a simple question, like &quot;What is my name?&quot; or &quot;What day is it?&quot;</p>
            </div>
          )}
          {conversation.map((entry, index) => (
            <div key={index} className={`flex items-end gap-2 ${entry.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-lg max-w-sm text-base ${entry.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {entry.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-lg bg-muted">
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a simple question..."
          disabled={loading}
          className="text-base h-12"
        />
        <Button type="submit" disabled={loading} size="icon" className="h-12 w-12 shrink-0">
          <SendHorizonal className="h-5 w-5" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
