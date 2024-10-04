import React, { createContext, useEffect, useState } from 'react'
import Parent from '../Parent'
import Leave from "./Leave";
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
import { gettingClockinsData } from '../ReuseableAPI';
import Status from '../leave/Status';
import LeaveRequest from '../leave/Request';
import LeaveSummary from '../leave/Summary';
import axios from 'axios';
import LeaveCalender from '../leave/Calender';
import Settings from '../Settings.jsx/Settings';
import UnAuthorize from './UnAuthorize';
import LeaveRequestForm from './LeaveResquestForm';
import EditLeaveRequestForm from '../EditLeaveRequestForm';

export const LeaveStates = createContext(null);

export default function HRMDashboard({ data }) {
    const [attendanceData, setAttendanceData] = useState([]);
    const [attendanceForSummary, setAttendanceForSummary] = useState({});
    const empId = localStorage.getItem("_id");
    const [leaveRequests, setLeaveRequests] = useState({});
    const [fullLeaveRequests, setFullLeaveRequests] = useState([]);
    const [empName, setEmpName] = useState("");
    const token = localStorage.getItem('token');
    const [whoIs, setWhoIs] = useState("");
    const url = process.env.REACT_APP_API_URL;
    const [daterangeValue, setDaterangeValue] = useState("");

    function filterLeaveRequests() {
        if (empName === "") {
            setLeaveRequests(fullLeaveRequests);
        } else {
            const filterRequests = fullLeaveRequests.filter((leave) => leave.employee.FirstName.toLowerCase().includes(empName));
            setLeaveRequests((pre) => ({ ...pre, leaveData: filterRequests }));
        }
    }

    useEffect(() => {
        const getLeaveData = async () => {
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
            } catch (err) {
                toast.error(err?.response?.data?.message)
            }
        }
        getLeaveData();
    }, [daterangeValue, empId])

    useEffect(() => {
        if (data?.Account) {
            if (data.Account == 1) {
                setWhoIs("admin");
            } else if (data.Account == 2) {
                setWhoIs("hr");
            } else {
                setWhoIs("emp");
            }
        }
        async function getClocknsData() {
            if (empId) {
                try {
                    const data = await gettingClockinsData(empId);
                    setAttendanceForSummary(data);
                    setAttendanceData(data.clockIns);
                } catch (err) {
                    console.log(err);
                    toast.error(err?.response?.data?.message)
                }
            }
        }
        getClocknsData();
    }, [])


    return (
        <Routes >
            <Route path="/" element={<Parent whoIs={whoIs} />} >
                <Route index element={<Dashboard data={data} />} />
                <Route path="job-desk/*" element={<JobDesk whoIs={whoIs} />} />
                <Route path="employee" element={<Employee whoIs={whoIs} />} />
                {/* <Route path="leave/" element={<Leave />} /> */}
                <Route path="employee/add" element={<Employees />} />
                <Route path="leave/*" element={
                    <LeaveStates.Provider value={{ daterangeValue, setDaterangeValue, leaveRequests, filterLeaveRequests, empName, setEmpName }} >
                        <Routes>
                            <Route index path='status' element={<Status />} />
                            <Route path='request' element={<LeaveRequest />} />
                            <Route path='calender' element={<LeaveCalender />} />
                            <Route path='summary' element={<LeaveSummary />} />
                        </Routes>
                    </LeaveStates.Provider>
                } />
                <Route path='/leave-request' element={<LeaveRequestForm />} />
                <Route path="/leave-request/edit/:id" element={<EditLeaveRequestForm />} />
                <Route path="attendance/*" element={
                    <Routes>
                        <Route index path="request" element={<Request attendanceData={attendanceData} />} />
                        <Route path="daily-log" element={<Dailylog attendanceData={attendanceData} />} />
                        <Route path="details" element={<Details attendanceData={attendanceData} />} />
                        <Route path="summary" element={<Summary attendanceData={attendanceForSummary} />} />
                    </Routes>
                }>
                </Route>
                <Route path="administration/" element={<Administration />} />
                <Route path="settings/" element={<Settings />} />
                <Route path="*" element={<p>404</p>} />
                <Route path="unauthorize" element={<UnAuthorize />} />
            </Route>
        </Routes>
    )
}
