import { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowUp, Bot, Loader2, MessageSquare, X } from 'lucide-react';
import useDialog from '../hooks/useDialog';
import cleanAiText from '../lib/cleanAiText';
import './QuoteChat.css';

const suggestions = [
  'Pourquoi ce nombre de panneaux ?',
  'Quelle autonomie sans soleil ?',
  'Comment réduire le budget ?',
  'Peut-on ajouter un climatiseur ?',
];

export function QuoteChatButton({ onClick }) {
  return (
    <button type="button" className="quote-ai-invite" onClick={onClick}>
      <MessageSquare size={19} />
      <span>
        <strong>Discuter avec l’IA</strong>
        <small>Comprendre mon devis</small>
      </span>
      <span aria-hidden="true"><ArrowUp size={16} /></span>
    </button>
  );
}

function StreamingAiMessage({ text, isError, isNew, onTick }) {
  const clean = useMemo(() => cleanAiText(text), [text]);
  const [displayed, setDisplayed] = useState(() => (isNew ? '' : clean));
  const [isTyping, setIsTyping] = useState(() => Boolean(isNew));

  useEffect(() => {
    if (!isNew) {
      setDisplayed(clean);
      setIsTyping(false);
      return;
    }
    let idx = 0;
    setIsTyping(true);
    const interval = setInterval(() => {
      idx += 2;
      if (idx >= clean.length) {
        setDisplayed(clean);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setDisplayed(clean.slice(0, idx));
        onTick?.();
      }
    }, 12);
    return () => clearInterval(interval);
  }, [clean, isNew, onTick]);

  return (
    <p>
      {displayed}
      {isTyping && <span className="quote-ai-cursor" aria-hidden="true">▍</span>}
    </p>
  );
}

export default function QuoteChat({ open, onClose, messages, input, onInput, onSend, pending }) {
  const dialogRef = useDialog(open, onClose);
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const started = messages.some(message => message.role === 'user');

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, pending, open]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <section ref={dialogRef} className="quote-ai-screen" role="dialog" aria-modal="true" aria-label="Discussion sur l’étude solaire">
      <header className="quote-ai-header">
        <button type="button" onClick={onClose} className="quote-ai-back">
          <ArrowLeft size={18} /><span>Retour au devis</span>
        </button>
        <div className="quote-ai-brand">
          <Bot size={22} />
          <span>Djua <strong>Conseil</strong><small>Assistant IA · Votre étude solaire</small></span>
        </div>
        <button type="button" onClick={onClose} className="quote-ai-close" aria-label="Fermer la discussion">
          <X size={21} />
        </button>
      </header>

      <div className={`quote-ai-workspace ${started ? 'has-messages' : ''}`}>
        <div className="quote-ai-scroll">
          {!started ? (
            <div className="quote-ai-welcome">
              <div className="quote-ai-robot">
                <img src={`${import.meta.env.BASE_URL}bot.gif`} alt="Robot assistant Djua" />
                <Bot className="quote-ai-static-robot" size={80} />
              </div>
              <p className="quote-ai-eyebrow">VOTRE DEVIS, EN CLAIR</p>
              <h1>Et si on parlait de<br />votre installation ?</h1>
              <p>Panneaux, autonomie, budget… Je vous aide à comprendre votre étude, à votre rythme.</p>
            </div>
          ) : (
            <div className="quote-ai-thread" role="log" aria-label="Messages de la discussion" aria-live="polite">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                return (
                  <article
                    key={message.id || index}
                    className={`quote-ai-message ${isUser ? 'is-user' : ''} ${message.isError ? 'is-error' : ''}`}
                  >
                    <span className="quote-ai-author">
                      {isUser ? 'Vous' : <><Bot size={17} />Djua Conseil</>}
                    </span>
                    {isUser ? (
                      <p>{message.text}</p>
                    ) : (
                      <StreamingAiMessage
                        text={message.text}
                        isError={message.isError}
                        isNew={message.isNew}
                        onTick={scrollToBottom}
                      />
                    )}
                  </article>
                );
              })}
              {pending && (
                <div className="quote-ai-thinking" role="status">
                  <Loader2 size={17} />Je prépare votre réponse…
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="quote-ai-compose-area">
          {!started && (
            <div className="quote-ai-suggestions" aria-label="Questions suggérées">
              {suggestions.map((question) => (
                <button
                  type="button"
                  key={question}
                  onClick={() => {
                    onInput(question);
                    inputRef.current?.focus();
                  }}
                >
                  {question}<ArrowUp size={14} />
                </button>
              ))}
            </div>
          )}

          <form
            className="quote-ai-composer"
            onSubmit={(event) => {
              event.preventDefault();
              onSend();
            }}
          >
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(event) => onInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  onSend();
                }
              }}
              maxLength={1000}
              aria-label="Votre question sur l’étude"
              placeholder="Que souhaitez-vous comprendre dans votre devis ?"
            />
            <div className="quote-ai-composer-bottom">
              <span><Bot size={15} />Conseil sur votre projet solaire</span>
              <button type="submit" aria-label="Envoyer la question" disabled={!input.trim() || pending}>
                {pending ? <Loader2 size={19} className="quote-ai-spin" /> : <ArrowUp size={21} />}
              </button>
            </div>
          </form>
          <p className="quote-ai-note">L’IA peut se tromper. Les choix techniques et les prix restent à valider avec votre conseiller.</p>
        </div>
      </div>
    </section>,
    document.body
  );
}
