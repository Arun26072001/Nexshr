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
import NoDataFound from './payslip/NoDataFound';

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

export default function Home({ peopleOnLeave, isFetchPeopleOnLeave }) {
    const { isStartLogin, isStartActivity, workTimeTracker, timeOption, updateClockins } = useContext(TimerStates);
    const [value, setValue] = useState(0);
    const [isLoading, setLoading] = useState(true); // Track loading state
    const empId = localStorage.getItem('_id');

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
        return `${dateValue + " " + monthString + " " + actualDate.getHours() + ":" + actualDate.getMinutes()}`
    }

    useEffect(() => {
        const getClockInsData = async () => {
            try {
                setLoading(true);
                if (!isStartLogin && !isStartActivity && empId) {
                    const { activitiesData } = await getDataAPI(empId);
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
                                workTimeTracker[timeOption]?.startingTime?.length === workTimeTracker[timeOption]?.endingTime?.length &&
                                isLoading ?
                                <>
                                    <Skeleton varient="text" />
                                    <Skeleton varient="text" />
                                    <Skeleton varient="text" />
                                    <Skeleton varient="circular" width={150} height={150} />
                                </> :
                                <>
                                    <p className='chartTitle'>Time Activity</p>
                                    <ApexChart activitiesData={tableData} />
                                </>
                        }
                    </div>
                    <p className='payslipTitle my-2 px-3'>PeopleOnLeave</p>
                    <div className="d-flex flex-wrap gap-2 align-items-center justify-content-center my-2">

                        {
                            isFetchPeopleOnLeave ?
                                <>
                                    <Skeleton varient="circular" height={150} style={{ flex: 1, width: "100%" }} />
                                    <Skeleton varient="circular" height={150} style={{ flex: 1, width: "100%" }} />
                                </> :
                                peopleOnLeave.length ?
                                    peopleOnLeave.map((leave) => {
                                        return <div className='box-content d-flex align-items-center justify-content-around col-lg-5 col-12 col-md-5' style={{ boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px" }}>
                                            <img src={leave?.employee?.profile || profile} alt="" className='imgContainer' />
                                            <div className="d-block">
                                                <p style={{ fontSize: "13px" }}><b>{leave?.employee?.FirstName[0].toUpperCase() + leave?.employee?.FirstName.slice(1) + " " + leave?.employee?.LastName}</b>({leave?.employee?.team?.teamName || "TeamName"})</p>
                                                <p className='sub_text'><b>{formatDate(leave.fromDate)} / {formatDate(leave.toDate)}</b></p>
                                            </div>
                                        </div>
                                    }) : <NoDataFound message={"No one leave Today"} />
                        }
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
