import React, { useContext, useEffect, useState } from 'react';
import './dashboard.css';
import { fetchEmployeeData, formatTime, getDataAPI, gettingClockinsData, getTotalWorkingHourPerDay } from '../ReuseableAPI';
import ActivityTimeTracker from '../ActivityTimeTracker';
import NexHRDashboard from '../NexHRDashboard';
import Loading from '../Loader';
import { EssentialValues } from '../../App';
import { toast } from 'react-toastify';
import NoDataFound from './NoDataFound';
import { TimerStates } from './HRMDashboard';

const Dashboard = () => {
    const { updateClockins } = useContext(TimerStates)
    const { handleLogout } = useContext(EssentialValues);
    const empId = localStorage.getItem("_id");
    const [leaveData, setLeaveData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [dailyLogindata, setDailyLoginData] = useState({})
    const [monthlyLoginData, setMonthlyLoginData] = useState({});

    const gettingEmpdata = async () => {
        try {
            if (!empId) return; // Exit early if empId is not provided

            setIsLoading(true);

            // Fetch employee data
            const data = await fetchEmployeeData(empId);
            if (!data) {
                toast.error("Error in fetching workingTimePattern data!");
                setLeaveData({});
                return;
            }

            // Calculate working hours for the day
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

            // Fetch daily clock-in data
            const clockinsData = await getDataAPI(empId);
            console.log(clockinsData);

            setDailyLoginData(clockinsData);

            // Set leave data with working hours
            setLeaveData({ ...data, workingHour });

        } catch (error) {
            toast.error(error.message || "An error occurred while fetching employee data.");
            setLeaveData({});
        } finally {
            setIsLoading(false); // Ensure loading state is always updated
        }
    };
    console.log(dailyLogindata);

    function getPadStartHourAndMin(time) {
        console.log(time);

        const [hour, min] = String(time)?.split(".").map(Number);

        const padStartHour = String(hour).padStart(2, "0");
        const paddStartMin = String(min || 0).padStart(2, "0");
        console.log(padStartHour, paddStartMin);

        return `${padStartHour}:${paddStartMin}`;
    }

    useEffect(() => {
        gettingEmpdata();
    }, [empId]);
    

    return (
        <div className='dashboard-parent'>
            <ActivityTimeTracker leaveData={leaveData} handleLogout={handleLogout} updateClockins={updateClockins} />
            {
                isLoading ? <Loading /> :
                    leaveData && leaveData?.annualLeaveEntitlement && monthlyLoginData ? (
                        <>
                            <div className="allowance row container-fluid mx-auto g-2">
                                <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                                    <p className='leaveIndicatorTxt'>Total leave allowance</p>
                                    <p className='text-primary number'>{leaveData?.annualLeaveEntitlement}</p>
                                </div>
                                <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                                    <p className='leaveIndicatorTxt'>Total leave taken</p>
                                    <p className='text-primary number'>{leaveData?.totalTakenLeaveCount}</p>
                                </div>
                                <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                                    <p className='leaveIndicatorTxt'>Total leave available</p>
                                    <p className='text-primary number'>{Number(leaveData?.annualLeaveEntitlement) - Number(leaveData.totalTakenLeaveCount)}</p>
                                </div>
                                <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                                    <p className='leaveIndicatorTxt'>Leave request pending</p>
                                    <p className='text-primary number'>{leaveData?.pendingLeaveRequests}</p>
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
                                            <p>{(dailyLogindata?.empTotalWorkingHours)?.toFixed(2) || "00:00"}</p>
                                            <p className='sub_text'>Worked</p>
                                        </div>
                                        <div className='col-lg-3 col-md-3 col-4 timeLogBox'>
                                            <p>{getPadStartHourAndMin(leaveData?.workingHour - Number(dailyLogindata?.empTotalWorkingHours)?.toFixed(2) || 0)}</p>
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
                                                <p className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{monthlyLoginData?.companyTotalWorkingHour} hour</span></p>
                                            </div>
                                            <div className="progress">
                                                <div
                                                    className="progress-bar progress-bar-striped"
                                                    role="progressbar"
                                                    style={{ width: `${monthlyLoginData?.totalWorkingHourPercentage}%` }}
                                                    aria-valuenow={monthlyLoginData?.totalWorkingHourPercentage}
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
                                                    style={{ width: `${monthlyLoginData?.totalWorkedHourPercentage}%` }}
                                                    aria-valuenow={monthlyLoginData?.totalWorkedHourPercentage}
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                >
                                                </div>
                                            </div>
                                        </div>

                                        <div className='col-lg-6 col-md-6 col-sm-6 col-12'>
                                            <div className='space row'>
                                                <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap'>Shortage time</span></div>
                                                <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{monthlyLoginData?.companyTotalWorkingHour - monthlyLoginData?.totalEmpWorkingHours} hour</span></div>
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
                            {/* {
                                    account === '1' || account === '3' ?
                                        <div>
                                            <Home updateClockins={updateClockins} />
                                            <Twotabs />
                                        </div>
                                        : null
                                } */}
                            <NexHRDashboard updateClockins={updateClockins} />
                        </>
                    ) : <NoDataFound message={"leave data not found!"} />
            }
        </div>
    );
};

export default Dashboard;