import React, { useContext, useEffect, useState } from 'react';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { toast } from 'react-toastify';
import "./dashboard.css";
import LeaveTable from '../LeaveTable';
import { fetchEmployees } from '../ReuseableAPI';
import Loading from '../Loader';
import { useNavigate } from 'react-router-dom';
import NoDataFound from './NoDataFound';
import { TimerStates } from './HRMDashboard';
import Cookies from "universal-cookie";

export default function Employee() {
    const { whoIs } = useContext(TimerStates);
    const [employees, setEmployees] = useState([]);
    const [empName, setEmpName] = useState("");
    const [allEmployees, setAllEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [errorData, setErrorData] = useState("");

    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                const empData = await fetchEmployees();
                setEmployees(empData);
                setAllEmployees(empData);
            } catch (error) {
                setErrorData(error.response.data.message)
                toast.error("Failed to fetch employees");
            }
        };
        setIsLoading(true);
        fetchEmployeeData();
        setIsLoading(false);
        // Cleanup function if needed (optional)
        return () => {
            setEmployees([]);  // Clear employee list on unmount, if necessary
        };
    }, []);



    // Filter employees when `empName` changes
    useEffect(() => {
        function filterEmployees() {
            if (empName === "") {
                setEmployees(allEmployees);
            } else {
                setEmployees(allEmployees.filter((emp) => emp.FirstName.toLowerCase().includes(empName)));
            }
        }
        filterEmployees();
    }, [empName]);


    return (
        <>
            {/* head */}
            <div className='d-flex justify-content-between px-2'>
                <div className="payslipTitle">
                    All Employee
                </div>

                <div className='d-flex' style={{ gap: "10px" }}>
                    <div className="button" onClick={() => navigate(`/${whoIs}/employee/add`)}>
                        + Add Employee
                    </div>
                    <div className="button bg-light text-dark">
                        <EmailOutlinedIcon /> Invite
                    </div>
                </div>
            </div>
            <div className='employee d-block'>
                {/* content */}
                <div className='px-3'>
                    <div className="row">
                        <div className="col-lg-12 searchInputIcon">
                            <input type="text" className='payrunInput' onChange={(e) => setEmpName(e.target.value)} placeholder='Search' />
                        </div>
                    </div>
                </div>

                {
                    isLoading ? (
                        <Loading />
                    ) : errorData ? (
                        <NoDataFound message={errorData} />
                    ) : (
                        <LeaveTable data={employees} />
                    )
                }

            </div>
        </>
    )
}
