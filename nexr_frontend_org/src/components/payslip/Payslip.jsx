import React, { useState } from "react";
import { DateRangePicker } from "rsuite";
import LeaveTable from "../LeaveTable";
import NoDataFound from "./NoDataFound";
import Loading from "../Loader";

const Payslip = ({ payslips, isLoading }) => {
    const [daterangeValue, setDaterangeValue] = useState("");

    return (
        isLoading ? <Loading height="80vh" /> :
            <div>
                <div className="leaveDateParent mb-2">
                    <p className="payslipTitle">
                        Payslip
                    </p>
                    <div>
                        <DateRangePicker size="md" showOneCalendar placement="bottomEnd" value={daterangeValue} placeholder="Select Date" onChange={setDaterangeValue} />
                    </div>
                </div>

                <div className="w-100 d-flex justify-content-center">
                    <div className="leaveBoard">
                        <div className="leaveData">
                            <div className="d-flex flex-column">
                                <div className="leaveDays">
                                    {payslips?.length}
                                </div>
                                <div className="leaveDaysDesc">
                                    Total Payslip
                                </div>
                            </div>
                        </div>
                        <div className="leaveData">
                            <div className="d-flex flex-column">
                                <div className="leaveDays">
                                    02
                                </div>
                                <div className="leaveDaysDesc">
                                    Send Payslip
                                </div>
                            </div>
                        </div>
                        <div style={{ width: "30%", margin: "10px" }} >
                            <div className="d-flex flex-column">
                                <div className="leaveDays">
                                    0
                                </div>
                                <div className="leaveDaysDesc">
                                    Conflicted Payslip
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
                {payslips.length > 0 ?
                    <LeaveTable data={payslips} />
                    : <NoDataFound message={"Sorry! No payslip data in your account."} />
                }
            </div>
    )
};

export default Payslip;
