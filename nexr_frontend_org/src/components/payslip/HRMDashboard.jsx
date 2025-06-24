import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    addDataAPI,
    fetchAllEmployees,
    getDataAPI,
    gettingClockinsData,
    removeClockinsData,
    updateDataAPI
} from '../ReuseableAPI';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { EssentialValues } from '../../App';
import Company from '../Administration/Company';
import Country from '../Administration/Country';
import ManageTeam from './ManageTeam';
import TimeLog from '../TimeLog';
import Comments from '../Comments';
import LeaveDetails from '../Administration/LeaveDetails';
import WFHRequestForm from './WFHRequestForm';
import WFHRequests from '../workfromhome/WFHRequests';
import EmailTemplates from './EmailTemplates';
import UnpaidRequest from '../leave/UnpaidRequest';
import Holiday from '../HolidaysPicker';

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
// const AttendanceCalendar = React.lazy(() => import('./AttendanceCalendar'));
const Projects = React.lazy(() => import("../Projects"));
const Tasks = React.lazy(() => import("../Tasks"));
const Reports = React.lazy(() => import("../Reports"));

export const LeaveStates = createContext(null);
export const TimerStates = createContext(null);

export default function HRMDashboard() {
    const url = process.env.REACT_APP_API_URL;
    const { data, isStartLogin, isStartActivity, setIsStartLogin, setIsStartActivity, whoIs } = useContext(EssentialValues);
    const { token, Account, _id } = data;
    const { isTeamLead, isTeamHead, isTeamManager } = jwtDecode(token);
    const [attendanceData, setAttendanceData] = useState([]);
    const [attendanceForSummary, setAttendanceForSummary] = useState({});
    const [leaveRequests, setLeaveRequests] = useState({});
    const [fullLeaveRequests, setFullLeaveRequests] = useState({});
    const [empName, setEmpName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [waitForAttendance, setWaitForAttendance] = useState(false);
    const [daterangeValue, setDaterangeValue] = useState("");
    const [isEditEmp, setIsEditEmp] = useState(false);
    const [timeOption, setTimeOption] = useState(localStorage.getItem("timeOption") || "meeting");
    const navigate = useNavigate();
    const [reloadRole, setReloadRole] = useState(false);
    const [syncTimer, setSyncTimer] = useState(false);
    const [isUpdatedRequest, setIsUpdatedReqests] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    // for handle task modal
    const [isAddTask, setIsAddTask] = useState(false);
    const [isWorkingLoginTimerApi, setIsWorkingLoginTimerApi] = useState(false);
    const [isworkingActivityTimerApi, setISWorkingActivityTimerApi] = useState(false);
    const [selectedProject, setSelectedProject] = useState("");
    const [checkClockins, setCheckClockins] = useState(false);
    const [isForgetToPunchOut, setIsForgetToPunchOut] = useState(false);

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

    function updateClockins() {
        setCheckClockins(!checkClockins);
    }

    function updateWorkTracker(value) {
        setTimeOption(value);
    }

    async function fetchCompanies() {
        try {
            const res = await axios.get(`${url}/api/company`, {
                headers: {
                    Authorization: token || ""
                }
            })
            setCompanies(res.data.map((comp) => ({ label: comp.CompanyName, value: comp._id })));
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in fetch companies", error);
        }
    }
    function filterLeaveRequests() {
        if (empName === "") {
            setLeaveRequests(fullLeaveRequests);
        } else {
            const filterRequests = fullLeaveRequests?.leaveData.filter((leave) => leave?.employee?.FirstName?.toLowerCase()?.includes(empName) || leave?.employee?.LastName?.toLowerCase()?.includes(empName));
            setLeaveRequests((pre) => ({ ...pre, leaveData: filterRequests }));
        }
    }

    // change reason for late input field(breaks)
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

    //change reason for early(login) input field
    function changeReasonForEarly(value, name) {
        setWorkTimeTracker((pre) => {
            if (name === "reasonForEarlyLogout") {
                return {
                    ...pre,
                    login: {
                        ...pre.login,
                        [name]: value.trimStart(),
                    },
                };
            } else {
                return {
                    ...pre,
                    [name]: value.trimStart(),
                };
            }
        });
    }


    const startLoginTimer = async (worklocation, location) => {
        const currentTime = new Date().toTimeString().split(' ')[0];
        const updatedState = {
            ...workTimeTracker,
            login: {
                ...workTimeTracker?.login,
                startingTime: [...(workTimeTracker?.login?.startingTime || []), currentTime],
            },
        };
        setIsWorkingLoginTimerApi(true)
        try {
            if (!updatedState?._id) {
                // Add new clock-ins data
                const clockinsData = await addDataAPI(updatedState, worklocation, location);
                // const totalWorkingHour = await getTotalWorkingHourPerDay(workingTimePattern.StartingTime, workingTimePattern.FinishingTime)
                if (clockinsData !== "undefined" && clockinsData._id) {
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
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            setIsStartLogin(false);
            localStorage.setItem("isStartLogin", false);
            toast.error(error);
        } finally {
            setIsWorkingLoginTimerApi(false)
        }
    };

    const stopLoginTimer = async (timeHolderData) => {
        trackTimer();
        const currentTime = new Date().toTimeString().split(' ')[0];
        const updatedState = {
            ...workTimeTracker,
            login: {
                ...workTimeTracker?.login,
                endingTime: [...(workTimeTracker?.login?.endingTime || []), currentTime],
                timeHolder: timeHolderData,
            },
        };
        // socket.emit("verify_completed_workinghour", updatedState);
        setIsWorkingLoginTimerApi(true)
        try {
            const updatedData = await updateDataAPI(updatedState);
            setWorkTimeTracker(updatedData);
            localStorage.setItem('isStartLogin', false);
            setIsStartLogin(false);
            updateClockins();
        } catch (err) {
            console.error(err);
        } finally {
            setIsWorkingLoginTimerApi(false);
        }
    };


    const startActivityTimer = async () => {
        const loginStartTimeLen = workTimeTracker?.login?.startingTime.length;
        const loginEndTimeLen = workTimeTracker?.login?.endingTime.length;
        if (loginStartTimeLen !== loginEndTimeLen) {
            const currentTime = new Date().toTimeString().split(' ')[0];
            const updatedState = {
                ...workTimeTracker,
                [timeOption]: {
                    ...workTimeTracker[timeOption],
                    startingTime: [...(workTimeTracker[timeOption]?.startingTime || []), currentTime],
                },
            };
            setISWorkingActivityTimerApi(true)
            try {
                await updateDataAPI(updatedState);
                localStorage.setItem("isStartActivity", true);
                setIsStartActivity(true);
                setWorkTimeTracker(updatedState);
                localStorage.setItem("timeOption", timeOption);
                toast.success(`${timeOption[0].toUpperCase() + timeOption.slice(1)} timer has been started!`);
            } catch (error) {
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
                console.error('Error updating data:', error);
                toast.error('Please PunchIn');
            } finally {
                setISWorkingActivityTimerApi(false)
            }
        } else {
            toast.error(`You can't start ${timeOption} timer, until start Login Timer`)
        }
    }


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
        setISWorkingActivityTimerApi(true)
        try {
            // Call the API with the updated state
            const updatedData = await updateDataAPI(updatedState(workTimeTracker));
            setWorkTimeTracker(updatedData);
            localStorage.removeItem("isStartActivity", false);
            setIsStartActivity(false);
            updateClockins();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error.message);
        } finally {
            setISWorkingActivityTimerApi(false)
        }
    }

    function changeEmpEditForm(id) {
        if (isEditEmp) {
            navigate(["manager", "admin", "hr"].includes(whoIs) ? `/${whoIs}/employee` : `/${whoIs}`);
            setIsEditEmp(false);
        } else {
            // console.log("calling...");
            // setIsEditEmp(true);
            navigate(`/${whoIs}/employee/edit/${id}`);
        }
    }

    function reloadRolePage() {
        setReloadRole(!reloadRole)
    }

    function changeRequests() {
        setIsUpdatedReqests(!isUpdatedRequest);
    }

    // get attendance summary page table of data
    const getClocknsData = useCallback(async () => {
        if (!_id) return;
        setWaitForAttendance(true);
        try {
            const data = await gettingClockinsData(_id);
            if (data) {
                setAttendanceForSummary(data);
            } else {
                console.log("error in fetch attendance Data");
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
                params: {
                    daterangeValue
                },
                headers: {
                    Authorization: token || ""
                }
            });
            setAttendanceData(empOfAttendances.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error(error);
        }
    }

    async function getTeamAttendance() {
        try {
            const res = await axios.get(`${url}/api/clock-ins/team/${_id}`, {
                params: {
                    who: isTeamHead ? "head" : isTeamLead ? "lead" : "manager",
                    daterangeValue
                },
                headers: {
                    Authorization: token || ""
                }
            });
            setAttendanceData(res.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error(error);
        }
    }

    function trackTimer() {
        setSyncTimer(!syncTimer);
    }

    async function gettingEmps() {
        try {
            const emps = await fetchAllEmployees();
            // const withoutMyData = emps.filter((emp)=> emp._id !== _id);
            setEmployees(emps.map((emp) => ({ label: emp?.FirstName + " " + emp?.LastName, value: emp._id })))
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
        }
    }

    function handleAddTask(projectId) {
        if (projectId) {
            setSelectedProject(projectId)
        }
        setIsAddTask(!isAddTask);
    }

    const getLeaveData = async () => {
        setIsLoading(true);
        try {
            const leaveData = await axios.get(`${url}/api/leave-application/date-range/management/${whoIs}`, {
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
        } finally {
            setIsLoading(false);
        }
    }

    const getLeaveDataFromTeam = async () => {
        setIsLoading(true);
        try {
            const leaveData = await axios.get(`${url}/api/leave-application/team/${_id}`, {
                params: {
                    who: isTeamLead ? "lead" : isTeamHead ? "head" : "manager",
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
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (whoIs && [isTeamHead, isTeamLead, isTeamManager].includes(true)) {
            getLeaveDataFromTeam()
        } else if (["admin", "hr"].includes(whoIs)) {
            getLeaveData();
        }
    }, [daterangeValue, _id, whoIs, isUpdatedRequest]);

    // to view attendance data for admin and hr
    useEffect(() => {
        if ([isTeamHead, isTeamLead, isTeamManager].includes(true)) {
            getTeamAttendance();
        } else if (["admin", "hr"].includes(whoIs)) {
            getAttendanceData()
        }
        getClocknsData();
        fetchCompanies();
    }, [getClocknsData, Account, daterangeValue]);

    // get workTimeTracker from DB in Initially
    useEffect(() => {
        const getClockInsData = async () => {
            try {
                if (_id) {
                    const { timeData } = await getDataAPI(_id);
                    if (timeData) {
                        if (new Date(timeData.date).toLocaleDateString() !== new Date().toLocaleDateString()) {
                            localStorage.setItem('isStartLogin', true);
                            setIsStartLogin(true);
                            setIsForgetToPunchOut(true)
                        }

                        setWorkTimeTracker(timeData)
                    } else {
                        setWorkTimeTracker({ ...workTimeTracker });
                        removeClockinsData();
                    }
                }
            } catch (error) {
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
                console.warn(error);
            }
        }
        gettingEmps()
        getClockInsData()
    }, [syncTimer]);

    return (
        <TimerStates.Provider value={{ workTimeTracker, reloadRolePage, setIsWorkingLoginTimerApi, setIsEditEmp, companies, employees, isForgetToPunchOut, setIsForgetToPunchOut, updateWorkTracker, isWorkingLoginTimerApi, isworkingActivityTimerApi, trackTimer, startLoginTimer, stopLoginTimer, changeReasonForLate, changeReasonForEarly, startActivityTimer, stopActivityTimer, setWorkTimeTracker, updateClockins, checkClockins, timeOption, isStartLogin, isStartActivity, handleAddTask, changeEmpEditForm, isEditEmp, isAddTask, setIsAddTask, handleAddTask, selectedProject, daterangeValue, setDaterangeValue }}>
            <Routes >
                <Route path="/" element={<Parent />} >
                    <Route index element={<Dashboard data={data} />} />
                    <Route path="job-desk/*" element={<JobDesk />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="tasks/*" element={
                        <Routes>
                            <Route index element={<Tasks />} />
                            <Route path="time-log/:id" element={<TimeLog />} />
                            <Route path="comments/:id" element={<Comments />} />
                        </Routes>
                    } />
                    <Route path="reports" element={<Reports />} />
                    <Route path="/holiday" element={<Holiday />} />
                    <Route path="/raise-bugs" element={<div className='text-center' style={{ justifyContent: "center", flexDirection: "row" }}>
                        <h2>If you encounter any bugs, please report them using the sheet below.</h2>
                        <button className='button' >
                            <a href={"https://docs.google.com/spreadsheets/d/1BXfw57J6w9HL2LzsTfu5d9WrxT6L55jdlqoG09XqON0/edit?gid=263793447#gid=263793447"} target="_blank" rel="noreferrer noopener" >
                                Raise your bug
                            </a>
                        </button>
                    </div>} />
                    <Route path="/announcement" element={<Announce />} />
                    <Route path="/email-templates" element={<EmailTemplates />} />
                    <Route path="employee" element={<Employee />} />
                    <Route path="employee/add" element={<AddEmployee />} />
                    <Route path="employee/edit/:id" element={<AddEmployee />} />
                    <Route path="leave/*" element={
                        <LeaveStates.Provider value={{ isLoading, leaveRequests, filterLeaveRequests, empName, setEmpName, changeRequests }} >
                            <Routes>
                                <Route index path='status' element={<Status />} />
                                <Route path='leave-request' element={<LeaveRequest />} />
                                <Route path="unpaid-request" element={<UnpaidRequest />} />
                                <Route path='calendar' element={<LeaveCalender />} />
                                <Route path='leave-summary' element={<LeaveSummary />} />
                                <Route path="leave-details" element={<LeaveDetails />} />
                            </Routes>
                        </LeaveStates.Provider>
                    } />
                    <Route path='/leave-request' element={<LeaveRequestForm />} />
                    <Route path="/leave-request/edit/:id" element={<LeaveRequestForm />} />
                    <Route path="/leave-request/view/:id" element={<LeaveRequestForm type={"view"} />} />
                    <Route path="/wfh-request" element={<WFHRequestForm />} />
                    <Route path="/wfh-request/view/:id" element={<WFHRequestForm type={"view"} />} />
                    <Route path="/wfh-request/edit/:id" element={<WFHRequestForm type={"edit"} />} />
                    <Route path="attendance/*" element={
                        <Routes>
                            <Route index path="attendance-request" element={<Request attendanceData={attendanceData} isLoading={waitForAttendance} />} />
                            <Route path="daily-log" element={<Dailylog attendanceData={attendanceData} isLoading={waitForAttendance} />} />
                            <Route path="details" element={<Details attendanceData={attendanceData} isLoading={waitForAttendance} />} />
                            <Route path="attendance-summary" element={<Summary attendanceData={attendanceForSummary} isLoading={waitForAttendance} />} />
                        </Routes>
                    }>
                    </Route>
                    <Route path="workfromhome/*" element={
                        <Routes>
                            <Route index path="wfh-request" element={<WFHRequests />} />
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
                            <Route path="/company" element={<Company />} />
                            <Route path="/department" element={<Department />} />
                            <Route path="/position" element={<Position />} />
                            <Route path="/country" element={<Country />} />
                            <Route path="/team" element={<ManageTeam />} />
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
        </TimerStates.Provider>
    )
}
