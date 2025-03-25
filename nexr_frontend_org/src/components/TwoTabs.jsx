import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { fetchLeaveRequests } from './ReuseableAPI';
import CircleBar from './CircleProcess';
import { useNavigate } from 'react-router-dom';
import { EssentialValues } from '../App';
import { Badge, Calendar, Dropdown, HStack, Popover, Whisper } from 'rsuite';
import { Skeleton } from '@mui/material';

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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
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
          setLeaveRequests(leaveReqs.leaveApplications);

          leaveReqs.leaveApplications.forEach((req) => {
            // if (req.status === "pending" || req.status === "approved") {
            if (req.status === "approved" && req.leaveType !== "Permission Leave") {
              let toDate = new Date(req.toDate);
              let fromDate = new Date(req.fromDate);
              let timeDifference = toDate - fromDate;
              const dayDifference = timeDifference === 0 ? 1 : timeDifference / (1000 * 60 * 60 * 24);

              setTakenLeave(prev => prev + Number(dayDifference.toFixed(2)));  // Set this to the correct unit (e.g., days)
            }
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

  useEffect(() => {
    async function getAllEmpLeaveData() {
      setIsLoading(true);
      try {
        const res = await fetchLeaveRequests(data._id);
        setLeaveData(res.leaveApplications.map((leave) => ({
          title: `${leave.employee.FirstName[0].toUpperCase() + leave.employee.FirstName.slice(1)} ${leave.employee.LastName} (${leave.leaveType[0].toUpperCase() + leave.leaveType.slice(1)} - ${leave.status})`,
          start: new Date(leave.fromDate),
          end: new Date(leave.toDate),
          status: leave.status
        })))
      } catch (error) {
        console.log(error);
      }
      setIsLoading(false)
    }
    // if (["2", "3"].includes(data.Account)) {
    getAllEmpLeaveData();
    // }
  }, [])

  function getTodoList(date) {
    if (!date) {
      return [];
    }

    return leaveData.filter((leave) => {
      return leave.start.toDateString() === date.toDateString();
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
          {list.map((item) => (
            <Dropdown.Item key={item.start}>{item.title}</Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Popover>
    );
  };

  function highlightToLeave(date) {
    if (!leaveData || !leaveData.length) return null; // Ensure leaveData exists

    // Filter leaveData based on date comparison
    const isLeave = leaveData.filter((leave) => {
      const leaveDate = new Date(leave.start); // Ensure `leave.start` is a Date object
      return leaveDate.toDateString() === date.toDateString();
    });

    if (isLeave.length > 0) {
      const leaveStatus = isLeave[0].status; // Get status from the first matched leave

      return (
        <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu(date)}>
          <div style={{ width: "20px", height: "20px" }}>
            <Badge className={`calendar-todo-item-badge ${leaveStatus === "pending" ? "bg-warning" : ""}`} />
          </div>
        </Whisper>
      );
    }

    return null; // Return null if no leave is found
  }
  console.log(annualLeave, takenLeave);

  return (
    <Box sx={{ width: '100%', border: '2px solid rgb(208 210 210)', borderRadius: '5px', height: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" style={{ backgroundColor: 'rgb(238, 247, 255)' }}>
          <Tab label="Absence" {...a11yProps(0)} />
          {/* <Tab label="Overtime" {...a11yProps(1)} /> */}
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0} className="bg-light tabParent">
        <div className='empActivies'>
          <div className="d-flex justify-content-between w-100" style={{ fontSize: "12px", fontWeight: 600 }}>
            <div className=''>
              <button className='button' onClick={() => navigate(`/${whoIs}/leave-request`)}>Apply Leave</button>
            </div>
            <div className=''>
              <button className="outline-btn p-2" onClick={() => navigate(`/${whoIs}/job-desk/leave`)}>Absence history</button>
            </div>
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
            isLoading ? [...Array(5)].map((item) => {
              return <Skeleton variant='rounded' width={"100%"} className='my-1' height={30} />
            }) :
              leaveRequests?.map((req, index) => {
                // debugger;
                let todayDate = today.getTime()
                let leaveDate = new Date(req.fromDate).getTime()
                if (todayDate < leaveDate) {
                  return (<div key={index} className={`leaveReq ${req.status === "pending" ? "bg-warning"
                    : req.status === "rejected" ? "bg-danger" : "bg-success"}`}>
                    {req.leaveType[0].toUpperCase() + req.leaveType.slice(1) + " "}
                    {new Date(req.fromDate).toLocaleString("default", { month: "short" })} {new Date(req.fromDate).getDate()}th{" to "}{new Date(req.toDate).getDate()}th
                  </div>)
                }
              })
          }

          <HStack spacing={10} style={{ height: 320 }} alignItems="flex-start" wrap className='position-relative'>
            {
              isLoading ? <Skeleton variant='rounded' width={"100%"} height={300} />
                : <Calendar compact style={{ width: 320, paddingTop: "0px" }} renderCell={highlightToLeave} onChange={(value) => setSelectedDate(value)} bordered />
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