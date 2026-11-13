import { useEffect, useState } from 'react';
import { toast } from 'sonner';

function readMessages(storageKey, initialMessages) {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === null) return { messages: initialMessages, error: null };

    const messages = JSON.parse(stored);
    if (!Array.isArray(messages) || messages.some(message => (
      !message
      || !['user', 'assistant'].includes(message.role)
      || typeof message.text !== 'string'
    ))) {
      throw new Error('Le format de l’historique de discussion est invalide.');
    }

    return {
      messages: messages.map(message => ({
        ...message,
        isNew: false,
      })),
      error: null,
    };
  } catch (error) {
    console.error('Impossible de lire l’historique du chat depuis le stockage local.', error);
    return { messages: initialMessages, error };
  }
}

export default function usePersistentChatMessages(storageKey, initialMessages) {
  const [storedState] = useState(() => readMessages(storageKey, initialMessages));
  const [messages, setMessages] = useState(storedState.messages);

  useEffect(() => {
    if (storedState.error) {
      toast.error('L’historique de cette discussion n’a pas pu être lu.');
    }
  }, [storedState.error]);

  useEffect(() => {
    try {
      const savedMessages = JSON.stringify(messages, (key, value) => (
        key === 'isNew' ? undefined : value
      ));
      window.localStorage.setItem(storageKey, savedMessages);
    } catch (error) {
      console.error('Impossible de sauvegarder l’historique du chat dans le stockage local.', error);
      toast.error('L’historique de cette discussion n’a pas pu être sauvegardé.');
    }
  }, [messages, storageKey]);

  return [messages, setMessages];
}
