import React, { useContext, useEffect, useState } from "react"
import Attendence from "./Attendence";
import Leave from "./Leave";
import Payslip from "./Payslip";
import Address from "./Address";
import Contact from "./Contact";
import Social from "./Social";
import History from "./History";
import { Route, Routes, useNavigate } from "react-router-dom";
import PayslipRouter from "../unwanted/PayslipRouter";
import { fetchEmployeeData } from "../ReuseableAPI";
import { EssentialValues } from "../../App";
import MyDetails from "./MyDetails";
import "../../components/landinPage.css";
import WorkFromHome from "./WorkFromHome";

const JobDesk = () => {
    const navigate = useNavigate();
    const [empObj, setEmpObj] = useState({});
    const [error, setError] = useState("");
    const { data, isEditEmp } = useContext(EssentialValues);
    const [refetch, setRefetch] = useState(false);
    const jobDeskFiles = [
        'my-details', 'attendance', 'leave', "workFromHome",
        'payslip', 'history', 'contact', 'social', 'address'
    ];
    
    function changeFetching() {
        setRefetch(!refetch)
    }


    useEffect(() => {
        async function getEmp() {
            try {
                const empData = await fetchEmployeeData(data._id);
                setEmpObj(empData);
            } catch (error) {
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
                setError(error.response.data.error);
            }
        }
        getEmp();
    }, [refetch, isEditEmp])


    return (
        <Routes>
            <Route path="/" element={<PayslipRouter files={jobDeskFiles} />}>
                <Route index element={<MyDetails empObj={empObj} />} /> {/* Default route */}
                <Route path="my-details" element={<MyDetails empObj={empObj} />} />
                <Route path="attendance" element={<Attendence />} />
                <Route path="leave" element={<Leave />} />
                <Route path="workFromHome" element={<WorkFromHome />} />
                <Route path="history" element={<History />} />
                <Route path="payslip" element={<Payslip />} />
                <Route path="contact" element={<Contact empObj={empObj} error={error} />} />
                <Route path="social" element={<Social empObj={empObj} changeFetching={changeFetching} error={error} />} />
                <Route path="address" element={<Address empData={empObj} error={error} />} />
                <Route path="*" element={<h1>404</h1>} />
            </Route>
        </Routes>
    )
};

export default JobDesk;
