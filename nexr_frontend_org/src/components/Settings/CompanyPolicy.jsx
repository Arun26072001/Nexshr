import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import './SettingsStyle.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { EssentialValues } from '../../App';
import { useNavigate } from 'react-router-dom';

// Icons
import PolicyIcon from '@mui/icons-material/Policy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PaymentIcon from '@mui/icons-material/Payment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { DatePicker, InputNumber, TimePicker } from 'rsuite';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  };
}

function LabelWithIcon({ icon, label }) {
  const IconComponent = icon;
  return (
    <div className='text-left d-flex align-items-center w-100 px-1'>
      <IconComponent sx={{ mr: 1 }} />
      {label}
    </div>
  );
}

export default function CompanyPolicy() {
  const navigate = useNavigate();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const { data } = useContext(EssentialValues);
  const url = process.env.REACT_APP_API_URL;

  // Policy state
  const [policySettings, setPolicySettings] = useState({});

  const fetchPolicySettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/company-policy`, {
        headers: {
          Authorization: data.token || ""
        }
      });
      console.log("settings", response.data);

      if (response.data) {
        setPolicySettings(response.data.policy);
      }
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue");
      }
      console.error('Error fetching policy settings:', error);
      toast.error(error?.response?.data?.error || 'Failed to fetch policy settings');
    } finally {
      setLoading(false);
    }
  };

  // Update policy settings
  const updatePolicySettings = async () => {
    try {
      setLoading(true);
      await axios.put(`${url}/api/company-policy`, policySettings, {
        headers: {
          Authorization: data.token || ""
        }
      });
      toast.success('Policy settings updated successfully');
    } catch (error) {
      console.error('Error updating policy settings:', error);
      toast.error(error?.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (section, field, value) => {
    setPolicySettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    fetchPolicySettings();
  }, []);

  const renderTextField = (section, field, label, type = 'number', helperText = '') => {
    const value = policySettings?.[section]?.[field];

    if (type === 'time') {
      const strToDate = (val) => {
        if (!val || typeof val !== 'string') return null;
        const [hStr, mStr] = val.split(':');
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
      };
      const dateToHHmm = (d) => {
        if (!d) return '';
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      };

      return (
        <>
          <TimePicker
            format="HH:mm"
            style={{ width: '100%', marginTop: '16px' }}
            size="lg"
            value={strToDate(value)}
            onChange={(date) => {
              handleInputChange(section, field, dateToHHmm(date));
            }}
            placeholder="Select time"
            cleanable
          />
          <p style={{ fontSize: "0.75rem", color: "#6c757d", marginTop: "4px" }}>{helperText}</p>
        </>
      );
    }

    return (
      <TextField
        fullWidth
        type={type}
        value={value}
        onChange={(e) =>
          handleInputChange(
            section,
            field,
            type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
          )
        }
        helperText={helperText}
        margin="normal"
        size="small"
      />
    );
  };

  const renderSelectField = (section, field, label, options = [], helperText = '') => (
  <FormControl fullWidth margin="normal" size="small">
    <InputLabel>{label}</InputLabel>
    <Select
      value={policySettings?.[section]?.[field] ?? ""}
      label={label}
      onChange={(e) => handleInputChange(section, field, e.target.value)}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
    {helperText && <p style={{ fontSize: "0.75rem", color: "#6c757d", marginTop: "4px" }}>{helperText}</p>}
  </FormControl>
);

  return (
    <>
      <Box
        className="total_company_details"
        sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: 'fit-content' }}
      >
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={value}
          onChange={handleChange}
          aria-label="Company policy tabs"
          sx={{ borderRight: 1, borderColor: 'divider', minWidth: 250 }}
        >
          <Tab
            label={<LabelWithIcon icon={AccessTimeIcon} label="Attendance Policy" />}
            className="bbb"
            {...a11yProps(0)}
          />
          <Tab
            label={<LabelWithIcon icon={EventAvailableIcon} label="Leave Policy" />}
            className="bbb"
            {...a11yProps(1)}
          />
          <Tab
            label={<LabelWithIcon icon={PaymentIcon} label="Payroll Policy" />}
            className="bbb"
            {...a11yProps(2)}
          />
          <Tab
            label={<LabelWithIcon icon={NotificationsIcon} label="Notification Policy" />}
            className="bbb"
            {...a11yProps(3)}
          />
          {/* <Tab
            label={<LabelWithIcon icon={PolicyIcon} label="Templates" />}
            className="bbb"
            {...a11yProps(4)}
          /> */}
        </Tabs>

        {/* Attendance Policy Tab */}
        <TabPanel value={value} index={0} className="zzz">
          <div className="container">
            <div className="row" style={{ marginBottom: "50px" }}>
              <div className="col-lg-12">
                <div className="box-content">
                  <h5 className='my-3'>ATTENDANCE POLICY</h5>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    These settings control attendance-related policies like permissions, late logins, and overtime limits.
                  </Alert>

                  <div className="row">
                    <div className="col-lg-6">
                      {renderTextField('attendance', 'monthlyPermissionLimit', 'Monthly Permission Limit', 'number', 'Maximum permissions allowed per employee per month')}
                    </div>
                    <div className="col-lg-6">
                      {renderTextField('attendance', 'permissionHourLimit', 'Permission Hour Limit (minutes)', 'number', 'Maximum duration for a single permission in minutes')}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-lg-6">
                      {renderTextField('attendance', 'lateLoginPenaltyThreshold', 'Late Login Penalty Threshold (minutes)', 'number', 'Minutes after which late login results in penalty')}
                    </div>
                    <div className="col-lg-6">
                      {renderTextField('attendance', 'defaultStartTime', 'Default Start Time (HH:mm)', 'time', 'Default daily start time for attendance calculations')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Leave Policy Tab */}
        <TabPanel value={value} index={1} className="zzz">
          <div className="container">
            <div className="row" style={{ marginBottom: "50px" }}>
              <div className="col-lg-12">
                <div className="box-content">
                  <h5 className='my-3'>LEAVE POLICY</h5>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Configure team leave limits, work from home policies, and leave processing settings.
                  </Alert>

                  <div className="row">
                    <div className="col-lg-6">
                      {renderTextField('leave', 'teamLeaveLimit', 'Team Leave Limit', 'number', 'Maximum team members on leave simultaneously')}
                    </div>
                    <div className="col-lg-6">
                      {renderTextField('leave', 'teamWfhLimit', 'Team WFH Limit', 'number', 'Maximum team members working from home simultaneously')}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-lg-6">
                      {renderTextField('leave', 'autoRejectTime', 'Auto-reject Time', 'time', 'Time after which pending leave requests are auto-rejected')}
                    </div>
                    <div className="col-lg-6">
                      {renderTextField('leave', 'annualLeaveDefault', 'Annual Leave Default (days)', 'number', 'Default annual leave allocation for new employees')}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-lg-6">
                      {renderSelectField(
                        "leave",
                        "sickLeaveAdvanceApplication",
                        "Allow Same Day/Tomorrow Sick Leave",
                        [
                          { value: true, label: "Enabled" },
                          { value: false, label: "Disabled" },
                        ],
                        "Controls whether sick leave can be applied on the same or next day"
                      )}
                    </div>
                    <div className="col-lg-6">
                      {renderSelectField(
                        "leave",
                        "casualLeaveAdvanceApplication",
                        "Require Advance for Casual Leave",
                        [
                          { value: true, label: "Enabled" },
                          { value: false, label: "Disabled" },
                        ],
                        "Enforces prior application for casual leave"
                      )}
                    </div>
                    <div className="col-lg-6">
                      {renderSelectField(
                        "leave",
                        "medLeavePresc",
                        "Medical Leave Requires Prescription",
                        [
                          { value: true, label: "Yes" },
                          { value: false, label: "No" },
                        ],
                        "If enabled, a medical certificate is required for medical leave"
                      )}
                    </div>
                    <div className="col-lg-6">
                      {renderSelectField(
                        "leave",
                        "requireHRApproval",
                        "Require HR Approval",
                        [
                          { value: true, label: "Yes" },
                          { value: false, label: "No" },
                        ],
                        "Leave requests must be approved by HR"
                      )}
                    </div>
                    <div className="col-lg-6">
                      {renderSelectField(
                        "leave",
                        "requireTeamHigherAuthApproval",
                        "Require Team Higher Authority Approval",
                        [
                          { value: true, label: "Yes" },
                          { value: false, label: "No" },
                        ],
                        "Leave requests require approval from Leads/Managers"
                      )}
                    </div>
                    <div className="col-lg-6">
                      {renderSelectField(
                        "leave",
                        "autoApprovePermissions",
                        "Auto Approve Permissions",
                        [
                          { value: true, label: "Enabled" },
                          { value: false, label: "Disabled" },
                        ],
                        "Automatically approves permission requests without manual review"
                      )}
                    </div>
                    <div className="col-lg-12">
                      {renderSelectField(
                        "leave",
                        "currentDayPendingApplication",
                        "If a leave starting today remains pending",
                        [
                          { value: 'reject', label: 'Auto-reject at end of day' },
                          { value: 'no_action', label: 'Do nothing (keep pending)' },
                          { value: 'auto_approve', label: 'Auto-approve at end of day' },
                        ],
                        "Choose how to handle same-day pending leave applications at the end of the day"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Payroll Policy Tab */}
        <TabPanel value={value} index={2} className="zzz">
          <div className="container">
            <div className="row" style={{ marginBottom: "50px" }}>
              <div className="col-lg-12">
                <div className="box-content">
                  <h5 className='my-3'>PAYROLL POLICY</h5>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Set payroll generation schedules and working hour standards.
                  </Alert>

                  <div className="row">
                    <div className="col-lg-6">
                      <DatePicker
                        placement='rightStart'
                        value={new Date(policySettings?.["payroll"]?.["generationDate"]) || null}
                        onChange={(date) => handleInputChange("payroll", "generationDate", date)}
                        format="yyyy-MM-dd HH:mm:ss"
                        style={{ width: '100%', marginTop: '16px' }}
                        placeholder="Select generation date"
                        size="lg"
                      />
                      <small className="helperText">This is the date on which the payslip will be generated each month.</small>
                    </div>
                    <div className="col-lg-6">
                      <InputNumber step={.1}
                        style={{ width: '100%', marginTop: '16px' }}
                        size="lg"
                        value={policySettings?.["payroll"]?.["workingHoursPerDay"] || null}
                        onChange={(e) => handleInputChange("payroll", "workingHoursPerDay", e)} />
                      <small className="helperText">Standard working hours per day</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Notification Policy Tab */}
        <TabPanel value={value} index={3} className="zzz">
          <div className="container">
            <div className="row" style={{ marginBottom: "50px" }}>
              <div className="col-lg-12">
                <div className="box-content">
                  <h5 className='my-3'>NOTIFICATION POLICY</h5>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Configure notification frequency and automatic processing settings.
                  </Alert>

                    <div className="row">
    <div className="col-lg-6">
      {renderSelectField("notifications", "reminderFrequency", "Reminder Frequency", [
        { value: "daily", label: "Daily" },
        { value: "weekly", label: "Weekly" },
        { value: "monthly", label: "Monthly" },
      ])}
    </div>


    <div className="col-lg-6">
      {renderSelectField("notifications", "autoProcessingEnabled", "Auto Processing", [
        { value: true, label: "Enabled" },
        { value: false, label: "Disabled" },
      ])}
    </div>

    <div className="col-lg-6">
      {renderSelectField("notifications", "emailReminders", "Email Reminders", [
        { value: true, label: "Enabled" },
        { value: false, label: "Disabled" },
      ])}
    </div>

    <div className="col-lg-6">
      {renderSelectField("notifications", "pushNotifications", "Push Notifications", [
        { value: true, label: "Enabled" },
        { value: false, label: "Disabled" },
      ])}
    </div>
    <div className="col-lg-12">
      {renderSelectField("notifications", "reminderDaysMode", "Reminder Days", [
        { value: "workingday", label: "Working days only (Mon-Fri)" },
        { value: "everyday", label: "Every day (Sun-Sat)" },
      ], "Choose whether reminders are sent on all days or only weekdays")}
    </div>
  </div>

                </div>
              </div>
            </div>
          </div>
        </TabPanel>
      </Box>

      <div className='settingsFooter'>
        <div>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
        <div>
          <Button
            variant="contained"
            onClick={updatePolicySettings}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Policy Settings'}
          </Button>
        </div>
      </div>
    </>
  );



  
}

// {/* Templates Tab */}
// {/* <TabPanel value={value} index={4} className="zzz">
//   <div className="container">
//     <div className="row" style={{ marginBottom: "50px" }}>
//       <div className="col-lg-12">
//         <div className="box-content">
//           <h5 className='my-3'>POLICY TEMPLATES</h5>
//           <Alert severity="info" sx={{ mb: 2 }}>
//             Apply pre-configured policy templates or reset to default settings.
//           </Alert>

//           <div className="row">
//             {Object.entries(templates).map(([key, template]) => (
//               <div key={key} className="col-lg-4 mb-3">
//                 <div className="card">
//                   <div className="card-body">
//                     <h6 className="card-title">{template?.name}</h6>
//                     <p className="card-text">{template?.description}</p>
//                     <div className="mb-2">
//                       <Chip
//                         label={`${template?.settings?.attendance?.monthlyPermissionLimit} Monthly Permissions`}
//                         size="small"
//                         sx={{ mr: 1, mb: 1 }}
//                       />
//                       <Chip
//                         label={`${template?.settings?.leave?.teamLeaveLimit} Team Leave Limit`}
//                         size="small"
//                         sx={{ mr: 1, mb: 1 }}
//                       />
//                       <Chip
//                         label={`${template?.settings?.leave?.teamWfhLimit} WFH Limit`}
//                         size="small"
//                         sx={{ mr: 1, mb: 1 }}
//                       />
//                     </div>
//                     <Button
//                       variant="outlined"
//                       size="small"
//                       onClick={() => applyTemplate(key)}
//                       disabled={loading}
//                     >
//                       Apply Template
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className="row mt-4">
//             <div className="col-lg-12">
//               <Button
//                 variant="outlined"
//                 color="warning"
//                 onClick={resetToDefaults}
//                 disabled={loading}
//               >
//                 Reset to Default Settings
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// </TabPanel> */}

  // Template options
  // const templates = {
  //   startup: {
  //     name: 'Startup Template',
  //     description: 'Flexible policies for startup companies',
  //     settings: {
  //       attendance: {
  //         monthlyPermissionLimit: 3,
  //         permissionHourLimit: 180,
  //         lateLoginPenaltyThreshold: 360,
  //         permissionGrantDuration: 3,
  //         warningLimit: 5,
  //         overtimeLimit: 15
  //       },
  //       leave: {
  //         teamLeaveLimit: 3,
  //         teamWfhLimit: 3,
  //         autoRejectTime: '22:00',
  //         annualLeaveDefault: 20
  //       },
  //       payroll: {
  //         generationDay: 28,
  //         workingHoursPerDay: 8
  //       },
  //       notifications: {
  //         reminderFrequency: 'daily',
  //         autoProcessingEnabled: true
  //       }
  //     }
  //   },
  //   corporate: {
  //     name: 'Corporate Template',
  //     description: 'Standard policies for corporate organizations',
  //     settings: {
  //       attendance: {
  //         monthlyPermissionLimit: 2,
  //         permissionHourLimit: 120,
  //         lateLoginPenaltyThreshold: 240,
  //         permissionGrantDuration: 2,
  //         warningLimit: 3,
  //         overtimeLimit: 12
  //       },
  //       leave: {
  //         teamLeaveLimit: 2,
  //         teamWfhLimit: 2,
  //         autoRejectTime: '23:59',
  //         annualLeaveDefault: 14
  //       },
  //       payroll: {
  //         generationDay: 25,
  //         workingHoursPerDay: 8
  //       },
  //       notifications: {
  //         reminderFrequency: 'daily',
  //         autoProcessingEnabled: true
  //       }
  //     }
  //   },
  //   enterprise: {
  //     name: 'Enterprise Template',
  //     description: 'Strict policies for large enterprises',
  //     settings: {
  //       attendance: {
  //         monthlyPermissionLimit: 1,
  //         permissionHourLimit: 60,
  //         lateLoginPenaltyThreshold: 180,
  //         permissionGrantDuration: 1,
  //         warningLimit: 2,
  //         overtimeLimit: 10
  //       },
  //       leave: {
  //         teamLeaveLimit: 1,
  //         teamWfhLimit: 1,
  //         autoRejectTime: '18:00',
  //         annualLeaveDefault: 12
  //       },
  //       payroll: {
  //         generationDay: 30,
  //         workingHoursPerDay: 9
  //       },
  //       notifications: {
  //         reminderFrequency: 'weekly',
  //         autoProcessingEnabled: false
  //       }
  //     }
  //   }
  // };
  // console.log("settingsObj", policySettings)
  // Fetch current policy settings
  
  // Template options
  // const templates = {
  //   startup: {
  //     name: 'Startup Template',
  //     description: 'Flexible policies for startup companies',
  //     settings: {
  //       attendance: {
  //         monthlyPermissionLimit: 3,
  //         permissionHourLimit: 180,
  //         lateLoginPenaltyThreshold: 360,
  //         permissionGrantDuration: 3,
  //         warningLimit: 5,
  //         overtimeLimit: 15
  //       },
  //       leave: {
  //         teamLeaveLimit: 3,
  //         teamWfhLimit: 3,
  //         autoRejectTime: '22:00',
  //         annualLeaveDefault: 20
  //       },
  //       payroll: {
  //         generationDay: 28,
  //         workingHoursPerDay: 8
  //       },
  //       notifications: {
  //         reminderFrequency: 'daily',
  //         autoProcessingEnabled: true
  //       }
  //     }
  //   },
  //   corporate: {
  //     name: 'Corporate Template',
  //     description: 'Standard policies for corporate organizations',
  //     settings: {
  //       attendance: {
  //         monthlyPermissionLimit: 2,
  //         permissionHourLimit: 120,
  //         lateLoginPenaltyThreshold: 240,
  //         permissionGrantDuration: 2,
  //         warningLimit: 3,
  //         overtimeLimit: 12
  //       },
  //       leave: {
  //         teamLeaveLimit: 2,
  //         teamWfhLimit: 2,
  //         autoRejectTime: '23:59',
  //         annualLeaveDefault: 14
  //       },
  //       payroll: {
  //         generationDay: 25,
  //         workingHoursPerDay: 8
  //       },
  //       notifications: {
  //         reminderFrequency: 'daily',
  //         autoProcessingEnabled: true
  //       }
  //     }
  //   },
  //   enterprise: {
  //     name: 'Enterprise Template',
  //     description: 'Strict policies for large enterprises',
  //     settings: {
  //       attendance: {
  //         monthlyPermissionLimit: 1,
  //         permissionHourLimit: 60,
  //         lateLoginPenaltyThreshold: 180,
  //         permissionGrantDuration: 1,
  //         warningLimit: 2,
  //         overtimeLimit: 10
  //       },
  //       leave: {
  //         teamLeaveLimit: 1,
  //         teamWfhLimit: 1,
  //         autoRejectTime: '18:00',
  //         annualLeaveDefault: 12
  //       },
  //       payroll: {
  //         generationDay: 30,
  //         workingHoursPerDay: 9
  //       },
  //       notifications: {
  //         reminderFrequency: 'weekly',
  //         autoProcessingEnabled: false
  //       }
  //     }
  //   }
  // };
  // console.log("settingsObj", policySettings)
  // Fetch current policy settings
  