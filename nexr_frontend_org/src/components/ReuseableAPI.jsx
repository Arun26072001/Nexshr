import axios from 'axios';
import { toast } from 'react-toastify';
import { Notification, toaster } from "rsuite";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { jwtDecode } from 'jwt-decode';
const url = process.env.REACT_APP_API_URL;

function getToken() {
    const token = localStorage.getItem('token');
    return token;
}

function getId() {
    const empId = localStorage.getItem("_id");
    return empId;
}

const updateDataAPI = async (body, warning) => {
    try {
        const token = getToken()
        if (body._id) {
            const response = await axios.put(`${url}/api/clock-ins/${body._id}`, body, {
                params: {
                    warning
                },
                headers: { authorization: token || '' },
            });
            const clockInsData = response.data.updatedClockIn;
            if (response.data?.isWarningLimitReached) {
                localStorage.setItem("isWarningLimitReached", true);
            }
            return clockInsData;
        }
    } catch (error) {
        toast.warning(error.response.data.error)
        console.error('Update error:', error);
    }
};

async function fetchTeamEmps(type) {
    const empId = getId();
    const token = getToken()
    const { isTeamHead, isTeamLead, isTeamManager } = jwtDecode(token);
    try {
        const res = await axios.get(`${url}/api/team/members/${empId}`, {
            params: {
                who: isTeamLead ? "lead" : isTeamHead ? "head" : isTeamManager ? "manager" : "employees"
            },
            headers: {
                Authorization: token || ""
            }
        })
        if (type === "fullData") {
            return res.data.employees;
        }
        const emps = res.data.employees.map((emp) => ({ label: emp.FirstName + " " + emp.LastName, value: emp._id }));
        return emps;
    } catch (error) {
        console.log("error in fetch team emps", error);
    }
}

function getTotalWorkingHourPerDay(start, end) {
    if (start && end) {
        // Calculate the difference in milliseconds
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();

        let timeDifference;
        if (endTime > startTime) {
            timeDifference = end - start;
        } else {
            timeDifference = start - end
        }

        const diffHrs = timeDifference / (1000 * 60 * 60); // Convert milliseconds to hours
        return diffHrs > 0 ? diffHrs : 0; // Ensure non-negative value
    } else return 0;
}

const getDataAPI = async (_id) => {
    try {
        const token = getToken();
        const empId = getId();
        const response = await axios.get(`${url}/api/clock-ins/${empId}`, {
            params: { date: changeClientTimezoneDate(new Date()) },
            headers: { authorization: token || '' },
        });
        const data = response.data;
        return data;
    } catch (error) {
        console.log("error in fetch clockins data", error);
    }
};


const getclockinsDataById = async (id) => {
    try {
        const token = getToken()
        const response = await axios.get(`${url}/api/clock-ins/item/${id}`, {
            headers: { authorization: token || '' },
        });

        const data = response.data;
        return data;
    } catch (error) {
        return error?.response?.data?.message;
    }
};

function checkDateIsHoliday(dateList = [], target) {
    if (target) {
        return dateList.some((holiday) => new Date(holiday.date).toLocaleDateString() === new Date(target).toLocaleDateString());
    } else {
        return false;
    }
}

function isValidLeaveDate(holidays = [], WeeklyDays = [], target) {
    const date = new Date(target);
    const dayName = date.toLocaleString(undefined, { weekday: "long" }); // e.g., 'Monday', 'Tuesday', etc.

    const isHoliday = checkDateIsHoliday(holidays, date);
    const isWeeklyOff = WeeklyDays.includes(dayName);

    // A valid leave date is one that is NOT a holiday AND NOT a weekly off
    return !isHoliday && !isWeeklyOff;
}

const addDataAPI = async (body, worklocation, location) => {
    try {
        const token = getToken();
        const empId = getId();
        const response = await axios.post(`${url}/api/clock-ins/${empId}`, body, {
            params: {
                worklocation,
                location
            },
            headers: { authorization: token || '' },
        });
        toast.success(response.data.message);
        return response?.data;
    } catch (error) {
        console.log("error in start login timer", error)
        toast.error(error?.response?.data?.error)
    }
};

