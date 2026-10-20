import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useUi } from '../../state/UiContext';
import { formatTime } from '../../utils/format';

interface Msg {
  from: 'bot' | 'user';
  text: string;
  at: number;
}

const BOT_REPLIES = [
  'Thanks for reaching out! A simulated support agent will follow up shortly. Meanwhile, you can explore the Help Center.',
  'Got it — I have logged this in the demo queue. Anything else I can help with?',
  'In this demo environment all balances and orders are simulated, so there is no risk to real funds.',
];

/** Floating gold support button + simulated chat panel. */
export function SupportWidget(): React.ReactElement {
  const { supportOpen, setSupportOpen } = useUi();
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: 'bot',
      text: 'Hi there 👋 Welcome to Bityaris support. This is a simulated assistant — how can I help you today?',
      at: Date.now(),
    },
  ]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, supportOpen]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: 'user', text, at: Date.now() }]);
    setDraft('');
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        { from: 'bot', text: BOT_REPLIES[m.filter((x) => x.from === 'bot').length % BOT_REPLIES.length], at: Date.now() },
      ]);
    }, 700);
  };

  return (
    <>
      <button
        type="button"
        aria-label={supportOpen ? 'Close support chat' : 'Open support chat'}
        onClick={() => setSupportOpen(!supportOpen)}
        className="fixed bottom-8 right-6 z-[140] flex h-12 w-12 items-center justify-center rounded-full bg-accent text-night-900 shadow-pop transition-transform hover:scale-105"
      >
        {supportOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {supportOpen && (
        <div className="fixed bottom-24 right-6 z-[140] flex h-[420px] w-[min(340px,92vw)] flex-col overflow-hidden rounded-2xl border border-bd-dark bg-night-800 shadow-pop">
          <div className="flex items-center justify-between border-b border-bd-dark px-4 py-3">
            <div>
              <div className="text-[13px] font-semibold text-txt-primary">Bityaris Support</div>
              <div className="text-[11px] text-txt-secondary">Simulated assistant · typically replies instantly</div>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-up">
              <span className="h-1.5 w-1.5 rounded-full bg-up pulse-dot" /> online
            </span>
          </div>
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4 scroll-thin">
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'user' ? 'text-right' : ''}>
                <div
                  className={
                    m.from === 'user'
                      ? 'inline-block max-w-[85%] rounded-xl rounded-br-sm bg-accent px-3 py-2 text-left text-[12px] text-night-900'
                      : 'inline-block max-w-[85%] rounded-xl rounded-bl-sm bg-night-600 px-3 py-2 text-left text-[12px] text-txt-primary'
                  }
                >
                  {m.text}
                </div>
                <div className="mt-1 text-[10px] text-txt-muted">{formatTime(m.at)}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-bd-dark p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type your message…"
              className="flex-1 rounded-lg bg-night-600 px-3 py-2 text-[12px] text-txt-primary outline-none placeholder:text-txt-muted"
            />
            <button
              type="button"
              aria-label="Send message"
              onClick={send}
              className="rounded-lg bg-accent p-2 text-night-900 hover:bg-accent-hover"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
