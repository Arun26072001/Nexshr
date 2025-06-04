import React, { useContext, useEffect } from 'react';
import { DateRangePicker, Input } from 'rsuite';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { LeaveStates, TimerStates } from '../payslip/HRMDashboard';
import "../payslip/payslip.css";
import { Skeleton } from '@mui/material';

export default function LeaveSummary() {
    const { empName, setEmpName, filterLeaveRequests, leaveRequests, isLoading } = useContext(LeaveStates);
    const { daterangeValue, setDaterangeValue } = useContext(TimerStates)

    // Trigger the filtering whenever empName or daterangeValue changes
    useEffect(() => {
        filterLeaveRequests();
    }, [empName, daterangeValue]);

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
                                value={daterangeValue}
                                placeholder="Filter Range of Date"
                                onChange={setDaterangeValue}
                            />
                        </div>
                    </div>
                    <div className="w-100 d-flex justify-content-center">
                        <div className="leaveBoard">
                            <div className="leaveData col-12 col-lg-3">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">{leaveRequests?.approvedLeave?.length} Days</div>
                                    <div className="leaveDaysDesc">Leave Taken</div>
                                </div>
                            </div>
                            <div className="leaveData col-12 col-lg-3">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">{leaveRequests?.upComingLeave?.length} Days</div>
                                    <div className="leaveDaysDesc">Upcoming Leave</div>
                                </div>
                            </div>
                            <div style={{ width: '30%', margin: '10px' }} className='col-12 col-lg-3' >
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">{leaveRequests?.pendingLeave?.length} Days</div>
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
