import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import "./dashboard.css";
import LeaveTable from '../LeaveTable';
import { fetchAllEmployees, fetchEmployees, fetchTeamEmps } from '../ReuseableAPI';
import { useNavigate } from 'react-router-dom';
import NoDataFound from './NoDataFound';
import { EssentialValues } from '../../App';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import axios from "axios";
import employeesData from "../../files/Employees data.xlsx";
import { jwtDecode } from 'jwt-decode';
import { Skeleton } from '@mui/material';

export default function Employee() {
    const url = process.env.REACT_APP_API_URL;
    const { whoIs, data } = useContext(EssentialValues);
    const decodedData = jwtDecode(data.token);
    const { isTeamHead, isTeamLead, isTeamManager } = decodedData;
    const [employees, setEmployees] = useState([]);
    const [empName, setEmpName] = useState("");
    const [filteredEmps, setFilteredEmps] = useState([]);
    const [isModifyEmps, setIsModifyEmps] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState("");
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    function handleModifyEmps() {
        setIsModifyEmps(!isModifyEmps)
    }
    // Handle file upload
    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append('documents', file);
        setProcessing(true);
        try {
            const response = await axios.post(`${url}/api/google-sheet/upload/employees/${data._id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: data.token || ""
                }
            });
            toast.success(response.data.message);
            handleModifyEmps();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error('File upload failed:', error);
            toast.error(error?.response?.data?.error);
        } finally {
            setProcessing(false);
        }
    };
    // delete employee
    async function handleDeleteEmp(empId) {
        try {
            setIsDeleting(empId)
            const res = await axios.delete(`${url}/api/employee/${empId}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            handleModifyEmps();
        } catch (error) {
            toast.error(error.response.data.error)
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in delete emp", error);
        } finally {
            setIsDeleting("")
        }
    }

    const fetchEmployeeData = async () => {
        try {
            setIsLoading(true);
            const empData = await fetchEmployees();
            setEmployees(empData);
            setFilteredEmps(empData);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error: ", error);
            toast.error("Failed to fetch employees");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllEmployeeData = async () => {
        try {
            setIsLoading(true);
            const empData = await fetchAllEmployees();
            setEmployees(empData);
            setFilteredEmps(empData);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error: ", error);
            // toast.error("Failed to fetch employees");
        } finally {
            setIsLoading(false);
        }
    };

    async function getTeamEmps() {
        const emps = await fetchTeamEmps("fullData");
        if (emps?.length > 0) {
            setEmployees(emps)
        }
    }

    useEffect(() => {
        if (["admin"].includes(whoIs)) {
            fetchAllEmployeeData()
        } else if ([isTeamLead, isTeamHead, isTeamManager].includes(true)) {
            getTeamEmps()
        }
        else if (["hr"].includes(whoIs)) {
            fetchEmployeeData();
        }
    }, [isModifyEmps]);


    // Filter employees when `empName` changes
    useEffect(() => {
        function filterEmployees() {
            if (empName === "") {
                setEmployees(filteredEmps);
            } else {
                setEmployees(filteredEmps?.filter((emp) => emp?.FirstName?.toLowerCase()?.includes(empName.toLowerCase())));
            }
        }
        filterEmployees();
    }, [empName]);

    return (
        <>
            {processing && (
                <div className="d-flex justify-content-center my-2">
                    <div className='box-content text-align-center p-2 bg-warning'>
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
                    {
                        ["admin", "hr"].includes(whoIs) &&
                        <>
                            <button className="button" onClick={() => navigate(`/${whoIs}/employee/add`)}>
                                <AddRoundedIcon /> Add Employee
                            </button>
                            <button className="button" style={{ cursor: `${processing ? "wait" : "pointer"}` }} onClick={() => document.getElementById("fileUploader").click()} >
                                <AddRoundedIcon />Import
                            </button>
                        </>
                    }
                    <input
                        type="file"
                        id="fileUploader"
                        style={{ display: 'none' }}
                        onChange={(e) => handleUpload(e.target.files[0])}
                    />
                </div>
            </div>
            {
                ["admin", "hr"].includes(whoIs) &&
                <p className='text-end px-2 my-2'>
                    <a href={employeesData} download={employeesData}>
                        Download Employee data model file
                    </a>
                </p>
            }
            <div className='employee d-block'>
                {/* content */}
                <div className='px-3'>
                    <div className="row">
                        <div className="col-lg-12 searchInputIcon">
                            <input type="text" className='payrunInput' onChange={(e) => setEmpName(e.target.value?.trimStart()?.replace(/\s+/g, ' '))} placeholder='Search by EmpName' />
                        </div>
                    </div>
                </div>

                {
                    isLoading ?
                        <Skeleton
                            sx={{ bgcolor: 'grey.500' }}
                            variant="rectangular"
                            width={"100%"}
                            height={"50vh"}
                        /> :
                        employees?.length > 0 ?
                            <LeaveTable data={employees} isLoading={isDeleting} deleteData={handleDeleteEmp} />
                            : <NoDataFound message={"Employee data not found"} />
                }
            </div>
        </>
    )
}
