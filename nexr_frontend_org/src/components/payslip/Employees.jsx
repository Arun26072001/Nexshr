import * as React from 'react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import AddEmployee from '../AddEmployee';
import ManageTeam from './ManageTeam';
import "../leaveForm.css";

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      className='rmpd'
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

export default function Employees() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className='boxParent'>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="Employees" {...a11yProps(0)} />
            <Tab label="Manage teams" {...a11yProps(1)} />
            <Tab label="Vaccinated Employees" {...a11yProps(2)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <AddEmployee />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <ManageTeam />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          Vaccinated Employees
        </CustomTabPanel>
      </Box>
    </div>
  );
}

