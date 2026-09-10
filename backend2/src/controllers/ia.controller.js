import iaService from '../services/ia.service.js';

export async function postConversation(req, res) {
  const { message, context = {} } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Field "message" is required and must be a string.' });
  }

  try {
    const result = await iaService.postConversation({ message, context });
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[IA Controller] Requête refusée', {
      status: err.status || 500,
    });

    return res.status(err.status === 400 ? 400 : 503).json({
      success: false,
      error: {
        code: 'AI_SERVICE_UNAVAILABLE',
        message: "L'assistant est momentanément indisponible. Réessayez dans quelques instants.",
      },
    });
  }
}
