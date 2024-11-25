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

export default function Home() {
    const { isStartLogin, isStartActivity, updateClockins } = useContext(TimerStates);
    const [value, setValue] = useState(0);
    const [isLoading, setLoading] = useState(true); // Track loading state
    const { data } = useContext(EssentialValues);
    const { _id } = data;

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
                if (!isStartLogin && !isStartActivity && _id) {
                    const { activitiesData } = await getDataAPI(_id);
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
        isLoading ? <Loading /> :
            <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                        <Tab label="My Summary" {...a11yProps(0)} />
                        <Tab label="Working Status" {...a11yProps(1)} />
                        <Tab label="Who's Working" {...a11yProps(2)} />
                    </Tabs>
                </Box>
                {/* {
        data.length > 0 ? */}
                <CustomTabPanel value={value} index={0} className="tabParent" style={{ backgroundColor: "white" }}>
                    <div className='row'>
                        <div className='col-lg-6 col-md-6 col-12'>
                            <table className='table table-striped'>
                                <thead>
                                    <tr>
                                        <th>Activity</th>
                                        <th>Starting Time</th>
                                        <th>Ending Time</th>
                                    </tr>
                                </thead>
                                <tbody>
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
                        </div>
                        <div className='col-lg-6 col-md-6 col-12'>
                            <p className='chartTitle'>Time Activity</p>
                            {
                                [isStartActivity, isStartLogin].includes(true) ?
                                    <NoDataFound message={"You can't view time value, until stop timers"} /> :
                                    <ApexChart activitiesData={tableData} />
                            }
                            {/* <PieChartGraph listOfActivity={listOfActivity} /> */}
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
