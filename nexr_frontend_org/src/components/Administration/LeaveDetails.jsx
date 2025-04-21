import React, { useContext, useEffect, useState } from 'react'
import Loading from '../Loader';
import LeaveTable from '../LeaveTable';
import axios from "axios";
import { EssentialValues } from '../../App';
import NoDataFound from '../payslip/NoDataFound';
import CommonModel from './CommonModel';
import { toast } from 'react-toastify';
import { Input } from 'rsuite';
import { Skeleton } from '@mui/material';

export default function LeaveDetails() {
    const [isLoading, setIsLoading] = useState(false);
    const [leaveTypes, setLeavetypes] = useState([]);
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const [leaveTypeObj, setLeaveTypeObj] = useState({});
    const [isWorkingApi, setIsworkingApi] = useState(false);
    const [fullLeavetypes, setFullLeavetypes] = useState([]);
    const [leaveTypeName, setLeavTypeName] = useState("");
    const [isChangeLeavetype, setIsChangeLeaveType] = useState({
        isAdd: false,
        isEdit: false
    })

    async function deleteLeaveType(leaveData) {
        try {
            const res = await axios.delete(`${url}/api/leave-type/${leaveData._id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            fetchLeavetypes();
        } catch (error) {

        }
    }

    async function editLeaveType() {
        setIsworkingApi(true);
        try {
            const res = await axios.put(`${url}/api/leave-type/${leaveTypeObj._id}`, leaveTypeObj, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setLeaveTypeObj({});
            fetchLeavetypes();
            toast.success(res.data.message);
            handleChangeLeavetype("Edit")
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.error)
        } finally {
            setIsworkingApi(false);
        }
    }

    async function addLeavetype() {
        setIsworkingApi(true);
        try {
            const res = await axios.post(`${url}/api/leave-type`, leaveTypeObj, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setLeaveTypeObj({});
            fetchLeavetypes();
            handleChangeLeavetype("Add")
            toast.success(res.data.message)
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.error)
        } finally {
            setIsworkingApi(false);
        }
    }

    function handleChangeLeavetype(type, value) {
        if (type === "Edit") {
            if (!isChangeLeavetype.isEdit) {
                setLeaveTypeObj(value)
            } else {
                setLeaveTypeObj({})
            }
            setIsChangeLeaveType((pre) => ({
                ...pre,
                isEdit: !pre.isEdit
            }))
        } else if (type === "Delete") {
            deleteLeaveType(value)
        } else {
            setIsChangeLeaveType((pre) => ({
                ...pre,
                isAdd: !pre.isAdd
            }))
        }
    }

    function changeLeavetypeData(value, name) {
        console.log(name, value);

        setLeaveTypeObj((pre) => ({
            ...pre,
            [name]: value
        }))
    }

    useEffect(() => {
        function filterLeaveTypes() {
            setLeavetypes(fullLeavetypes.filter((leave) => leave.LeaveName.toLowerCase().includes(leaveTypeName.toLowerCase())))
        }
        filterLeaveTypes()
    }, [leaveTypeName])

    async function fetchLeavetypes() {
        setIsLoading(true);
        try {
            const res = await axios.get(`${url}/api/leave-type`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setLeavetypes(res.data);
            setFullLeavetypes(res.data);
        } catch (error) {
            setLeavetypes([])
            console.log(error);
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLeavetypes()
    }, [])

    return (
        isChangeLeavetype.isAdd ? <CommonModel isAddData={isChangeLeavetype.isAdd} type="LeaveType" dataObj={leaveTypeObj} isWorkingApi={isWorkingApi} changeData={changeLeavetypeData} modifyData={handleChangeLeavetype} addData={addLeavetype} /> :
            isChangeLeavetype.isEdit ? <CommonModel isAddData={isChangeLeavetype.isEdit} changeData={changeLeavetypeData} type="LeaveType" dataObj={leaveTypeObj} isWorkingApi={isWorkingApi} modifyData={handleChangeLeavetype} editData={editLeaveType} /> :
                <div className='dashboard-parent pt-4'>
                    <div className="d-flex justify-content-between px-2">
                        <h5 className='text-daily'>Leave Details</h5>
                        <div className='d-flex gap-2'>
                            <Input type="text" onChange={setLeavTypeName} value={leaveTypeName} style={{ width: "230px" }} placeholder='Search by LeaveName' />
                            <button className='button m-0' onClick={handleChangeLeavetype}>+ LeaveType</button>
                        </div>

                    </div>
                    {
                        isLoading ? <Skeleton
                            sx={{ bgcolor: 'grey.500' }}
                            variant="rectangular"
                            width={"100%"}
                            height={"50vh"}
                        /> :
                            leaveTypes.length > 0 ?
                                <LeaveTable data={leaveTypes} handleChangeLeavetype={handleChangeLeavetype} />
                                : <NoDataFound message={"Roles data not found"} />
                    }
                </div>
    )
}
