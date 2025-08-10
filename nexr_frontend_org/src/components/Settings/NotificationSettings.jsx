import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Switch, FormControlLabel,
  Accordion, AccordionSummary, AccordionDetails, Button, Grid,
  Alert, Chip, IconButton, Tooltip, CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import './SettingsStyle.css';
import { Toggle } from 'rsuite';

const NotificationSettings = () => {
  const url = process.env.REACT_APP_API_URL;
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [globalToggle, setGlobalToggle] = useState(true);

  const token = localStorage.getItem('token');

  // Module configurations with display names and icons
  const moduleConfig = {
    leaveManagement: {
      title: 'Leave Management',
      description: 'Application, approval, rejection, and reminder notifications',
      // icon: '🏖️',
      color: 'black'
    },
    wfhManagement: {
      title: 'Work From Home',
      description: 'WFH application, approval, and team limit notifications',
      // icon: '🏠',
      color: 'black'
    },
    employeeManagement: {
      title: 'Employee Onboarding',
      description: 'Welcome emails, credential updates, and onboarding progress',
      // icon: '👋',
      color: 'black'
    },
    attendanceManagement: {
      title: 'Attendance Management',
      description: 'Late punch, break reminders, and daily reports',
      // icon: '⏰',
      color: 'black'
    },
    taskManagement: {
      title: 'Task Management',
      description: 'Task assignments, completion, and deadline reminders',
      // icon: '📋',
      color: 'black'
    },
    holidayNotifications: {
      title: 'Holiday Notifications',
      description: 'Holiday list updates and upcoming holiday reminders',
      // icon: '🎉',
      color: 'black'
    },
    administrative: {
      title: 'Administrative',
      description: 'System updates, policy changes, and announcements',
      // icon: '⚙️',
      color: 'black'
    }
  };

  // Notification type display names
  const notificationTypeNames = {
    application: 'Applications',
    approval: 'Approvals',
    rejection: 'Rejections',
    reminders: 'Reminders',
    applicationUpdates: 'Application Updates',
    approvalDeadlines: 'Approval Deadlines',
    balanceAlerts: 'Balance Alerts',
    teamLimitAlerts: 'Team Limit Alerts',
    welcomeEmails: 'Welcome Emails',
    credentialUpdates: 'Credential Updates',
    documentReminders: 'Document Reminders',
    onboardingProgress: 'Onboarding Progress',
    completionNotifications: 'Completion Notifications',
    taskAssignments: 'Task Assignments',
    latePunchNotifications: 'Late Punch Notifications',
    breakReminders: 'Break Reminders',
    dailyReports: 'Daily Reports',
    overtimeAlerts: 'Overtime Alerts',
    clockInReminders: 'Clock In Reminders',
    clockOutReminders: 'Clock Out Reminders',
    attendanceAnomalies: 'Attendance Anomalies',
    monthlyReports: 'Monthly Reports',
    assignment: 'Assignments',
    completion: 'Completions',
    commentNotifications: 'Comments',
    deadlineReminders: 'Deadline Reminders',
    statusUpdates: 'Status Updates',
    overdueTasks: 'Overdue Tasks',
    projectUpdates: 'Project Updates',
    holidayListCreation: 'Holiday List Creation',
    holidayListUpdates: 'Holiday List Updates',
    upcomingHolidays: 'Upcoming Holidays',
    holidayReminders: 'Holiday Reminders',
    companyEvents: 'Company Events',
    timeScheduleChanges: 'Schedule Changes',
    annualLeaveRenewals: 'Leave Renewals',
    policyUpdates: 'Policy Updates',
    systemMaintenance: 'System Maintenance',
    companyAnnouncements: 'Announcements',
    userPermissionChanges: 'Permission Changes',
    reportGeneration: 'Report Generation'
  };

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      const response = await axios.get(`${url}/api/notification-settings`, {
        headers: { Authorization: `${token}` }
      });
      console.log("notificationData", response.data);
      setSettings(response.data.data);
      calculateGlobalToggle(response.data.data);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      toast.error('Failed to fetch notification settings');
    } finally {
      setLoading(false);
    }
  };

  const calculateGlobalToggle = (settingsData) => {
    const modules = ['leaveManagement', 'wfhManagement', 'employeeManagement',
      'attendanceManagement', 'taskManagement', 'holidayNotifications', 'administrative'];

    let enabledCount = 0;
    let totalCount = 0;

    modules.forEach(module => {
      if (settingsData[module]) {
        Object.values(settingsData[module]).forEach(value => {
          if (typeof value === 'boolean') {
            totalCount++;
            if (value) enabledCount++;
          }
        });
      }
    });

    setGlobalToggle(enabledCount > totalCount / 2);
  };

  const handleModuleToggle = async (module, enabled) => {
    setSaving(true);
    try {
      const moduleSettings = {};
      Object.keys(settings?.[module]).forEach(key => {
        if (typeof settings?.[module]?.[key] === 'boolean') {
          moduleSettings[key] = enabled;
        } else {
          moduleSettings[key] = settings?.[module]?.[key];
        }
      });

      const response = await axios.patch(`${url}/api/notification-settings/${module}`,
        moduleSettings, {
        headers: { Authorization: token }
      });

      setSettings(prev => ({
        ...prev,
        [module]: { ...prev[module], ...moduleSettings }
      }));

      calculateGlobalToggle({ ...settings, [module]: { ...settings[module], ...moduleSettings } });
      toast.success(`${moduleConfig[module].title} notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating module settings:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (module, notificationType, enabled) => {
    setSaving(true);
    try {
      const updatedModuleSettings = {
        ...settings[module],
        [notificationType]: enabled
      };

      const response = await axios.patch(`${url}/api/notification-settings/${module}`,
        updatedModuleSettings, {
        headers: { Authorization: token }
      });

      setSettings(prev => ({
        ...prev,
        [module]: updatedModuleSettings
      }));

      calculateGlobalToggle({ ...settings, [module]: updatedModuleSettings });
      toast.success(`${notificationTypeNames[notificationType]} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating notification setting:', error);
      toast.error('Failed to update notification setting');
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalToggle = async (enabled) => {
    setSaving(true);
    try {
      await axios.post(`${url}/api/notification-settings/bulk-toggle`,
        { enabled }, {
        headers: { Authorization: token }
      });

      await fetchNotificationSettings();
      toast.success(`All notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error bulk toggling notifications:', error);
      toast.error('Failed to update notifications');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    setSaving(true);
    try {
      await axios.post(`${url}/api/notification-settings/reset`, {}, {
        headers: { Authorization: token }
      });

      await fetchNotificationSettings();
      toast.success('Notification settings reset to defaults');
    } catch (error) {
      console.error('Error resetting notification settings:', error);
      toast.error('Failed to reset notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAccordionChange = (module) => (event, isExpanded) => {
    setExpandedModules(prev => ({
      ...prev,
      [module]: isExpanded
    }));
  };

  const getModuleEnabledCount = (module) => {
    if (!settings?.[module]) return { enabled: 0, total: 0 };

    const values = Object.values(settings?.[module]).filter(v => typeof v === 'boolean');
    return {
      enabled: values.filter(v => v).length,
      total: values.length
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <NotificationsIcon sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">
            Notification Settings
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchNotificationSettings}
            disabled={saving}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleResetToDefaults}
            disabled={saving}
          >
            Reset to Defaults
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configure notification preferences for different modules. You can enable or disable
        notifications globally or customize settings for each module individually.
      </Alert>

      {/* Global Toggle */}
      <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" gutterBottom>
                Master Notification Control
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enable or disable all notifications at once
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={globalToggle}
                  onChange={(e) => handleGlobalToggle(e.target.checked)}
                  disabled={saving}
                  size="large"
                />
              }
              label={globalToggle ? "All Notifications On" : "All Notifications Off"}
              labelPlacement="start"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Module Settings */}
      {Object.entries(moduleConfig).map(([module, config]) => {
        const { enabled, total } = getModuleEnabledCount(module);
        const moduleEnabled = enabled > 0;
        return (
          <Accordion
            key={module}
            expanded={expandedModules[module] || false}
            onChange={handleAccordionChange(module)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: moduleEnabled ? `${config.color}15` : '#f5f5f5',
                borderLeft: `4px solid ${config.color}`,
                '&:hover': { bgcolor: `${config.color}25` }
              }}
            >
              <Box display="flex" alignItems="center" gap={2} width="100%">
                {/* <Box sx={{ fontSize: 24 }}>{config.icon}</Box> */}
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {config.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {config.description}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip
                    label={`${enabled}/${total} enabled`}
                    size="small"
                    color={enabled === total ? 'success' : enabled > 0 ? 'warning' : 'default'}
                  />
                  <Tooltip title={`${moduleEnabled ? 'Disable' : 'Enable'} all ${config.title.toLowerCase()}`}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModuleToggle(module, !moduleEnabled);
                      }}
                      disabled={saving}
                      color={moduleEnabled ? 'success' : 'default'}
                    >
                      {<Toggle size="sm" defaultChecked={moduleEnabled} color="green" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              <Grid container spacing={2}>
                {Object.entries(settings?.[module] || {}).map(([key, value]) => {
                  if (typeof value === 'boolean') {
                    return (
                      <Grid item xs={12} sm={6} md={4} key={key}>
                        <FormControlLabel
                          control={
                            <Switch
                              // size='small'
                              checked={value}
                              onChange={(e) => handleNotificationToggle(module, key, e.target.checked)}
                              disabled={saving}
                            />
                          }
                          label={notificationTypeNames[key] || key}
                          sx={{
                            width: '100%',
                            m: 0,
                            '& .MuiFormControlLabel-label': {
                              // fontSize: '0.9rem',
                              flex: 1
                            }
                          }}
                        />
                      </Grid>
                    );
                  }
                  return null;
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Global Settings */}
      {/* {settings?.globalSettings && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <SettingsIcon /> Global Notification Settings
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.globalSettings.emailNotifications}
                      onChange={(e) => handleNotificationToggle('globalSettings', 'emailNotifications', e.target.checked)}
                      disabled={saving}
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.globalSettings.pushNotifications}
                      onChange={(e) => handleNotificationToggle('globalSettings', 'pushNotifications', e.target.checked)}
                      disabled={saving}
                    />
                  }
                  label="Push Notifications"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.globalSettings.smsNotifications}
                      onChange={(e) => handleNotificationToggle('globalSettings', 'smsNotifications', e.target.checked)}
                      disabled={saving}
                    />
                  }
                  label="SMS Notifications"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.globalSettings.browserNotifications}
                      onChange={(e) => handleNotificationToggle('globalSettings', 'browserNotifications', e.target.checked)}
                      disabled={saving}
                    />
                  }
                  label="Browser Notifications"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Notification Frequency</InputLabel>
                  <Select
                    value={settings.globalSettings.notificationFrequency}
                    label="Notification Frequency"
                    onChange={(e) => handleNotificationToggle('globalSettings', 'notificationFrequency', e.target.value)}
                    disabled={saving}
                  >
                    <MenuItem value="immediate">Immediate</MenuItem>
                    <MenuItem value="hourly">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.globalSettings.quietHours.enabled}
                      onChange={(e) => handleNotificationToggle('globalSettings', 'quietHours', { 
                        ...settings.globalSettings.quietHours, 
                        enabled: e.target.checked 
                      })}
                      disabled={saving}
                    />
                  }
                  label="Enable Quiet Hours"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )} */}

      {saving && (
        <Box position="fixed" bottom={20} right={20}>
          <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            Saving changes...
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default NotificationSettings;
