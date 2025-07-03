import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import axios from "axios";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { formatDate, getDataAPI } from './ReuseableAPI';
import ApexChart from './ApexChart';
import { TimerStates } from './payslip/HRMDashboard';
import { Skeleton } from '@mui/material';
import profile from "../imgs/male_avatar.webp";
import "./NexHRDashboard.css";
import calendarIcon from "../asserts/calendar.svg";
import { EssentialValues } from '../App';
import { useNavigate } from 'react-router-dom';

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            style={{ backgroundColor: '#EEF7FF' }}
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

export default function Home() {
    const url = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();
    const { isStartLogin, isStartActivity, workTimeTracker, timeOption, checkClockins } = useContext(TimerStates);
    const [value, setValue] = useState(0);
    // const [isMobileView, setIsMobileView] = useState(false);
    const [isLoading, setLoading] = useState(true); // Track loading state
    const { data } = useContext(EssentialValues);
    const [isFetchPeopleOnLeave, setIsFetchPeopleOnLeave] = useState(false);
    const [isFetchpeopleOnWfh, setIsFetchPeopleOnWfh] = useState(false);
    const [peopleOnLeave, setPeopleOnLeave] = useState([]);
    const [filteredPeopleOnLeave, setFilteredPeopleOnLeave] = useState([]);
    const [peopleOnWorkFromHome, setPeopleOnWorkFromHome] = useState([]);
    const [filteredPeopleOnWfh, setFilteredPeopleOnWfh] = useState([]);
    const [empForLeave, setEmpforLeave] = useState("");
    const [empForWfh, setEmpforWfh] = useState("");
    const now = new Date();

    const staticData = {
        startingTime: "00:00",
        endingTime: "00:00",
        timeCalMins: 0,
    };

    const activities = ['login', 'meeting', 'morningBreak', 'lunch', 'eveningBreak', 'event'];

    const [tableData, setTableData] = useState(
        activities.map((activity) => ({
            activity: activity,
            ...staticData,
        }))
    );

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const getClockInsData = async () => {
        try {
            setLoading(true);
            if (!isStartLogin && !isStartActivity && data._id) {
                const { activitiesData } = await getDataAPI(data._id);
                if (activitiesData) {
                    setTableData(activitiesData)
                } else {
                    setTableData(tableData);
                }
            }
        }
        catch (err) {
            console.log("error in fetch clockins data: ", err)
        } finally {
            setLoading(false)
        }
    };

    async function fetchPeopleOnLeave() {
        try {
            setIsFetchPeopleOnLeave(true);
            const res = await axios.get(`${url}/api/leave-application/people-on-leave`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setPeopleOnLeave(res.data);
            setFilteredPeopleOnLeave(res.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            setPeopleOnLeave([]);
            console.log("error in fetch peopleOnLeave data: ", error);
        } finally {
            setIsFetchPeopleOnLeave(false);
        }
    }

    async function fetchWorkFromHomeEmps() {
        try {
            setIsFetchPeopleOnWfh(true);
            const res = await axios.get(`${url}/api/wfh-application/on-wfh`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setPeopleOnWorkFromHome(res.data);
            setFilteredPeopleOnWfh(res.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in fetch work from home emps", error);
        } finally {
            setIsFetchPeopleOnWfh(false)
        }
    }

    useEffect(() => {
        if (empForLeave === "") {
            setPeopleOnLeave(filteredPeopleOnLeave);
        } else {
            setPeopleOnLeave(filteredPeopleOnLeave.filter((leave) => leave.employee.FirstName.toLowerCase().includes(empForLeave)))
        }
    }, [empForLeave])

    useEffect(() => {
        if (empForWfh === "") {
            setPeopleOnWorkFromHome(filteredPeopleOnWfh);
        } else {
            setPeopleOnWorkFromHome(filteredPeopleOnWfh.filter((wfh) => wfh.employee.FirstName.toLowerCase().includes(empForWfh)))
        }
    }, [empForWfh])

    useEffect(() => {
        fetchPeopleOnLeave()
        fetchWorkFromHomeEmps();
    }, [])

    useEffect(() => {
        getClockInsData();
    }, [checkClockins]);

    // useEffect(() => {
    //     const handleResize = () => {
    //         if (window.innerWidth <= 450) {
    //             setIsMobileView(true)
    //         } else {
    //             setIsMobileView(false)
    //         }
    //     };

    //     window.addEventListener("resize", handleResize);

    //     // Cleanup function to remove the event listener
    //     return () => {
    //         window.removeEventListener("resize", handleResize);
    //     };
    // }, []);

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label={"My Summary"} {...a11yProps(0)} />
                </Tabs>
            </Box>

            <CustomTabPanel value={value} index={0} className="tabParent" style={{ backgroundColor: "white" }}>
                <div className='row'>
                    <div className='col-lg-6 col-md-6 col-12'>
                        {
                            isLoading ?
                                [...Array(5)].map((_, index) => (
                                    <Skeleton key={index} variant="rounded" width={300} height={30} className="my-1" />
                                ))
                                :
                                <table className='table table-striped'>
                                    <thead>
                                        <tr>
                                            <th>Activity</th>
                                            <th>Starting Time</th>
                                            <th>Ending Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className='w-100'>
                                        {
                                            tableData?.map((data, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        {data.activity}
                                                    </td>
                                                    <td>
                                                        {data.startingTime}
                                                    </td>
                                                    <td>
                                                        {data.endingTime}
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                        }
                    </div>
                    <div className='col-lg-6 col-md-6 col-12'>
                        {
                            workTimeTracker?.login?.startingTime?.length === workTimeTracker?.login?.endingTime?.length &&
                                workTimeTracker?.[timeOption]?.startingTime?.length === workTimeTracker[timeOption]?.endingTime?.length &&
                                isLoading ?
                                <>
                                    {
                                        [...Array(3)].map((_, index) => {
                                            return <Skeleton varient="text" key={index} />
                                        })
                                    }
                                    <Skeleton varient="circular" width={150} height={150} />
                                </> :
                                <>
                                    <p className='chartTitle'>Time Activity</p>
                                    <ApexChart activitiesData={tableData} />
                                </>
                        }
                    </div>
                    {/* <p className='payslipTitle my-2 px-3'>PeopleOnLeave</p> */}
                    <div className="d-flex flex-wrap gap-2 align-items-center justify-content-center my-2">
                        {/* people on leave container */}
                        <div className="boxContainer-parent col-12" >
                            <div className="d-flex flex-wrap justify-content-between align-items-center py-2" style={{ position: "sticky", top: "0px", background: "rgba(245, 245, 245, 1)" }} >
                                <p className='sub_text text-dark' style={{ fontWeight: "bold" }}>PeopleOnLeave</p>
                                <p className='timeLogBox' style={{ background: "white" }}><img src={calendarIcon} alt='dateIcon' width={15} height={"auto"} /> <span className='sub_text text-dark'>{now.getDate() + " " + now.toLocaleString("default", { "month": "short" }) + " " + now.getFullYear()}</span></p>
                                <input type="text" className='box-content mt-2 homeEmpSearchInp' placeholder='Search Employee...' value={empForLeave} onChange={(e) => setEmpforLeave(e.target.value)} />
                            </div>
                            {
                                isFetchPeopleOnLeave ? <div className="gap-1">
                                    {
                                        [...Array(2)].map((_, index) => {
                                            return <Skeleton variant="rounded" key={index} height={110} className="my-3" />
                                        })
                                    }
                                </div> :
                                    peopleOnLeave.length ?
                                        peopleOnLeave.map((leave, index) => {
                                            const fromDate = leave.fromDate;
                                            const toDate = leave.toDate;
                                            return <div key={index} className='box-content d-flex align-items-center justify-content-around my-1 ' style={{ boxShadow: 'none', background: "white" }}>
                                                <img src={leave?.employee?.profile || profile} alt="profile" className='imgContainer' />
                                                <div className="d-block">
                                                    <p style={{ fontSize: "13px" }}><b>{leave?.employee?.FirstName[0].toUpperCase() + leave?.employee?.FirstName.slice(1) + " " + leave?.employee?.LastName}</b>({leave?.employee?.team?.teamName || "TeamName"})</p>
                                                    <p className='sub_text'><b>{formatDate(fromDate) + " " + (leave.periodOfLeave === "half day" ? `${new Date(fromDate).getHours()}:${new Date(toDate).getMinutes()}` : "")} - {formatDate(toDate) + " " + (leave.periodOfLeave === "half day" ? `${new Date(toDate).getHours()}:${new Date(toDate).getMinutes()}` : "")}</b></p>
                                                    <p className={`sub_text ${leave?.leaveType?.toLowerCase()?.includes("unpaid") ? "text-danger" : "text-success"}`}>{leave.leaveType}</p>
                                                </div>
                                            </div>
                                        }) : <p className='homeEmpListtxt' >No one is leave Today</p>
                            }
                        </div>
                        {/* work from home employees container */}
                        <div className="boxContainer-parent col-12" >
                            <div className="d-flex flex-wrap justify-content-between align-items-center py-2" style={{ position: "sticky", top: "0px", background: "rgba(245, 245, 245, 1)" }} >
                                <p className='sub_text text-dark' style={{ fontWeight: "bold" }}>WFH Employees</p>
                                <p className='timeLogBox' style={{ background: "white" }}><img src={calendarIcon} alt='dateIcon' width={15} height={"auto"} /> <span className='sub_text text-dark'>{now.getDate() + " " + now.toLocaleString("default", { "month": "short" }) + " " + now.getFullYear()}</span></p>
                                <input type="text" className='box-content mt-2 homeEmpSearchInp' placeholder='Search Employee...' value={empForWfh} onChange={(e) => setEmpforWfh(e.target.value)} />
                            </div>
                            {
                                isFetchpeopleOnWfh ? <div className="gap-1">
                                    {
                                        [...Array(2)].map((_, index) => {
                                            return <Skeleton variant="rounded" key={index} height={110} className="my-3" />
                                        })
                                    }
                                </div> :
                                    peopleOnWorkFromHome.length ?
                                        peopleOnWorkFromHome.map((wfh, index) => {
                                            return <div key={index} className='box-content d-flex align-items-center justify-content-around my-1' style={{ boxShadow: 'none', background: "white", height: "fit-content" }}>
                                                <img src={wfh?.employee?.profile || profile} alt="profile" className='imgContainer' />
                                                <div className="d-block">
                                                    <p style={{ fontSize: "13px" }}><b>{wfh?.employee?.FirstName[0].toUpperCase() + wfh?.employee?.FirstName.slice(1) + " " + wfh?.employee?.LastName}</b>({wfh?.employee?.team?.teamName || "TeamName"})</p>
                                                    <p className='sub_text'><b>{formatDate(wfh.fromDate)} - {formatDate(wfh.toDate)}</b></p>
                                                </div>
                                            </div>
                                        }) : <p className='homeEmpListtxt'>No one in Work From Home</p>
                            }
                        </div>
                    </div>
                </div>
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                Working Status
            </CustomTabPanel>
            <CustomTabPanel value={value} index={2}>
                Who's Working?
            </CustomTabPanel>
        </Box >
    );
}
