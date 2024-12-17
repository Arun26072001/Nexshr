import React, { useEffect, useState } from "react"
import { ScaleLoader } from "react-spinners";
import LeaveTable from "../LeaveTable";
import { fetchEmployees } from "../ReuseableAPI";
import { toast } from "react-toastify";

const Assets = (props) => {
    const [empData, setEmpData] = useState([]);

    useEffect(() => {
        const gettingEmployees = async () => {
            try {
                const emps = await fetchEmployees();
                setEmpData(emps);
            } catch (err) {
                toast.error(err);
            }
        }
        gettingEmployees();
    }, [])
    return (
        <div>
            <p className="payslipTitle">
                Assets
            </p>

            {
                empData.length > 0
                    ? <LeaveTable data={empData} />
                    : <ScaleLoader />
            }
        </div>
    )
};

export default Assets;
