import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { getDataAPI } from './ReuseableAPI';
import ApexChart from './ApexChart';
import { TimerStates } from './payslip/HRMDashboard';
import Loading from './Loader';
import { EssentialValues } from '../App';
import { jwtDecode } from 'jwt-decode';
import { Skeleton } from '@mui/material';

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
    const { isStartLogin, isStartActivity, workTimeTracker, timeOption } = useContext(TimerStates);
    const [value, setValue] = useState(0);
    const [isLoading, setLoading] = useState(true); // Track loading state
    const empId = localStorage.getItem('_id');
    // const { data } = useContext(EssentialValues);    
    // const { isTeamLead, isTeamHead } = jwtDecode(data.token);

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
    }, []);

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