function removeClockinsData() {
    localStorage.removeItem('loginTimer');
    localStorage.removeItem("activityTimer");
    localStorage.removeItem("isStartActivity");
    localStorage.removeItem("isStartLogin");
}

const fetchEmpLeaveRequests = async () => {
    try {
        const token = getToken()
        const res = await axios.get(`${url}/api/leave-application/hr`, {
            headers: {
                authorization: token || ""
            }
        })
        return res.data;

    } catch (err) {
        console.log(err);
        if (err.response && err.response.data && err.response.data.message) {
            return err.response.data.message;
        }
    }
}

function timeToMinutes(timeStr) {
    if (typeof timeStr === 'object') {
        const timeData = new Date(timeStr).toTimeString().split(' ')[0]
        const [hours, minutes, seconds] = timeData.split(/[:.]+/).map(Number)
        return Number(((hours * 60) + minutes + (seconds / 60)).toFixed(2)) || 0;
    }
    if (timeStr.split(/[:.]+/).length === 3) {
        const [hours, minutes, seconds] = timeStr.split(/[:.]+/).map(Number);
        return Number(((hours * 60) + minutes + (seconds / 60)).toFixed(2)) || 0; // Defaults to 0 if input is invalid
    } else {
        const [hours, minutes] = timeStr.split(/[:.]+/).map(Number);
        return Number(((hours * 60) + minutes).toFixed(2)) || 0;
    }
}

async function createTask(task) {
    try {
        const token = getToken();
        const empId = getId();
        let newTaskObj = {
            ...task,
            assignedTo: Array.isArray(task?.assignedTo) && task.assignedTo.includes(empId)
                ? task.assignedTo
                : [...(task?.assignedTo || []), empId]
        }
        const res = await axios.post(`${url}/api/task/${empId}`, newTaskObj, {
            headers: { Authorization: token || "" }
        });

        toast.success(res.data.message);
    } catch (error) {
        console.error("Task creation error:", error);
        toast.error(error.response?.data?.error || "Task creation failed");
        return;
    }
}

const getCurrentTimeInMinutes = () => {
    const now = new Date().toLocaleTimeString('en-US', { timeZone: process.env.TIMEZONE, hourCycle: 'h23' });
    const timeWithoutSuffix = now.replace(/ AM| PM/, ""); // Remove AM/PM
    const [hour, min, sec] = timeWithoutSuffix.split(/[:.]+/).map(Number);
    return timeToMinutes(`${hour}:${min}:${sec}`);
};

function changeClientTimezoneDate(date) {
    const options = {
        timeZone: 'Asia/Calcutta', hourCycle: 'h23', year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    }
    const actualDate = new Intl.DateTimeFormat('en-US', options).format(date);
    return new Date(actualDate);
}

function formatTimeFromMinutes(minutes) {
    if ([NaN, 0].includes(minutes)) {
        return `00:00:00`;
    } else {
        const hours = Math.floor(minutes / 60); // Get the number of hours
        const mins = Math.floor(minutes % 60); // Get the remaining whole minutes
        const fractionalPart = minutes % 1; // Get the fractional part of the minutes
        const secs = Math.round(fractionalPart * 60); // Convert the fractional part to seconds

        // Format each part to ensure two digits (e.g., "04" instead of "4")
        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(mins).padStart(2, '0');
        const formattedSeconds = String(secs).padStart(2, '0');

        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }
}

function convertTimeStringToDate(timeStr) {
    let hours, minutes, seconds = 0;
    if (new Date(timeStr) && new Date(timeStr).getHours()) {
        return new Date(timeStr);
    } else {
        [hours, minutes, seconds] = timeStr.split(/[:.]+/).map(Number);
    }

    if (
        [hours, minutes, seconds].some(
            (value) => isNaN(value) || value < 0 || value > 59
        ) || hours > 23
    ) {
        throw new Error("Invalid time string format. Expected 'HH:MM:SS'");
    }

    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        seconds
    );
}

