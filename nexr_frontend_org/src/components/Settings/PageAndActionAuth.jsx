import React, { useContext, useEffect, useState } from 'react'
import LeaveTable from '../LeaveTable';
import "../leave/../leaveForm.css";
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../Loader';
import { EssentialValues } from '../../App';

export default function PageAndActionAuth() {
    const { id } = useParams();
    const navigate = useNavigate();
    const params = useParams();
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const [isChangingRole, setIschangingRole] = useState(false);
    const [roleObj, setRoleObj] = useState({});
    const actions = [
        { sNo: 1, action: "Leave" },
        { sNo: 2, action: "Attendance" },
        { sNo: 3, action: "WorkPlace" },
        { sNo: 4, action: "Role" },
        { sNo: 5, action: "Department" },
        { sNo: 6, action: "Holiday" },
        { sNo: 7, action: "Employee" },
        { sNo: 8, action: "Company" },
        { sNo: 9, action: "TimePattern" },
        { sNo: 10, action: "Payroll" },
    ];

    function getCheckedValue(e) {
        const { name, checked } = e.target;
        const [action, actionName] = name.split("-").map(data => data);
        setRoleObj((pre) => ({
            ...pre,
            userPermissions: {
                ...pre.userPermissions,
                [actionName]: {
                    ...pre.userPermissions[actionName],
                    [action]: checked
                }
            }
        }))
    }

    function getCheckAll(e) {
        const { name, checked } = e.target;
        setRoleObj((pre) => ({
            ...pre,
            userPermissions: {
                ...pre.userPermissions,
                [name]: {
                    view: checked,
                    edit: checked,
                    add: checked,
                    delete: checked
                }
            }
        }))
    }

    function changePageAuth(e) {
        const { name, value } = e.target;
        setRoleObj((pre) => ({
            ...pre,
            pageAuth: {
                ...pre.pageAuth,
                [name]: value
            }
        }))
    }

    async function fetchRoleById() {
        try {
            const role = await axios.get(`${url}/api/role/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            });

            setRoleObj(role.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
            toast.error(error?.response?.data?.error)
        }
    }

    async function addRoleAndPermission() {
        setIschangingRole(true);
        try {
            const roleData = await axios.post(`${url}/api/role`, roleObj, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            toast.success(roleData.data?.message);
            navigate(-1);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
        }
        setIschangingRole(false);
    }

    async function updateRoleAndPermission() {
        setIschangingRole(true)
        try {
            const updatedRole = await axios.put(`${url}/api/role/${id}`, roleObj, {
                headers: {
                    authorization: data.token || ""
                }
            });
            console.log(updatedRole.data);
            toast.success(updatedRole?.data?.message)
            navigate(-1);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
        }
        setIschangingRole(false);
    }

    async function getInitialRoleObj() {
        const roleName = prompt("Please Enter Role Name: ");
        try {
            const roleData = await axios.get(`${url}/api/role/name`, {
                headers: {
                    authorization: data.token || ""
                }
            });
            setRoleObj({
                ...roleData.data,
                RoleName: roleName?.trimStart()?.replace(/\s+/g, ' ') || "Employee"
            })
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
            toast.error(error?.response?.data?.error)
        }
    }

    useEffect(() => {
        if (id) {
            fetchRoleById()
        } else {
            getInitialRoleObj()
        }
    }, [id])

    return (
        <div className='d-flex align-items-center justify-content-center w-100'>
            <div className='leaveFormParent' style={{ width: "840px" }}>
                <h3 className='text-center mb-3'>{roleObj?.RoleName} Authorization</h3>

                <h5 className='text-start my-2'>Page Authorization</h5>
                {
                    Object.entries(roleObj?.pageAuth || {}).map(([page, auth]) => {
                        // Skip '_id' and '__v' fields
                        if (page === '_id' || page === '__v') {
                            return null;
                        }
                        return (
                            <div key={page} className="row d-flex align-items-center justify-content-center gap-2 my-2">
                                <div className="col-lg-5">
                                    <p className="text-start">{page}</p>
                                </div>
                                <div className="col-lg-5">
                                    <select
                                        name={page}
                                        className="form-control"
                                        disabled={params['*']?.includes("view")}
                                        value={auth}
                                        onChange={(e) => changePageAuth(e)}
                                    >
                                        <option>Select Page Auth</option>
                                        <option value="allow">Allow</option>
                                        <option value="not allow">Not Allow</option>
                                    </select>
                                </div>
                            </div>
                        );
                    })
                }

                <h5 className="text-start my-2">Actions Authorization</h5>
                <LeaveTable data={actions} roleObj={roleObj} getCheckedValue={getCheckedValue} getCheckAll={getCheckAll} />
                {
                    !params['*'].includes("view") ?
                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-3 col-12">
                                <div className="btnParent mx-auto">
                                    <button className="outline-btn" onClick={() => navigate(-1)} style={{ background: "#e0e0e0", border: "none" }} >Cancel</button>
                                    <button className="button" style={{ cursor: isChangingRole ? "progress" : "pointer" }} onClick={isChangingRole ? null : (id ? updateRoleAndPermission : addRoleAndPermission)}>{isChangingRole ? <Loading size={20} color={isChangingRole ? `black` : "white"} /> : id ? "Update" : "Save"}</button>
                                </div>
                            </div>
                        </div> : <button className="outline-btn" onClick={() => navigate(-1)} style={{ background: "#e0e0e0", border: "none" }} >Back</button>
                }
            </div>
        </div>
    )
}
