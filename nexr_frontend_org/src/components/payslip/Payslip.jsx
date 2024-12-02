import React, { useContext, useEffect, useState } from "react";
import { DateRangePicker } from "rsuite";
import LeaveTable from "../LeaveTable";
import NoDataFound from "./NoDataFound";
import { toast } from "react-toastify";
import { fetchPayslipFromEmp } from "../ReuseableAPI";
import Loading from "../Loader";
import { EssentialValues } from "../../App";

const Payslip = (props) => {
    const { data } = useContext(EssentialValues);
    const { _id } = data;
    const [payslips, setPayslips] = useState([]);
    const [daterangeValue, setDaterangeValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchPayslips() {
            try {
                const slips = await fetchPayslipFromEmp(_id);
                setPayslips(slips);
            } catch (err) {
                setError(err?.response?.data?.error)
            }
        }

        setIsLoading(true);
        fetchPayslips();
        setIsLoading(false);
    }, [_id])
    return (
        isLoading ? <Loading /> :
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
                    error ? <NoDataFound message={error} />
                        : payslips?.length > 0 ?
                            <LeaveTable data={payslips} />
                            : <NoDataFound message={"Sorry! No payslip data in your account."} />
                }
            </div>
    )
};

export default Payslip;