function processActivityDurations(record, activity) {
    const startingTimes = record[activity]?.startingTime || [];
    const endingTimes = record[activity]?.endingTime || [];

    const durations = startingTimes.map((startTime, i) => {
        const start = timeToMinutes(startTime);
        const end = endingTimes[i] ? timeToMinutes(endingTimes[i]) : getCurrentTimeInMinutes();
        return Math.abs(end - start);
    });

    const total = durations.reduce((sum, mins) => sum + mins, 0);
    if (!record[activity]) record[activity] = {};
    record[activity].timeHolder = formatTimeFromMinutes(total);
    return record;
}

const fetchLeaveRequests = async (_id) => {
    try {
        const token = getToken()
        const res = await axios.get(`${url}/api/leave-application/emp/${_id}`, {
            headers: {
                authorization: token || ""
            }
        });
        return res.data;
    } catch (err) {
        if (err.response && err.response.data && err.response.data.details) {
            toast.error(err.response.data.details)
        }
    }
};

function getDayDifference(leave) {
    if (leave?.leaveType === "half day") {
        return 0.5;
    }

    let toDate = new Date(leave.toDate);
    let fromDate = new Date(leave.fromDate);

    let timeDifference = toDate - fromDate;
    let dayDifference = Math.round(timeDifference / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

    if (dayDifference < 1) {
        return 1; // Minimum one day for a leave if it's less than a full day
    }

    return dayDifference;
}

async function deleteLeave(id) {
    try {
        const token = getToken();
        const empId = getId();
        let deletedMsg = await axios.delete(`${url}/api/leave-application/${empId}/${id}`, {
            headers: {
                authorization: token || ""
            }
        })

        toast.success(deletedMsg.data.message);
    } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
            toast.error(err.response.data.message)
        }
    }
}

const fetchEmployeeData = async (id) => {
    try {
        const token = getToken()
        const response = await axios.get(`${url}/api/employee/${id}`, {
            headers: {
                authorization: token || ""
            }
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
            toast.error(error?.response?.data?.details)
            return error;
        }
    }
};

const fetchEmployees = async () => {
    try {
        const token = getToken()
        const res = await axios.get(`${url}/api/employee`, {
            headers: {
                authorization: token || ""
            }
        });
        return res.data;
    } catch (err) {
        return err;
    }
}

const fetchAllEmployees = async () => {
    try {
        const token = getToken()
        const res = await axios.get(`${url}/api/employee/all`, {
            headers: {
                authorization: token || ""
            }
        });
        return res.data;
    } catch (err) {
        console.log("error in fetchall emps", err)
        return err.response.data.error
    }
}

const gettingClockinsData = async (_id) => {
    const token = getToken();
    if (!token) {
        window.location.reload();
        return;
    }
    try {
        const dashboard = await axios.get(`${url}/api/clock-ins/employee/${_id}`, {
            headers: {
                authorization: token || ""
            }
        })
        return dashboard.data
    } catch (err) {
        toast.error(err.message)
    }
}

function formatTime(fractionalHours) {
    // Calculate total minutes
    const totalMinutes = fractionalHours * 60;

    // Get the whole hours, minutes, and seconds
    const hours = Math.floor(fractionalHours);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes % 1) * 60);

    // Format the output as HH:MM:SS
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedTime;
}

const fetchWorkplace = async () => {
    try {
        const token = getToken()
        const workPlaces = await axios.get(url + "/api/work-place", {
            headers: {
                authorization: token || ""
            }
        })
        return workPlaces.data;
    } catch (err) {
        return err?.response?.data
    }
};

