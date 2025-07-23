import React, { useContext, useEffect, useState } from 'react';
import { DateRangePicker, Input } from 'rsuite';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import axios from "axios";
import "../payslip/payslip.css";
import { Skeleton } from '@mui/material';
import { toast } from 'react-toastify';
import { EssentialValues } from '../../App';

export default function LeaveSummary() {
    const { data, whoIs } = useContext(EssentialValues);
        const [empName, setEmpName] = useState("");
        const [dateRangeValue, setDateRangeValue] = useState([]);
        const [fullLeaveRequests, setFullLeaveRequests] = useState([]);
        const [leaveRequests, setLeaveRequests] = useState([]);
        const url = process.env.REACT_APP_API_URL;
        const [isLoading, setIsLoading] = useState(false);
    
        const getLeaveData = async () => {
            setIsLoading(true);
            try {
                const leaveData = await axios.get(`${url}/api/leave-application/date-range/management/${whoIs}`, {
                    params: {
                        dateRangeValue
                    },
                    headers: {
                        authorization: data.token || ""
                    }
                })
                setLeaveRequests(leaveData.data);
                setFullLeaveRequests(leaveData.data);
            } catch (err) {
                toast.error(err?.response?.data?.message);
                console.log("error in fethc leave data", err)
            } finally {
                setIsLoading(false);
            }
        }
    
        useEffect(() => {
            getLeaveData();
        }, [dateRangeValue])
        // Filter leave requests when empName or daterangeValue changes
        useEffect(() => {
            if (empName === "") {
                setLeaveRequests(fullLeaveRequests);
            } else {
                const filterRequests = fullLeaveRequests?.leaveData.filter((leave) => leave?.employee?.FirstName?.toLowerCase()?.includes(empName.toLowerCase()) || leave?.employee?.LastName?.toLowerCase()?.includes(empName.toLowerCase()));
                setLeaveRequests((pre) => ({ ...pre, leaveData: filterRequests }));
            }
        }, [empName]);

    return (
        <div>
            <div className="leaveDateParent">
                <p className="payslipTitle">Leave Summary</p>
            </div>
            <div>
                <div className="leaveContainer d-block">
                    <div className="px-3 my-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <Input value={empName} size="lg" style={{ width: "300px" }} placeholder="Search Employee" onChange={(e) => setEmpName(e)} />
                            <DateRangePicker
                                size="lg"
                                showOneCalendar
                                placement="bottomEnd"
                                value={dateRangeValue}
                                placeholder="Filter Range of Date"
                                onChange={setDateRangeValue}
                            />
                        </div>
                    </div>
                    <div className="w-100 d-flex justify-content-center">
                        <div className="leaveBoard">
                            <div className="leaveData col-12 col-lg-3">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">{leaveRequests?.approvedLeave || 0} Days</div>
                                    <div className="leaveDaysDesc">Leave Taken</div>
                                </div>
                            </div>
                            <div className="leaveData col-12 col-lg-3">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">{leaveRequests?.upComingLeave || 0} Days</div>
                                    <div className="leaveDaysDesc">Upcoming Leave</div>
                                </div>
                            </div>
                            <div style={{ width: '30%', margin: '10px' }} className='col-12 col-lg-3' >
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">{leaveRequests?.pendingLeave || 0} Days</div>
                                    <div className="leaveDaysDesc">Pending Request</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Render Leave Table */}
                    {
                        isLoading ? <Skeleton
                            sx={{ bgcolor: 'grey.500' }}
                            variant="rectangular"
                            width={"100%"}
                            height={"50vh"}
                        /> :
                            leaveRequests?.leaveData?.length > 0 ?
                                <LeaveTable data={leaveRequests.leaveData} /> : <NoDataFound message="No Leave request for this employee Name" />}
                </div>
            </div>
        </div>
    );
}
