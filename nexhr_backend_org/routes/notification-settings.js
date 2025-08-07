const express = require('express');
const router = express.Router();
const NotificationSettings = require('../models/NotificationSettingsModel');
const { verifyAdminHR, verifyAdminHREmployeeManagerNetwork } = require('../auth/authMiddleware');
const { getCompanyIdFromToken } = require('../Reuseable_functions/reusableFunction');

// Get notification settings for a company
router.get('/', verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }

    let settings = await NotificationSettings.findOne({ companyId });
    console.log("settings", settings)
    // If no settings found, create default settings
    if (!settings) {
      settings = new NotificationSettings({ companyId });
      await settings.save();
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings',
      error: error.message
    });
  }
});

// Update notification settings for a company
router.put('/', verifyAdminHR, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }
    const updateData = req.body;

    let settings = await NotificationSettings.findOne({ companyId });

    if (!settings) {
      // Create new settings if none exist
      settings = new NotificationSettings({ companyId, ...updateData });
    } else {
      // Update existing settings
      Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'object' && updateData[key] !== null && !Array.isArray(updateData[key])) {
          // For nested objects, merge properties
          settings[key] = { ...settings[key], ...updateData[key] };
        } else {
          settings[key] = updateData[key];
        }
      });
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message
    });
  }
});

// Update specific module settings
router.patch('/:module', verifyAdminHR, async (req, res) => {
  try {
    console.log("calling", req.params.module)
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }
    const { module } = req.params;
    const moduleSettings = req.body;

    let settings = await NotificationSettings.findOne({ companyId });

    if (!settings) {
      settings = new NotificationSettings({ companyId });
    }

    // Validate module exists
    const validModules = [
      'leaveManagement',
      'wfhManagement',
      'employeeOnboarding',
      'attendanceManagement',
      'taskManagement',
      'holidayNotifications',
      'administrative',
      'globalSettings',
      'templates'
    ];

    if (!validModules.includes(module)) {
      return res.status(400).json({
        success: false,
        message: `Invalid module: ${module}`
      });
    }

    // Update specific module
    settings[module] = { ...settings[module], ...moduleSettings };
    await settings.save();

    res.json({
      success: true,
      message: `${module} settings updated successfully`,
      data: settings[module]
    });
  } catch (error) {
    console.error(`Error updating ${req.params.module} settings:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to update ${req.params.module} settings`,
      error: error.message
    });
  }
});

// Reset to default settings
router.post('/reset', verifyAdminHR, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }
    const { modules } = req.body; // Optional: array of specific modules to reset

    let settings = await NotificationSettings.findOne({ companyId });

    if (!settings) {
      settings = new NotificationSettings({ companyId });
    } else if (modules && Array.isArray(modules)) {
      // Reset specific modules only
      const defaultSettings = new NotificationSettings({ companyId });
      modules.forEach(module => {
        if (defaultSettings[module]) {
          settings[module] = defaultSettings[module];
        }
      });
    } else {
      // Reset all settings
      await NotificationSettings.findOneAndDelete({ companyId });
      settings = new NotificationSettings({ companyId });
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Notification settings reset to default successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error resetting notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset notification settings',
      error: error.message
    });
  }
});

// Get notification settings by module
router.get('/:module', verifyAdminHREmployeeManagerNetwork, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }
    const { module } = req.params;

    const settings = await NotificationSettings.findOne({ companyId });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Notification settings not found'
      });
    }

    if (!settings[module]) {
      return res.status(400).json({
        success: false,
        message: `Invalid module: ${module}`
      });
    }

    res.json({
      success: true,
      data: settings[module]
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.module} settings:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${req.params.module} settings`,
      error: error.message
    });
  }
});

// Bulk toggle notifications (enable/disable all)
router.post('/bulk-toggle', verifyAdminHR, async (req, res) => {
  try {
    const companyId = getCompanyIdFromToken(req.headers["authorization"]);
    if (!companyId) {
      return res.status(400).send({ error: "You are not part of any company. Please check with your higher authorities." });
    }
    const { enabled, modules } = req.body; // enabled: boolean, modules: array (optional)

    let settings = await NotificationSettings.findOne({ companyId });

    if (!settings) {
      settings = new NotificationSettings({ companyId });
    }

    const targetModules = modules || [
      'leaveManagement',
      'wfhManagement',
      'employeeOnboarding',
      'attendanceManagement',
      'taskManagement',
      'holidayNotifications',
      'administrative'
    ];

    targetModules.forEach(module => {
      if (settings[module]) {
        Object.keys(settings[module]).forEach(key => {
          if (typeof settings[module][key] === 'boolean') {
            settings[module][key] = enabled;
          }
        });
      }
    });

    await settings.save();

    res.json({
      success: true,
      message: `All notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: settings
    });
  } catch (error) {
    console.error('Error bulk toggling notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk toggle notifications',
      error: error.message
    });
  }
});

module.exports = router;
