import * as React from 'react';
import "./SettingsStyle.css";
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import CompanyTab from './Company';
import Permission from './Permission';
import TimePattern from './TimePattern';
import Notification from './Notification';
import WorkPlaceTab from './WorkPlace';
import TimezoneTab from './TimezoneTab';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function Settings() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{width: '100%'}}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange}  aria-label="basic tabs example">
          <Tab label="Company" {...a11yProps(0)} className='ccc' />
          <Tab label="Permission" {...a11yProps(1)} className='ccc'/>
          <Tab label="Working time patterns" {...a11yProps(2)} className='ccc'/>
          <Tab label="Notifications" {...a11yProps(3)} className='ccc' />
          <Tab label="Place of work" {...a11yProps(4)} className='ccc'/>
          <Tab label="Time zone"  {...a11yProps(5)} className='ccc'/>
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
         <CompanyTab />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <Permission />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <TimePattern />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
        <Notification />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={4}>
        <WorkPlaceTab />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={5}>
        <TimezoneTab />
      </CustomTabPanel>
    </Box>
  );
}
