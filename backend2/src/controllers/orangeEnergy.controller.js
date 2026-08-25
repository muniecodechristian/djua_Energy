import orangeEnergyService from '../services/orangeEnergy.service.js';

export const getClients = async (req, res) => {
  try {
    const clients = await orangeEnergyService.syncAndGetClients();
    return res.status(200).json({
      success: true,
      data: clients
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error.message
    });
  }
};

export const getKits = async (req, res) => {
  try {
    const kits = await orangeEnergyService.syncAndGetKits();
    return res.status(200).json({
      success: true,
      data: kits
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error.message
    });
  }
};

export const getScoringData = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone parameter is required'
      });
    }

    const scoringData = await orangeEnergyService.syncAndGetScoringData(phone);
    if (!scoringData) {
      return res.status(404).json({
        success: false,
        message: 'Scoring data not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: scoringData
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error.message
    });
  }
};

export const getKitById = async (req, res) => {
  try {
    const { kitId } = req.params;
    if (!kitId) {
      return res.status(400).json({
        success: false,
        message: 'KitId parameter is required'
      });
    }

    const kit = await orangeEnergyService.syncAndGetKitById(kitId);
    if (!kit) {
      return res.status(404).json({
        success: false,
        message: 'Kit not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: kit
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error.message
    });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await orangeEnergyService.syncAndGetPayments();
    return res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error.message
    });
  }
};

export const getPaymentsByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone parameter is required'
      });
    }

    const payments = await orangeEnergyService.syncAndGetPaymentsByPhone(phone);
    return res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error.message
    });
  }
};