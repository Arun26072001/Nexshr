import React, { useState } from "react";
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const Payrun = (props) => {
    const [isShowPayrun, setIsShowPayrun] = useState(true);
    function handleShowNotification() {
        setIsShowPayrun(!isShowPayrun);
    }
    
    return (
        <>
            <p className="payslipTitle">Payrun</p>
            <div className="d-flex flex-column align-items-center">
                {
                    isShowPayrun &&
                    <div className="payrunNotification">
                        <div className="w-100">
                            <div className="d-flex">
                                <div className="d-flex align-items-center">
                                    <WarningAmberRoundedIcon color="primary" fontSize="large" />
                                    <p className="payslipTitle p-1">Payrun </p>
                                </div>
                                <div style={{ marginLeft: "auto", cursor: "pointer" }} onClick={handleShowNotification}><CloseRoundedIcon color="primary" fontSize="large" /></div>
                            </div>
                            <ol>
                                <li>By default all payrun and beneficiary badges is set from default setting</li>
                                <li>You can individually update or change these values from the edit option.</li>
                            </ol>
                        </div>
                    </div>
                }
                <div className="row" style={{ width: "95%" }}>
                    <div className="col-lg-4 my-2">
                        <div className="py-2">
                            <span>Pay run period</span>
                        </div>
                        <select className="payrunInput">
                            <option value="">Select Payrun</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>

                    <div className="col-lg-4 my-2">
                        <div className="d-flex justify-content-between py-2">
                            <span>Bonus</span> <span style={{ color: "gray" }}>(Allowance)</span>
                        </div>
                        <div className="position-relative">
                            <input type="number" min={0} max={100} className="payrunInput" />
                            <span className="percentageIcon">%</span>
                        </div>

                    </div>

                    <div className="col-lg-4 my-2">
                        <div className="d-flex justify-content-between py-2">
                            <span>Tax</span> <span style={{ color: "gray" }}>(Deduction)</span>
                        </div>
                        <div className="position-relative">
                            <input type="number" min={0} max={100} step={".5"} className="payrunInput" />
                            <span className="percentageIcon">%</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
};

export default Payrun;
