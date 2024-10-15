import React, { useEffect, useState } from 'react';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { toast } from 'react-toastify';
import "./dashboard.css";
import LeaveTable from '../LeaveTable';
import { fetchEmployees } from '../ReuseableAPI';
import Loading from '../Loader';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Employee({ whoIs }) {
    const [employees, setEmployees] = useState([]);
    const [empName, setEmpName] = useState("");
    const [allEmployees, setAllEmployees] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                const empData = await fetchEmployees();
                
                if (empData.length > 0) {
                    setEmployees(empData);
                    setAllEmployees(empData);
                } else {
                    toast.error("No employee data available.");
                }
            } catch (error) {
                toast.error("Failed to fetch employees");
            }
        };

        fetchEmployeeData();

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
                        <div className="col-lg-6 searchInputIcon">
                            <input type="text" className='payrunInput' onChange={(e) => setEmpName(e.target.value)} placeholder='Search' />
                        </div>
                    </div>
                </div>

                {employees.length > 0 ? (
                    <LeaveTable data={employees} />
                ) : empName !== "" ? (
                    <div className="text-center text-danger">No employees with this Name</div>
                ) : (
                    <Loading />
                )}
            </div>
        </>
    )
}
