import React, { useContext, useEffect } from 'react';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { LeaveStates } from '../payslip/HRMDashboard';

export default function LeaveRequest() {
    const { empName, setEmpName, filterLeaveRequests, isLoading, leaveRequests } = useContext(LeaveStates);

    useEffect(() => {
        filterLeaveRequests();
    }, [empName]);

    return (
        isLoading ? (
            <Loading />
        ) : (
            <div>
                <div className="row">
                    <div className="col-lg-6 payslipTitle">
                        Leave Request
                    </div>
                    <div className="col-lg-6 searchInputIcon">
                        <input
                            type="text"
                            className='payrunInput'
                            value={empName}
                            onChange={(e) => setEmpName(e.target.value)}
                            placeholder='Search'
                        />
                    </div>
                </div>
                <div className="leaveContainer d-block">
                    <div className="w-100 d-flex justify-content-center">
                        <div className="leaveBoard">
                            {/* Leave taken */}
                            <div className="leaveData">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.approvedLeave?.length || 0} Days
                                    </div>
                                    <div className="leaveDaysDesc">
                                        Leave taken
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming leave */}
                            <div className="leaveData">
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.upComingLeave?.length || 0} Days
                                    </div>
                                    <div className="leaveDaysDesc">
                                        Upcoming leave
                                    </div>
                                </div>
                            </div>

                            {/* Pending request */}
                            <div style={{ width: "30%", margin: "10px" }}>
                                <div className="d-flex flex-column">
                                    <div className="leaveDays">
                                        {leaveRequests?.pendingLeave?.length || 0} Days
                                    </div>
                                    <div className="leaveDaysDesc">
                                        Pending request
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Leave Table */}
                    {
                        leaveRequests?.leaveData?.length > 0 ?
                            <LeaveTable data={leaveRequests.leaveData} /> :
                            <NoDataFound message={"No Leave request for this employee Name"} />

                    }
                </div>
            </div>
        )
    );
}
