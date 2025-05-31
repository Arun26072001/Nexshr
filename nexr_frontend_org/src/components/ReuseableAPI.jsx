import axios from 'axios';
import { toast } from 'react-toastify';
import { Notification, toaster } from "rsuite";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const url = process.env.REACT_APP_API_URL;
const token = localStorage.getItem('token');
const _id = localStorage.getItem("_id");

const updateDataAPI = async (body) => {
    try {
        if (body._id) {
            const response = await axios.put(`${url}/api/clock-ins/${body._id}`, body, {
                headers: { authorization: token || '' },
            });

            return response.data;
        } else {
            toast.error("You did't Login properly!")
        }
    } catch (error) {
        console.error('Update error:', error);
    }
};

async function getTotalWorkingHourPerDay(start, end) {
    const [startHour, startMin] = start.split(/[:.]+/).map(Number);
    const [endHour, endMin] = end.split(/[:.]+/).map(Number);

    const startTime = new Date(2000, 0, 1, startHour, startMin);
    const endTime = new Date(2000, 0, 1, endHour, endMin);

    const diffMs = endTime - startTime;
    const diffHrs = diffMs / (1000 * 60 * 60); // Convert milliseconds to hours
    return diffHrs > 0 ? diffHrs : 0; // Ensure non-negative value
}

const getDataAPI = async (_id) => {
    try {
        const response = await axios.get(`${url}/api/clock-ins/${_id}`, {
            params: { date: new Date().toISOString() },
            headers: { authorization: token || '' },
        });
        const data = response.data;
        return data;

    } catch (error) {
        console.log(error?.response?.data?.error);

        // return error?.response?.data?.error;
    }
};


const getclockinsDataById = async (id) => {
    try {
        const response = await axios.get(`${url}/api/clock-ins/item/${id}`, {
            headers: { authorization: token || '' },
        });

        const data = response.data;
        return data;
    } catch (error) {
        return error?.response?.data?.message;
    }
};

const addDataAPI = async (body, worklocation, location) => {
    try {
        const response = await axios.post(`${url}/api/clock-ins/${_id}`, body, {
            params: {
                worklocation,
                location
            },
            headers: { authorization: token || '' },
        });
        toast.success(response.data.message);
        return response?.data?.clockIns;
    } catch (error) {
        toast.error(error?.response?.data?.error)

        return error?.response?.data?.error;
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
    console.log(typeof timeStr, timeStr);
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
            let newTaskObj = {
                ...task,
                assignedTo: Array.isArray(task?.assignedTo) && task.assignedTo.includes(_id)
                    ? task.assignedTo
                    : [...(task?.assignedTo || []), _id]
            }
            const res = await axios.post(`${url}/api/task/${_id}`, newTaskObj, {
                headers: { Authorization: token || "" }
            });

            toast.success(res.data.message);
            // socket.emit("send_notification_for_task", newTaskObj)
            // setTaskObj({});
            // toggleTaskMode("Add");
        } catch (error) {
            console.error("Task creation error:", error);
            toast.error(error.response?.data?.error || "Task creation failed");
        }
    }

const getCurrentTimeInMinutes = () => {
    const now = new Date().toLocaleTimeString('en-US', { timeZone: process.env.TIMEZONE, hourCycle: 'h23' });
    const timeWithoutSuffix = now.replace(/ AM| PM/, ""); // Remove AM/PM
    const [hour, min, sec] = timeWithoutSuffix.split(/[:.]+/).map(Number);
    return timeToMinutes(`${hour}:${min}:${sec}`);
};

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
    const [hours, minutes, seconds] = timeStr.split(/[:.]+/).map(Number);

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
    let dayDifference = timeDifference / (1000 * 60 * 60 * 24); // Convert milliseconds to days

    if (dayDifference < 1) {
        return 1; // Minimum one day for a leave if it's less than a full day
    }

    return dayDifference;
}

