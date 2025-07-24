import React, { useContext, useEffect, useState } from 'react'
import LeaveTable from '../LeaveTable'
import NoDataFound from '../payslip/NoDataFound'
import { toast } from 'react-toastify';
import axios from 'axios';
import { getDepartments } from '../ReuseableAPI';
import CommonModel from './CommonModel';
import { EssentialValues } from '../../App';
import { Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TimerStates } from '../payslip/HRMDashboard';

export default function Department() {
    const { companies } = useContext(TimerStates);
    const navigate = useNavigate();
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const [errorData, setErrorData] = useState("");
    const [departmentObj, setDepartmentObj] = useState({});
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState("");
    const [isDepartmentsDataUpdate, setIsDepartmentDataUpdate] = useState(false);
    const [isAddDepartment, setIsAddDepartment] = useState(false);
    const [isChangingDepartment, setIsChangingDepartment] = useState(false);

    function reloadDepartmentPage() {
        setIsDepartmentDataUpdate(!isDepartmentsDataUpdate)
    }

    function modifyDepartments() {
        if (isAddDepartment) {
            setDepartmentObj({});
            setErrorData({});
            setErrorData("")
        }
        setIsAddDepartment(!isAddDepartment);
    }

    function changeDepartment(value, name) {
        setDepartmentObj((prev) => ({
            ...prev,
            [name]: value?.trimStart()?.replace(/\s+/g, ' ')
        }))
    }
    async function addDepartment() {
        setIsChangingDepartment(true);
        setErrorData("");
        try {
            const msg = await axios.post(url + "/api/department", departmentObj, {
                headers: {
                    authorization: data.token || ""
                }
            });
            toast.success(msg?.data?.message);
            setDepartmentObj({});
            modifyDepartments();
            reloadDepartmentPage();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            const errorMsg = error?.response?.data?.error
            setErrorData(errorMsg)
            toast.error(errorMsg)
        }
        setIsChangingDepartment(false);
    }

    async function deleteDepartment(id) {
        try {
            setIsDeleting(id)
            const deleteDep = await axios.delete(`${url}/api/department/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            toast.success(deleteDep?.data?.message);
            reloadDepartmentPage();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
            toast.error(error?.response?.data?.message)
        } finally {
            setIsDeleting("")
        }
    }

    async function editDepartment() {
        setIsChangingDepartment(true);
        setErrorData("");
        try {
            // Assuming the correct API endpoint for editing a department is '/api/department/${id}'
            const response = await axios.put(`${url}/api/department/${departmentObj._id}`, departmentObj, {
                headers: {
                    Authorization: data.token || ""
                }
            });

            // Assuming the API response contains a success message
            toast.success(response?.data?.message);
            modifyDepartments();
            setDepartmentObj({});
            // Reload the department page (or trigger any necessary updates)
            reloadDepartmentPage();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            // Show an error toast with the message from the API (or a generic error message if not available)
            const errorMsg = error?.response?.data?.error
            setErrorData(errorMsg)
            toast.error(errorMsg)
        }
        setIsChangingDepartment(false);
    }

    async function getEditDepartmentId(id) {

        try {
            const department = await axios.get(`${url}/api/department/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            setDepartmentObj(department.data);
            modifyDepartments();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
            toast.error(error);
        }
    }

    useEffect(() => {
        const fetchDepartments = async () => {
            setIsLoading(true);
            try {
                const departmentsData = await getDepartments();
                setDepartments(departmentsData);
            } catch (error) {
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
                toast.error(error);
            }
            setIsLoading(false);
        }

        fetchDepartments()
    }, [isDepartmentsDataUpdate]);

    return (
        isAddDepartment ? <CommonModel
            errorMsg={errorData}
            dataObj={departmentObj}
            editData={editDepartment}
            changeData={changeDepartment}
            isAddData={isAddDepartment}
            addData={addDepartment}
            comps={companies}
            modifyData={modifyDepartments}
            type="Department"
            isWorkingApi={isChangingDepartment}
        /> :
            <div className='dashboard-parent pt-4'>
                <div className="d-flex justify-content-between px-2 mb-2">
                    <h5 className='text-daily'>Department</h5>
                    <button className='button m-0' onClick={modifyDepartments}>+ Add Department</button>
                </div>
                {
                    isLoading ? <Skeleton
                        sx={{ bgcolor: 'grey.500' }}
                        variant="rectangular"
                        width={"100%"}
                        height={"50vh"}
                    /> :
                        departments.length > 0 ?
                            <LeaveTable data={departments} deleteData={deleteDepartment} isLoading={isDeleting} fetchData={getEditDepartmentId} />
                            : <NoDataFound message={"Departments data not found"} />
                }
            </div>
    )
}
