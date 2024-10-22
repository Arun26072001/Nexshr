import React, { createContext, useContext, useEffect, useState } from 'react'
import Parent from '../Parent'
import Dashboard from './Dashboard';
import JobDesk from './Jobdesk';
import Employee from './Employee';
import Administration from './Administration';
import { Route, Routes } from 'react-router-dom';
import Employees from './Employees';
import Request from '../attendance/Request';
import Dailylog from '../attendance/Dailylog';
import Details from '../attendance/Details';
import Summary from '../attendance/Summary';
import { toast } from 'react-toastify';
import { addDataAPI, gettingClockinsData, updateDataAPI } from '../ReuseableAPI';
import Status from '../leave/Status';
import LeaveRequest from '../leave/Request';
import LeaveSummary from '../leave/Summary';
import axios from 'axios';
import LeaveCalender from '../leave/Calender';
import Settings from '../Settings/Settings';
import UnAuthorize from './UnAuthorize';
import LeaveRequestForm from './LeaveResquestForm';
import EditLeaveRequestForm from '../EditLeaveRequestForm';
import Payroll from "../Settings/Payroll";
import PayrollManage from './PayrollManage';
import PayslipInfo from './PayslipInfo';
import PayrollValue from './PayrollValue';
import PayslipRouter from './PayslipRouter';
import { EssentialValues } from '../../App';

export const LeaveStates = createContext(null);
export const TimerStates = createContext(null);

