import React, { useContext, useEffect, useState } from "react"
import Attendence from "./Attendence";
import Leave from "./Leave";
import Payslip from "./Payslip";
import Address from "./Address";
import Contact from "./Contact";
import Social from "./Social";
import History from "./History";
import { Route, Routes } from "react-router-dom";
import PayslipRouter from "../unwanted/PayslipRouter";
import { fetchEmployeeData, fetchPayslipFromEmp } from "../ReuseableAPI";
import { EssentialValues } from "../../App";
import { toast } from "react-toastify";

const JobDesk = () => {
    const [empObj, setEmpObj] = useState({});
    const [error, setError] = useState("");
    const { data } = useContext(EssentialValues);
    const [isLoading, setIsLoading] = useState(false);
    const [payslips, setPayslips] = useState([]);
    const jobDeskFiles = [
        'attendance', 'leave', 'payslip', 'history',
        'contact', 'social', 'address'
    ];

    useEffect(() => {
        async function fetchPayslips() {
            setIsLoading(true);
            try {
                const slips = await fetchPayslipFromEmp(data._id);
                setPayslips(slips);
            } catch (err) {
                toast.error(err?.response?.data?.error)
            }
            setIsLoading(false);
        }

        fetchPayslips();
    }, [data._id])

    useEffect(() => {
        async function getEmp() {
            try {
                const empData = await fetchEmployeeData(data._id);
                setEmpObj(empData);
            } catch (error) {
                setError(error.response.data.error);
            }
        }
        getEmp();
    }, [])

    return (
        <Routes >
            <Route path="/" element={<PayslipRouter files={jobDeskFiles} />}>
                <Route index path="attendance" element={<Attendence />} />
                <Route path="leave" element={<Leave />} />
                <Route path="history" element={<History payslips={payslips} isLoading={isLoading} />} />
                <Route path="payslip" element={<Payslip payslips={payslips} isLoading={isLoading} />} />
                <Route path="contact" element={<Contact empObj={empObj} error={error} />} />
                <Route path="social" element={<Social empObj={empObj} error={error} />} />
                <Route path="address" element={<Address />} />
                <Route path="*" element={<h1>404</h1>} />
            </Route>
        </Routes>
    )
};

export default JobDesk;
