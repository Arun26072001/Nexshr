import React, { useState } from "react";
import { DateRangePicker } from "rsuite";
import LeaveTable from "../LeaveTable";
import NoDataFound from "./NoDataFound";
import Loading from "../Loader";
import { Skeleton } from "@mui/material";

const Payslip = ({ payslips, isLoading }) => {
    const [daterangeValue, setDaterangeValue] = useState("");

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center px-2 my-2">
                <p className="payslipTitle">
                    Payslip
                </p>
                <div>
                    <DateRangePicker size="lg" showOneCalendar placement="bottomEnd" value={daterangeValue} placeholder="Select Date" onChange={setDaterangeValue} />
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
            {
                isLoading ? <Skeleton
                    sx={{ bgcolor: 'grey.500' }}
                    variant="rectangular"
                    width={"100%"}
                    height={"50vh"}
                /> :
                    payslips.length > 0 ?
                        <LeaveTable data={payslips} />
                        : <NoDataFound message={"Sorry! No payslip data in your account."} />
            }
        </div>
    )
};

export default Payslip;
