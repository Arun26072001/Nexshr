import React, { useContext, useEffect, useState } from 'react';
import Loading from '../Loader';
import { useNavigate } from 'react-router-dom';
import { EssentialValues } from '../../App';
import DatePicker from "react-datepicker";
import TextEditor from './TextEditor';
import { toast } from 'react-toastify';
import { getDayDifference, getHoliday } from '../ReuseableAPI';
import axios from 'axios';

export default function WFHRequestForm({ type }) {
    const navigate = useNavigate();
    const url = process.env.REACT_APP_API_URL;
    const { whoIs, data } = useContext(EssentialValues);
    const now = new Date();
    const [wfhRequestObj, setwfhRequestObj] = useState({
        fromDate: null,
        toDate: null,
        reason: "",
        numOfDays: 0
    });
    const [excludedDates, setExcludeDates] = useState([]);
    const [isWorkingApi, setIsWorkingApi] = useState(false);
    const [errors, setErrors] = useState({});

    function handleInputChange(name, value) {
        setwfhRequestObj(prev => ({
            ...prev,
            [name]: value
        }));
    }

    function validateForm() {
        const newErrors = {};
        if (!wfhRequestObj.fromDate) newErrors.fromDate = "Start date is required.";
        if (!wfhRequestObj.toDate) newErrors.toDate = "End date is required.";
        // if (!wfhRequestObj.numOfDays) newErrors.numOfDays = "Number of Days Required";
        if (!wfhRequestObj.reason.trim()) newErrors.reason = "Reason is required.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }


    async function handleSubmit(e) {
        e.preventDefault();
        setwfhRequestObj((pre) => ({
            ...pre,
            numOfDays: getDayDifference(wfhRequestObj)
        }))
        if (!validateForm()) {
            toast.error("Please fix the errors.");
            return;
        }

        try {
            setIsWorkingApi(true);
            if (wfhRequestObj._id) {
                const res = await axios.put(`${url}/api/wfh-application/${wfhRequestObj._id}`, wfhRequestObj, {
                    headers: {
                        Authorization: data.token || ""
                    }
                });
                toast.success(res.data?.message || "Request updated successfully!");
            } else {
                const res = await axios.post(`${url}/api/wfh-application/${data._id}`, wfhRequestObj, {
                    headers: {
                        Authorization: data.token || ""
                    }
                });
                toast.success(res.data?.message || "Request submitted successfully!");
            }
            setwfhRequestObj({});
            navigate(`/${whoIs}`);
        } catch (error) {
            toast.error(error.response?.data?.error || "Something went wrong.");
        } finally {
            setIsWorkingApi(false);
        }
    }

    useEffect(() => {
        async function fetchHolidays() {
            try {
                const res = await getHoliday();
                setExcludeDates(res.holidays.map(date => new Date(date)));
            } catch (error) {
                console.log(error);
                // toast.error("Failed to load holidays.");
            }
        }
        fetchHolidays();
    }, []);
    return (
        <form onSubmit={handleSubmit}>
            <div className="leaveFormContainer">
                <div className="leaveFormParent" style={{ width: "600px" }}>
                    <div className="heading">
                        <h5 className="my-3">Work From Home Request Form</h5>
                    </div>

                    {/* Date Picker */}
                    <div className="row my-3">
                        <div className="col-12 col-lg-6 col-md-6">
                            <span className="inputLabel">Start Date</span>
                            <DatePicker
                                showTimeSelect
                                dateFormat="Pp"
                                disabled={type === "view"}
                                className={`inputField ${errors.fromDate ? "error" : ""} w-100`}
                                selected={wfhRequestObj.fromDate ? new Date(wfhRequestObj.fromDate) : null}
                                minDate={now}
                                onChange={(date) => handleInputChange("fromDate", date)}
                                excludeDates={excludedDates}
                            />
                            {errors.fromDate && <div className="text-center text-danger">{errors.fromDate}</div>}
                        </div>

                        <div className="col-12 col-lg-6 col-md-6">
                            <span className="inputLabel">End Date</span>
                            <DatePicker
                                showTimeSelect
                                dateFormat="Pp"
                                disabled={type === "view"}
                                className={`inputField ${errors.toDate ? "error" : ""} w-100`}
                                selected={wfhRequestObj.toDate ? new Date(wfhRequestObj.toDate) : null}
                                onChange={(date) => handleInputChange("toDate", date)}
                                minDate={now}
                                excludeDates={excludedDates}
                            />
                            {errors.toDate && <div className="text-center text-danger">{errors.toDate}</div>}
                        </div>
                    </div>

                    <div className="col-12 col-lg-12 col-md-6">
                        <span className="inputLabel">Number of Days</span>
                        <input type="number" value={wfhRequestObj.fromDate && wfhRequestObj.toDate ? getDayDifference(wfhRequestObj) : 0} className={`inputField ${errors.toDate ? "error" : ""}`} />
                        {errors.fromDate && <div className="text-center text-danger">{errors.fromDate}</div>}
                    </div>

                    {/* Reason for Leave */}
                    <div className="my-3">
                        <span className="inputLabel">Reason for Leave</span>
                        <TextEditor
                            handleChange={(content) => handleInputChange("reason", content)}
                            content={wfhRequestObj.reason}
                            isDisabled={type === "view"}
                        />
                        {errors.reason && <div className="text-center text-danger">{errors.reason}</div>}
                    </div>

                    {/* Action Buttons */}
                    {type !== "view" ? (
                        <div className="row gap-2 d-flex align-items-center justify-content-center my-4">
                            <div className="col-12 col-lg-5 col-md-5">
                                <button
                                    type="button"
                                    className="btn btn-outline-dark w-100"
                                    onClick={() => navigate(`/${whoIs}`)}
                                >
                                    Cancel
                                </button>
                            </div>
                            <div className="col-12 col-lg-5 my-2 col-md-5">
                                <button type="submit" className="btn btn-dark w-100">
                                    {isWorkingApi ? <Loading size={20} color="white" /> : wfhRequestObj._id ? "Update" : "Submit"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={() => navigate(-1)}
                        >
                            Back
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}
