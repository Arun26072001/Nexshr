import React, { createContext, Suspense, useCallback, useContext, useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  addDataAPI, 
  getDataAPI, 
  gettingClockinsData, 
  removeClockinsData, 
  updateDataAPI 
} from '../ReuseableAPI';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { EssentialValues } from '../../App';
// import "../../App.css";
// import "../payslip/payslip.css";
import Loading from '../Loader';
import Projects from '../Projects';
import Tasks from '../Tasks';
import Reports from '../Reports';

// Lazy loading components
const Dashboard = React.lazy(() => import('./Dashboard'));
const JobDesk = React.lazy(() => import('./Jobdesk'));
const Employee = React.lazy(() => import('./Employee'));
const Employees = React.lazy(() => import('./Employees'));
const Request = React.lazy(() => import('../attendance/Request'));
const Dailylog = React.lazy(() => import('../attendance/Dailylog'));
const Details = React.lazy(() => import('../attendance/Details'));
const Summary = React.lazy(() => import('../attendance/Summary'));
const Status = React.lazy(() => import('../leave/Status'));
const LeaveRequest = React.lazy(() => import('../leave/Request'));
const LeaveSummary = React.lazy(() => import('../leave/Summary'));
const LeaveCalender = React.lazy(() => import('../leave/Calender'));
const Settings = React.lazy(() => import('../Settings/Settings'));
const UnAuthorize = React.lazy(() => import('./UnAuthorize'));
const LeaveRequestForm = React.lazy(() => import('./LeaveResquestForm'));
const EditLeaveRequestForm = React.lazy(() => import('../EditLeaveRequestForm'));
const Payroll = React.lazy(() => import('../Settings/Payroll'));
const PayrollManage = React.lazy(() => import('./PayrollManage'));
const PayslipInfo = React.lazy(() => import('./PayslipInfo'));
const PayrollValue = React.lazy(() => import('./PayrollValue'));
const PayslipRouter = React.lazy(() => import('../unwanted/PayslipRouter'));
const AddEmployee = React.lazy(() => import('../AddEmployee'));
const Roles = React.lazy(() => import('../Administration/Roles'));
const PageAndActionAuth = React.lazy(() => import('../Settings/PageAndActionAuth'));
const Announce = React.lazy(() => import('../Announcement/announce'));
const Department = React.lazy(() => import('../Administration/Department'));
const Position = React.lazy(() => import('../Administration/Position'));
const Parent = React.lazy(() => import('./layout/Parent'));
const PayslipUI = React.lazy(() => import('./PayslipUI'));
const AttendanceCalendar = React.lazy(() => import('../AttendanceCalendar'));

export const LeaveStates = createContext(null);
export const TimerStates = createContext(null);

