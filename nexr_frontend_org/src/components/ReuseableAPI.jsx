import axios from 'axios';
import { toast } from 'react-toastify';
const url = process.env.REACT_APP_API_URL;
const empId = localStorage.getItem('_id') || "";
const token = localStorage.getItem('token');

const updateDataAPI = async (body) => {
    const clockinsId = localStorage.getItem('clockinsId') || "";

    try {
        if (clockinsId) {
            const response = await axios.put(`${url}/api/clock-ins/${clockinsId}`, body, {
                headers: { authorization: token || '' },
            });
            console.log('Updated successfully:', response.data);
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

const getDataAPI = async (id) => {
    try {
        const response = await axios.get(`${url}/api/clock-ins/${id}`, {
            headers: { authorization: token || '' },
        });

        const data = response.data;
        data.timeData.meeting.takenTime = 0; // Do this before setting the state to avoid mutation
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
    }
};

const addDataAPI = async (body) => {
    try {
        const response = await axios.post(`${url}/api/clock-ins/${empId}`, body, {
            headers: { authorization: token || '' },
        });
        localStorage.setItem('clockinsId', response.data._id);
        console.log('Added successfully:', response.data);
        return response?.data?.punchInMsg;
    } catch (error) {
        toast.error(`Data not added: ${error.message}`);
    }
};

function removeClockinsData() {
    localStorage.removeItem('countdownEndTime');
    localStorage.removeItem('timeOption');
    localStorage.removeItem('isPaused');
    localStorage.removeItem('clockinsId');
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
        const response = await axios.get(`${url}/api/employee/${id}`, {
            headers: {
                authorization: token || ""
            }
        });
        return response.data;

    } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
            toast.error(error.response.data.message)
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

export {
    addDataAPI,
    getDataAPI,
    updateDataAPI,
    fetchPayslipInfo,
    removeClockinsData,
    fetchLeaveRequests,
    deleteLeave,
    fetchEmployeeData,
    fetchEmployees,
    fetchEmpLeaveRequests,
    getTotalWorkingHourPerDay,
    gettingClockinsData,
    formatTime,
    fetchWorkplace
};
