import React, { useContext, useEffect, useState } from "react";
import { EssentialValues } from "../../App";
import RequestPageIcon from '@mui/icons-material/RequestPage';
import { useNavigate } from "react-router-dom";
import NoDataFound from "./NoDataFound";
import { Skeleton } from "@mui/material";
import { fetchPayslipFromEmp } from "../ReuseableAPI";
import { toast } from "react-toastify";

const History = () => {
    const { data, whoIs } = useContext(EssentialValues);
    const navigate = useNavigate();
    const [payslips, setPayslips] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchPayslips() {
            setIsLoading(true);
            try {
                const slips = await fetchPayslipFromEmp(data._id);
                setPayslips(slips);
            } catch (err) {
                toast.error(err?.response?.data?.error)
            } finally {
                setIsLoading(false);
            }
        }

        fetchPayslips();
    }, [data._id])

    if (isLoading) {
        return <div className="gap-1">
            {
                [Array(3).length].map((_, index) => {
                    return <Skeleton variant="rounded" key={index} height={130} className="my-3" />
                })
            }
        </div>;
    }

    return (
        <div className="container-fluid">
            <p className="payslipTitle">History</p>
            {payslips?.arrangedPayslips?.length > 0 ? payslips.arrangedPayslips.map((item, index) => {
                const {
                    basicSalary = 0, ESI = 0, LossOfPay = 0, ProfessionalTax = 0, ProvidentFund = 0,
                    bonusAllowance = 0, conveyanceAllowance = 0,
                    houseRentAllowance = 0, incomeTax = 0, othersAllowance = 0
                } = item.payslip;

                const Salary =
                    (basicSalary + bonusAllowance + conveyanceAllowance + houseRentAllowance + othersAllowance) -
                    (ESI + LossOfPay + ProfessionalTax + ProvidentFund + incomeTax);

                const employeeName = data.Name[0].toUpperCase() + data.Name.slice(1);

                return (
                    <div className="historyCard" key={index}>
                        <div className="salaryFont">{Salary.toFixed(2)} &#8377;</div>
                        <div className="d-flex justify-content-between">
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                <div className="timeLogBox " >
                                    {employeeName || "N/A"}
                                </div>
                                <div className="timeLogBox" >
                                    {item.payslip.period || "N/A"}
                                </div>
                                <div className="timeLogBox">
                                    {item.payslip.status || "N/A"}
                                </div>
                            </div>
                            <div onClick={() => navigate(`/${whoIs}/payslip/${item._id}`)}>
                                <RequestPageIcon color="primary" fontSize="large" style={{ cursor: "pointer" }} />
                            </div>
                        </div>
                    </div>
                );
            }) :
                <NoDataFound message="No payslip data found" />
            }
        </div>
    );
};

export default History;
