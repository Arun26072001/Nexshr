import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import { fetchLeaveRequests } from './ReuseableAPI';
import CircleBar from './CircleProcess';
import { useNavigate } from 'react-router-dom';
import { EssentialValues } from '../App';

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

export default function Twotabs() {
  const { whoIs } = useContext(EssentialValues);
  const navigate = useNavigate();
  const { data } = useContext(EssentialValues);
  const { annualLeave, _id } = data;
  const [value, setValue] = useState(0);
  const [takenLeave, setTakenLeave] = useState(0);
  const today = new Date();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [upComingHoliday, setupComingHoliday] = useState("");

  const dateArray = [
    `${new Date().getFullYear()}-01-01`,
    `${new Date().getFullYear()}-01-15`,
    `${new Date().getFullYear()}-01-26`,
    `${new Date().getFullYear()}-03-29`,
    `${new Date().getFullYear()}-05-01`,
    `${new Date().getFullYear()}-08-15`,
    `${new Date().getFullYear()}-10-02`,
    `${new Date().getFullYear()}-10-11`,
    `${new Date().getFullYear()}-10-31`,
    `${new Date().getFullYear()}-12-25`
  ];

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    for (let i = 0; i < dateArray.length; i++) {
      const holidayDate = new Date(dateArray[i]);
      if (holidayDate > today) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        setupComingHoliday(new Intl.DateTimeFormat('default', options).format(holidayDate).replace(",", ""))
        break;
      }
    }
    // return (() => { })
  }, []);

  useEffect(() => {
    // debugger;
    const gettingLeaveRequests = async () => {
      if (_id) {
        const leaveReqs = await fetchLeaveRequests(_id);

        if (leaveReqs?.leaveApplications?.length > 0) {
          setLeaveRequests(leaveReqs.leaveApplications);

          leaveReqs.leaveApplications.forEach((req) => {
            // if (req.status === "pending" || req.status === "approved") {
            if (req.status === "approved") {
              let toDate = new Date(req.toDate);
              let fromDate = new Date(req.fromDate);
              let timeDifference = toDate - fromDate;
              const dayDifference = timeDifference === 0 ? 1 : timeDifference / (1000 * 60 * 60 * 24);

              setTakenLeave(prev => prev + dayDifference);  // Set this to the correct unit (e.g., days)
            }
          });
        } else {
          setTakenLeave(0);
        }
      }
    }

    gettingLeaveRequests();

    return () => {
      setTakenLeave(0);
    }
  }, []);


  return (
    <Box sx={{ width: '100%', border: '2px solid rgb(208 210 210)', borderRadius: '5px', height: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" style={{ backgroundColor: 'rgb(238, 247, 255)' }}>
          <Tab label="Absence" {...a11yProps(0)} />
          <Tab label="Overtime" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0} className="bg-light tabParent">
        <div className='empActivies'>
          <div className="d-flex justify-content-between w-100" style={{ fontSize: "12px", fontWeight: 600 }}>
            <div className=''>
              <button className='button' onClick={() => navigate(`/${whoIs}/leave-request`)}>Request time off</button>
            </div>
            <div className=''>
              <button className="outline-btn">Absence history</button>
            </div>
          </div>
          <div className="row" >
            <div className="leaveCircle col-lg-6 col-sm-12 col-md-12 p-0" >
              <CircleBar annualLeave={Number(annualLeave || 0)} takenLeave={takenLeave || 0} />
            </div>

            <div className='text-center col-lg-6 col-sm-12 col-md-12 p-0 m-auto' style={{ fontSize: "13px" }} >
              <p><b>{(Number(annualLeave) - takenLeave) || 0} Days</b> Remaining</p>
              <p><b>{annualLeave || 0} Days</b> Allowance</p>
            </div>
          </div>

          {
            leaveRequests?.map((req) => {
              // debugger;
              let todayDate = today.getTime()
              let leaveDate = new Date(req.fromDate).getTime()
              if (todayDate < leaveDate) {
                return (<div className={`leaveReq ${req.status === "pending" ? "bg-warning"
                  : req.status === "rejected" ? "bg-danger" : "bg-success"}`}>
                  {req.leaveType + " "}
                  {new Date(req.fromDate).toLocaleString("default", { month: "short" })} {new Date(req.fromDate).getDate()}th{" to "}{new Date(req.toDate).getDate()}th
                </div>)
              }
            })
          }

          <div className="text-dark">
            <p className='text-start'>Next up - Public Holiday</p>
            <p className='text-primary text-start'><b>{upComingHoliday}</b></p>
            <p className='mt-3 text-start'>You've also taken</p>
          </div>
          <div className='text-center'>
            <div className='w-100'>
              <button className='btn btn-outline-warning w-100 my-2'><WatchLaterIcon /> 0 Lateness</button>
            </div>
            <div className='w-100'>
              <button className='btn btn-outline-danger w-100'><CoronavirusIcon />0 Sickness</button>
            </div>
          </div>
        </div>
      </CustomTabPanel>

      <CustomTabPanel value={value} index={1}>
        Overtime
      </CustomTabPanel>
    </Box>
  );
}

