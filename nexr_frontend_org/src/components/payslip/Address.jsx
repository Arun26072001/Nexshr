import React from "react"

const Address = (props) => {
    return (
        <div>
            <p className="payslipTitle">
                Address
            </p>

            <div className="px-3">
                <div className="my-3">
                    <div className="my-2">
                        Permanent Address
                    </div>
                    <input type="text" className="payrunInput" placeholder="4140 Parker Rd. Allentown, New Mexico 31134" />
                </div>

                <div className="my-3">
                    <div className="my-2">
                        Current Address
                    </div>
                    <input type="text" className="payrunInput" placeholder="3517 W. Gray St. Utica, Pennsylvania 57867" />
                </div>
            </div>

            <div className="row">
                <div className="col-lg-3 col-12">
                    <div className="btnParent mx-auto">
                        <button className="outline-btn" style={{ background: "#e0e0e0", border: "none" }}>Cancel</button>
                        <button className="button">Save</button>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Address;
