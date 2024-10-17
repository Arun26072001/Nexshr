import React, { createContext, useEffect, useState } from 'react'
import Parent from '../Parent'
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
import Settings from '../Settings/Settings';
import UnAuthorize from './UnAuthorize';
import LeaveRequestForm from './LeaveResquestForm';
import EditLeaveRequestForm from '../EditLeaveRequestForm';
import Payroll from "../Settings/Payroll";
import PayrollManage from './PayrollManage';
import PayslipInfo from './PayslipInfo';
import PayrollValue from './PayrollValue';
import PayslipRouter from './PayslipRouter';

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
    const [isLoading, setIsLoading] = useState(false);
    const [waitForAttendance, setWaitForAttendance] = useState(false);
    const url = process.env.REACT_APP_API_URL;
    const [daterangeValue, setDaterangeValue] = useState("");
    // files for payroll
    const files = ['payroll', 'value', 'manage', 'payslip'];

    function filterLeaveRequests() {
        if (empName === "") {
            setLeaveRequests(fullLeaveRequests);
        } else {
            console.log(fullLeaveRequests);
            const filterRequests = fullLeaveRequests?.leaveData.filter((leave) => leave.employee.FirstName.toLowerCase().includes(empName));
            setLeaveRequests((pre) => ({ ...pre, leaveData: filterRequests }));
        }
    }

    useEffect(() => {
        const getLeaveData = async () => {
            setIsLoading(true);
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
                setIsLoading(false);
            } catch (err) {
                toast.error(err?.response?.data?.message);
                setIsLoading(false);
            }
        }
        getLeaveData();
    }, [daterangeValue, empId]);

    useEffect(() => {
        if (data?.Account) {
            if (data.Account === '1') {
                setWhoIs("admin");
            } else if (data.Account === '2') {
                setWhoIs("hr");
            } else if (data.Account === '3') {
                setWhoIs("emp");
            }
        }
        async function getClocknsData() {
            if (empId) {
                setWaitForAttendance(true);
                try {
                    const data = await gettingClockinsData(empId);
                    if (data) {
                        setAttendanceForSummary(data);
                        setAttendanceData(data.clockIns);
                        setWaitForAttendance(false);
                    } else {
                        toast.error("Error in fetch attendance Data");
                        setWaitForAttendance(false);
                    }
                } catch (err) {
                    console.log(err);
                    setWaitForAttendance(false);
                    toast.error(err?.response?.data?.message)
                }
            }
        }
        getClocknsData();
    }, [empId])


    return (
        <Routes >
            <Route path="/" element={<Parent whoIs={whoIs} />} >
                <Route index element={<Dashboard data={data} />} />
                <Route path="job-desk/*" element={<JobDesk whoIs={whoIs} />} />
                <Route path="employee" element={<Employee whoIs={whoIs} />} />
                {/* <Route path="leave/" element={<Leave />} /> */}
                <Route path="employee/add" element={<Employees />} />
                <Route path="leave/*" element={
                    <LeaveStates.Provider value={{ daterangeValue, setDaterangeValue, isLoading,leaveRequests, filterLeaveRequests, empName, setEmpName }} >
                        <Routes>
                            <Route index path='status' element={<Status />} />
                            <Route path='leave-request' element={<LeaveRequest />} />
                            <Route path='calender' element={<LeaveCalender />} />
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
                <Route path="administration/" element={<Administration />} />
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

                <Route path="*" element={<p>404</p>} />
                <Route path="unauthorize" element={<UnAuthorize />} />
            </Route>
        </Routes>
    )
}
