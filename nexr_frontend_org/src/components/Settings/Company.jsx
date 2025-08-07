import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import './SettingsStyle.css';
import RadioButtons from './RadioButtons';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import HouseRoundedIcon from '@mui/icons-material/HouseRounded';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import PolicyIcon from '@mui/icons-material/Policy';
import axios from 'axios';
import { toast } from 'react-toastify';
import { EssentialValues } from '../../App';
import { useNavigate } from 'react-router-dom';

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
          <Typography>{children}</Typography>
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

export default function CompanyTab() {
  const navigate = useNavigate();
  const [value, setValue] = useState(0);
  const names = ["Show", "Hide"];
  const url = process.env.REACT_APP_API_URL;
  const {data} = useContext(EssentialValues);

  const [RadioOption, setRadioOption] = useState({
    CompanyName: "",
    EmpStatus: 0,
    EmpEmail: 0,
    EmpInfo: 0,
    AllowOvertime: 0,
    RecordOvertime: 0,
    ToilLeaveApproval: 0,
    AbsenceConflict: 0,
    AnnualLeaveCarryOver: 0,
    EmpLeaveCancel: 0,
    RotasPermissions: 0,
    HideLabelForEmp: 0
  })

  // Policy Settings State
  const [policySettings, setPolicySettings] = useState({
    attendance: {
      monthlyPermissionLimit: 2,
      permissionHourLimit: 120,
      lateLoginPenaltyThreshold: 240,
      permissionGrantDuration: 2,
      warningLimit: 3,
      overtimeLimit: 12
    },
    leave: {
      teamLeaveLimit: 2,
      teamWfhLimit: 2,
      autoRejectTime: '23:59',
      annualLeaveDefault: 14
    },
    payroll: {
      generationDay: 25,
      workingHoursPerDay: 8
    },
    notifications: {
      reminderFrequency: 'daily',
      autoProcessingEnabled: true
    }
  })

  function handleSubmit() {
    const body = RadioOption;
    axios.post(`${url}/api/company-settings`, body, {
      headers: {
        authorization: data.token || ""
      }
    }).then((res) => {
      toast.success(res.data)
      setRadioOption({})
    }).catch((err) => {
      toast.error(err.response.data.error)
    })
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // Step 2: Handle button click events
  const handleRadioOption = (name, value) => {
    setRadioOption({
      ...RadioOption,
      [name]: Number(value)
    })
  };

  function handleComName(e) {
    const { name, value } = e.target;
    setRadioOption({
      ...RadioOption,
      [name]: value
    })
  }

  function LabelWithIcon({ icon, label }) {
    const IconComponnet = icon;
    return (
      <div className='text-left d-flex align-items-center w-100 px-1'>
        <IconComponnet /> {label}
      </div>
    )
  }

  // Policy-related functions
  const handlePolicyChange = (section, field, value) => {
    setPolicySettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const fetchPolicySettings = async () => {
    try {
      const response = await axios.get(`${url}/api/company-policy`, {
        headers: {
          Authorization: data.token || ""
        }
      });
      
      if (response.data) {
        setPolicySettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching policy settings:', error);
      // Don't show error toast as this might be the first time setup
    }
  };

  const updatePolicySettings = async () => {
    try {
      await axios.put(`${url}/api/company-policy`, policySettings, {
        headers: {
          Authorization: data.token || ""
        }
      });
      toast.success('Policy settings updated successfully');
    } catch (error) {
      console.error('Error updating policy settings:', error);
      toast.error(error?.response?.data?.error || 'Failed to update policy settings');
    }
  };

  const applyPolicyTemplate = async (templateKey) => {
    try {
      await axios.post(`${url}/api/company-policy/template`, {
        template: templateKey
      }, {
        headers: {
          Authorization: data.token || ""
        }
      });
      await fetchPolicySettings(); // Refresh the settings after applying template
      toast.success(`${templateKey.charAt(0).toUpperCase() + templateKey.slice(1)} template applied successfully`);
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error(error?.response?.data?.error || 'Failed to apply template');
    }
  };

  const resetPolicyToDefaults = async () => {
    try {
      await axios.post(`${url}/api/company-policy/reset`, {}, {
        headers: {
          Authorization: data.token || ""
        }
      });
      await fetchPolicySettings(); // Refresh the settings after reset
      toast.success('Policy settings reset to defaults');
    } catch (error) {
      console.error('Error resetting policy settings:', error);
      toast.error(error?.response?.data?.error || 'Failed to reset policy settings');
    }
  };

  useEffect(() => {
    async function fetchCompanySettings() {
      try {
        const res = await axios.get(`${url}/api/company-settings`, {
          headers: {
            Authorization: data.token || ""
          }
        })
        setRadioOption(res.data)
     } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
        console.log(error);
        toast.error(error?.response?.data?.error)
      }
    }
    
    // Fetch both company settings and policy settings
    fetchCompanySettings();
    fetchPolicySettings();
  }, [])
  

  function checkAllValue() {
    return Object.values(RadioOption).every((value) => value !== "")
  }
  return (
    <>
      <Box
        className="aaa total_company_details"
        sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: 'fit-content' }}
      >
        <Tabs
          className='xxx'
          orientation="vertical"
          variant="scrollable"
          value={value}
          onChange={handleChange}
          aria-label="Vertical tabs example"
          sx={{ borderRight: 1, borderColor: 'divider' }}
        >
          <Tab label={<LabelWithIcon icon={EditOutlinedIcon} label={"Company wide Settings"} className="d-flex align-items-center" />} className='bbb' {...a11yProps(0)} />
          <Tab label={<LabelWithIcon icon={BadgeOutlinedIcon} label={"Employee Settings"} />} className='bbb' {...a11yProps(1)} />
          <Tab label={<LabelWithIcon icon={WatchLaterOutlinedIcon} label={"Overtime and TOIL"} />} className='bbb' {...a11yProps(2)} />
          <Tab label={<LabelWithIcon icon={HouseRoundedIcon} label={"Absence and Entitlement"} />} className='bbb' {...a11yProps(3)} />
          <Tab label={<LabelWithIcon icon={EventNoteOutlinedIcon} label={"Rotas"} />} className='bbb' {...a11yProps(4)} />
          <Tab label={<LabelWithIcon icon={PolicyIcon} label={"Policy Settings"} />} className='bbb' {...a11yProps(5)} />
        </Tabs>
        <TabPanel value={value} index={0} className={"zzz"}>
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="box-content">
                  <h5 className='my-3'>COMPANY WIDE SETTINGS</h5>
                  <div className="row">
                    <div className="col-lg-4">
                      <h6 className='my-2'>Company Name</h6>
                      <input type="text" name='CompanyName' value={RadioOption?.CompanyName} onChange={(e) => handleComName(e)} placeholder='Enter Company Name' className='form-control mb-2' />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        <TabPanel value={value} index={1} className={"zzz"}>
          <div className="row">
            <div className="col-lg-12">
              <div className="box-content">
                <h5 className='my-3'>EMPLOYEE SETTINGS</h5>
                <div className="row">
                  <div className="col-lg-8">
                    <h6 className='my-2'>Employee Status</h6>
                    <p>Enable this ability for employees to display their current status.</p>
                  </div>
                  <RadioButtons RadioOption={RadioOption.EmpStatus} name={"EmpStatus"} handleRadioOption={handleRadioOption} />
                </div>

                <div className="row">
                  <div className="col-lg-8">
                    <h6 className='my-2'>Hide Email Address</h6>
                    <p>Show or hide employee email addresses from others employees. this will affect: </p>

                    <ul className='subpoint'>
                      <li>The Employee hub</li>
                      <li>The contact details on the mobile app</li>
                    </ul>
                  </div>
                  <RadioButtons names={names} RadioOption={RadioOption.EmpEmail} name={"EmpEmail"} handleRadioOption={handleRadioOption} />
                </div>

                <div className="row">
                  <div className="col-lg-8">
                    <h6 className='my-2'>Hide Employee</h6>
                    <p>Hide Employee Details from other employees. Admin and manager are unaffected by this settings. This will take effect across all BrightHR products</p>
                  </div>
                  <RadioButtons RadioOption={RadioOption.EmpInfo} name={"EmpInfo"} handleRadioOption={handleRadioOption} />
                </div>
              </div>
            </div>
          </div>
          {/* </div> */}
        </TabPanel>
        <TabPanel value={value} index={2} className={"zzz"}>
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="box-content">
                  <h5 className='my-3'>OVERTIME AND TOIL</h5>
                  <h6 className='my-2'>Overtime</h6>
                  <p>Overtime refers to any hours worked by an employee that exceed their normal acheduled working hours.</p>

                  <div className="row my-2">
                    <div className="col-lg-8">
                      <h6>
                        Allow overtime
                      </h6>
                      <p>Select <b>Enable</b> to allow managers and admins to record additional
                        hours for employees and let staff book absences using the time
                        they've built up. If you choose <b>Disable</b>, managers and admins
                        won't be able to record any overtime and BrightHR will hide
                        all references to overtime from your account. <b>If you have
                          pending overtime requests you won't be able to manage them
                          if you disable overtime</b>.</p>
                    </div>
                    <RadioButtons RadioOption={RadioOption.AllowOvertime} name={"AllowOvertime"} handleRadioOption={handleRadioOption} />
                  </div>

                  <div className="row my-2">
                    <div className="col-lg-8">
                      <h6>
                        Record overtime
                      </h6>
                      <p className='my-2'>
                        By selecting Managers you're allowing only BrightHR managers to record Overtime for employees. To let employees record overtime themselves, select Everyone.
                      </p>
                    </div>
                    <RadioButtons names={["Everyone", "Managers"]} RadioOption={RadioOption.RecordOvertime} name={"RecordOvertime"} handleRadioOption={handleRadioOption} />
                  </div>

                  <div className="row my-2">
                    <div className="col-lg-8">
                      <h6>
                        Use TOIL balance
                      </h6>
                      <p className='my-2'>
                        By selecting <b>Everyone</b> employees will be able to send an absence request using their TOIL balance to their Manager or Admin for approval. By selecting <b>Managers</b>, only BrightHR managers will be able to book TOIL absences on behalf of their employees.
                      </p>
                    </div>
                    <RadioButtons names={["Everyone", "Managers"]} RadioOption={RadioOption.ToilLeaveApproval} name={"ToilLeaveApproval"} handleRadioOption={handleRadioOption} />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </TabPanel>
        <TabPanel value={value} index={3} className={"zzz"}>
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="box-content">
                  <h5 className='my-3'>ABSENCE AND ENTITILEMENT</h5>
                  <div className="row my-2">
                    <div className="col-lg-8">
                      <h6>
                        Absence conflict when not in teams
                      </h6>
                      <p className='my-2'>
                        If <b>enabled</b>, this setting allows you to also see absence conflicts between employees who haven't been added to a team.
                        <br />
                        If <b>disabled</b>, employees who haven't been added to a team won't show as absence conflicts with each other.
                      </p>
                    </div>

                    <RadioButtons RadioOption={RadioOption.AbsenceConflict} name={"AbsenceConflict"} handleRadioOption={handleRadioOption} />
                  </div>

                  <div className="row my-2">
                    <div className="col-lg-8">
                      <h6 className='mb-2'>
                        Annual leave carryover
                      </h6>
                      <p className='mt-2'>
                        Enables the ability to add a 'carryover balance for an employee, so they can carry over unused annual leave from one year to the next.
                        You can specify the amount to be carried over for each employee on their profile. N.B. Carryover balance will be used for annual
                        leave requests if that employee has a carryover balance, even if this switch is disabled.
                      </p>
                    </div>
                    <RadioButtons RadioOption={RadioOption.AnnualLeaveCarryOver} name={"AnnualLeaveCarryOver"} handleRadioOption={handleRadioOption} />

                  </div>

                  <div className="row">
                    <div className="col-lg-8">
                      <h6>

                        Prevent employees cancelling future annual leave

                      </h6>

                      <p>
                        Enabling this setting removes the ability for your employees
                        to delete their own annual leave requests.
                        Their manager or an administrator must take this action on their behalf.
                      </p>
                    </div>

                    <RadioButtons RadioOption={RadioOption.EmpLeaveCancel} name={"EmpLeaveCancel"} handleRadioOption={handleRadioOption} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        <TabPanel value={value} index={4} className={"zzz"}>
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="box-content">
                  <h5 className='my-3'>ROTAS</h5>
                  <div className="row my-2">
                    <div className="col-lg-8">
                      <h6>
                        Restricted rota permissions
                      </h6>
                      <p>
                        By enabling this setting, you are restricting the edit and delete capabilities of your managers.
                        Once created, rotas can be edited by the author and by admins.
                        Additional managers can be given edit permissions from the rota menu.                    </p>
                    </div>

                    <RadioButtons RadioOption={RadioOption.RotasPermissions} name={"RotasPermissions"} handleRadioOption={handleRadioOption} />
                  </div>

                  <div className="row my-2">
                    <div className="col-lg-8">
                      <h6 className='mb-2'>
                        Hide shift labels in rotas from employees
                      </h6>
                      <p className='mt-2'>
                        Enabling this setting will prevent employees from seeing any
                        colours and labels assigned to shifts on your rotas
                      </p>
                    </div>
                    <RadioButtons RadioOption={RadioOption.HideLabelForEmp} name={"HideLabelForEmp"} handleRadioOption={handleRadioOption} />

                  </div>

                  <div className="row">
                    <div className="col-lg-8">
                      <h6>

                        Ability to accept and decline shifts

                      </h6>

                      <p>
                        Select which employees have the ability to accept or decline shifts by clicking the button on the right
                      </p>
                      <p className='my-1' style={{ color: "gray" }}>
                        Please note: Amending these settings will only impact shifts assigned after changes are saved.
                      </p>
                    </div>

                    <div className='col-lg-4 text-center'>
                      <button className='button' style={{ fontSize: "13px", width: "100%" }}>
                        Select Eligible Employees
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        <TabPanel value={value} index={5} className={"zzz"}>
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="box-content">
                  <h5 className='my-3'>COMPANY POLICY SETTINGS</h5>
                  <div className="alert alert-info">
                    Configure company-wide policies for attendance, leave, payroll, and notifications. These settings will be applied across all HR operations.
                  </div>
                  
                  {/* Attendance Policy Section */}
                  <div className="row my-4">
                    <div className="col-lg-12">
                      <h6 className="mb-3 text-primary">📅 Attendance Policy</h6>
                      <div className="row">
                        <div className="col-lg-6">
                          <label className="form-label">Monthly Permission Limit</label>
                          <input 
                            type="number" 
                            className="form-control mb-2" 
                            value={policySettings?.attendance?.monthlyPermissionLimit}
                            onChange={(e) => handlePolicyChange('attendance', 'monthlyPermissionLimit', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                          <small className="text-muted">Maximum permissions per employee per month</small>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Permission Duration Limit (minutes)</label>
                          <input 
                            type="number" 
                            className="form-control mb-2" 
                            value={policySettings?.attendance?.permissionHourLimit}
                            onChange={(e) => handlePolicyChange('attendance', 'permissionHourLimit', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                          <small className="text-muted">Maximum duration for a single permission</small>
                        </div>
                      </div>
                      <div className="row mt-3">
                        <div className="col-lg-6">
                          <label className="form-label">Late Login Penalty Threshold (minutes)</label>
                          <input 
                            type="number" 
                            className="form-control mb-2" 
                            value={policySettings?.attendance?.lateLoginPenaltyThreshold}
                            onChange={(e) => handlePolicyChange('attendance', 'lateLoginPenaltyThreshold', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                          <small className="text-muted">Minutes after which late login results in penalty</small>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Warning Limit</label>
                          <input 
                            type="number" 
                            className="form-control mb-2" 
                            value={policySettings?.attendance?.warningLimit}
                            onChange={(e) => handlePolicyChange('attendance', 'warningLimit', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                          <small className="text-muted">Maximum warnings before action is taken</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Leave Policy Section */}
                  <div className="row my-4">
                    <div className="col-lg-12">
                      <h6 className="mb-3 text-success">🏖️ Leave Policy</h6>
                      <div className="row">
                        <div className="col-lg-6">
                          <label className="form-label">Team Leave Limit</label>
                          <input 
                            type="number" 
                            className="form-control mb-2" 
                            value={policySettings?.leave?.teamLeaveLimit}
                            onChange={(e) => handlePolicyChange('leave', 'teamLeaveLimit', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                          <small className="text-muted">Maximum team members on leave simultaneously</small>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Team Work From Home Limit</label>
                          <input 
                            type="number" 
                            className="form-control mb-2" 
                            value={policySettings?.leave?.teamWfhLimit}
                            onChange={(e) => handlePolicyChange('leave', 'teamWfhLimit', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                          <small className="text-muted">Maximum team members working from home simultaneously</small>
                        </div>
                      </div>
                      <div className="row mt-3">
                        <div className="col-lg-6">
                          <label className="form-label">Auto-reject Time</label>
                          <input 
                            type="time" 
                            className="form-control mb-2" 
                            value={policySettings?.leave?.autoRejectTime}
                            onChange={(e) => handlePolicyChange('leave', 'autoRejectTime', e.target.value)}
                          />
                          <small className="text-muted">Time after which pending requests are auto-rejected</small>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Annual Leave Default (days)</label>
                          <input 
                            type="number" 
                            className="form-control mb-2" 
                            value={policySettings?.leave?.annualLeaveDefault}
                            onChange={(e) => handlePolicyChange('leave', 'annualLeaveDefault', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                          <small className="text-muted">Default annual leave allocation for new employees</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payroll Policy Section */}
                  <div className="row my-4">
                    <div className="col-lg-12">
                      <h6 className="mb-3 text-warning">💰 Payroll Policy</h6>
                      <div className="row">
                        <div className="col-lg-6">
                          <label className="form-label">Payroll Generation Day</label>
                          <input 
                            type="number" 
                            className="form-control mb-2" 
                            value={policySettings?.payroll?.generationDay}
                            onChange={(e) => handlePolicyChange('payroll', 'generationDay', parseInt(e.target.value) || 0)}
                            min="1"
                            max="31"
                          />
                          <small className="text-muted">Day of the month when payroll is generated</small>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Working Hours Per Day</label>
                          <input 
                            type="number" 
                            className="form-control mb-2" 
                            value={policySettings?.payroll?.workingHoursPerDay}
                            onChange={(e) => handlePolicyChange('payroll', 'workingHoursPerDay', parseInt(e.target.value) || 0)}
                            min="1"
                            max="24"
                          />
                          <small className="text-muted">Standard working hours per day</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notification Policy Section */}
                  <div className="row my-4">
                    <div className="col-lg-12">
                      <h6 className="mb-3 text-info">🔔 Notification Policy</h6>
                      <div className="row">
                        <div className="col-lg-6">
                          <label className="form-label">Reminder Frequency</label>
                          <select 
                            className="form-control mb-2" 
                            value={policySettings?.notifications?.reminderFrequency}
                            onChange={(e) => handlePolicyChange('notifications', 'reminderFrequency', e.target.value)}
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                          <small className="text-muted">How often reminder notifications are sent</small>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Auto Processing</label>
                          <select 
                            className="form-control mb-2" 
                            value={policySettings?.notifications?.autoProcessingEnabled}
                            onChange={(e) => handlePolicyChange('notifications', 'autoProcessingEnabled', e.target.value === 'true')}
                          >
                            <option value={true}>Enabled</option>
                            <option value={false}>Disabled</option>
                          </select>
                          <small className="text-muted">Enable automatic processing of requests</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Templates Section */}
                  <div className="row my-4">
                    <div className="col-lg-12">
                      <h6 className="mb-3 text-secondary">🚀 Quick Templates</h6>
                      <div className="row">
                        <div className="col-lg-4">
                          <div className="card border-success">
                            <div className="card-body">
                              <h6 className="card-title text-success">Startup Template</h6>
                              <p className="card-text small">Flexible policies for growing startups</p>
                              <button 
                                className="btn btn-outline-success btn-sm" 
                                onClick={() => applyPolicyTemplate('startup')}
                              >
                                Apply Template
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="card border-primary">
                            <div className="card-body">
                              <h6 className="card-title text-primary">Corporate Template</h6>
                              <p className="card-text small">Standard policies for established companies</p>
                              <button 
                                className="btn btn-outline-primary btn-sm" 
                                onClick={() => applyPolicyTemplate('corporate')}
                              >
                                Apply Template
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="card border-warning">
                            <div className="card-body">
                              <h6 className="card-title text-warning">Enterprise Template</h6>
                              <p className="card-text small">Strict policies for large enterprises</p>
                              <button 
                                className="btn btn-outline-warning btn-sm" 
                                onClick={() => applyPolicyTemplate('enterprise')}
                              >
                                Apply Template
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row mt-3">
                        <div className="col-lg-6">
                          <button 
                            className="btn btn-outline-secondary" 
                            onClick={resetPolicyToDefaults}
                          >
                            Reset to Default Settings
                          </button>
                        </div>
                        <div className="col-lg-6 text-end">
                          <button 
                            className="btn btn-success" 
                            onClick={updatePolicySettings}
                          >
                            Save Policy Settings
                          </button>
                        </div>
                      </div>
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
          <button className='outline-btn'>Cancel</button>
        </div>
        <div>
          <button className='button' onClick={handleSubmit} disabled={!checkAllValue()}>Update</button>
        </div>
      </div>
    </>
  );
}
