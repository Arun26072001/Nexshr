import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { fetchRoles } from '../ReuseableAPI';
import { useNavigate } from 'react-router-dom';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import { TimerStates } from '../payslip/HRMDashboard';
import axios from 'axios';
import { EssentialValues } from '../../App';
import { Skeleton } from '@mui/material';

const Roles = () => {
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const { reloadRolePage } = useContext(TimerStates);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState("");
    const [roles, setRoles] = useState([]);
    const navigate = useNavigate();

    async function deleteRoleAndPermission(id) {
        try {
            setIsDeleting(id);
            const deleteRole = await axios.delete(`${url}api/role/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            toast.success(deleteRole?.data?.message);
            reloadRolePage();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
            toast.error(error?.response?.data?.message)
        } finally {
            setIsDeleting("");
        }
    }

    useEffect(() => {
        const fetchEmpRoles = async () => {
            setIsLoading(true);
            try {
                const roleData = await fetchRoles();
                setRoles(roleData);
            } catch (err) {
                console.log(err);
                toast.error(err?.response?.data?.message)
            }
            setIsLoading(false);
        }
        fetchEmpRoles();
    }, [reloadRolePage])

    return (
        <div className='dashboard-parent pt-4'>
            <div className="d-flex justify-content-between px-2 mb-2">
                <h5 className='text-daily'>Roles</h5>
                <button className='button m-0' onClick={() => navigate(`add`)}>+ Add Role</button>
            </div>
            {
                isLoading ? <Skeleton
                    sx={{ bgcolor: 'grey.500' }}
                    variant="rectangular"
                    width={"100%"}
                    height={"50vh"}
                /> :
                    roles.length > 0 ?
                        <LeaveTable data={roles} isLoading={isDeleting} deleteData={deleteRoleAndPermission} />
                        : <NoDataFound message={"Roles data not found"} />
            }
        </div>
    );
};

export default Roles;