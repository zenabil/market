'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { aiSupportChatbot } from '@/ai/flows/ai-support-chatbot';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
};

export default function AiChatbot() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiSupportChatbot({ question: input });
      const botMessage: Message = { id: `${Date.now()}-bot`, text: response.answer, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        text: t('chatbot.error'),
        sender: 'bot',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg" size="icon">
          <MessageSquare className="h-8 w-8" />
          <span className="sr-only">{t('chatbot.open')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] h-[70vh] flex flex-col p-0">
        <DialogHeader className='p-6 pb-2'>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Bot /> {t('chatbot.title')}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-3',
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.sender === 'bot' && <AvatarIcon sender="bot" />}
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg p-3 text-sm',
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.text}
                </div>
                {message.sender === 'user' && <AvatarIcon sender="user" />}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <AvatarIcon sender="bot" />
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-6 pt-2 border-t">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('chatbot.placeholder')}
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">{t('chatbot.send')}</span>
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const AvatarIcon = ({ sender }: { sender: 'user' | 'bot' }) => {
  const Icon = sender === 'bot' ? Bot : User;
  return (
    <div className={cn(
      'flex h-8 w-8 items-center justify-center rounded-full',
      sender === 'bot' ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
    )}>
      <Icon className="h-5 w-5" />
    </div>
  );
};