export default function HRMDashboard() {
    const { data } = useContext(EssentialValues)
    const [attendanceData, setAttendanceData] = useState([]);
    const [attendanceForSummary, setAttendanceForSummary] = useState({});
    const empId = localStorage.getItem("_id");
    const [leaveRequests, setLeaveRequests] = useState({});
    const [fullLeaveRequests, setFullLeaveRequests] = useState([]);
    const [empName, setEmpName] = useState("");
    const token = localStorage.getItem('token');
    const [whoIs, setWhoIs] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [waitForAttendance, setWaitForAttendance] = useState(false);
    const url = process.env.REACT_APP_API_URL;
    const [daterangeValue, setDaterangeValue] = useState("");
    const [timeOption, setTimeOption] = useState(localStorage.getItem("timeOption") || "meeting");
    const [isPaused, setIsPaused] = useState(false);
    const [sec, setSec] = useState(() => parseInt(localStorage.getItem("timer")?.split(":")[2]) || 0);
    const [min, setMin] = useState(() => parseInt(localStorage.getItem("timer")?.split(":")[1]) || 0);
    const [hour, setHour] = useState(() => parseInt(localStorage.getItem("timer")?.split(":")[0]) || 0);
    const [ranTime, setRanTime] = useState(0);
    // getting current time
    const currentDate = new Date();
    const currentHours = currentDate.getHours().toString().padStart(2, '0');
    const currentMinutes = currentDate.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;
    // files for payroll
    const files = ['payroll', 'value', 'manage', 'payslip'];
    const startAndEndTime = {
        startingTime: "00:00",
        endingTime: "00:00",
        takenTime: 0,
        timeHolder: 0,
    };

    const [workTimeTracker, setWorkTimeTracker] = useState({
        date: new Date(),
        login: { ...startAndEndTime },
        meeting: { ...startAndEndTime },
        morningBreak: { ...startAndEndTime },
        lunch: { ...startAndEndTime },
        eveningBreak: { ...startAndEndTime },
        event: { ...startAndEndTime }
    });
    const [checkClockins, setCheckClockins] = useState(false);
    function updateClockins() {
        setCheckClockins(!checkClockins);
    }

    function filterLeaveRequests() {
        if (empName === "") {
            setLeaveRequests(fullLeaveRequests);
        } else {
            console.log(fullLeaveRequests);
            const filterRequests = fullLeaveRequests?.leaveData.filter((leave) => leave.employee.FirstName.toLowerCase().includes(empName));
            setLeaveRequests((pre) => ({ ...pre, leaveData: filterRequests }));
        }
    }
    
    const startCountdown = async () => {
        localStorage.setItem("timeOption", timeOption);
        localStorage.setItem('isPaused', false);
        setIsPaused(false);
        toast.success("Timer has been started!");
    };

    const startTimer = async () => {
        const updatedState = {
            ...workTimeTracker,
            [timeOption]: {
                ...workTimeTracker[timeOption],
                startingTime: workTimeTracker[timeOption].startingTime !== "00:00" ? workTimeTracker[timeOption].startingTime : currentTime
            },
        };

        // Check if clockinsId is present
        if (!workTimeTracker?._id) {
            try {
                const clockinsData = await addDataAPI(updatedState);  // Assuming updateState is some required data for addDataAPI
                setWorkTimeTracker(clockinsData);
                updateClockins();
            } catch (error) {
                console.error('Error in starting timer:', error);
            }
        } else {
            if (workTimeTracker?._id && !isPaused) {
                toast.warning("Timer has been already started!")
            }
            try {
                // Call the API with the updated state
                await updateDataAPI(updatedState);
                setWorkTimeTracker(updatedState)
            } catch (error) {
                console.error('Error updating data:', error);
                toast.error('Failed to update the timer. Please try again.');
            }
        }
        await startCountdown();
        // Set login time when 'login' is selected and no loginTime is set
        // if (timeOption === "login" && loginTime === "00:00") {
        //     const time = currentTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        //     setLoginTime(time);
        //     localStorage.setItem("loginTime", time);
        // }

        // if (isPaused) {
        //     // Update state for paused case
        //     setWorkTimeTracker((prevState) => ({
        //         ...prevState,
        //         [timeOption]: {
        //             ...prevState[timeOption],
        //             startingTime: currentTime
        //         }
        //     }));
        //     // Start the countdown after updating the state
        //     await startCountdown();
        // }
        // toast.success(`${timeOption} timer has been started!`);
    };

    const stopTimer = async () => {
        // if (timeOption === "login") {
        //     const time = currentTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        //     setLogoutTime(time);
        //     localStorage.setItem("logoutTime", time);
        // }
        const timeHolderValue = `${hour}:${min}:${sec}`;
        const updatedState = (prev) => ({
            ...prev,
            [timeOption]: {
                ...prev[timeOption],
                endingTime: currentTime,
                timeHolder: Math.abs(timeHolderValue),
                takenTime: ranTime,
            },
        });

        if (workTimeTracker?._id) {
            // Call the API with the updated state
            await updateDataAPI(updatedState(workTimeTracker));
            localStorage.setItem('isPaused', true);
            setIsPaused(true);
            toast.success(`${timeOption} Timer has been stopped!`)
            updateClockins();
        } else {
            localStorage.setItem('isPaused', true);
            setIsPaused(true);
            return toast.error("You did't punch-in")
        }
    };

    // useEffect(() => {
    //     if (!isPaused) {
    //         const interval = setInterval(() => {
    //             setRanTime((prevTime) => prevTime + 1000);
    //             localStorage.setItem("timer", `${hour + ":" + min + ":" + sec}`)
    //         }, 1000);

    //         return () => {
    //             clearInterval(interval);
    //             setRanTime(0);
    //         };
    //     }
    // }, [isPaused]);

    useEffect(() => {
        const getLeaveData = async () => {
            setIsLoading(true);
            try {
                const leaveData = await axios.get(`${url}/api/leave-application/date-range/${empId}`, {
                    params: {
                        daterangeValue
                    },
                    headers: {
                        authorization: token || ""
                    }
                })

                setLeaveRequests(leaveData.data);
                setFullLeaveRequests(leaveData.data);
                setIsLoading(false);
            } catch (err) {
                toast.error(err?.response?.data?.message);
                setIsLoading(false);
            }
        }
        getLeaveData();
    }, [daterangeValue, empId]);

    async function getClocknsData() {
        if (empId) {
            setWaitForAttendance(true);
            try {
                const data = await gettingClockinsData(empId);
                if (data) {
                    setAttendanceForSummary(data);
                    setAttendanceData(data.clockIns);
                    setWaitForAttendance(false);
                } else {
                    toast.error("Error in fetch attendance Data");
                    setWaitForAttendance(false);
                }
            } catch (err) {
                console.log(err);
                setWaitForAttendance(false);
                toast.error(err?.response?.data?.message)
            }
        }
    }

    useEffect(() => {
        if (data?.Account) {
            if (data.Account === '1') {
                setWhoIs("admin");
            } else if (data.Account === '2') {
                setWhoIs("hr");
            } else if (data.Account === '3') {
                setWhoIs("emp");
            }
        }
        getClocknsData();
    }, [empId]);


    return (
        <TimerStates.Provider value={{ workTimeTracker, startTimer, stopTimer, setWorkTimeTracker, updateClockins, whoIs }}>
            <Routes >
                <Route path="/" element={<Parent />} >
                    <Route index element={<Dashboard data={data} />} />
                    <Route path="job-desk/*" element={<JobDesk whoIs={whoIs} />} />
                    <Route path="employee" element={<Employee whoIs={whoIs} />} />
                    {/* <Route path="leave/" element={<Leave />} /> */}
                    <Route path="employee/add" element={<Employees />} />
                    <Route path="leave/*" element={
                        <LeaveStates.Provider value={{ daterangeValue, setDaterangeValue, isLoading, leaveRequests, filterLeaveRequests, empName, setEmpName }} >
                            <Routes>
                                <Route index path='status' element={<Status />} />
                                <Route path='leave-request' element={<LeaveRequest />} />
                                <Route path='calender' element={<LeaveCalender />} />
                                <Route path='leave-summary' element={<LeaveSummary />} />
                            </Routes>
                        </LeaveStates.Provider>
                    } />
                    <Route path='/leave-request' element={<LeaveRequestForm />} />
                    <Route path="/leave-request/edit/:id" element={<EditLeaveRequestForm />} />
                    <Route path="attendance/*" element={
                        <Routes>
                            <Route index path="attendance-request" element={<Request attendanceData={attendanceData} isLoading={waitForAttendance} />} />
                            <Route path="daily-log" element={<Dailylog attendanceData={attendanceData} isLoading={waitForAttendance} />} />
                            <Route path="details" element={<Details attendanceData={attendanceData} isLoading={waitForAttendance} />} />
                            <Route path="attendance-summary" element={<Summary attendanceData={attendanceForSummary} isLoading={waitForAttendance} />} />
                        </Routes>
                    }>
                    </Route>
                    <Route path="administration/" element={<Administration />} />
                    <Route path="settings/*" element={
                        <Routes>
                            <Route index element={<Settings />} />
                            <Route path="/" element={<PayslipRouter whoIs={whoIs} files={files} />}>
                                <Route path="payroll" element={<Payroll whoIs={whoIs} />} />
                                <Route path="value" element={<PayrollValue />} />
                                <Route path="manage" element={<PayrollManage />} />
                                <Route path="payslip" element={<PayslipInfo />} />
                            </Route>
                        </Routes>
                    } />

                    <Route path="*" element={<p>404</p>} />
                    <Route path="unauthorize" element={<UnAuthorize />} />
                </Route>
            </Routes>
        </TimerStates.Provider>
    )
}
