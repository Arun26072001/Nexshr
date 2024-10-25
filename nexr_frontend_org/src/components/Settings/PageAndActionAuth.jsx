import React from 'react'
import LeaveTable from '../LeaveTable';
import "../leave/../leaveForm.css";

export default function PageAndActionAuth() {
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


    return (
        <div className='d-flex align-items-center justify-content-center w-100'>
            <div className='leaveFormParent' style={{ width: "700px" }}>
              
                <h5 className='text-start my-2'>Page Authorization</h5>
                {
                    pages.map((page) => {
                        return <div className="row container d-flex align-items-center justify-content-center gap-2 my-2">
                            <div className="col-lg-5">
                                <p className='text-start'>{page}</p>
                            </div>
                            <div className="col-lg-5">
                                <select name="" id="" className='form-control'>
                                    <option value="allow">Allow</option>
                                    <option value="not allow">Not Allow</option>
                                </select>
                            </div>
                        </div>
                    })
                }
                <h5 className="text-start my-2">Actions Authorization</h5>
                {<LeaveTable data={actions} />}
            </div>
        </div>
    )
}
