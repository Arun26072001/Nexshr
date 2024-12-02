import React, { useContext, useEffect, useState } from 'react';
// import './Attendence.css';
// import PageAndActionAuth from '../Settings/PageAndActionAuth';
import Loading from '../Loader';
import { toast } from 'react-toastify';
import { fetchRoles } from '../ReuseableAPI';
import { useNavigate } from 'react-router-dom';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { TimerStates } from '../payslip/HRMDashboard';
import axios from 'axios';
import Cookies from 'universal-cookie';

const Roles = () => {
    const url = process.env.REACT_APP_API_URL;
    const cookies = new Cookies();
    const token = cookies.get('token');
    const { reloadRolePage } = useContext(TimerStates);
    const [isLoading, setIsLoading] = useState(false);
    const [roles, setRoles] = useState([]);
    const navigate = useNavigate();
    const [error, setError] = useState("");

    async function deleteRoleAndPermission(id) {
        try {
            const deleteRole = await axios.delete(`${url}/api/role/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            toast.success(deleteRole?.data?.message);
            reloadRolePage();
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message)
        }
    }

    useEffect(() => {
        const fetchEmpRoles = async () => {
            try {
                const roleData = await fetchRoles();
                setRoles(roleData);
            } catch (err) {
                console.log(err);
                setError(err.response.data.error)
            }
        }
        
        setIsLoading(true);
        fetchEmpRoles();
        setIsLoading(false);
    }, [reloadRolePage])

    return (
        isLoading ? <Loading /> :
            <div className='dashboard-parent pt-4'>
                <div className="row">
                    <div className='col-lg-6 col-6'>
                        <h5 className='text-daily'>Roles</h5>
                    </div>
                    <div className='col-lg-6 col-6 d-flex gap-2 justify-content-end'>
                        <button className='button m-0' onClick={() => navigate(`add`)}>+ Add Role</button>
                    </div>
                </div>
                {
                    error ? <NoDataFound message={error} /> :
                    roles.length > 0 ?
                        <LeaveTable data={roles} deleteRole={deleteRoleAndPermission} />
                        : <NoDataFound message={"Roles and permissions data not found!"} />
                }
            </div>
    );
};

export default Roles;