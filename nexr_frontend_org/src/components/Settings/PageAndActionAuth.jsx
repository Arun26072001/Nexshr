import React, { useState } from 'react'
import LeaveTable from '../LeaveTable';
import "../leave/../leaveForm.css";

export default function PageAndActionAuth({ manageAuthorization }) {
    const pages = ["Dashboard", "Job Desk",
        "Employee", "Leave",
        "Attendance", "Administration",
        "Settings"];
    const actions = [
        { sNo: 1, action: "Leave" },
        { sNo: 2, action: "Attendance" },
        { sNo: 3, action: "WorkPlace" },
        { sNo: 4, action: "Role" },
        { sNo: 5, action: "Department" },
        { sNo: 6, action: "Holiday" },
        { sNo: 7, action: "Employee" },
        { sNo: 8, action: "Company" },
        { sNo: 9, action: "TimePatten" }
    ];
    const [roleObj, setRoleObj] = useState({});

    function getCheckedValue(e) {
        const { name, checked } = e.target;
        const [action, actionName] = name.split("-").map(data => data);


        setRoleObj((pre) => ({
            ...pre,
            [actionName]: {
                ...pre[actionName],
                [action]: checked
            }
        }))
    }

    function getCheckAll(e) {
        const { name, checked } = e.target;
        setRoleObj((pre) => ({
            ...pre,
            [name]: {
                view: checked,
                edit: checked,
                update: checked,
                delete: checked
            }
        }))
    }
    console.log(roleObj);
    
    function changePageAuth(e){
        const {name, value} = e.target;
        setRoleObj((pre)=>({
            ...pre,
            [name]: value
        }))
    }

    return (
        <div className='d-flex align-items-center justify-content-center w-100'>
            <div className='leaveFormParent' style={{ width: "840px" }}>
                <h3 className='text-center mb-3'>Update Employee Authorization</h3>

                <h5 className='text-start my-2'>Page Authorization</h5>
                {
                    pages.map((page) => {
                        return <div className="row container d-flex align-items-center justify-content-center gap-2 my-2">
                            <div className="col-lg-5">
                                <p className='text-start'>{page}</p>
                            </div>
                            <div className="col-lg-5">
                                <select name={page} className='form-control' onChange={(e)=>changePageAuth(e)}>
                                    <option >Select Page Auth</option>
                                    <option value="allow">Allow</option>
                                    <option value="not allow">Not Allow</option>
                                </select>
                            </div>
                        </div>
                    })
                }
                <h5 className="text-start my-2">Actions Authorization</h5>
                {<LeaveTable data={actions} roleObj={roleObj} getCheckedValue={getCheckedValue} getCheckAll={getCheckAll} />}

                <div className="row d-flex justify-content-center">
                    <div className="col-lg-3 col-12">
                        <div className="btnParent mx-auto">
                            <button className="button">Save</button>
                            <button className="outline-btn" onClick={manageAuthorization} style={{ background: "#e0e0e0", border: "none" }} >Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
