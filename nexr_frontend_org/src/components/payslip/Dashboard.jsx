import React, { useContext, useEffect, useState } from 'react';
import './dashboard.css';
import { fetchEmployeeData, formatTime, getDataAPI, gettingClockinsData, getTotalWorkingHourPerDay } from '../ReuseableAPI';
import ClockIns from '../ClockIns';
import NexHRDashboard from '../NexHRDashboard';
import Loading from '../Loader';
import { EssentialValues } from '../../App';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const { handleLogout } = useContext(EssentialValues);
    const empId = localStorage.getItem("_id");
    const [leaveData, setLeaveData] = useState({});
    const [checkClockins, setCheckClockins] = useState(false);
    const clockinsId = localStorage.getItem("clockinsId");
    const [dailyLogindata, setDailyLoginData] = useState({})
    const [monthlyLoginData, setMonthlyLoginData] = useState({});
    const [workedTime, setWorkedTime] = useState("00:00");
    const [balanceTime, setBalanceTime] = useState("00:00");

    function updateClockins() {
        setCheckClockins(!checkClockins);
    }

    useEffect(() => {
        const gettingEmpdata = async () => {
            if (empId) {
                const data = await fetchEmployeeData(empId);
                if (data) {
                    const workingHour = await getTotalWorkingHourPerDay(data.workingTimePattern.StartingTime, data.workingTimePattern.FinishingTime);

                    // Fetch clock-ins data
                    const getEmpMonthPunchIns = await gettingClockinsData(empId);

                    // Calculate total working hour percentage and total worked hour percentage
                    const totalWorkingHourPercentage = (getEmpMonthPunchIns.companyTotalWorkingHour / getEmpMonthPunchIns.totalWorkingHoursPerMonth) * 100;
                    const totalWorkedHourPercentage = (getEmpMonthPunchIns.totalEmpWorkingHours / getEmpMonthPunchIns.companyTotalWorkingHour) * 100;

                    // Set the monthly login data
                    setMonthlyLoginData({
                        ...getEmpMonthPunchIns,
                        totalWorkingHourPercentage,
                        totalWorkedHourPercentage
                    });
                    // Check if `clockinsId` is available and fetch clock-in data
                    if (clockinsId) {
                        const clockinsData = await getDataAPI(clockinsId);
                        setDailyLoginData(clockinsData);
                    } else {
                        console.log("No clockins ID");
                    }

                    // Set leave data with working hours
                    setLeaveData({ ...data, workingHour });
                } else {
                    toast.error("Error in fetch workingtimePattern data!")
                }

            } else {
                setLeaveData({});
            }
        }

        gettingEmpdata();
    }, [empId]);

    return (
        <div className='dashboard-parent'>
            <ClockIns leaveData={leaveData} handleLogout={handleLogout} updateClockins={updateClockins} />

            {leaveData && leaveData.annualLeaveEntitlement && monthlyLoginData && leaveData && dailyLogindata ? (

                <>
                    <div className="allowance row container-fluid mx-auto g-2">
                        <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                            <p className='leaveIndicatorTxt'>Total leave allowance</p>
                            <p className='text-primary number'>{leaveData.annualLeaveEntitlement}</p>
                        </div>
                        <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                            <p className='leaveIndicatorTxt'>Total leave taken</p>
                            <p className='text-primary number'>{leaveData.totalTakenLeaveCount}</p>
                        </div>
                        <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                            <p className='leaveIndicatorTxt'>Total leave available</p>
                            <p className='text-primary number'>{Number(leaveData.annualLeaveEntitlement) - Number(leaveData.totalTakenLeaveCount)}</p>
                        </div>
                        <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                            <p className='leaveIndicatorTxt'>Leave request pending</p>
                            <p className='text-primary number'>{leaveData.pendingLeaveRequests}</p>
                        </div>
                    </div>
                    <div className='container-fluid mx-auto time row g-2'>
                        <h6>Time Log</h6>
                        <div className='col-lg-6 col-md-12 col-12'>
                            <p className='leaveIndicatorTxt'>Today</p>
                            <div className='row gap-3 text-center d-flex justify-content-center'>
                                <div className='col-lg-3 col-md-3 col-4 timeLogBox'>
                                    <p>{formatTime(leaveData?.workingHour)}</p>
                                    <p className='sub_text'>Scheduled</p>
                                </div>
                                <div className='col-lg-3 col-md-3 col-4 timeLogBox'>
                                    <p>{workedTime}</p>
                                    <p className='sub_text'>Worked</p>
                                </div>
                                <div className='col-lg-3 col-md-3 col-4 timeLogBox'>
                                    <p>{balanceTime}</p>
                                    <p className='sub_text'>Balance</p>
                                </div>
                            </div>
                        </div>

                        <div className='col-lg-6 col-md-12 col-12'>
                            <p className='leaveIndicatorTxt'>This month</p>
                            <div className='row'>
                                <div className='col-lg-6 col-md-6 col-12'>
                                    <div className='space row'>
                                        <p className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap '>Total</span></p>
                                        <p className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{monthlyLoginData.companyTotalWorkingHour} hour</span></p>
                                    </div>
                                    <div className="progress">
                                        <div
                                            className="progress-bar progress-bar-striped"
                                            role="progressbar"
                                            style={{ width: `${monthlyLoginData.totalWorkingHourPercentage}%` }}
                                            aria-valuenow={monthlyLoginData.totalWorkingHourPercentage}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        >
                                        </div>
                                    </div>
                                </div>

                                <div className='col-lg-6 col-md-6 col-sm-6 col-12'>
                                    <div className='space row'>
                                        <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap'>Worked time</span></div>
                                        <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{monthlyLoginData.totalEmpWorkingHours} hour</span></div>
                                    </div>

                                    <div className="progress">
                                        <div
                                            className="progress-bar progress-bar-striped"
                                            role="progressbar"
                                            style={{ width: `${monthlyLoginData.totalWorkedHourPercentage}%` }}
                                            aria-valuenow={monthlyLoginData.totalWorkedHourPercentage}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        >
                                        </div>
                                    </div>
                                </div>

                                <div className='col-lg-6 col-md-6 col-sm-6 col-12'>
                                    <div className='space row'>
                                        <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap'>Shortage time</span></div>
                                        <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{monthlyLoginData.companyTotalWorkingHour - monthlyLoginData.totalEmpWorkingHours} hour</span></div>
                                    </div>
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-striped" role="progressbar" style={{ width: "50%" }} aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                </div>

                                <div className='col-lg-6 col-md-6 col-sm-6 col-12'>
                                    <div className='space row'>
                                        <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap'>Over time</span></div>
                                        <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>0 hour</span></div>
                                    </div>
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-striped" role="progressbar" style={{ width: "0%" }} aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : <Loading />}

            <NexHRDashboard updateClockins={updateClockins} />
        </div>
    );
};

export default Dashboard;