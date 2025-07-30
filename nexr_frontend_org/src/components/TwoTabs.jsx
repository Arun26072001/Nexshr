import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { checkEmpIsPermanentWFH, fetchLeaveRequests, getDayDifference } from './ReuseableAPI';
import CircleBar from './CircleProcess';
import { useNavigate } from 'react-router-dom';
import { EssentialValues } from '../App';
import { Badge, Calendar, Dropdown, HStack, Popover, Whisper } from 'rsuite';
import { Skeleton } from '@mui/material';
import AddHomeWorkRoundedIcon from '@mui/icons-material/AddHomeWorkRounded';

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
  const [isPermanentWFH, setIsPermanentWFH] = useState(false);
  const { annualLeave, _id } = data;
  const [value, setValue] = useState(0);
  const [takenLeave, setTakenLeave] = useState(0);
  const today = new Date();
  const [leaveRequests, setLeaveRequests] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [leaveData, setLeaveData] = useState([]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    // debugger;
    const gettingLeaveRequests = async () => {

      setIsLoading(true)
      if (_id) {
        const leaveReqs = await fetchLeaveRequests(_id);
        if (leaveReqs?.leaveApplications?.length > 0) {
          const correctApplications = [];

          leaveReqs.leaveApplications.forEach((req) => {
            let todayDate = today.getTime()
            let leaveDate = new Date(req.fromDate).getTime()
            if (leaveDate > todayDate) {
              correctApplications.push(req)
            }
            if (req.status === "approved" && !["Permission Leave", "Unpaid Leave (LWP)"].includes(req.leaveType)) {
              const dayDifference = Math.ceil(getDayDifference(req));
              setTakenLeave(prev => prev + Number(dayDifference.toFixed(2)));  // Set this to the correct unit (e.g., days)
            }
            setLeaveRequests({
              ...leaveReqs,
              leaveApplications: correctApplications
            });
          });
        } else {
          setTakenLeave(0);
        }
      }
      setIsLoading(false);
    }

    gettingLeaveRequests();

    return () => {
      setTakenLeave(0);
    }
  }, []);

  async function checkPermanentWFH() {
    const isPermanent = await checkEmpIsPermanentWFH(_id);
    if(isPermanent){
      setIsPermanentWFH(isPermanent);
    }
  }

  useEffect(() => {
    checkPermanentWFH()
  }, [])

  useEffect(() => {
    async function getEmpAllLeaveData() {
      setIsLoading(true);
      try {
        const res = await fetchLeaveRequests(data._id);
        if (res && res.leaveApplications) {
          setLeaveData(res.leaveApplications.map((leave) => ({
            title: `${leave.employee.FirstName[0].toUpperCase() + leave.employee.FirstName.slice(1)} ${leave.employee.LastName} (${leave.leaveType[0].toUpperCase() + leave.leaveType.slice(1)} - ${leave.status})`,
            start: new Date(leave.fromDate),
            end: new Date(leave.toDate),
            status: leave.status
          })))
        }
      } catch (error) {
        if (error?.message === "Network Error") {
          navigate("/network-issue")
        }
        console.log(error);
      } finally {
        setIsLoading(false)
      }
    }
    // if (["2", "3"].includes(data.Account)) {
    getEmpAllLeaveData();
    // }
  }, [])

  function getTodoList(date) {
    if (!date) return [];

    const current = new Date(date);
    current.setHours(0, 0, 0, 0); // Normalize time

    return leaveData?.filter((leave) => {
      const start = new Date(leave.start);
      const end = new Date(leave.end || leave.start); // fallback to start if no end

      // Normalize time for comparison
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return current >= start && current <= end;
    });
  }

  const renderMenu = (date) => ({ onClose, right, top, className }, ref) => {
    const list = getTodoList(date);

    if (!list.length) {
      return null; // Return null instead of []
    }

    const handleSelect = (eventKey) => {
      if (eventKey === 1) {
        // Handle selection
      }
      onClose();
    };

    return (
      <Popover ref={ref} className={className} style={{ right, top }} full>
        <Dropdown.Menu onSelect={handleSelect} title="Personal Settings">
          {list?.map((item) => (
            <Dropdown.Item key={item.start}>{item.title}</Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Popover>
    );
  };

  function highlightToLeave(date) {
    if (!leaveData || !leaveData.length) return null;

    // Find if the given date falls within any leave range
    const matchedLeave = leaveData.find((leave) => {
      const start = new Date(leave.start);
      const end = new Date(leave.end || leave.start); // fallback if no end

      // Normalize time to 00:00:00 for comparison
      start.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
      end.setHours(end.getHours(), end.getMinutes(), end.getSeconds(), 0);
      const current = new Date(date);
      current.setHours(0, 0, 0, 0);

      if (leaveRequests?.calendarLeaveApps?.includes(current.toLocaleDateString("en-GB"))) {
        return current.toLocaleDateString() === start.toLocaleDateString() || (current >= start && current <= end);
      }
    });

    if (matchedLeave) {
      const leaveStatus = matchedLeave.status;

      return (
        <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu(date)}>
          <div style={{ width: "20px", height: "20px" }}>
            <Badge
              className={`calendar-todo-item-badge ${leaveStatus === "pending"
                ? "bg-warning"
                : leaveStatus === "approved"
                  ? "bg-success"
                  : ""
                }`}
            />
          </div>
        </Whisper>
      );
    }

    return null;
  }


  return (
    <Box sx={{ width: '100%', borderRadius: '5px', height: "100%", backgroundColor: 'white' }} >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Absence" {...a11yProps(0)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0} className="tabParent">
        <div className='empActivies'>
          <div className="d-flex justify-content-between w-100" style={{ fontSize: "12px", fontWeight: 600 }}>
            <div className=''>
              <button className='button' onClick={() => navigate(`/${whoIs}/leave-request`)}>Apply Leave</button>
            </div>
            <button className="button" disabled={isPermanentWFH} title={isPermanentWFH ? "You have the permanent WFH option, so there's no need to apply for WFH." : "You can submit a WFH request."} onClick={() => navigate(`/${whoIs}/wfh-request`)}>
              <AddHomeWorkRoundedIcon /> Apply WFH
            </button>
          </div>
          <div className="row" >
            <div className="leaveCircle col-lg-6 col-sm-12 col-md-12 p-0" >
              {
                isLoading ? <Skeleton variant="circular" width={120} height={120} className="m-2" /> :
                  <CircleBar annualLeave={Number(annualLeave).toFixed(1) || 0} takenLeave={takenLeave.toFixed(2) || 0} />
              }
            </div>

            <div className='text-center col-lg-6 col-sm-12 col-md-12 p-0 m-auto' style={{ fontSize: "13px" }} >
              {
                isLoading ?
                  <>
                    <Skeleton variant='text' />
                    <Skeleton variant='text' />
                  </> :
                  <>
                    <p><b>{(Number(annualLeave) - takenLeave).toFixed(2) || 0} Days</b> Remaining</p>
                    <p><b>{annualLeave || 0} Days</b> Allowance</p>
                  </>
              }
            </div>
          </div>

          {
            isLoading ? [...Array(5)].map((item, index) => {
              return <Skeleton variant='rounded' key={index} width={"100%"} className='my-1' height={30} />
            }) :
              leaveRequests.leaveApplications?.slice(0, 3).map((req, index) => {
                return (<div key={index} className={`leaveReq ${req.status === "pending" ? "bg-warning"
                  : req.status === "rejected" ? "bg-danger" : "bg-success"}`}>
                  {req.leaveType[0].toUpperCase() + req.leaveType.slice(1) + " "}
                  {new Date(req.fromDate).toLocaleString("default", { month: "short" })} {new Date(req.fromDate).getDate()}th{" to "}{new Date(req.toDate).getDate()}th
                </div>)
              })
          }
          {
            leaveRequests?.leaveApplications?.length > 3 ? <p className='text-center sub_text my-2' style={{ cursor: "pointer", fontWeight: 600 }} onClick={() => navigate(`/${whoIs}/job-desk/leave`)} >View All...</p> : null
          }

          <HStack spacing={10} style={{ height: 320 }} alignItems="flex-start" wrap className='position-relative'>
            {
              isLoading ? <Skeleton variant='rounded' width={"100%"} height={300} />
                : <Calendar compact style={{ width: "100%", paddingTop: "0px" }} renderCell={highlightToLeave} bordered />
            }
          </HStack>

        </div>
      </CustomTabPanel>

      <CustomTabPanel value={value} index={1}>
        Under Development
      </CustomTabPanel>
    </Box>
  );
}