async function deleteLeave(id) {
    try {
        let deletedMsg = await axios.delete(`${url}/api/leave-application/${_id}/${id}`, {
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
        const res = await axios.get(`${url}/api/employee`, {
            headers: {
                authorization: token || ""
            }
        });
        return res.data;
    } catch (err) {
        return err
    }
}

const fetchAllEmployees = async () => {
    try {
        const res = await axios.get(`${url}/api/employee/all`, {
            headers: {
                authorization: token || ""
            }
        });
        return res.data;
    } catch (err) {
        return err.response.data.message
    }
}

const gettingClockinsData = async (_id) => {
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
        return error?.response?.data?.message
    }
}

const fetchRoles = async () => {
    try {
        const roles = await axios.get(url + "/api/role", {
            headers: {
                authorization: token || ""
            }
        });
        return roles.data;
    } catch (error) {
        return error?.response?.data?.message
    }
}

const fetchTeams = async () => {
    try {
        const teams = await axios.get(`${url}/api/team`, {
            headers: {
                Authorization: token || ""
            }
        });
        return teams.data;
    } catch (error) {
        toast.error(error.response.data.error);
    }
}

const fetchPayslip = async (id) => {
    try {
        const payslip = await axios.get(`${url}/api/payslip/${id}`);
        return payslip.data;
    } catch (error) {
        return error?.response?.data?.message
    }
}

const getDepartments = async () => {
    try {
        const departments = await axios.get(url + "/api/department", {
            headers: {
                authorization: token || ""
            }
        });
        return departments.data;
    } catch (error) {
        return error?.response?.data?.message
    }
}

const updateEmp = async (data, id) => {
    try {
        const res = await axios.put(`${url}/api/employee/${id || data._id}`, data, {
            headers: {
                authorization: token || ""
            }
        })
        return res.data.message;
    } catch (error) {
        toast.error(error.response.data.error);
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
        console.error("Error fetching location:", error);
        return null;
    }
}

function formatDate(date) {
    const actualDate = new Date(date).toUTCString().split(" ");
    return `${actualDate.slice(1, 3)} ${actualDate[4]?.split(/[:.]+/)[0]}:${actualDate[4]?.split(/[:.]+/)[1]}`
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
        const res = await axios.get(`${url}/api/holidays/${new Date().getFullYear()}`, {
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
        const res = await axios.get(`${url}/api/company`, {
            headers: {
                Authorization: token
            }
        })
        return res.data;
    } catch (error) {
        console.log("error in fetch companies", error);
        toast.error(error.response.data.error)
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

function calculateTimePattern(start, end) {
    // if (timePatternObj.StartingTime && timePatternObj.FinishingTime) {
        const startingTime = new Date(start).getTime()
        const endingTime = new Date(end).getTime()
        const timeDiff = endingTime - startingTime;
        // console.log(startingTime, endingTime, timeDiff);
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        return hoursDiff
    // }
}

function triggerToaster(response) {
    return (
        toaster.push(
            <Notification
                header={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={response.company.logo} alt="Company Logo" style={{ width: 50, height: 50, marginRight: 10 }} />
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

// Format milliseconds to HH:mm:ss
const formatMs = (ms) => {
    if (!ms || isNaN(ms)) return "00:00:00";
    return new Date(ms).toISOString().substr(11, 8);
};

function exportAttendanceToExcel(attendanceData) {
    if (!attendanceData.length) return;

    const formattedData = attendanceData.map((item) => ({
        Date: item.date.split("T")[0],
        Behaviour: item.behaviour,
        EmployeeName: item.employee.FirstName + " " + item.employee.LastName,

        // Login
        LoginStart: item.login?.startingTime[0] || "00:00",
        LoginEnd: item.login?.endingTime.at(-1) || "00:00",
        LoginTaken: formatMs(item.login?.takenTime || 0),

        // Meeting
        MeetingStart: item.meeting?.startingTime[0] || "00:00",
        MeetingEnd: item.meeting?.endingTime.at(-1) || "00:00",
        MeetingTaken: formatMs(item.meeting?.takenTime || 0),

        // Morning Break
        MorningBreakStart: item.morningBreak?.startingTime[0] || "00:00",
        MorningBreakEnd: item.morningBreak?.endingTime.at(-1) || "00:00",
        MorningBreakTaken: formatMs(item.morningBreak?.takenTime || 0),

        // Lunch
        LunchStart: item.lunch?.startingTime[0] || "00:00",
        LunchEnd: item.lunch?.endingTime.at(-1) || "00:00",
        LunchTaken: formatMs(item.lunch?.takenTime || 0),

        // Evening Break
        EveningBreakStart: item.eveningBreak?.startingTime[0] || "00:00",
        EveningBreakEnd: item.eveningBreak?.endingTime.at(-1) || "00:00",
        EveningBreakTaken: formatMs(item.eveningBreak?.takenTime || 0),

        // Event
        EventStart: item.event?.startingTime[0] || "00:00",
        EventEnd: item.event?.endingTime.at(-1) || "00:00",
        EventTaken: formatMs(item.event?.takenTime || 0),
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
    formatDate,
    processActivityDurations,
    getTimeFromHour,
    getHoliday,
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
    removeClockinsData,
    fetchLeaveRequests,
    deleteLeave,
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
    fetchRoles,
    formatTimeFromHour,
    timeToMinutes,
    fileUploadInServer,
    convertTimeStringToDate,
    getDayDifference,
    exportAttendanceToExcel
};
