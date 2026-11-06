import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuoteChat from '../components/QuoteChat';
import api from '../api/axios';

const suggestedQuestions = [
  { label: 'Comment choisir un kit solaire ?', prompt: 'Aide-moi à choisir un kit solaire adapté, et pose-moi les questions nécessaires.' },
  { label: 'Quel budget prévoir ?', prompt: 'Quel budget prévoir pour une installation solaire ? Explique les éléments qui influencent le prix.' },
  { label: 'Maison sans électricité stable', prompt: 'Je veux équiper une maison où le courant est instable. Par quoi commencer ?' },
  { label: 'Dimensionner selon mes appareils', prompt: 'Quels renseignements dois-je te donner pour dimensionner un système selon mes appareils ?' },
];

export default function QuoteAdvice() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);

  const sendMessage = async (suggestedText) => {
    const message = (suggestedText ?? input).trim();
    if (!message || pending) return;

    const previousMessages = messages;
    setMessages(current => [...current, { id: `user-${Date.now()}`, role: 'user', text: message }]);
    setInput('');
    setPending(true);

    try {
      const { data } = await api.post('/api/solar/conversation', {
        message,
        context: {
          scope: 'quote_advice',
          mode: 'general_quote_advice',
          conversation_history: previousMessages.slice(-8).map(({ role, text }) => ({ role, content: text })),
          instruction: 'Conseiller sur les devis et installations solaires sans prétendre qu’un devis Djua est créé ou enregistré. Si des informations manquent, poser des questions ciblées et signaler les hypothèses.',
        },
      });
      const result = data?.data;
      const answer = result?.assistant_message || result?.answer;
      if (!answer || result?.error) {
        throw new Error(result?.error?.message || result?.error || 'Le conseiller IA n’a pas retourné de réponse exploitable.');
      }
      setMessages(current => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', text: answer, isNew: true }]);
    } catch (error) {
      setMessages(current => [...current, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        isError: true,
        text: error.response?.data?.error?.message
          || error.response?.data?.message
          || error.message
          || 'Le conseiller IA est momentanément indisponible. Réessayez.',
      }]);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <main className="ops-page quote-advice-page">
        <div>
          <h1>Conseil devis par IA</h1>
          <p>Discutez de votre projet solaire sans remplir l’onboarding. Cette conversation ne crée pas de devis officiel.</p>
        </div>
        <button type="button" onClick={() => navigate('/devis/nouveau')}>Créer un devis avec le formulaire</button>
      </main>
      <QuoteChat
        open
        onClose={() => navigate('/devis')}
        onCreateQuote={() => navigate('/devis/nouveau')}
        backLabel="Retour aux devis"
        messages={messages}
        input={input}
        onInput={setInput}
        onSend={() => sendMessage()}
        onSuggestionSelect={prompt => sendMessage(prompt)}
        pending={pending}
        assistantName="Assistant Djúa Solaire IA"
        assistantBadge="Conseil"
        assistantSubtitle="Conseiller solaire, sans devis préalable"
        welcomeEyebrow="CONSEIL SOLAIRE SANS FORMULAIRE"
        welcomeTitle={<>Parlons de votre<br />projet solaire</>}
        welcomeDescription="Décrivez votre logement, vos appareils, votre budget ou vos questions. Je vous guide et précise les informations manquantes."
        inputPlaceholder="Ex. J’ai un frigo, une TV et 4 lampes…"
        suggestions={suggestedQuestions}
      />
    </>
  );
}
