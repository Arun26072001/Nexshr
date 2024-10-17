import React, { useContext, useEffect } from 'react';
import { DateRangePicker } from 'rsuite';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { LeaveStates } from '../payslip/HRMDashboard';

export default function LeaveSummary() {
    const { empName, setEmpName, filterLeaveRequests, leaveRequests, daterangeValue, isLoading,setDaterangeValue } = useContext(LeaveStates);

    // Trigger the filtering whenever empName or daterangeValue changes
    useEffect(() => {
        filterLeaveRequests();
    }, [empName, daterangeValue]);

    return (
        <div>
            <div className="leaveDateParent">
                <div className="payslipTitle">Leave Summary</div>
                <div>
                    <DateRangePicker
                        size="md"
                        showOneCalendar
                        placement="bottomEnd"
                        value={daterangeValue}
                        placeholder="Select Date"
                        onChange={setDaterangeValue}
                    />
                </div>
            </div>
            {
                isLoading ? <Loading /> :
                    leaveRequests?.leaveData?.length > 0 ?
                        <div>
                            <div className="leaveContainer d-block">
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

                                {/* Search Input */}
                                <div className="px-3 my-3">
                                    <div className="row">
                                        <div className="col-lg-12 searchInputIcon">
                                            <input
                                                type="text"
                                                className="payrunInput"
                                                value={empName}
                                                onChange={(e) => setEmpName(e.target.value)}
                                                placeholder="Search by Employee Name"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Render Leave Table */}
                                <LeaveTable data={leaveRequests.leaveData} />
                            </div>
                        </div> : <NoDataFound message="No Leave request for this employee Name" />
            }
        </div>
    );
}
