import React, { useEffect, useState } from "react";
import { DateRangePicker } from "rsuite";
import axios from "axios";
import LeaveTable from "../LeaveTable";
import NoDataFound from "./NoDataFound";
import { toast } from "react-toastify";
import { fetchPayslipInfo } from "../ReuseableAPI";

const Payslip = (props) => {
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const [payslips, setPayslips] = useState([]);
    const [daterangeValue, setDaterangeValue] = useState("");

    useEffect(() => {
        async function fetchPayslips() {
            try {
                const slips = await fetchPayslipInfo();
                setPayslips(slips);
            } catch (err) {
                toast.error(err?.response?.data?.error)
            }
        }

        fetchPayslips();
    }, [])
    return (
        <div>

            <div className="leaveDateParent">
                <div className="payslipTitle">
                    Payslip
                </div>
                <div>
                    <DateRangePicker size="md" showOneCalendar placement="bottomEnd" value={daterangeValue} placeholder="Select Date" onChange={setDaterangeValue} />
                </div>
            </div>

            <div className="w-100 d-flex justify-content-center">
                <div className="leaveBoard">
                    <div className="leaveData">
                        <div className="d-flex flex-column">
                            <div className="leaveDays">
                                2
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

            {/* <div className="container-fluid my-3"> */}
            {
                payslips.length > 0 ?
                    <LeaveTable data={payslips} />
                    : payslips.length === 0 ? <NoDataFound message={"Slip data not found"} />
                        : null
            }
            {/* </div> */}
        </div>
    )
};

export default Payslip;
