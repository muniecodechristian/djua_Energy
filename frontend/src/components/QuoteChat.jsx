import { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowUp, Loader2, MessageSquare, User, X } from 'lucide-react';
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

function StreamingAiMessage({ text, isNew, onTick }) {
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

export default function QuoteChat({
  open,
  onClose,
  messages,
  input,
  onInput,
  onSend,
  pending,
  suggestions: suggestedQuestions = suggestions,
  onSuggestionSelect,
  assistantName = 'Djua Copilot',
  assistantBadge = 'Copilot',
  assistantSubtitle = 'Assistant de votre étude solaire',
  welcomeEyebrow = 'VOTRE DEVIS, EN CLAIR',
  welcomeTitle = <>Et si on parlait de<br />votre installation ?</>,
  welcomeDescription = 'Panneaux, autonomie, budget… Je vous aide à comprendre votre étude, à votre rythme.',
  inputPlaceholder = 'Que souhaitez-vous comprendre dans votre devis ?',
}) {
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
        <div className="quote-ai-brand">
          <span className="quote-ai-brand-avatar">
            <img src="/bot.gif" alt="" aria-hidden="true" />
          </span>
          <span>
            <span className="quote-ai-brand-title">{assistantName} <strong>{assistantBadge}</strong></span>
            <small>{assistantSubtitle}</small>
          </span>
        </div>
        <div className="quote-ai-actions">
          <button type="button" onClick={onClose} className="quote-ai-back">
            <ArrowLeft size={18} /><span>Retour au devis</span>
          </button>
          <button type="button" onClick={onClose} className="quote-ai-close" aria-label="Fermer la discussion">
            <X size={21} />
          </button>
        </div>
      </header>

      <div className={`quote-ai-workspace ${started ? 'has-messages' : ''}`}>
        <div className="quote-ai-messages quote-ai-scroll">
          {!started ? (
            <div className="quote-ai-welcome">
              <div className="quote-ai-robot">
                <img src={`${import.meta.env.BASE_URL}bot.gif`} alt="Robot assistant Djua" />
              </div>
              <p className="quote-ai-eyebrow">{welcomeEyebrow}</p>
              <h1>{welcomeTitle}</h1>
              <p>{welcomeDescription}</p>
              <div className="quote-ai-suggestions" aria-label="Questions suggérées">
                {suggestedQuestions.map((suggestion) => {
                  const question = typeof suggestion === 'string' ? suggestion : suggestion.label;
                  const prompt = typeof suggestion === 'string' ? suggestion : suggestion.prompt;
                  return (
                  <button
                    type="button"
                    key={question}
                    onClick={() => {
                      if (onSuggestionSelect) onSuggestionSelect(prompt);
                      else {
                        onInput(prompt);
                        inputRef.current?.focus();
                      }
                    }}
                  >
                    {question}
                  </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="quote-ai-thread" role="log" aria-label="Messages de la discussion" aria-live="polite">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id || index}
                    className={`quote-ai-message-row ${isUser ? 'is-user' : ''}`}
                  >
                    {!isUser && (
                      <span className="quote-ai-message-avatar">
                        <img src="/bot.gif" alt="" aria-hidden="true" />
                      </span>
                    )}
                    {isUser ? (
                      <div className="quote-ai-message-bubble is-user">{message.text}</div>
                    ) : (
                      <div className={`quote-ai-message-bubble ${message.isError ? 'is-error' : ''}`}>
                        <StreamingAiMessage
                          text={message.text}
                          isNew={message.isNew}
                          onTick={scrollToBottom}
                        />
                      </div>
                    )}
                    {isUser && (
                      <span className="quote-ai-message-user-avatar">
                        <User size={12} />
                      </span>
                    )}
                  </div>
                );
              })}
              {pending && (
                <div className="quote-ai-thinking" role="status">
                  <span className="quote-ai-message-avatar">
                    <img src="/bot.gif" alt="" aria-hidden="true" />
                  </span>
                  <span className="quote-ai-thinking-dots">
                    <i /><i /><i />
                  </span>
                  <span className="quote-ai-sr-only">Je prépare votre réponse…</span>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="quote-ai-compose-area">
          <form
            className="quote-ai-composer"
            onSubmit={(event) => {
              event.preventDefault();
              onSend();
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
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
              placeholder={inputPlaceholder}
            />
            <button type="submit" aria-label="Envoyer la question" disabled={!input.trim() || pending}>
              {pending ? <Loader2 size={19} className="quote-ai-spin" /> : <ArrowUp size={21} />}
            </button>
          </form>
          <p className="quote-ai-note">L’IA peut se tromper. Les choix techniques et les prix restent à valider avec votre conseiller.</p>
        </div>
      </div>
    </section>,
    document.body
  );
}
