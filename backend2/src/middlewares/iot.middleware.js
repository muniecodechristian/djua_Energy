import config from '../config/env.config.js';

export function authenticateDevice(req, res, next) {
  const token = req.get('x-device-token');

  if (!config.iot.authRequired && process.env.NODE_ENV !== 'production') {
    return next();
  }

  if (!config.iot.apiKey) {
    return res.status(503).json({
      success: false,
      message: 'IOT_API_KEY is not configured on the server',
    });
  }

  if (!token || token !== config.iot.apiKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid device token',
    });
  }

  next();
}
