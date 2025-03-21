import React, { useContext, useEffect, useState } from 'react';
import './dashboard.css';
import { fetchEmployeeData, formatTime, getDataAPI, gettingClockinsData, getTotalWorkingHourPerDay } from '../ReuseableAPI';
import ActivityTimeTracker from '../ActivityTimeTracker';
import NexHRDashboard from '../NexHRDashboard';
import Loading from '../Loader';
import { EssentialValues } from '../../App';
import { toast } from 'react-toastify';
import { TimerStates } from './HRMDashboard';

const Dashboard = () => {
    const { updateClockins, isEditEmp } = useContext(TimerStates)
    const { handleLogout, setData, data } = useContext(EssentialValues);
    const [leaveData, setLeaveData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [dailyLogindata, setDailyLoginData] = useState({})
    const [monthlyLoginData, setMonthlyLoginData] = useState({});

    const gettingEmpdata = async () => {
        try {
            let workingHour = 0;
            if (!data._id) return; // Exit early if empId is not provided

            setIsLoading(true);

            // Fetch employee data
            const empData = await fetchEmployeeData(data._id);

            if (!empData) {
                toast.error("Error in fetching workingTimePattern data!");
                setLeaveData({});
                return;
            }
            setData((pre) => ({
                ...pre,
                Name: empData.FirstName + " " + empData.LastName,
                annualleave: empData.annualLeaveEntitlement
            }))

            // Calculate working hours for the day
            if (empData?.workingTimePattern?.StartingTime && empData?.workingTimePattern?.FinishingTime) {
                workingHour = await getTotalWorkingHourPerDay(empData?.workingTimePattern?.StartingTime, empData?.workingTimePattern?.FinishingTime);
            }

            // Fetch clock-ins data
            const getEmpMonthPunchIns = await gettingClockinsData(data._id);

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
            const clockinsData = await getDataAPI(data._id);
            setDailyLoginData(clockinsData);

            // Set leave data with working hours
            setLeaveData({ ...empData, workingHour });

        } catch (error) {
            console.log(error.message || "An error occurred while fetching employee data.");
            // toast.error(error.message || "An error occurred while fetching employee data.");
            setLeaveData({});
        } finally {
            setIsLoading(false); // Ensure loading state is always updated
        }
    };

    function getPadStartHourAndMin(time) {
        if (isNaN(time) || time < 0) return "00:00";
        const hour = Math.floor(time);
        const min = Math.round((time - hour) * 60);
        const padStartHour = String(hour).padStart(2, "0");
        const padStartMin = String(min).padStart(2, "0");

        return `${padStartHour}:${padStartMin}`;
    }

    function getOverTime(companyWorkingTime, empWorkingTime) {
        if (empWorkingTime && companyWorkingTime && empWorkingTime > companyWorkingTime) {
            return empWorkingTime - companyWorkingTime
        }
        return 0;
    }

    useEffect(() => {
        gettingEmpdata();
    }, [isEditEmp]);

    return (
        <div className='dashboard-parent'>
            <ActivityTimeTracker empName={data.Name} leaveData={leaveData} handleLogout={handleLogout} updateClockins={updateClockins} />
            {
                isLoading ? <Loading height="80vh" /> :
                    <>
                        {/* <div className="allowance row container-fluid mx-auto g-2"> */}
                        <div className='allowance flex-wrap'>
                            <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                                <p className='leaveIndicatorTxt'>Total leave allowance</p>
                                <p className='text-primary number'>{leaveData?.annualLeaveEntitlement || 0}</p>
                            </div>
                            <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                                <p className='leaveIndicatorTxt'>Total leave taken</p>
                                <p className='text-primary number'>{leaveData?.totalTakenLeaveCount || 0}</p>
                            </div>
                            <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                                <p className='leaveIndicatorTxt'>Total leave available</p>
                                <p className='text-primary number'>{(Number(leaveData?.annualLeaveEntitlement) - (Number(leaveData.totalTakenLeaveCount)) < 0 ? 0 : Number(leaveData?.annualLeaveEntitlement) - Number(leaveData.totalTakenLeaveCount)) || 0}</p>
                            </div>
                            <div className='col-lg-3 col-md-3 col-6 my-1 text-center'>
                                <p className='leaveIndicatorTxt'>Leave request pending</p>
                                <p className='text-primary number'>{leaveData?.pendingLeaveRequests || 0}</p>
                            </div>
                        </div>
                        <div className='time flex-wrap'>
                            <h6 className='col-lg-12 col-12'>Time Log</h6>
                            <div className='col-lg-6 col-md-12 col-12'>
                                <p className='leaveIndicatorTxt'>Today</p>
                                <div className='row gap-3 text-center d-flex justify-content-center'>
                                    <div className='col-lg-3 col-md-3 col-4 timeLogBox'>
                                        <p>{formatTime(leaveData?.workingHour || 0)}</p>
                                        <p className='sub_text'>Total Hours</p>
                                    </div>
                                    <div className='col-lg-3 col-md-3 col-4 timeLogBox'>
                                        <p>{dailyLogindata?.empTotalWorkingHours ? dailyLogindata?.empTotalWorkingHours : "00:00"}</p>
                                        <p className='sub_text'>Worked</p>
                                    </div>
                                    <div className='col-lg-3 col-md-3 col-4 timeLogBox'>
                                        <p>{getPadStartHourAndMin(leaveData?.workingHour - (Number(dailyLogindata?.empTotalWorkingHours)?.toFixed(2) || "00:00"))}</p>
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
                                            <p className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{monthlyLoginData?.companyTotalWorkingHour || 0} hour</span></p>
                                        </div>
                                        <div className="progress">
                                            <div
                                                className="progress-bar progress-bar-striped"
                                                role="progressbar"
                                                style={{ width: `${monthlyLoginData?.totalWorkingHourPercentage || 0}%` }}
                                                aria-valuenow={monthlyLoginData?.totalWorkingHourPercentage || 0}
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            >
                                            </div>
                                        </div>
                                    </div>

                                    <div className='col-lg-6 col-md-6 col-sm-6 col-12'>
                                        <div className='space row'>
                                            <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap'>Worked time</span></div>
                                            <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{monthlyLoginData?.totalEmpWorkingHours || 0} hour</span></div>
                                        </div>

                                        <div className="progress">
                                            <div
                                                className="progress-bar progress-bar-striped"
                                                role="progressbar"
                                                style={{ width: `${monthlyLoginData?.totalWorkedHourPercentage || 0}%` }}
                                                aria-valuenow={monthlyLoginData?.totalWorkedHourPercentage || 0}
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            >
                                            </div>
                                        </div>
                                    </div>

                                    <div className='col-lg-6 col-md-6 col-sm-6 col-12'>
                                        <div className='space row'>
                                            <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap'>Shortage time</span></div>
                                            <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{(monthlyLoginData?.companyTotalWorkingHour || 0 - monthlyLoginData?.totalEmpWorkingHours || 0)?.toFixed(2)} hour</span></div>
                                        </div>
                                        <div className="progress">
                                            <div className="progress-bar progress-bar-striped" role="progressbar" style={{ width: `${monthlyLoginData?.companyTotalWorkingHour || 0 - monthlyLoginData?.totalEmpWorkingHours || 0}%` }} aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>

                                    <div className='col-lg-6 col-md-6 col-sm-6 col-12'>
                                        <div className='space row'>
                                            <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap'>Over time</span></div>
                                            <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{getOverTime(monthlyLoginData?.companyTotalWorkingHour, monthlyLoginData?.totalEmpWorkingHours)} hour</span></div>
                                        </div>
                                        <div className="progress">
                                            <div className="progress-bar progress-bar-striped" role="progressbar" style={{ width: `${getOverTime(monthlyLoginData?.companyTotalWorkingHour, monthlyLoginData?.totalEmpWorkingHours)}%` }} aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <NexHRDashboard updateClockins={updateClockins} />
                    </>
            }
        </div>
    );
};

export default Dashboard; 