export default function HRMDashboard() {
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
    const startAndEndTime1 = {
        startingTime: [],
        endingTime: [],
        timeHolder: "00:00:00",
        reasonForLate: ""
    };
    const startAndEndTime = {
        startingTime: [],
        endingTime: [],
        timeHolder: "00:00:00",
    };

    const [workTimeTracker, setWorkTimeTracker] = useState({
        date: new Date(),
        login: { ...startAndEndTime },
        meeting: { ...startAndEndTime },
        morningBreak: { ...startAndEndTime1 },
        lunch: { ...startAndEndTime1 },
        eveningBreak: { ...startAndEndTime1 },
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

    // change reason for leave input field
    function changeReasonForLate(e) {
        const { value } = e.target;

        setWorkTimeTracker((pre) => ({
            ...pre,
            [timeOption]: {
                ...pre[timeOption],
                reasonForLate: value
            }
        }))
    }

    const startLoginTimer = async () => {
        const currentTime = new Date().toTimeString().split(' ')[0];
        const updatedState = {
            ...workTimeTracker,
            login: {
                ...workTimeTracker?.login,
                startingTime: [...(workTimeTracker?.login?.startingTime || []), currentTime],
            },
        };

        try {
            if (!updatedState?._id) {
                // Add new clock-ins data
                const clockinsData = await addDataAPI(updatedState);
                if (clockinsData) {
                    setWorkTimeTracker(clockinsData);
                    setIsStartLogin(true);
                    localStorage.setItem("isStartLogin", true);
                    updateClockins();
                }
            } else {
                // Update existing clock-ins data
                trackTimer();
                const updatedData = await updateDataAPI(updatedState);
                setWorkTimeTracker(updatedData);
                setIsStartLogin(true);
                localStorage.setItem("isStartLogin", true);
            }
        } catch (error) {
            setIsStartLogin(false);
            localStorage.setItem("isStartLogin", false);
            toast.error('Error handling data:', error);
        }
    };


    const stopLoginTimer = async () => {
        trackTimer();
        const currentTime = new Date().toTimeString().split(' ')[0];
        const updatedState = {
            ...workTimeTracker,
            login: {
                ...workTimeTracker?.login,
                endingTime: [...(workTimeTracker?.login?.endingTime || []), currentTime],
                timeHolder: workTimeTracker?.login?.timeHolder,
            },
        };

        try {
            const updatedData = await updateDataAPI(updatedState);
            setWorkTimeTracker(updatedData);
            localStorage.setItem('isStartLogin', false);
            setIsStartLogin(false);
            updateClockins();
        } catch (err) {
            console.error(err);
        }
    };


    const startActivityTimer = async () => {
        const currentTime = new Date().toTimeString().split(' ')[0];
        const updatedState = {
            ...workTimeTracker,
            [timeOption]: {
                ...workTimeTracker[timeOption],
                startingTime: [...(workTimeTracker[timeOption]?.startingTime || []), currentTime],
            },
        };

        try {
            await updateDataAPI(updatedState);
            localStorage.setItem("isStartActivity", true);
            setIsStartActivity(true);
            setWorkTimeTracker(updatedState);
            localStorage.setItem("timeOption", timeOption);
            toast.success(`${timeOption} timer has been started!`);
        } catch (error) {
            console.error('Error updating data:', error);
            toast.error('Please PunchIn');
        }
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
        } catch (error) {
            toast.error(error.message);
        }
    }

    function changeEmpEditForm(id) {
        if (isEditEmp) {
            navigate(-1);
            setIsEditEmp(false);
        } else {
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

        const getLeaveDataFromTeam = async () => {
            setIsLoading(true);
            try {
                const leaveData = await axios.get(`${url}/api/leave-application/team/${_id}`, {
                    params: {
                        isLead: isTeamLead ? true : false,
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
        if ((whoIs) && (String(Account) === '2' || String(Account) === '1')) {
            getLeaveData();
        } else if ((whoIs && isTeamLead) || (whoIs && isTeamHead)) {
            getLeaveDataFromTeam()
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
        <TimerStates.Provider value={{ workTimeTracker, reloadRolePage, setIsEditEmp, updateWorkTracker, trackTimer, startLoginTimer, stopLoginTimer, changeReasonForLate, startActivityTimer, stopActivityTimer, setWorkTimeTracker, updateClockins, timeOption, isStartLogin, isStartActivity, changeEmpEditForm, isEditEmp }}>
            <Suspense fallback={<Loading />}>
            <Routes >
                <Route path="/" element={<Parent />} >
                    <Route index element={<Dashboard data={data} />} />
                    <Route path="job-desk/*" element={<JobDesk />} />
                    <Route path="calendar" element={<AttendanceCalendar />} />
                    {/* <Route path="" */}
                    <Route path="projects" element={<Projects />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="reports" element={<Reports />} />
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
                            <Route path="/department" element={<Department />} />
                            <Route path="/position" element={<Position />} />
                            <Route path="/holiday" element={<h1 className='text-center'>Under Development</h1>} />
                            <Route path="/announcement" element={<Announce />} />
                            <Route path={"/shift"} element={<h1 className='text-center'>Under Development</h1>} />
                        </Routes>
                    } />
                    <Route path="settings/*" element={
                        <Routes>
                            <Route path="profile" element={<Settings />} />
                            <Route path="/" element={<PayslipRouter whoIs={whoIs} files={files} />}>
                                <Route path="payroll" element={<Payroll whoIs={whoIs} />} />
                                <Route path="value" element={<PayrollValue />} />
                                <Route path="manage" element={<PayrollManage />} />
                                <Route path="payslip" element={<PayslipInfo />} />
                                <Route path="account" element={<h1 className='text-center'>Under Development</h1>} />
                            </Route>
                        </Routes>
                    } />
                    <Route path='payslip/:id' element={<PayslipUI />} />
                    <Route path="*" element={<p>404</p>} />
                    <Route path="unauthorize" element={<UnAuthorize />} />
                </Route>
            </Routes>
            </Suspense>
        </TimerStates.Provider>
    )
}
