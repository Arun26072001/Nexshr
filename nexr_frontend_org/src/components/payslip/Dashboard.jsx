import React, { useContext, useEffect, useRef, useState } from 'react';
import './dashboard.css';
import { createTask, fetchEmployeeData, fetchTeamEmps, fileUploadInServer, formatTime, formatTimeFromHour, getDataAPI, gettingClockinsData, getTotalWorkingHourPerDay } from '../ReuseableAPI';
import ActivityTimeTracker from '../ActivityTimeTracker';
import NexHRDashboard from '../NexHRDashboard';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { EssentialValues } from '../../App';
import { TimerStates } from './HRMDashboard';
import ContentLoader from './ContentLoader';
import axios from 'axios';
import Select from "react-select";
import LeaveTable from '../LeaveTable';
import Loading from '../Loader';
import NoDataFound from './NoDataFound';
import CommonModel from '../Administration/CommonModel';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import DeadlineTask from './DeadlineTask';
import CalendarViewTasks from './CalendarViewTasks';
import GanttView from './GanttView';
import Planner from '../Task-Options/Planner';
import { useNavigate } from 'react-router-dom';
import { DateRangePicker } from 'rsuite';

const Dashboard = () => {
    const navigate = useNavigate();
    const url = process.env.REACT_APP_API_URL;
    const myTaskRef = useRef();
    const { updateClockins } = useContext(TimerStates)
    const { handleLogout, data, whoIs, isEditEmp, setData } = useContext(EssentialValues);
    const { isTeamLead, isTeamHead, isTeamManager } = jwtDecode(data.token)
    const [leaveData, setLeaveData] = useState({});
    const [isWorkingApi, setIsWorkingApi] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorData, setErrorData] = useState("");
    const [taskOption, setTaskOption] = useState("List");
    const [isLoadingForTask, setIsLoadingForTask] = useState(false);
    const [dailyLogindata, setDailyLoginData] = useState({})
    const [monthlyLoginData, setMonthlyLoginData] = useState({});
    const [tasks, setTasks] = useState([]);
    const [categorizeTasks, setCategorizeTasks] = useState({});
    const [plannerTasks, setPlannerTasks] = useState({});
    const [notCompletedTasks, setNotCompletedTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [teamEmps, setTeamEmps] = useState([]);
    const [previewList, setPreviewList] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState({ value: data._id, label: data.Name });
    const [isDelete, setIsDelete] = useState({ type: false, value: "" });
    const [taskObj, setTaskObj] = useState({});
    // handle add, edit and view task
    const [isAddTask, setIsAddTask] = useState(false);
    const [isEditTask, setIsEditTask] = useState(false);
    const [isviewTask, setIsViewtask] = useState(false);
    const [dateRange, setDateRange] = useState([]);

    function navigateToMyTask() {
        const scrollDown = myTaskRef?.current?.getBoundingClientRect()?.top + window.scrollY
        window.scrollTo({
            top: scrollDown,
            behavior: "smooth"
        })
    }

    function handleViewTask(id) {
        if (id) {
            fetchTaskById(id)
        }
        if (isviewTask) {
            setTaskObj({});
            setErrorData("");
        }
        setIsViewtask(!isviewTask)
    }

    function handleEditTask(id) {
        if (id) {
            fetchTaskById(id)
        }
        if (isEditTask) {
            setTaskObj({});
            setErrorData("");
        }
        setIsEditTask(!isEditTask);
    }

    // handling to delete task
    function handleDeleteTask() {
        setIsDelete((pre) => ({
            ...pre,
            type: !pre.type
        }));
    }

    function handleDelete(data) {
        setIsDelete((pre) => ({
            ...pre,
            value: data._id
        }))
        handleDeleteTask();
    }

    function handleAddTask() {
        if (isAddTask) {
            setTaskObj({});
            setPreviewList([]);
            setErrorData("");
        }
        setIsAddTask(!isAddTask)
    }

    useEffect(() => {
        navigateToMyTask()
    }, [isviewTask, isEditTask, isAddTask])

    // remove task of attachments
    function removeAttachment(value, fileIndex) {
        const updatedPrevireList = previewList.filter((imgFile) => imgFile !== value);
        setPreviewList(updatedPrevireList);
        const updatedAttachments = taskObj.attachments.filter((file, index) => index !== fileIndex);
        setTaskObj({ ...taskObj, attachments: updatedAttachments })
    }

    // project of emps
    async function fetchProjectEmps() {
        try {
            const res = await axios.get(`${url}/api/project/employees/${taskObj?.project}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })

            setEmployees(res.data.map((emp) => ({ label: emp.FirstName + " " + emp.LastName, value: emp._id })))
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in fetch employess", error);
        }
    }

    async function fetchTaskById(id) {
        try {
            const res = await axios.get(`${url}/api/task/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setTaskObj(res.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
        }
    }

    const gettingEmpdata = async () => {
        try {
            let workingHour = 0;
            if (!data._id) return; // Exit early if empId is not provided

            setIsLoading(true);

            // Fetch employee data
            const empData = await fetchEmployeeData(data._id);
            if (empData && Object.values(empData).length) {
                setData((pre) => ({
                    ...pre,
                    Account: String(empData.Account),
                    Name: `${empData.FirstName} ${empData.LastName}`,
                    annualLeave: empData.annualLeaveEntitlement || 0,
                    profile: empData.profile
                }));
            }

            // Calculate working hours for the day
            if (empData && empData?.workingTimePattern?.StartingTime && empData?.workingTimePattern?.FinishingTime) {
                workingHour = getTotalWorkingHourPerDay(new Date(empData?.workingTimePattern?.StartingTime), new Date(empData?.workingTimePattern?.FinishingTime));
            }

            // Fetch clock-ins data
            const getEmpMonthPunchIns = await gettingClockinsData(data._id);
            if (getEmpMonthPunchIns) {
                // Calculate total working hour percentage and total worked hour percentage
                const totalWorkingHourPercentage = (getEmpMonthPunchIns.companyTotalWorkingHour / getEmpMonthPunchIns.totalWorkingHoursPerMonth) * 100;
                const totalWorkedHourPercentage = (getEmpMonthPunchIns.totalEmpWorkingHours / getEmpMonthPunchIns.companyTotalWorkingHour) * 100;

                // Set the monthly login data
                setMonthlyLoginData({
                    ...getEmpMonthPunchIns,
                    totalWorkingHourPercentage,
                    totalWorkedHourPercentage
                });
            }

            // Fetch daily clock-in data
            const clockinsData = await getDataAPI(data._id);
            if (clockinsData) {
                setDailyLoginData(clockinsData);
            }
            // Set leave data with working hours
            setLeaveData({ ...empData, workingHour });

        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error || "An error occurred while fetching employee data.");
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

    // add reminder
    function addReminder(remindObj) {
        setTaskObj((pre) => ({
            ...pre,
            "remind": [...(pre?.remind || []), remindObj]
        }))
    }
    // remove reminder
    function removeReminder(index) {
        const filteredReminders = taskObj?.remind.filter((item, i) => i !== index);
        setTaskObj((pre) => ({
            ...pre,
            "remind": filteredReminders
        }))
    }

    async function updatedTimerInTask(taskData, timerType) {
        // const taskData = await fetchTaskById(id);
        let updatedTask;
        const currentTime = new Date().toTimeString().split(' ')[0];
        if (timerType === "startTime") {
            updatedTask = {
                ...taskData,
                spend: {
                    ...taskData?.spend,
                    startingTime: [...(taskData?.spend?.startingTime || []), currentTime]
                }
            }
        } else {
            updatedTask = {
                ...taskData,
                spend: {
                    ...taskData?.spend,
                    endingTime: [...(taskData?.spend?.endingTime || []), currentTime],
                }
            }
        }
        editTask(updatedTask)
    }

    // fill task data
    function changeTask(event, name) {
        const files = event?.target?.files; // Extract files correctly
        const value = event; // Extract value properly

        if (name === "attachments" || name.includes("attachments")) {
            const imgUrls = [];

            for (let index = 0; index < files.length; index++) {
                imgUrls.push(URL.createObjectURL(files[index]));
            }

            // Update state once with all images
            setPreviewList((prev = []) => [...prev, ...imgUrls]);
        }

        setTaskObj((prev) => {
            if (name.startsWith("remind.")) {
                const childName = name.split(/[:.]+/)[1];
                return {
                    ...prev,
                    "remind": [...prev.remind, {
                        ...prev?.remind,
                        [childName]: value, // Store correctly
                    }],
                }
            }
            else if (name.startsWith("spend.")) {
                const spendChild = name.split(/[:.]+/)[1];

                return {
                    ...prev,
                    spend: {
                        ...prev.spend,
                        [spendChild]: files || value, // Store correctly
                    },
                };
            } else if (name.startsWith("comments.")) {
                const commentChild = name.split(/[:.]+/)[1];

                return {
                    ...prev,
                    comments: prev.comments.length > 0
                        ? [
                            ...prev.comments.slice(0, -1), // Keep all except the last one
                            {
                                ...prev.comments[prev.comments.length - 1], // Modify last comment
                                [commentChild]: name.includes("attachments")
                                    ? [...(prev?.comments?.[prev.comments.length - 1]?.[commentChild] || []), ...files]
                                    : value,
                            },
                        ]
                        : [{ [commentChild]: name.includes("attachments") ? [...files] : value }],
                };
            } else {
                return {
                    ...prev,
                    [name]: name === "attachments"
                        ? [...(prev[name] || []), ...files] // Spread FileList properly
                        : value, // Update other fields directly
                };
            }
        });
    }

    // add task
    async function addTask() {
        let newTask;
        setIsWorkingApi(true);
        setErrorData("");
        if (taskObj?.attachments?.length > 0) {
            try {
                const files = taskObj.attachments;
                const responseData = await fileUploadInServer(files)

                newTask = {
                    ...taskObj,
                    estTime: getTotalWorkingHourPerDay(taskObj.from, taskObj.to),
                    attachments: responseData.files.map(file => file.originalFile)
                };

                // After successful upload, create the task
                await createTask(newTask);
                setTaskObj({});
                setIsAddTask(false)
                navigateToMyTask()
                fetchEmpAssignedTasks();
            } catch (error) {
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
                const errorMsg = error?.response?.data?.error
                setErrorData(errorMsg)
                toast.error(errorMsg)
            } finally {
                setIsLoading(false);
            }
        } else {
            newTask = {
                ...taskObj,
                estTime: (new Date(taskObj.to) - new Date(taskObj.from)) / (1000 * 60 * 60)
            };

            await createTask(newTask);
            setTaskObj({});
            setIsViewtask(false);
            navigateToMyTask()
        }
        setIsWorkingApi(false);
    }

    // edit task
    async function editTask(updatedTask) {
        if (!updatedTask?._id) {
            toast.error("Invalid task. Please try again.");
            return;
        }

        let taskToUpdate = { ...updatedTask };

        // Ensure `spend.timeHolder` is correctly formatted
        if (
            typeof updatedTask?.spend?.timeHolder === "string" &&
            updatedTask.spend.timeHolder.split(/[:.]+/).length <= 2
        ) {
            taskToUpdate.spend = {
                ...updatedTask.spend,
                timeHolder: formatTimeFromHour(updatedTask.spend.timeHolder) || "00:00:00",
            };
        }


        let files = [];

        try {
            // Ensure attachments exist before filtering
            if (taskToUpdate?.comments?.[0]?.attachments?.length) {
                files = taskToUpdate.comments[0].attachments.filter((file) => file.type === "image/png");
            } else {
                files = taskToUpdate?.attachments?.filter((file) => file.type === "image/png") || [];
            }

            let updatedTaskData = { ...taskToUpdate };

            if (files.length > 0) {
                // Upload files if any exist
                const responseData = await fileUploadInServer(files);

                if (taskToUpdate?.comments?.[0]?.attachments?.length > 0) {
                    updatedTaskData = {
                        ...taskToUpdate,
                        comments: [
                            {
                                ...taskToUpdate.comments[0],
                                attachments: responseData.files.map((file) => file.originalFile),
                            },
                        ],
                    };
                } else {
                    const uploadedImgPath = taskToUpdate.attachments?.filter((file) => file.type !== "image/png" && file.type !== "video/mp4") || [];

                    updatedTaskData = {
                        ...taskToUpdate,
                        attachments: [...uploadedImgPath, ...responseData.files.map((file) => file.originalFile)],
                    };
                }
            }
            // set loader true task is updating
            setIsWorkingApi(true);
            setErrorData("")
            // Send updated task
            const res = await axios.put(
                `${url}/api/task/${data._id}/${taskToUpdate._id}`, // Ensure correct projectId
                updatedTaskData,
                {
                    headers: { Authorization: data?.token || "" },
                }
            );

            toast.success(res.data.message);
            setTaskObj({});
            setIsEditTask(false);
            navigateToMyTask();
            fetchEmpAssignedTasks()
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error("Error updating task:", error);
            const errorMsg = error?.response?.data?.error
            setErrorData(errorMsg)
            toast.error(errorMsg)
        } finally {
            setIsWorkingApi(false);
        }
    }

    async function fetchEmpAssignedTasks() {
        setIsLoadingForTask(true);
        try {
            const res = await axios.get(`${url}/api/task/assigned/${selectedEmp.value}`, {
                params: {
                    dateRange
                },
                headers: {
                    Authorization: data.token || ""
                }
            })

            setTasks(res.data.tasks);
            setCategorizeTasks(res.data.categorizeTasks);
            setPlannerTasks(res.data.planner);
            setNotCompletedTasks(res.data.tasks.filter((task) => task.status !== "Completed"))
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            setTasks([])
            console.log(error);
        }
        finally {
            setIsLoadingForTask(false)
        }
    }

    async function deleteTask() {
        try {
            const res = await axios.delete(`${url}/api/task/${isDelete.value}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            fetchEmpAssignedTasks();
            setIsDelete({ type: false, value: "" })
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
        }
    }

    async function getValue(task) {
        // const taskData = await fetchTaskById(task._id);
        const updatedTask = {
            ...task,
            "status": task.status === "Completed" ? "Pending" : "Completed"
        }
        editTask(updatedTask)
    }

    async function fetchEmpsProjects() {
        setIsLoading(true)
        try {
            const res = await axios.get(`${url}/api/project/emp/${data._id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })

            setProjects(res.data.map((project) => ({ label: project.name, value: project._id })));
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in fetch emp project", error);

            // toast.error(error?.response?.data?.error)
        }
        setIsLoading(false)
    }
    async function gettingTeamEmp() {
        const emps = await fetchTeamEmps();
        if (Array.isArray(emps) && emps.length > 0) {
            setTeamEmps(emps);
            setEmployees(emps);
        }
    }
    useEffect(() => {
        if (!["admin", "hr"].includes(whoIs)) {
            gettingTeamEmp()
            fetchEmpsProjects()
        }
    }, [])

    useEffect(() => {
        if (taskObj?.project) {
            fetchProjectEmps()
        }
    }, [taskObj?.project])

    useEffect(() => {
        fetchEmpAssignedTasks();
    }, [selectedEmp, dateRange])

    useEffect(() => {
        gettingEmpdata();
    }, [isEditEmp]);

    if (isviewTask) {
        return (
            <CommonModel type="Task View" tasks={tasks} isAddData={isviewTask} modifyData={handleViewTask} notCompletedTasks={notCompletedTasks} dataObj={taskObj} projects={projects} removeAttachment={removeAttachment} employees={employees} />
        )
    } if (isEditTask) {
        return (
            <CommonModel
                errorMsg={errorData}
                isWorkingApi={isWorkingApi}
                dataObj={taskObj}
                tasks={tasks}
                notCompletedTasks={notCompletedTasks}
                previewList={previewList}
                isAddData={isEditTask}
                editData={editTask}
                addReminder={addReminder}
                changeData={changeTask}
                removeReminder={removeReminder}
                projects={projects}
                addData={addTask}
                removeAttachment={removeAttachment}
                employees={employees}
                type="Task"
                modifyData={handleEditTask} />
        )
    } if (isAddTask) {
        return (
            <CommonModel
                errorMsg={errorData}
                isWorkingApi={isWorkingApi}
                dataObj={taskObj}
                tasks={tasks}
                notCompletedTasks={notCompletedTasks}
                previewList={previewList}
                isAddData={isAddTask}
                editData={editTask}
                addReminder={addReminder}
                changeData={changeTask}
                removeReminder={removeReminder}
                projects={projects}
                addData={addTask}
                removeAttachment={removeAttachment}
                employees={employees}
                type="Task"
                modifyData={handleAddTask} />
        )
    }

    return (
        isDelete.type ? <CommonModel type="Task Confirmation" modifyData={handleDeleteTask} deleteData={deleteTask} isAddData={isDelete.type} /> :
            <div className='dashboard-parent'>
                <ActivityTimeTracker empName={data.Name} leaveData={leaveData} handleLogout={handleLogout} updateClockins={updateClockins} />
                <>
                    <div className='allowance flex-wrap'>
                        <div className={`col-lg-2 col-md-6 col-4 my-1 ${isLoading ? "d-flex justify-content-center" : "text-center"}`} title='This is the total number of paid leave days allotted to you for the current year based on your company’s leave policy. It includes all types of eligible leave such as annual, casual, or earned leave.'>
                            {
                                isLoading ?
                                    <ContentLoader />
                                    : <>
                                        <p className='leaveIndicatorTxt'>Total leave allowance</p>
                                        <p className='text-primary number'>{leaveData?.annualLeaveEntitlement || 0}</p>
                                    </>
                            }
                        </div>

                        <div className={`col-lg-2 col-md-6 col-4 my-1 ${isLoading ? "d-flex justify-content-center" : "text-center"}`} title='This is the total number of leave days you have already used or taken from your allotted leave balance during the current year.' >
                            {
                                isLoading ? <ContentLoader /> :
                                    <>
                                        <p className='leaveIndicatorTxt'>Total leave taken</p>
                                        <p className='text-primary number'>{leaveData?.totalTakenLeaveCount || 0}</p>
                                    </>
                            }
                        </div>
                        <div className={`col-lg-2 col-md-6 col-4 my-1 ${isLoading ? "d-flex justify-content-center" : "text-center"}`} title="This is the remaining number of paid leave days you can still use, calculated by subtracting your taken leaves from your total leave allowance." >
                            {
                                isLoading ? <ContentLoader /> :
                                    <>
                                        <p className='leaveIndicatorTxt'>Total leave available</p>
                                        <p className='text-primary number'>{(Number(leaveData?.annualLeaveEntitlement) - (Number(leaveData.totalTakenLeaveCount)) < 0 ? 0 : Number(leaveData?.annualLeaveEntitlement) - Number(leaveData.totalTakenLeaveCount)) || 0}</p>
                                    </>
                            }
                        </div>
                        <div className={`col-lg-3 col-md-6 col-4 my-1 ${isLoading ? "d-flex justify-content-center" : "text-center"}`} title="These are leave requests you’ve submitted that are waiting for approval from your manager or HR. They are not yet counted as approved leave." >
                            {
                                isLoading ? <ContentLoader /> :
                                    <>
                                        <p className='leaveIndicatorTxt'>Leave request pending</p>
                                        <p className='text-primary number'>{leaveData?.pendingLeaveRequests || 0}</p>
                                    </>
                            }
                        </div>
                        <div className={`col-lg-2 col-md-6 col-4 my-1 ${isLoading ? "d-flex justify-content-center" : "text-center"}`} title='This is the total number of leave days taken without pay, usually applied when paid leave balance is exhausted or for specific leave types like LOP (Loss Of Pay).' >
                            {
                                isLoading ? <ContentLoader /> :
                                    <>
                                        <p className='leaveIndicatorTxt'>Total Unpaid Leave</p>
                                        <p className='text-primary number'>{leaveData.totalUnpaidLeaveCount || 0}</p>
                                    </>
                            }
                        </div>
                    </div>
                    <div className='time flex-wrap'>
                        <h6 className='col-lg-12 col-12'>Time Log</h6>
                        <div className='col-lg-6 col-md-12 col-12'>
                            {
                                isLoading ? <ContentLoader /> :
                                    <>
                                        <p className='leaveIndicatorTxt'>Today</p>
                                        <div className='row gap-3 text-center d-flex justify-content-center'>
                                            <div className='col-lg-3 col-md-3 col-4 timeLogBox' title='This is the total number of working hours defined by the company for a day, used to track attendance, productivity, and leave calculations.' >
                                                <>
                                                    <p>{formatTime(leaveData?.workingHour || 0)}</p>
                                                    <p className='sub_text'>Total Hours</p>
                                                </>
                                            </div>
                                            <div className='col-lg-3 col-md-3 col-4 timeLogBox' title="This is the total number of hours you have actively worked or logged within the company’s defined working period" >
                                                <p>{dailyLogindata?.empTotalWorkingHours ? dailyLogindata?.empTotalWorkingHours : "00:00"}</p>
                                                <p className='sub_text'>Worked</p>
                                            </div>
                                            <div className='col-lg-3 col-md-3 col-4 timeLogBox' title="This is the remaining number of hours you are expected to work to meet the company’s total working hours for the period." >
                                                <p>{getPadStartHourAndMin(leaveData?.workingHour - Number(dailyLogindata?.empTotalWorkingHours || 0)?.toFixed(2))}</p>
                                                <p className='sub_text'>Balance</p>
                                            </div>
                                        </div>
                                    </>
                            }
                        </div>

                        <div className={`col-lg-6 col-md-12 col-12 ${isLoading ? "d-flex justify-content-center" : ""}`}>
                            {
                                isLoading ? <ContentLoader /> :
                                    <>
                                        <p className='leaveIndicatorTxt'>This month</p>
                                        <div className='row'>
                                            <div className='col-lg-6 col-md-5 col-12'>
                                                <div className='space row'>
                                                    <p className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap '>Total</span></p>
                                                    <p className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{monthlyLoginData?.companyTotalWorkingHour?.toFixed(2) || 0} hour</span></p>
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

                                            <div className='col-lg-6 col-md-5 col-12'>
                                                <div className='space row'>
                                                    <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap'>Worked time</span></div>
                                                    <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{monthlyLoginData?.totalEmpWorkingHours?.toFixed(2) || 0} hour</span></div>
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

                                            <div className='col-lg-6 col-md-5 col-12'>
                                                <div className='space row'>
                                                    <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap'>Shortage time</span></div>
                                                    <div className="col-lg-6 col-md-6 col-sm-6 col-6 text-end">
                                                        <span className="value">
                                                            {(
                                                                Math.max(
                                                                    0,
                                                                    (monthlyLoginData?.companyTotalWorkingHour || 0) -
                                                                    (monthlyLoginData?.totalEmpWorkingHours || 0)
                                                                )
                                                            ).toFixed(2)} hour
                                                        </span>
                                                    </div>

                                                </div>
                                                <div className="progress">
                                                    <div className="progress-bar progress-bar-striped" role="progressbar" style={{ width: `${monthlyLoginData?.companyTotalWorkingHour - monthlyLoginData?.totalEmpWorkingHours || 0}%` }} aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>

                                            <div className='col-lg-6 col-md-5 col-12'>
                                                <div className='space row'>
                                                    <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-start'><span className='text_gap'>Over time</span></div>
                                                    <div className='col-lg-6 col-md-6 col-sm-6 col-6 text-end'><span className='value'>{getOverTime(monthlyLoginData?.companyTotalWorkingHour, monthlyLoginData?.totalEmpWorkingHours)?.toFixed(2)} hour</span></div>
                                                </div>
                                                <div className="progress">
                                                    <div className="progress-bar progress-bar-striped" role="progressbar" style={{ width: `${getOverTime(monthlyLoginData?.companyTotalWorkingHour, monthlyLoginData?.totalEmpWorkingHours)}%` }} aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                            }

                        </div>
                    </div>
                    {
                        !["admin", "hr"].includes(whoIs) &&
                        <div className='time justify-content-start flex-wrap' >
                            <h6 ref={myTaskRef}>My Task</h6>

                            <div className="col-lg-12 col-md-12 col-12"  >
                                <div className="d-flex justify-content-between align-items-start flex-wrap my-2 px-2">
                                    <div className='d-flex align-items-center gap-3 timeLogBox flex-wrap'>
                                        {["List", "DeadLine", "Planner", "Calendar", "Gantt"].map((label) => (
                                            <span
                                                key={label}
                                                onClick={() => setTaskOption(label)}
                                                className={taskOption === label ? "active" : ""}
                                                style={{ cursor: "pointer" }}
                                            >
                                                {label}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Right Side: Controls */}
                                    <div className="d-flex gap-2 justify-content-end align-items-center" style={{ minWidth: "200px" }}>
                                        {
                                            [isTeamManager, isTeamLead, isTeamHead].includes(true) &&
                                            <Select options={teamEmps} styles={{
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                menu: (base) => ({ ...base, zIndex: 9999 })
                                            }} onChange={(e) => setSelectedEmp(e)} value={selectedEmp} placeholder="Select Team Employee" />
                                        }
                                        <DateRangePicker size="lg" className="ml-1" showOneCalendar style={{ width: "200px" }} placement="bottomEnd" value={dateRange} placeholder="Filter task" onChange={setDateRange} />
                                        <button className="button" onClick={handleAddTask} >
                                            <AddRoundedIcon /> New Task
                                        </button>
                                    </div>
                                </div>
                                <div >
                                    {
                                        taskOption === "List" ?
                                            isLoadingForTask ? <Loading /> :
                                                tasks.length ?
                                                    <LeaveTable data={tasks} handleEdit={handleEditTask} handleView={handleViewTask} deleteData={deleteTask} />
                                                    : <NoDataFound message={"Tasks data not found"} /> :
                                            taskOption === "DeadLine" ? <DeadlineTask updateTask={editTask} categorizeTasks={categorizeTasks} fetchEmpAssignedTasks={fetchEmpAssignedTasks} updateTaskStatus={getValue} deleteTask={handleDelete} handleViewTask={handleViewTask} handleEditTask={handleEditTask} setCategorizeTasks={setCategorizeTasks} updatedTimerInTask={updatedTimerInTask} /> :
                                                ["Planner"].includes(taskOption) ? <Planner plannerTasks={plannerTasks} deleteTask={handleDelete} setPlannerTasks={setPlannerTasks} isLoading={isLoading} updatedTimerInTask={updatedTimerInTask} handleViewTask={handleViewTask} handleEditTask={handleEditTask} fetchEmpAssignedTasks={fetchEmpAssignedTasks} updateTask={editTask} />
                                                    : taskOption === "Calendar" ? <CalendarViewTasks tasks={tasks} isLoading={isLoadingForTask} />
                                                        : taskOption === "Gantt" ? <GanttView tasks={tasks} isLoading={isLoadingForTask} /> : null
                                    }
                                </div>
                            </div>
                        </div>
                    }
                    <NexHRDashboard updateClockins={updateClockins} />
                </>
            </div>
    );
};

export default Dashboard; 