const fetchPayslipInfo = async () => {
    try {
        const token = getToken()
        const payslipInfo = await axios.get(`${url}/api/payslip-info`, {
            headers: {
                authorization: token || ""
            }
        });
        return payslipInfo.data;
    } catch (err) {
        return err;
    }
}

const fetchPayslipFromEmp = async (_id) => {
    try {
        const payslip = await axios.get(`${url}/api/payslip/emp/${_id}`);
        return payslip.data;
    } catch (error) {
        //  if (error?.message === "Network Error") {
        //         navigate("/network-issue")
        //     }
        return error?.response?.data?.message
    }
}

const fetchRoles = async () => {
    try {
        const token = getToken()
        const roles = await axios.get(url + "/api/role", {
            headers: {
                authorization: token || ""
            }
        });
        return roles.data;
    } catch (error) {
        //  if (error?.message === "Network Error") {
        //         navigate("/network-issue")
        //     }
        return error?.response?.data?.message
    }
}

const fetchTeams = async () => {
    try {
        const token = getToken()
        const teams = await axios.get(`${url}/api/team`, {
            headers: {
                Authorization: token || ""
            }
        });
        return teams.data;
    } catch (error) {
        //  if (error?.message === "Network Error") {
        //         navigate("/network-issue")
        //     }
        toast.error(error?.response?.data?.error);
    }
}

const fetchPayslip = async (id) => {
    try {
        const payslip = await axios.get(`${url}/api/payslip/${id}`);
        return payslip.data;
    } catch (error) {
        //  if (error?.message === "Network Error") {
        //         navigate("/network-issue")
        //     }
        return error?.response?.data?.message
    }
}

const getDepartments = async () => {
    try {
        const token = getToken()
        const departments = await axios.get(url + "/api/department", {
            headers: {
                authorization: token || ""
            }
        });
        return departments.data;
    } catch (error) {
        //  if (error?.message === "Network Error") {
        //         navigate("/network-issue")
        //     }
        return error?.response?.data?.message
    }
}

const updateEmp = async (data, id) => {
    try {
        const token = getToken()
        const res = await axios.put(`${url}/api/employee/${id || data._id}`, data, {
            headers: {
                authorization: token || ""
            }
        })
        return res.data.message;
    } catch (error) {
        toast.error(error?.response?.data?.error);
    }
}

async function getUserLocation(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.display_name) {
            return data.display_name;
        } else {
            console.error("Geocoding failed:", data);
            return null;
        }
    } catch (error) {
        //  if (error?.message === "Network Error") {
        //         navigate("/network-issue")
        //     }
        console.error("Error fetching location:", error);
        return null;
    }
}

function formatDate(date) {
    const actualDate = new Date(date).toUTCString().split(" ");
    return `${actualDate[1]}, ${actualDate[2]}`
}

