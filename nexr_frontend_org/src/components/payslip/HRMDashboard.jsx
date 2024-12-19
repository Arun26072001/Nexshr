import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Dashboard from './Dashboard';
import JobDesk from './Jobdesk';
import Employee from './Employee';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import Employees from './Employees';
import Request from '../attendance/Request';
import Dailylog from '../attendance/Dailylog';
import Details from '../attendance/Details';
import Summary from '../attendance/Summary';
import { toast } from 'react-toastify';
import { addDataAPI, getDataAPI, gettingClockinsData, removeClockinsData, updateDataAPI } from '../ReuseableAPI';
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
import PayslipRouter from '../unwanted/PayslipRouter';
import { EssentialValues } from '../../App';
import AddEmployee from '../AddEmployee';
import Roles from '../Administration/Roles';
import PageAndActionAuth from '../Settings/PageAndActionAuth';
import Announce from '../Announcement/announce';
import Department from '../Administration/Department';
import Position from '../Administration/Position';
import { jwtDecode } from 'jwt-decode';
import Parent from './layout/Parent';
import PayslipUI from './PayslipUI';

export const LeaveStates = createContext(null);
export const TimerStates = createContext(null);

export default function HRMDashboard() {
    const params = useParams();
    const { data, isStartLogin, isStartActivity, setIsStartLogin, setIsStartActivity, whoIs } = useContext(EssentialValues);
    const { token, Account, _id } = data;
    const { isTeamLead, isTeamHead } = jwtDecode(token);
    const [attendanceData, setAttendanceData] = useState([]);
    const [attendanceForSummary, setAttendanceForSummary] = useState({});
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [fullLeaveRequests, setFullLeaveRequests] = useState([]);
    const [empName, setEmpName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [waitForAttendance, setWaitForAttendance] = useState(false);
    const url = process.env.REACT_APP_API_URL;
    const [daterangeValue, setDaterangeValue] = useState("");
    const [isEditEmp, setIsEditEmp] = useState(false);
    const [timeOption, setTimeOption] = useState(localStorage.getItem("timeOption") || "meeting");
    const navigate = useNavigate();
    const [reloadRole, setReloadRole] = useState(false);
    const [syncTimer, setSyncTimer] = useState(false);
    const [isUpdatedRequest, setIsUpdatedReqests] = useState(false);
    // files for payroll
    const files = ['payroll', 'value', 'manage', 'payslip'];
    const startAndEndTime = {
        startingTime: [],
        endingTime: [],
        timeHolder: "00:00:00",
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

    function updateWorkTracker(value) {
        setTimeOption(value);
    }

    function filterLeaveRequests() {
        if (empName === "") {
            setLeaveRequests(fullLeaveRequests);
        } else {
            const filterRequests = fullLeaveRequests?.leaveData.filter((leave) => leave.employee.FirstName.toLowerCase().includes(empName));
            setLeaveRequests((pre) => ({ ...pre, leaveData: filterRequests }));
        }
    }

    const startLoginTimer = async () => {
        const currentDate = new Date();
        const currentHours = currentDate.getHours().toString().padStart(2, '0');
        const currentMinutes = currentDate.getMinutes().toString().padStart(2, '0');
        const currentSeconds = currentDate.getSeconds().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}:${currentSeconds}`;
        const updatedState = {
            ...workTimeTracker,
            login: {
                ...workTimeTracker?.login,
                // startingTime: workTimeTracker?.login?.startingTime !== "00:00" ? workTimeTracker.login.startingTime : currentTime
                startingTime: [...workTimeTracker?.login?.startingTime, currentTime]
            }
        };
        // // try to add clockins data
        if (!updatedState?._id) {
            try {
                const clockinsData = await addDataAPI(updatedState);
                if (clockinsData) {
                    setWorkTimeTracker(clockinsData);
                    // if successfully added clockins timer will start
                    setIsStartLogin(true);
                    localStorage.setItem("isStartLogin", true);
                    updateClockins();
                }
            } catch (error) {
                // else stop the timer
                setIsStartLogin(false);
                localStorage.setItem("isStartLogin", false);
                console.error('Error in add Clockins timer:', error);
            }
            // try to update clockins data
        } else {

            try {
                trackTimer();
                // Call the API with the updated state
                const updatedData = await updateDataAPI(updatedState);
                setWorkTimeTracker(updatedData);
                // if successfully updated, start the timer
                setIsStartLogin(true);
                localStorage.setItem("isStartLogin", true);

            } catch (error) {
                setIsStartLogin(false);
                localStorage.setItem("isStartLogin", false);
                toast.error('Error updating data:', error);
            }
        }
    };

    const stopLoginTimer = async () => {
        const currentDate = new Date();
        const currentHours = currentDate.getHours().toString().padStart(2, '0');
        const currentMinutes = currentDate.getMinutes().toString().padStart(2, '0');
        const currentSeconds = currentDate.getSeconds().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}:${currentSeconds}`;
        const updatedState = {
            ...workTimeTracker,
            login: {
                ...workTimeTracker?.login,
                endingTime: [...workTimeTracker?.login?.endingTime, currentTime],
                timeHolder: workTimeTracker.login.timeHolder
            }
        };
        try {
            // if (updatedState?._id && isStartLogin) {
            // Call the API with the updated state
            const updatedData = await updateDataAPI(updatedState);
            setWorkTimeTracker(updatedData);
            localStorage.setItem('isStartLogin', false);
            setIsStartLogin(false);
            updateClockins();
            // }
        } catch (err) {
            console.log(err);
        }
    }

    const startActivityTimer = async () => {
        const currentDate = new Date();
        const currentHours = currentDate.getHours().toString().padStart(2, '0');
        const currentMinutes = currentDate.getMinutes().toString().padStart(2, '0');
        const currentSeconds = currentDate.getSeconds().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}:${currentSeconds}`;
        const updatedState = {
            ...workTimeTracker,
            [timeOption]: {
                ...workTimeTracker[timeOption],
                startingTime: [...workTimeTracker[timeOption]?.startingTime, currentTime]
            }
        };
        try {
            // if (workTimeTracker?._id) {
            // Call the API with the updated state
            await updateDataAPI(updatedState);
            localStorage.setItem("isStartActivity", true);
            setIsStartActivity(true);
            setWorkTimeTracker(updatedState);
            toast.success(`${timeOption} timer has been started!`)
            // }
        } catch (error) {
            console.error('Error updating data:', error);
            toast.error('Please PunchIn');
        }
        // }
    };

    const stopActivityTimer = async () => {
        trackTimer();
        const currentDate = new Date();
        const currentHours = currentDate.getHours().toString().padStart(2, '0');
        const currentMinutes = currentDate.getMinutes().toString().padStart(2, '0');
        const currentSeconds = currentDate.getSeconds().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}:${currentSeconds}`;
        const updatedState = (prev) => ({
            ...prev,
            [timeOption]: {
                ...prev[timeOption],
                endingTime: [...workTimeTracker[timeOption]?.endingTime, currentTime],
                timeHolder: workTimeTracker[timeOption].timeHolder
            },
        });

        try {
            // Call the API with the updated state
            const updatedData = await updateDataAPI(updatedState(workTimeTracker));
            setWorkTimeTracker(updatedData);
            localStorage.setItem("isStartActivity", false);
            setIsStartActivity(false);
            updateClockins();
            // return toast.success(`${timeOption} Timer has been stopped!`);
        } catch (error) {
            toast.error(error.message);
        }
    }

    function changeEmpEditForm(id) {
        if (isEditEmp) {
            navigate(-1);
            setIsEditEmp(false);
        } else {
            console.log(params);
            navigate(`employee/edit/${id}`);
            setIsEditEmp(true);
        }
    }

    function reloadRolePage() {
        setReloadRole(!reloadRole)
    }

    function changeRequests() {
        setIsUpdatedReqests(!isUpdatedRequest);
    }
    // timers will stop. when browser window is close
    // window.addEventListener('onunload', function (e) {
    //     console.log("call to unload");

    //     // stopLoginTimer();
    //     // stopActivityTimer();
    //     // e.preventDefault();
    //     // e.returnValue = '';
    // });

    useEffect(() => {
        const getLeaveData = async () => {
            setIsLoading(true);
            try {
                const leaveData = await axios.get(`${url}/api/leave-application/date-range/${whoIs}`, {
                    params: {
                        daterangeValue
                    },
                    headers: {
                        authorization: token || ""
                    }
                })

                setLeaveRequests(leaveData.data);
                setFullLeaveRequests(leaveData.data);
            } catch (err) {
                toast.error(err?.response?.data?.message);
            }
            setIsLoading(false);
        }

        const getLeaveDataFromTeam = async (who) => {

            setIsLoading(true);
            try {
                const leaveData = await axios.get(`${url}/api/leave-application/${who}/${_id}`, {
                    params: {
                        daterangeValue
                    },
                    headers: {
                        authorization: token || ""
                    }
                })
                console.log(leaveData.data);
                setLeaveRequests(leaveData.data);
                setFullLeaveRequests(leaveData.data);
            } catch (err) {
                toast.error(err?.response?.data?.message);
            }
            setIsLoading(false);
        }
        if ((whoIs) && (String(Account) === '2' || String(Account) === '1')) {
            getLeaveData();
        } else if ((whoIs && isTeamLead) || (whoIs && isTeamHead)) {
            getLeaveDataFromTeam(isTeamHead ? "head" : "lead")
        }
    }, [daterangeValue, _id, whoIs, isUpdatedRequest]);

    // get attendance summary page table of data
    const getClocknsData = useCallback(async () => {
        if (!_id) return;
        setWaitForAttendance(true);
        try {
            const data = await gettingClockinsData(_id);
            if (data) {
                setAttendanceForSummary(data);
            } else {
                toast.error("Error in fetch attendance Data");
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message);
        } finally {
            setWaitForAttendance(false);
        }
    }, [_id]);

    const getAttendanceData = async () => {
        try {
            const empOfAttendances = await axios.get(`${url}/api/clock-ins/`, {
                headers: {
                    Authorization: token || ""
                }
            });
            setAttendanceData(empOfAttendances.data);
        } catch (error) {
            console.error(error);
        }
    }

    // to view attendance data for admin and hr
    useEffect(() => {
        if (Account === "1" || Account === "2") {
            getAttendanceData()
        }
        getClocknsData();
    }, [getClocknsData, Account]);

    function trackTimer() {
        setSyncTimer(!syncTimer);
    }

    // get workTimeTracker from DB in Initially
    useEffect(() => {
        const getClockInsData = async () => {
            try {
                if (_id) {
                    const { timeData } = await getDataAPI(_id);
                    if (timeData?.clockIns[0]?._id) {
                        setWorkTimeTracker(timeData.clockIns[0])
                    } else {
                        setWorkTimeTracker({ ...workTimeTracker });
                        removeClockinsData();
                    }
                }
            } catch (error) {
                console.warn(error);
            }
        }
        getClockInsData()
    }, [syncTimer]);

    useEffect(() => {
        localStorage.setItem("isStartLogin", isStartLogin);
        localStorage.setItem("isStartActivity", isStartActivity);
    }, [isStartLogin, isStartActivity]);

    return (
        <TimerStates.Provider value={{ workTimeTracker, reloadRolePage, setIsEditEmp, updateWorkTracker, trackTimer, startLoginTimer, stopLoginTimer, startActivityTimer, stopActivityTimer, setWorkTimeTracker, updateClockins, timeOption, isStartLogin, isStartActivity, changeEmpEditForm, isEditEmp }}>
            <Routes >
                <Route path="/" element={<Parent />} >
                    <Route index element={<Dashboard data={data} />} />
                    <Route path="job-desk/*" element={<JobDesk />} />
                    <Route path="employee" element={<Employee />} />
                    <Route path="employee/add" element={<Employees />} />
                    <Route path="employee/edit/:id" element={<AddEmployee />} />
                    <Route path="leave/*" element={
                        <LeaveStates.Provider value={{ daterangeValue, setDaterangeValue, isLoading, leaveRequests, filterLeaveRequests, empName, setEmpName, changeRequests }} >
                            <Routes>
                                <Route index path='status' element={<Status />} />
                                <Route path='leave-request' element={<LeaveRequest />} />
                                <Route path='calendar' element={<LeaveCalender />} />
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
                    <Route path="administration/*" element={
                        <Routes>
                            <Route index path="role/*" element={
                                <Routes>
                                    <Route index element={<Roles />} />
                                    <Route path="add" element={<PageAndActionAuth />} />
                                    <Route path="edit/:id" element={<PageAndActionAuth />} />
                                    <Route path="view/:id" element={<PageAndActionAuth />} />
                                </Routes>
                            } />
                            {/* <Route path="/shift" element={<Shift />} /> */}
                            <Route path="/department" element={<Department />} />
                            <Route path="/position" element={<Position />} />
                            {/* <Route path="/holiday" element={<Holiday />} /> */}
                            <Route path="/announcement" element={<Announce />} />
                        </Routes>
                    } />
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
                    <Route path='payslip/:id' element={<PayslipUI />} />
                    <Route path="*" element={<p>404</p>} />
                    <Route path="unauthorize" element={<UnAuthorize />} />
                </Route>
            </Routes>
        </TimerStates.Provider>
    )
}
