import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import "./dashboard.css";
import LeaveTable from '../LeaveTable';
import { fetchAllEmployees, fetchEmployees } from '../ReuseableAPI';
import Loading from '../Loader';
import { useNavigate } from 'react-router-dom';
import NoDataFound from './NoDataFound';
import { EssentialValues } from '../../App';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import axios from "axios";
import employeesData from "../../files/Employees data.xlsx";
import { Progress } from 'rsuite';

export default function Employee() {
    const url = process.env.REACT_APP_API_URL;
    const { whoIs, data } = useContext(EssentialValues);
    const [employees, setEmployees] = useState([]);
    const [empName, setEmpName] = useState("");
    const [allEmployees, setAllEmployees] = useState([]);
    const [isModifyEmps, setIsModifyEmps] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();
    const [errorData, setErrorData] = useState("");

    function handleModifyEmps() {
        setIsModifyEmps(!isModifyEmps)
    }
    // Handle file upload
    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append('documents', file);
        setProcessing(true);
        try {
            const response = await axios.post(`${url}/api/google-sheet/upload/employees`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: data.token || ""
                }
            });
            toast.success(response.data.message);
            handleModifyEmps();
        } catch (error) {
            console.error('File upload failed:', error);
            toast.error(error.response.data.error);
        }
        setProcessing(false);
    };

    useEffect(() => {
        const fetchEmployeeData = async () => {
            setIsLoading(true);
            try {
                const empData = await fetchEmployees();
                setEmployees(empData);
                setAllEmployees(empData);
            } catch (error) {
                setErrorData(error.response.data.message)
                toast.error("Failed to fetch employees");
            }
            setIsLoading(false);
        };

        const fetchAllEmployeeData = async () => {
            setIsLoading(true);
            try {
                const empData = await fetchAllEmployees();
                setEmployees(empData);
                setAllEmployees(empData);
            } catch (error) {
                console.log(error);

                // setErrorData(error.response.data.message)
                toast.error("Failed to fetch employees");
            }
            setIsLoading(false);
        };

        if (data.Account === "1") {
            fetchAllEmployeeData()
        } else {
            fetchEmployeeData();
        }
    }, [isModifyEmps]);

    // Filter employees when `empName` changes
    useEffect(() => {
        function filterEmployees() {
            if (empName === "") {
                setEmployees(allEmployees);
            } else {
                setEmployees(allEmployees?.filter((emp) => emp?.FirstName?.toLowerCase()?.includes(empName)));
            }
        }
        filterEmployees();
    }, [empName]);

    return (
        <>
            {processing && (
                <div className="d-flex">
                    <div className='processing box-content'>
                        File upload Processing...
                    </div>
                </div>
            )}

            {/* head */}
            <div className='d-flex justify-content-between px-2'>
                <p className="payslipTitle">
                    All Employee
                </p>

                <div className='d-flex' style={{ gap: "10px" }}>
                    <div className="button" onClick={() => navigate(`/${whoIs}/employee/add`)}>
                        <AddRoundedIcon /> Add Employee
                    </div>
                    <div className="button bg-light text-dark" onClick={() => document.getElementById("fileUploader").click()} >
                        <AddRoundedIcon />Import
                    </div>
                    <input
                        type="file"
                        id="fileUploader"
                        style={{ display: 'none' }}
                        onChange={(e) => handleUpload(e.target.files[0])}
                    />
                </div>
            </div>
            <p className='text-end px-2 my-2'>
                <a href={employeesData} download={employeesData}>
                    Download Employee data model file
                </a>
            </p>
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
                        // employees.length > 0 &&
                        <LeaveTable data={employees} />
                    )
                }

            </div>
        </>
    )
}
