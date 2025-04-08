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
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import { jwtDecode } from 'jwt-decode';

export default function Employee() {
    const url = process.env.REACT_APP_API_URL;
    const { whoIs, data } = useContext(EssentialValues);
    const decodedData = jwtDecode(data.token);
    const { isTeamHead, isTeamLead, isTeamManager } = decodedData;
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
        } finally {
            setProcessing(false);
        }
    };

    const fetchEmployeeData = async () => {
        setIsLoading(true);
        try {
            const empData = await fetchEmployees();
            const withoutMyData = empData?.filter((emp) => emp._id !== data._id)
            setEmployees(withoutMyData);
            setAllEmployees(withoutMyData);
        } catch (error) {
            setEmployees([]);
            console.log("error: ", error);
            toast.error("Failed to fetch employees");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllEmployeeData = async () => {
        setIsLoading(true);
        try {
            const empData = await fetchAllEmployees();
            const withoutMyData = empData.filter((emp) => emp._id !== data._id)
            setEmployees(withoutMyData);
            setAllEmployees(withoutMyData);
        } catch (error) {
            console.log("error: ", error);
            // toast.error("Failed to fetch employees");
        } finally {
            setIsLoading(false);
        }
    };

    async function fetchTeamEmps() {
        setIsLoading(true);
        try {
            const res = await axios.get(`${url}/api/employee/team/members/${data._id}`, {
                who: isTeamLead ? "lead" : isTeamHead ? "head" : "manager",
                headers: {
                    Authorization: data.token || ""
                }
            })
            setEmployees(res.data)
            setAllEmployees(res.data)
        } catch (error) {
            setEmployees([]);
            console.log(error);
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (data.Account === "1") {
            fetchAllEmployeeData()
        } else if ([isTeamLead, isTeamHead, isTeamManager].includes(true)) {
            fetchTeamEmps();
        }
        // else if (data.Account === "3") {
        //     navigate(`/${whoIs}/unauthorize`)
        // } 
        else {
            fetchEmployeeData();
        }
    }, [isModifyEmps]);


    // Filter employees when `empName` changes
    useEffect(() => {
        function filterEmployees() {
            if (empName === "") {
                setEmployees(allEmployees);
            } else {
                setEmployees(allEmployees?.filter((emp) => emp?.FirstName?.toLowerCase()?.includes(empName.toLowerCase())));
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
                    <button className="button" onClick={() => navigate(`/${whoIs}/administration/team`)}>
                        <Groups2RoundedIcon /> Manage Team
                    </button>
                    {
                        ["admin", "hr"].includes(whoIs) &&
                        <>
                            <button className="button" onClick={() => navigate(`/${whoIs}/employee/add`)}>
                                <AddRoundedIcon /> Add Employee
                            </button>
                            <button className="button bg-light text-dark" onClick={() => document.getElementById("fileUploader").click()} >
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
                            <input type="text" className='payrunInput' onChange={(e) => setEmpName(e.target.value)} placeholder='Search by EmpName' />
                        </div>
                    </div>
                </div>

                {
                    isLoading ?
                        <Loading height="80vh" /> :
                        employees.length > 0 ?
                            <LeaveTable data={employees} />
                            : <NoDataFound message={"Employee data not found"} />
                }
            </div>
        </>
    )
}
