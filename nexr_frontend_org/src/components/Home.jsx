import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { getDataAPI } from './ReuseableAPI';
import ApexChart from './ApexChart';
import { TimerStates } from './payslip/HRMDashboard';
import { Skeleton } from '@mui/material';
import profile from "../imgs/male_avatar.webp";
import "./NexHRDashboard.css";
import calendarIcon from "../asserts/calendar.svg";
import NoDataFound from './payslip/NoDataFound';
import { EssentialValues } from '../App';

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

export default function Home({ peopleOnLeave, peopleOnWorkFromHome, isFetchPeopleOnLeave, isFetchpeopleOnWfh }) {
    const { isStartLogin, isStartActivity, workTimeTracker, timeOption, updateClockins } = useContext(TimerStates);
    const [value, setValue] = useState(0);
    const [isLoading, setLoading] = useState(true); // Track loading state
    const { data } = useContext(EssentialValues);
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

    function formatDate(date) {
        const actualDate = new Date(date)
        const dateValue = actualDate.getDate();
        const monthString = actualDate.toLocaleString("default", { month: "short" })
        return `${dateValue + " " + monthString + " " + String(actualDate.getHours()).padStart(2, "0") + ":" + String(actualDate.getMinutes()).padStart(2, "0")}`
    }

    useEffect(() => {
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
                setLoading(false);
            }
            catch (err) {
                setLoading(false);
            }
        };
        getClockInsData();
    }, [updateClockins]);

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
                        <div className="boxContainer-parent">
                            <div className="d-flex justify-content-between align-items-center py-2" style={{ position: "sticky", top: "0px", background: "rgba(245, 245, 245, 1)" }} >
                                <p className='sub_text text-dark' style={{ fontWeight: "bold" }}>PeopleOnLeave</p>
                                <p className='timeLogBox' style={{ background: "white" }}><img src={calendarIcon} alt='dateIcon' width={15} height={"auto"} /> <span className='sub_text text-dark'>{now.getDate() + " " + now.toLocaleString("default", { "month": "short" }) + " " + now.getFullYear()}</span></p>
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
                                            return <div key={index} className='box-content d-flex align-items-center justify-content-around my-1' style={{ boxShadow: 'none', background: "white" }}>
                                                <img src={leave?.employee?.profile || profile} alt="profile" className='imgContainer' />
                                                <div className="d-block">
                                                    <p style={{ fontSize: "13px" }}><b>{leave?.employee?.FirstName[0].toUpperCase() + leave?.employee?.FirstName.slice(1) + " " + leave?.employee?.LastName}</b>({leave?.employee?.team?.teamName || "TeamName"})</p>
                                                    <p className='sub_text'><b>{formatDate(leave.fromDate)} - {formatDate(leave.toDate)}</b></p>
                                                    <p className={`sub_text ${leave?.leaveType?.toLowerCase()?.includes("unpaid") ? "text-danger" : "text-success"}`}>{leave.leaveType}</p>
                                                </div>
                                            </div>
                                        }) : <NoDataFound message={"No one is leave Today"} />
                            }
                        </div>
                        {/* work from home employees container */}
                        <div className="boxContainer-parent">
                            <div className="d-flex justify-content-between align-items-center py-2" style={{ position: "sticky", top: "0px", background: "rgba(245, 245, 245, 1)" }} >
                                <p className='sub_text text-dark' style={{ fontWeight: "bold" }}>WFH Employees</p>
                                <p className='timeLogBox' style={{ background: "white" }}><img src={calendarIcon} alt='dateIcon' width={15} height={"auto"} /> <span className='sub_text text-dark'>{now.getDate() + " " + now.toLocaleString("default", { "month": "short" }) + " " + now.getFullYear()}</span></p>
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
                                            return <div key={index} className='box-content d-flex align-items-center justify-content-around my-1' style={{ boxShadow: 'none', background: "white" }}>
                                                <img src={wfh?.employee?.profile || profile} alt="profile" className='imgContainer' />
                                                <div className="d-block">
                                                    <p style={{ fontSize: "13px" }}><b>{wfh?.employee?.FirstName[0].toUpperCase() + wfh?.employee?.FirstName.slice(1) + " " + wfh?.employee?.LastName}</b>({wfh?.employee?.team?.teamName || "TeamName"})</p>
                                                    <p className='sub_text'><b>{formatDate(wfh.fromDate)} - {formatDate(wfh.toDate)}</b></p>
                                                </div>
                                            </div>
                                        }) : <NoDataFound message={"No one in Work From Home"} />
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
        </Box>
    );
}
