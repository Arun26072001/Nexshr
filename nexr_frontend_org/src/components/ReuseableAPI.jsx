import axios from 'axios';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import Cookies from "universal-cookie";
const cookies = new Cookies();
const token = cookies.get('token');
const url = process.env.REACT_APP_API_URL;
const { _id } = jwtDecode(token);

const updateDataAPI = async (body) => {
    try {
        if (body._id) {
            const response = await axios.put(`${url}/api/clock-ins/${body._id}`, body, {
                headers: { Authorization: `Bearer ${token}` || "" }
            });
            console.log('Updated successfully:', response.data);
            return response.data;
        } else {
            toast.error("You did't Login properly!")
        }
    } catch (error) {
        console.error('Update error:', error);
    }
};

async function getTotalWorkingHourPerDay(start, end) {
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);

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
            headers: { Authorization: `Bearer ${token}` || "" }
        });

        const data = response.data;

        return data;
    } catch (error) {
        return error?.response?.data?.message;
    }
};


const getclockinsDataById = async (id) => {
    try {
        const response = await axios.get(`${url}/api/clock-ins/item/${id}`, {
            headers: { Authorization: `Bearer ${token}` || "" }
        });

        const data = response.data;
        return data;
    } catch (error) {
        return error?.response?.data?.message;
    }
};

const addDataAPI = async (body) => {
    try {
        const response = await axios.post(`${url}/api/clock-ins/${_id}`, body, {
            headers: { Authorization: `Bearer ${token}` || "" }
        });
        // localStorage.setItem('clockinsId', response.data._id);
        console.log('Added successfully:', response.data);
        return response?.data;
    } catch (error) {
        return error?.response?.data?.message;
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
                Authorization: `Bearer ${token}` || ""
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

const fetchLeaveRequests = async (_id) => {
    try {
        const res = await axios.get(`${url}/api/leave-application/emp/${_id}`, {
            headers: {
                Authorization: `Bearer ${token}` || ""
            }
        });
        return res.data;
    } catch (err) {
        if (err.response && err.response.data && err.response.data.details) {
            toast.error(err.response.data.details)
        }
    }
};


async function deleteLeave(id) {
    try {
        let deletedMsg = await axios.delete(`${url}/api/leave-application/${_id}/${id}`, {
            headers: {
                Authorization: `Bearer ${token}` || ""
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
        if (!token) {
            window.location.reload();
        }
        const response = await axios.get(`${url}/api/employee/${id}`, {
            headers: {
                Authorization: `Bearer ${token}` || ""
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
                Authorization: `Bearer ${token}` || ""
            }
        });
        return res.data;
    } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
            return err.response.data.message;
        } else {
            return err;
        }
    }
}

const fetchAllEmployees = async () => {
    try {
        const res = await axios.get(`${url}/api/employee/all`, {
            headers: {
                Authorization: `Bearer ${token}` || ""
            }
        });
        return res.data;
    } catch (err) {
        console.log(err);
        if (err.response && err.response.data && err.response.data.message) {
            return err.response.data.message;
        } else {
            return err;
        }
    }
}

const gettingClockinsData = async (_id) => {
    try {
        const dashboard = await axios.get(`${url}/api/clock-ins/employee/${_id}`, {
            headers: {
                Authorization: `Bearer ${token}` || ""
            }
        })

        return dashboard.data;

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
                Authorization: `Bearer ${token}`
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
                Authorization: `Bearer ${token}` || ""
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
                Authorization: `Bearer ${token}` || ""
            }
        });
        return roles.data;
    } catch (error) {
        return error?.response?.data?.message
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
                Authorization: `Bearer ${token}`
            }
        });
        return departments.data;
    } catch (error) {
        return error?.response?.data?.message
    }
}


const addSecondsToTime = (timeString, secondsToAdd) => {
    // Validate and normalize the timeString format
    if (!/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(timeString)) {
        console.error("Invalid time format:", timeString);
        return { hours: "00", minutes: "00", seconds: "00" };
    }

    // Split and convert to numbers
    const [hours, minutes, seconds] = timeString.split(":").map(Number);

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


export {
    addDataAPI,
    getDataAPI,
    getDepartments,
    updateDataAPI,
    fetchPayslipFromEmp,
    fetchPayslipInfo,
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
    fetchRoles
};
