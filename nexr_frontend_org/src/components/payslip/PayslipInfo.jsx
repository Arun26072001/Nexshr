import React from 'react'

export default function PayslipInfo() {

    return (
        <div>
            <div className="payslipTitle">
                Payslip
            </div>

            <div className="px-3">
                <div className="my-3">
                    <div className="my-2">
                        Payslip Logo
                    </div>
                    <input type="text" className="payrunInput" placeholder="Default" />
                </div>

                <div className="my-3">
                    <div className="my-2">
                        Payslip Title
                    </div>
                    <input type="text" className="payrunInput" placeholder="Default" />
                </div>
                <div className="my-3">
                    <div className="my-2">
                        Payslip Address
                    </div>
                    <input type="text" className="payrunInput" placeholder="Default" />
                </div>
            </div>

            <div className="row">
                <div className="col-lg-3 col-12">
                    <div className="btnParent mx-auto">
                        <button className="button">Save</button>
                        <button className="outline-btn" style={{ background: "#e0e0e0", border: "none" }}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
