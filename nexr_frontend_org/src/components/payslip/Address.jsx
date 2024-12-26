import React from "react"
import NoDataFound from "./NoDataFound";

const Address = ({ empData, error }) => {

    return (
        error ? <NoDataFound message={error} /> :
            <div>
                <p className="payslipTitle">
                    Address
                </p>

                <div className="px-3">
                    <div className="my-3">
                        <div className="my-2">
                            Permanent Address
                        </div>
                        <input type="text" className="payrunInput" value={`${empData?.address?.street || "street"}, ${empData?.address?.city || "city"}, ${empData?.address?.state || "state"}, ${empData?.address?.country || "country"}`} />
                    </div>

                    <div className="my-3">
                        <div className="my-2">
                            Current Address
                        </div>
                        <input type="text" className="payrunInput" value={`${empData?.address?.street || "street"}, ${empData?.address?.city || "city"}, ${empData?.address?.state || "state"}, ${empData?.address?.country || "country"}`} />
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
