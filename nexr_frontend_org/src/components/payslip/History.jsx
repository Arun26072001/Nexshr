import React, { useContext } from "react";
import Loading from "../Loader";
import { EssentialValues } from "../../App";
import RequestPageIcon from '@mui/icons-material/RequestPage';
import { useNavigate } from "react-router-dom";
import NoDataFound from "./NoDataFound";
import { Skeleton } from "@mui/material";

const History = ({ payslips, isLoading }) => {
    const { data, whoIs } = useContext(EssentialValues);
    const navigate = useNavigate();

    if (isLoading) {
        return <div className="gap-1">
            <Skeleton variant="rounded" height={130} className="my-3" />
            <Skeleton variant="rounded" height={130} className="my-3" />
            <Skeleton variant="rounded" height={130} className="my-3" />
        </div>;
    }

    return (
        <div className="container-fluid">
            <p className="payslipTitle">History</p>
            {payslips.length > 0 ? payslips.map((item, index) => {
                const {
                    ESI = 0, LossOfPay = 0, ProfessionalTax = 0, ProvidentFund = 0,
                    bonusAllowance = 0, conveyanceAllowance = 0,
                    houseRentAllowance = 0, incomeTax = 0, othersAllowance = 0
                } = item.payslip;
                const basicSalary = Number(item.employee.basicSalary) || 0;

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
