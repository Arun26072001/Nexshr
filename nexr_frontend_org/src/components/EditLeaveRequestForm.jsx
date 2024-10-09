import React, { useEffect, useState } from "react";
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import "./leaveForm.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { fetchLeaveRequests } from "./ReuseableAPI";

const EditLeaveRequestForm = () => {
    const { id } = useParams();
    const url = process.env.REACT_APP_API_URL;
    const empId = localStorage.getItem("_id");
    const token = localStorage.getItem("token");
    const [colleagues, setColleagues] = useState([]);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        leaveType: "",
        fromDate: "",
        toDate: "",
        periodOfLeave: "",
        reasonForLeave: "",
        prescription: "",
        coverBy: "",
        status: ""
    });

    useEffect(() => {
        const fetchLeaveRequest = async () => {
            if (id) {
                try {
                    const response = await axios.get(`${url}/api/leave-application/${id}`, {
                        headers: {
                            authorization: token || ""
                        }
                    });
                    setFormData(response.data);
                    if (response.data.employee) {
                        fetchCollegues(response.data.employee)
                    }
                } catch (error) {
                    toast.error("Failed to fetch leave request data.");
                }
            }
        };

        const fetchCollegues = async (id) => {
            const leaveReqs = await fetchLeaveRequests(id);
            const emps = leaveReqs.collegues.filter((emp) => (emp._id !== empId))
            setColleagues(emps)
        };

        fetchLeaveRequest();

    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`${url}/api/leave-application/${id}`, formData, {
                headers: {
                    authorization: token || ""
                }
            });
            toast.success(res.data.message);
            navigate("/hr/leave-management");
        } catch (error) {
            toast.error(error.response.data.details);
        }
    };

    console.log(formData);

    return (
        <form onSubmit={handleSubmit}>
            <div className="leaveFormContainer">
                <div className="leaveFormParent">
                    <div className="heading">
                        <h5 className="my-3"><LibraryBooksIcon /> Edit Leave Request</h5>
                        <p className="text-dark">Update the fields below to modify Employee of Leave Request</p>
                    </div>

                    <div className="my-3">
                        <span className="inputLabel">Leave Type</span>
                        <select
                            name="leaveType"
                            className="selectInput"
                            onChange={handleChange}
                            disabled
                            aria-readonly
                            value={formData.leaveType || ""}
                        >
                            <option>Select Leave type</option>
                            <option selected={`${formData.leaveType.toLocaleLowerCase() === "annual leave"}`} value="annual leave" >Annual Leave</option>
                            <option selected={`${formData.leaveType.toLocaleLowerCase() === "sick leave"}`} value="sick leave" >Sick Leave</option>
                            <option selected={`${formData.leaveType.toLocaleLowerCase() === "casual leave"}`} value="casual leave" >Casual Leave</option>
                        </select>
                    </div>

                    <div className="row gap-2 my-3">
                        <div className="col-12 col-lg-6 col-md-6">
                            <span className="inputLabel">Start Date</span>
                            <input
                                disabled
                                aria-readonly
                                type="date"
                                name="fromDate"
                                min={new Date().toISOString().split("T")[0]}
                                className="inputField"
                                onChange={handleChange}
                                value={formData.fromDate ? formData.fromDate.split('T')[0] : ""}
                            />
                        </div>
                        <div className="col-12 col-lg-6 col-md-6">
                            <span className="inputLabel">End Date</span>
                            <input
                                disabled
                                aria-readonly
                                type="date"
                                name="toDate"
                                min={new Date().toISOString().split("T")[0]}
                                className="inputField"
                                onChange={handleChange}
                                value={formData.toDate ? formData.toDate.split('T')[0] : ""}
                            />
                        </div>
                    </div>

                    <div className="my-3">
                        <span className="inputLabel">Period Of Leave</span>
                        <select
                            disabled
                            aria-readonly
                            name="periodOfLeave"
                            className="selectInput"
                            onChange={handleChange}
                            value={formData.periodOfLeave || ""}
                        >
                            <option>Select Leave type</option>
                            <option value="full day" selected={`${formData.periodOfLeave === "full day"}`}>Full Day</option>
                            <option value="half day" selected={`${formData.periodOfLeave === "half day"}`}>Half Day</option>
                        </select>
                    </div>

                    <div className="my-3">
                        <span className="inputLabel">Reason for Leave</span>
                        <input
                            disabled
                            aria-readonly
                            type="text"
                            name="reasonForLeave"
                            className="inputField"
                            onChange={handleChange}
                            value={formData.reasonForLeave || ""}
                        />
                    </div>

                    {/* <div className="my-3">
                        <span className="inputLabel">Attach handover document (pdf, jpg, docx, or any other format)</span>
                        <input
                            // disabled
                            // aria-readonly
                            type="file"
                            name="prescription"
                            className="fileInput"
                            onChange={handleChange}
                            value={formData.prescription || ""}
                        />
                    </div> */}

                    <div className="my-3">
                        <span className="inputLabel">Choose Relief Officer</span>
                        <select
                            // disabled
                            // aria-readonly
                            name="coverBy"
                            className="selectInput"
                            onChange={handleChange}
                            value={formData.coverBy || ""}
                        >
                            <option>Select a Relief Officer</option>
                            {colleagues.map((emp) => (
                                <option key={emp._id} selected={`${formData.coverBy === emp._id}`} value={emp._id}>{emp.FirstName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="my-3">
                        <span className="inputLabel">Leave Status</span>
                        <select

                            name="status"
                            className="selectInput"
                            onChange={handleChange}
                            value={formData.status || ""}
                        >
                            <option>Select Leave Status</option>
                            <option value="pending" selected={`${formData.status === "pending"}`}>Pending</option>
                            <option value="approved" selected={`${formData.status === "approved"}`}>Approved</option>
                            <option value="rejected" selected={`${formData.status === "rejected"}`}>Rejected</option>
                        </select>
                    </div>

                    <div className="row gap-2 d-flex align-items-center justify-content-center my-4">
                        <div className="col-12 col-lg-5 col-md-5">
                            <button className="btn btn-outline-dark w-100" onClick={()=>navigate(-1)}>Cancel</button>
                        </div>
                        <div className="col-12 col-lg-5 my-2 col-md-5">
                            <button className="btn btn-dark w-100" type="submit">Update</button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default EditLeaveRequestForm;
