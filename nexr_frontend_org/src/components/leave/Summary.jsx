import React, { useContext, useEffect } from 'react';
import { DateRangePicker } from 'rsuite';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { LeaveStates, TimerStates } from '../payslip/HRMDashboard';
import "../payslip/payslip.css";

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
            {
                isLoading ? <Loading height="80vh" /> :
                    <div>

                        <div className="leaveContainer d-block">
                            <div className="px-3 my-3">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="searchInputIcon">
                                        <input
                                            type="text"
                                            className='payrunInput'
                                            value={empName}
                                            onChange={(e) => setEmpName(e.target.value)}
                                            placeholder='Search Employee'
                                        />
                                    </div>
                                    <DateRangePicker
                                        size="lg"
                                        showOneCalendar
                                        placement="bottomEnd"
                                        value={daterangeValue}
                                        placeholder="Select Date"
                                        onChange={setDaterangeValue}
                                    />
                                </div>
                            </div>
                            <div className="w-100 d-flex justify-content-center">
                                <div className="leaveBoard">
                                    <div className="leaveData">
                                        <div className="d-flex flex-column">
                                            <div className="leaveDays">{leaveRequests?.approvedLeave?.length} Days</div>
                                            <div className="leaveDaysDesc">Leave Taken</div>
                                        </div>
                                    </div>
                                    <div className="leaveData">
                                        <div className="d-flex flex-column">
                                            <div className="leaveDays">{leaveRequests?.upComingLeave?.length} Days</div>
                                            <div className="leaveDaysDesc">Upcoming Leave</div>
                                        </div>
                                    </div>
                                    <div style={{ width: '30%', margin: '10px' }}>
                                        <div className="d-flex flex-column">
                                            <div className="leaveDays">{leaveRequests?.pendingLeave?.length} Days</div>
                                            <div className="leaveDaysDesc">Pending Request</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Render Leave Table */}
                            {leaveRequests?.leaveData?.length > 0 ?
                                <LeaveTable data={leaveRequests.leaveData} /> : <NoDataFound message="No Leave request for this employee Name" />}
                        </div>
                    </div>
            }
        </div>
    );
}
