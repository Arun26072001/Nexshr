import axios from 'axios';
import { toast } from 'react-toastify';
const url = process.env.REACT_APP_API_URL;
const empId = localStorage.getItem('_id');
const token = localStorage.getItem('token');

const updateDataAPI = async (body) => {
    try {
        if (body._id) {
            const response = await axios.put(`${url}/api/clock-ins/${body._id}`, body, {
                headers: { authorization: token || '' },
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

const getDataAPI = async (empId) => {
    try {
        const response = await axios.get(`${url}/api/clock-ins/${empId}`, {
            params: { date: new Date().toISOString() },
            headers: { authorization: token || '' },
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
            headers: { authorization: token || '' },
        });

        const data = response.data;
        return data;
    } catch (error) {
        return error?.response?.data?.message;
    }
};

const addDataAPI = async (body) => {
    try {
        const response = await axios.post(`${url}/api/clock-ins/${empId}`, body, {
            headers: { authorization: token || '' },
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
        console.log(token);

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

const fetchLeaveRequests = async (empId) => {
    try {
        const res = await axios.get(`${url}/api/leave-application/emp/${empId}`, {
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


async function deleteLeave(id) {
    try {
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
        if (!token) {
            window.location.reload();
        }
        const response = await axios.get(`${url}/api/employee/${id}`, {
            headers: {
                authorization: token || ""
            }
        });
        // console.log(response.data)
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
        console.log(err);
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
                authorization: token || ""
            }
        });
        return res.data;
    } catch (err) {
        console.log(err);
        toast.error(err.response.data.message)
    }
}

const gettingClockinsData = async (empId) => {
    try {
        const dashboard = await axios.get(`${url}/api/clock-ins/employee/${empId}`, {
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

const fetchPayslipFromEmp = async (empId) => {
    try {
        const payslip = await axios.get(`${url}/api/payslip/emp/${empId}`);
        return payslip.data;
    } catch (error) {
        return error?.response?.data?.message
    }
}

const fetchRoles = async () => {
    try {
        const roles = await axios.get(url + "/api/role", {
            headers: {
                authorization: localStorage.getItem("token") || ""
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
                authorization: token || ""
            }
        });
        return departments.data;
    } catch (error) {
        return error?.response?.data?.message
    }
}

const updateEmp = async (data) => {

    try {
        const res = await axios.put(`${url}/api/employee/${data.id}`, data.values, {
            headers: {
                authorization: token || ""
            }
        })
        return res.data.message;
    } catch (error) {
        return error.response.data.error;
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
    updateEmp,
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