function formatTimeFromHour(hour) {
    if (!hour) {
        return `00:00:00`;
    }
    const hours = Math.floor(hour);
    const minutes = Math.floor(hour % 60);
    const seconds = Math.floor((hour * 60) % 60); // Convert remaining fraction to seconds

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function isValidDate(value) {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.getHours() !== 0;
}

function getTimeFromDateOrTimeData(timeStr) {
    if (isValidDate(timeStr)) {
        return new Date(timeStr).toLocaleTimeString();
    }
    if (timeStr.split(/[:.]+/).length > 0) {
        const [hours, minutes, seconds] = timeStr.split(/[:.]+/).map(Number);
        const date = new Date();
        return new Date(date.setHours(hours, minutes, seconds)).toLocaleTimeString();
    }
}

const addSecondsToTime = (timeString, secondsToAdd) => {
    // Validate and normalize the timeString format
    if (!/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(timeString)) {
        console.error("Invalid time format:", timeString);
        return { hours: "00", minutes: "00", seconds: "00" };
    }

    // Split and convert to numbers
    const [hours, minutes, seconds] = timeString.split(/[:.]+/).map(Number);

    // Ensure totalSeconds is non-negative
    const totalSeconds = Math.max(0, hours * 3600 + minutes * 60 + seconds + secondsToAdd);

    // Calculate new time components
    const newHours = Math.floor(totalSeconds / 3600) % 24;
    const newMinutes = Math.floor((totalSeconds % 3600) / 60);
    const newSeconds = totalSeconds % 60;

    return {
        hours: String(newHours).padStart(2, "0"),
        minutes: String(newMinutes).padStart(2, "0"),
        seconds: String(newSeconds).padStart(2, "0"),
    };
};

async function getHoliday() {
    try {
        const token = getToken();
        const res = await axios.get(`${url}/api/holidays/current-year`, {
            headers: {
                Authorization: token || ""
            }
        });
        return res.data
    } catch (error) {
        console.log(error?.response?.data?.error);
    }
}

async function fetchCompanies() {
    try {
        const token = getToken()
        const res = await axios.get(`${url}/api/company`, {
            headers: {
                Authorization: token
            }
        })
        return res.data;
    } catch (error) {
        // if (error?.message === "Network Error") {
        //     navigate("/network-issue")
        // }
        console.log("error in fetch companies", error);
        toast.error(error?.response?.data?.error)
    }
}

function getTimeFromHour(timeStr, min = false) {
    if (timeStr) {
        const [hours, minutes, seconds] = timeStr.split(/[:.]+/).map(Number);
        if (min) {
            return ((hours * 60) + minutes + (seconds / 60))?.toFixed(2);
        } else {
            return (((hours * 60) + minutes + (seconds / 60)) / 60)?.toFixed(2);
        }
    } else {
        return 0;
    }
}

async function fileUploadInServer(files) {
    const formData = new FormData();

    // Append each file to FormData
    files.forEach((file) => {
        formData.append("documents", file); // Ensure correct field name
    });

    // Upload the files
    const response = await axios.post(`${url}/api/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
    });
    if (response) {
        return response.data
    }

    // Check if upload was successful
    if (!response.data || !response.data.files) {
        console.error("Upload failed:", response);
        return;
    }
}

async function checkEmpIsPermanentWFH(empId) {
    try {
        const token = getToken();
        const res = await axios.get(`${url}/api/employee/isPermanentWFH/${empId}`, {
            headers: {
                Authorization: token || ""
            }
        });
        return res.data.isPermanentWFH;
    } catch (error) {
        console.log("error in checkEmpIsPermanentWFH", error)
    }
}

function calculateTimePattern(start, end) {
    const startingTime = new Date(start).getTime()
    const endingTime = new Date(end).getTime()
    const timeDiff = endingTime - startingTime;
    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
    return hoursDiff
}

function getDueDateByType(type) {
    const today = new Date();
    const startOfToday = new Date(today.setHours(23, 59, 59, 999));

    switch (type) {
        case "Due Today":
            return startOfToday;

        case "Due This Week":
            const endOfWeek = new Date();
            endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
            return new Date(endOfWeek.setHours(23, 59, 59, 999));

        case "Due Next Week":
            const nextWeek = new Date();
            const day = nextWeek.getDay();
            const diff = 7 - day + 1; // Next Monday
            nextWeek.setDate(nextWeek.getDate() + diff);
            return new Date(nextWeek.setHours(9, 0, 0, 0));

        case "Due Over Two Weeks":
            const overTwoWeeks = new Date();
            overTwoWeeks.setDate(overTwoWeeks.getDate() + 15);
            return new Date(overTwoWeeks.setHours(9, 0, 0, 0));

        case "No Deadline":
            return null;

        default:
            return null;
    }
}

function triggerToaster(response) {
    return (
        toaster.push(
            <Notification
                header={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={response?.company?.logo} alt="Company Logo" style={{ width: 50, height: 50, marginRight: 10 }} />
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{response.company.CompanyName}</span>
                    </div>
                }
                closable
            >
                <strong>{response.title}</strong>
                <br />
                <p>{response.message}</p>
            </Notification>,
            { placement: 'bottomEnd' }
        )
    )
}

// // Format milliseconds to HH:mm:ss
// const formatMs = (ms) => {
//     if (!ms || isNaN(ms)) return "00:00:00";
//     return new Date(ms).toISOString().substr(11, 8);
// };

function dateToFormatTime(row) {
    const dateData = row;
    if (dateData) {
        const date = new Date(dateData);
        return !isNaN(date.getTime()) ? date.toLocaleTimeString() : dateData;
    } else {
        return "N/A";
    }
}

function exportAttendanceToExcel(attendanceData) {
    if (!attendanceData.length) return;

    const formattedData = attendanceData.map((item) => ({
        Date: item.date.split("T")[0],
        Behaviour: item.behaviour,
        EmployeeName: item.employee.FirstName + " " + item.employee.LastName,

        // Login
        LoginStart: dateToFormatTime(item.login?.startingTime[0]) || "00:00",
        LoginEnd: dateToFormatTime(item.login?.endingTime.at(-1)) || "00:00",
        LoginTaken: item.login?.timeHolder || 0,

        // Meeting
        MeetingStart: dateToFormatTime(item.meeting?.startingTime[0]) || "00:00",
        MeetingEnd: dateToFormatTime(item.meeting?.endingTime.at(-1)) || "00:00",
        MeetingTaken: item.meeting?.timeHolder || 0,

        // Morning Break
        MorningBreakStart: dateToFormatTime(item.morningBreak?.startingTime[0]) || "00:00",
        MorningBreakEnd: dateToFormatTime(item.morningBreak?.endingTime.at(-1)) || "00:00",
        MorningBreakTaken: item.morningBreak?.timeHolder || 0,

        // Lunch
        LunchStart: dateToFormatTime(item.lunch?.startingTime[0]) || "00:00",
        LunchEnd: dateToFormatTime(item.lunch?.endingTime.at(-1)) || "00:00",
        LunchTaken: item.lunch?.timeHolder || 0,

        // Evening Break
        EveningBreakStart: dateToFormatTime(item.eveningBreak?.startingTime[0]) || "00:00",
        EveningBreakEnd: dateToFormatTime(item.eveningBreak?.endingTime.at(-1)) || "00:00",
        EveningBreakTaken: item.eveningBreak?.timeHolder || 0,

        // Event
        EventStart: dateToFormatTime(item.event?.startingTime[0]) || "00:00",
        EventEnd: dateToFormatTime(item.event?.endingTime.at(-1)) || "00:00",
        EventTaken: item.event?.timeHolder || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    saveAs(blob, "Attendance.xlsx");
}

export {
    triggerToaster,
    calculateTimePattern,
    getTimeFromDateOrTimeData,
    formatDate,
    processActivityDurations,
    getTimeFromHour,
    getHoliday,
    dateToFormatTime,
    addDataAPI,
    createTask,
    fetchCompanies,
    fetchTeams,
    getDataAPI,
    updateEmp,
    getDepartments,
    updateDataAPI,
    fetchPayslipFromEmp,
    fetchPayslipInfo,
    getUserLocation,
    fetchPayslip,
    isValidDate,
    removeClockinsData,
    fetchLeaveRequests,
    isValidLeaveDate,
    deleteLeave,
    getDueDateByType,
    getclockinsDataById,
    fetchEmployeeData,
    fetchEmployees,
    addSecondsToTime,
    fetchEmpLeaveRequests,
    getTotalWorkingHourPerDay,
    gettingClockinsData,
    fetchAllEmployees,
    formatTime,
    fetchWorkplace,
    changeClientTimezoneDate,
    fetchRoles,
    formatTimeFromHour,
    timeToMinutes,
    fileUploadInServer,
    checkEmpIsPermanentWFH,
    fetchTeamEmps,
    convertTimeStringToDate,
    getDayDifference,
    exportAttendanceToExcel
};
