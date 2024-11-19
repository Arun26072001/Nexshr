import React, { useEffect, useContext } from 'react';
import Loading from '../Loader';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { DateRangePicker } from 'rsuite';
import { LeaveStates } from '../payslip/HRMDashboard';

export default function Status() {
    const { empName, setEmpName, filterLeaveRequests, leaveRequests, isLoading, daterangeValue, setDaterangeValue } = useContext(LeaveStates);

    // Filter leave requests when empName or daterangeValue changes
    useEffect(() => {
        filterLeaveRequests();
    }, [empName, daterangeValue]);

    return (
        isLoading ? <Loading /> :
            <div>
                {/* Top date input and leave label */}
                <div className="leaveDateParent">
                    <div className="payslipTitle">
                        Leave Status
                    </div>
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

                {/* Display leave data or no data found */}
                <div>
                    <div className="leaveContainer d-block">
                      <div className='px-3 my-3'>
                            <div className="row">
                                <div className="col-lg-12 searchInputIcon">
                                    <input
                                        type="text"
                                        className='payrunInput'
                                        value={empName}
                                        onChange={(e) => setEmpName(e.target.value)}
                                        placeholder='Search Employee'
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="w-100 d-flex justify-content-center">
                            <div className="leaveBoard">
                                <div className="leaveData">
                                    <div className="d-flex flex-column">
                                        <div className="leaveDays">
                                            {leaveRequests?.approvedLeave?.length || 0} Days
                                        </div>
                                        <div className="leaveDaysDesc">
                                            Total Leave Hours
                                        </div>
                                    </div>
                                </div>
                                <div className="leaveData">
                                    <div className="d-flex flex-column">
                                        <div className="leaveDays">
                                            {leaveRequests?.leaveInHours || 0} hrs
                                        </div>
                                        <div className="leaveDaysDesc">
                                            On Leave
                                        </div>
                                    </div>
                                </div>
                                <div style={{ width: "30%", margin: "10px" }}>
                                    <div className="d-flex flex-column">
                                        <div className="leaveDays">
                                            {leaveRequests?.pendingLeave?.length || 0} Days
                                        </div>
                                        <div className="leaveDaysDesc">
                                            Pending Request
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                    

                    {leaveRequests?.leaveData?.length > 0 ?
                        <LeaveTable data={leaveRequests.leaveData} /> : <NoDataFound message="No Leave request for this employee Name" />}
                    </div>
                </div>
            </div>

    )
}
