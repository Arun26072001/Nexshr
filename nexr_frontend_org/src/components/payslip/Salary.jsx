import React from "react"

const Salary = ({ salaryData }) => {
    return (
        <div>
            <p className="payslipTitle">
                Salary
            </p>
            {salaryData ? <div className="salaryCard">
                <div className="mb-3">
                    <div className="amountFont">Amount</div>
                    <div className="mainSalaryFont">$8080</div>
                </div>

                <div className="salaryDetails">
                    <div>
                        <div className="amountFont">To</div>
                        <div>Arun kumar</div>
                    </div>
                    <div>
                        <div className="amountFont">Date</div>
                        <div>6/10/2024</div>
                    </div>
                    <div>
                        <div className="amountFont">Payment Code</div>
                        <div>B-H767</div>
                    </div>
                </div>
            </div> : <div className="salaryCard">
                <div className="mb-3">
                    <div className="amountFont">Amount</div>
                    <div className="mainSalaryFont">$8080</div>
                </div>

                <div className="salaryDetails">
                    <div>
                        <div className="amountFont">To</div>
                        <div>Arun kumar</div>
                    </div>
                    <div>
                        <div className="amountFont">Date</div>
                        <div>6/10/2024</div>
                    </div>
                    <div>
                        <div className="amountFont">Payment Code</div>
                        <div>B-H767</div>
                    </div>
                </div>
            </div>}
        </div>
    )
};

export default Salary;
