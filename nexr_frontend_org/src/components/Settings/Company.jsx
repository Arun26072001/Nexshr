import React, { useEffect, useState } from 'react';
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
import axios from 'axios';
import { toast } from 'react-toastify';

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
  const [value, setValue] = useState(0);
  const names = ["Show", "Hide"];
  const url = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem("token");

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

  function handleSubmit() {
    const body = RadioOption;
    axios.post(`${url}/api/company-settings`, body, {
      headers: {
        authorization: token || ""
      }
    }).then((res) => {
      toast.success(res.data)
      setRadioOption({})
    }).catch((err) => {
      console.log(err);
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

  useEffect(() => {
    checkAllValue()
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
                      <input type="text" name='CompanyName' onChange={(e) => handleComName(e)} placeholder='Enter Company Name' className='form-control mb-2' />
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
