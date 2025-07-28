import React, { useContext, useEffect, useState } from "react";
import { DateRangePicker } from "rsuite";
import LeaveTable from "../LeaveTable";
import NoDataFound from "./NoDataFound";
import { Skeleton } from "@mui/material";
import { fetchPayslipFromEmp } from "../ReuseableAPI";
import { EssentialValues } from "../../App";
import { toast } from "react-toastify";

const Payslip = () => {
    const [daterangeValue, setDaterangeValue] = useState("");
    const { data } = useContext(EssentialValues);
    const [payslips, setPayslips] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchPayslips() {
            setIsLoading(true);
            try {
                const slips = await fetchPayslipFromEmp(data._id, daterangeValue);
                setPayslips(slips);
            } catch (err) {
                toast.error(err?.response?.data?.error)
            } finally {
                setIsLoading(false);
            }
        }

        fetchPayslips();
    }, [data._id, daterangeValue])

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center px-2 my-2">
                <p className="payslipTitle">
                    Payslip
                </p>
                <div>
                    <DateRangePicker size="lg" showOneCalendar placement="bottomEnd" value={daterangeValue} placeholder="Filter Range of Date" onChange={setDaterangeValue} />
                </div>
            </div>

            <div className="leaveContainer d-block">
                <div className="w-100 d-flex justify-content-center">
                    <div className="leaveBoard">
                        <div className="leaveData col-12 col-lg-3">
                            <div className="d-flex flex-column">
                                <div className="leaveDays">
                                    {payslips?.arrangedPayslips?.length}
                                </div>
                                <div className="leaveDaysDesc">
                                    Total Payslip
                                </div>
                            </div>
                        </div>
                        <div className="leaveData col-12 col-lg-3">
                            <div className="d-flex flex-column">
                                <div className="leaveDays">
                                    {payslips?.successPayslips?.length}
                                </div>
                                <div className="leaveDaysDesc">
                                    Send Payslip
                                </div>
                            </div>
                        </div>
                        <div className="leaveData col-12 col-lg-3" >
                            <div className="d-flex flex-column">
                                <div className="leaveDays">
                                    {payslips?.conflitPayslips?.length}
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
                        payslips?.arrangedPayslips?.length > 0 ?
                            <LeaveTable data={payslips?.arrangedPayslips} />
                            : <NoDataFound message={"Sorry! No payslip data in your account."} />
                }
            </div>
        </div>
    )
};

export default Payslip;
