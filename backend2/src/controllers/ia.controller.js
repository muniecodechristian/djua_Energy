import iaService from '../services/ia.service.js';

export async function postConversation(req, res) {
  const { message, context ={} } = req.body ;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Field "message" is required and must be a string.' });
  }

  try {
    const result = await iaService.postConversation({ message, context });
    return res.json({ success: true, data: result });
  } catch (err) {
    const status = err.status || 500;
    const payload = err.data || { message: err.message };
    return res.status(status).json({ success: false, error: payload });
  }
}
