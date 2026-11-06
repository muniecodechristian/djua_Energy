import { useEffect, useState } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { StreamChat } from 'stream-chat';
import api from '../api/axios';

function getVoiceMessages(channel) {
  return (channel.state.messages || [])
    .filter(message => message.attachments?.some(attachment => attachment.type === 'audio' && attachment.asset_url))
    .map(message => {
      const attachment = message.attachments.find(item => item.type === 'audio' && item.asset_url);
      return {
        _id: `stream-${message.id}`,
        sender: { _id: message.user?.id },
        senderName: message.user?.name || 'Utilisateur',
        senderRole: message.user?.djua_role || 'technician',
        type: 'audio',
        mediaUrl: attachment.asset_url,
        audioDuration: attachment.audio_length,
        status: 'sent',
        createdAt: message.created_at,
      };
    });
}

export default function useStreamInstallation(installationId) {
  const [state, setState] = useState({
    channel: null,
    videoClient: null,
    members: [],
    loading: Boolean(installationId),
    error: null,
  });

  useEffect(() => {
    if (!installationId) {
      setState({ channel: null, videoClient: null, members: [], loading: false, error: null });
      return undefined;
    }

    let active = true;
    let chatClient;
    let channel;
    let videoClient;

    setState({ channel: null, videoClient: null, members: [], loading: true, error: null });

    const connect = async () => {
      const sessionResponse = await api.get(`/api/installations/${installationId}/stream-session`);
      const session = sessionResponse.data?.data;
      if (!session?.apiKey || !session?.token || !session?.user?.id || !session?.channelId) {
        throw new Error('La réponse Stream est incomplète.');
      }

      const user = { id: session.user.id, name: session.user.name };
      const getToken = async () => {
        const response = await api.get(`/api/installations/${installationId}/stream-session`);
        const token = response.data?.data?.token;
        if (!token) throw new Error('Le serveur n’a pas fourni de jeton Stream.');
        return token;
      };

      chatClient = new StreamChat(session.apiKey);
      await chatClient.connectUser(user, getToken);

      channel = chatClient.channel('messaging', session.channelId);
      await channel.watch({ limit: 100 });

      videoClient = new StreamVideoClient({
        apiKey: session.apiKey,
        user,
        token: session.token,
        tokenProvider: getToken,
      });

      if (!active) {
        await chatClient.disconnectUser();
        await videoClient.disconnectUser();
        return;
      }

      setState({
        channel,
        videoClient,
        members: session.members,
        loading: false,
        error: null,
      });
    };

    connect().catch(error => {
      if (active) {
        setState({
          channel: null,
          videoClient: null,
          members: [],
          loading: false,
          error: error.response?.data?.message || error.message || 'Connexion Stream impossible.',
        });
      }
      if (channel) {
        channel.stopWatching().catch(stopError => console.error('[Stream] Arrêt du canal impossible:', stopError));
      }
      if (chatClient?.userID) {
        chatClient.disconnectUser().catch(disconnectError => console.error('[Stream] Déconnexion du chat impossible:', disconnectError));
      }
      if (videoClient) {
        videoClient.disconnectUser().catch(disconnectError => console.error('[Stream] Déconnexion vidéo impossible:', disconnectError));
      }
    });

    return () => {
      active = false;
      if (channel) channel.stopWatching().catch(error => console.error('[Stream] Arrêt du canal impossible:', error));
      if (chatClient?.userID) chatClient.disconnectUser().catch(error => console.error('[Stream] Déconnexion du chat impossible:', error));
      if (videoClient) videoClient.disconnectUser().catch(error => console.error('[Stream] Déconnexion vidéo impossible:', error));
    };
  }, [installationId]);

  const voiceMessages = state.channel ? getVoiceMessages(state.channel) : [];

  useEffect(() => {
    if (!state.channel) return undefined;

    const onMessage = () => setState(current => ({ ...current }));
    state.channel.on('message.new', onMessage);
    return () => state.channel.off('message.new', onMessage);
  }, [state.channel]);

  return { ...state, voiceMessages };
}
