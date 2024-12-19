import React, { useContext, useEffect, useState } from "react"
import { fetchEmployeeData } from "../ReuseableAPI";
import { EssentialValues } from "../../App";
import NoDataFound from "./NoDataFound";

const Address = (props) => {
    const { data } = useContext(EssentialValues);
    const [empData, setEmpData] = useState({});
    const [error, setError] = useState("");

    useEffect(() => {
        async function gettingEmp() {
            try {
                const emp = await fetchEmployeeData(data._id);

                setEmpData(emp);
            } catch (error) {
                setError(error.response.data.error);
            }
        }

        gettingEmp();
    }, []);

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
