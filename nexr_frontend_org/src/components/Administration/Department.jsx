import React, { useEffect, useState } from 'react'
import LeaveTable from '../LeaveTable'
import NoDataFound from '../payslip/NoDataFound'
import Loading from '../Loader';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getDepartments } from '../ReuseableAPI';

export default function Department() {
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const [department, setDepartment] = useState({});
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDepartmentsDataUpdate, setIsDepartmentDataUpdate] = useState(false);
    const navigate = useNavigate();

    function reloadDepartmentPage() {
        setIsDepartmentDataUpdate(!isDepartmentsDataUpdate)
    }

    async function addDepartment() {
        try {
            const msg = await axios.post(url + "/api/department", department, {
                headers: {
                    authorization: token || ""
                }
            });
            toast.success(msg?.data?.message);
        } catch (error) {
            return error?.response?.data?.message
        }
    }

    async function deleteDepartment(id) {
        try {
            const deleteRole = await axios.delete(`${url}/api/role/${id}`, {
                headers: {
                    Authorization: token || ""
                }
            });
            toast.success(deleteRole?.data?.message);
            reloadDepartmentPage();
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message)
        }
    }

    useEffect(() => {
        const fetchDepartments = async () => {
            setIsLoading(true);
            try {
                const departmentsData = await getDepartments();
                console.log(departmentsData);
                setDepartments(departmentsData);

            } catch (error) {
                console.log(error);

                toast.error(error);
            }
            setIsLoading(false);
        }

        fetchDepartments()
    }, [isDepartmentsDataUpdate]);
    console.log(departments);


    return (
        isLoading ? <Loading /> :
            <div className='dashboard-parent pt-4'>
                <div className="row">
                    <div className='col-lg-6 col-6'>
                        <h5 className='text-daily'>Department</h5>
                    </div>
                    <div className='col-lg-6 col-6 d-flex gap-2 justify-content-end'>
                        <button className='button m-0' onClick={() => navigate(`add`)}>+ Add Department</button>
                    </div>
                </div>
                {
                    departments.length > 0 ?
                        <LeaveTable data={departments} deleteDepartment={deleteDepartment} />
                        : <NoDataFound message={"Departments data not found"} />
                }
            </div>
    )
}
