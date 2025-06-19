import React, { useContext, useEffect, useState } from "react";
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { fetchAllEmployees, fetchLeaveRequests, getHoliday } from "../ReuseableAPI";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import TextEditor from "./TextEditor";
import { EssentialValues } from "../../App";
import Loading from "../Loader";
import { Notification, toaster } from "rsuite";
import { jwtDecode } from "jwt-decode";

const LeaveRequestForm = ({ type }) => {
  const { id } = useParams();
  const url = process.env.REACT_APP_API_URL;
  const { whoIs, data } = useContext(EssentialValues);
  const { _id, token } = data;
  const { company } = jwtDecode(token);
  const [errorData, setErrorData] = useState("");
  const [isShowPeriodOfLeave, setIsShowPeriodOfLeave] = useState(false);
  const navigate = useNavigate();
  const [typeOfLeave, setTypOfLeave] = useState({});
  const [excludedDates, setExcludeDates] = useState([]);
  const [filteredExcludesDates, setFilteredExcludeDates] = useState([]);
  const [prescriptionFile, setPrescriptionFile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [isWorkingApi, setIsWorkingApi] = useState(false);
  const now = new Date();
  const [leaveRequestObj, setLeaveRequestObj] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    setErrorData("");
    if (new Date(leaveRequestObj.fromDate) > new Date(leaveRequestObj.toDate)) {
      setErrorData("To Date must be after From Date");
      return;
    }
    const formData = new FormData();
    formData.append("leaveType", leaveRequestObj.leaveType);
    formData.append("fromDate", leaveRequestObj.fromDate ? new Date(leaveRequestObj.fromDate).toISOString() : "");
    formData.append("toDate", leaveRequestObj.toDate ? new Date(leaveRequestObj.toDate).toISOString() : "");
    formData.append("periodOfLeave", leaveRequestObj.periodOfLeave || leaveRequestObj?.leaveType?.toLowerCase()?.includes("permission") ? "half day" : "full day");
    formData.append("reasonForLeave", leaveRequestObj.reasonForLeave);
    formData.append("prescription", prescriptionFile); // Assuming `file` is the file object
    if (leaveRequestObj.coverBy) {
      formData.append("coverBy", leaveRequestObj.coverBy);
    }

    if (leaveRequestObj.applyFor) {
      formData.append("applyFor", leaveRequestObj.applyFor);
    }

    if (leaveRequestObj._id) {
      updateLeave(leaveRequestObj)
    } else {
      applyLeave(formData)
    }
  }

  async function applyLeave(formData) {
    try {
      setIsWorkingApi(true);
      // Leave request submission
      const res = await axios.post(`${url}/api/leave-application/${_id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          authorization: token || "",
        },
      });
      toast.success(res.data.message);
      setLeaveRequestObj({});
      navigate(`/${whoIs}`); // Navigate back
    } catch (err) {
      console.log("error in add leave", err);
      console.log("function", err?.response?.data?.error);
      toast.error(err?.response?.data?.error);
      setErrorData(err?.response?.data?.error);
    } finally {
      setIsWorkingApi(false);
    }
  }

  async function updateLeave(formData, resetForm) {
    const leaveData = {
      ...formData,
      employee: _id,
      coverBy: leaveRequestObj.coverBy || null,
      applyFor: leaveRequestObj.applyFor || null,
    }

    try {
      setIsWorkingApi(true);
      const res = await axios.put(`${url}/api/leave-application/${leaveRequestObj._id}`, leaveData, {
        headers: {
          Authorization: token || ""
        }
      })
      toast.success(res.data.message);
      setLeaveRequestObj({});
      navigate(`/${whoIs}`); // Navigate back
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      console.log("error in update leave", error);
      toast.error(error?.response?.data?.error);
      setErrorData(error?.response?.data?.error)
    } finally {
      setIsWorkingApi(false);
    }
  }

  const fetchLeaveRequest = async () => {
    try {
      const response = await axios.get(`${url}/api/leave-application/${id}`, {
        headers: {
          authorization: token || ""
        }
      });
      setLeaveRequestObj(response.data);
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      toast.error("Failed to fetch leave request data.");
    }
  };


  const gettingLeaveRequests = async () => {
    setIsLoading(true)
    try {
      if (leaveRequestObj.applyFor || _id) {
        const leaveReqs = await fetchLeaveRequests(leaveRequestObj.applyFor || _id);

        const leaveDates = leaveReqs?.peopleLeaveOnMonth.flatMap((leave) => [
          new Date(leave.fromDate).toISOString(),
          new Date(leave.toDate).toISOString(),
        ]) || [];

        // Count occurrences of each date
        const dateCounts = leaveDates.reduce((acc, date) => {
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        // Filter dates with more than one occurrence
        const duplicateDates = Object.entries(dateCounts)
          .filter(([, count]) => count > 1) // Keep only dates with count > 1
          .map(([date]) => new Date(date)); // Convert back to Date objects

        // Update the excludeDates array
        if (duplicateDates.length > 0) {
          setExcludeDates((prev) => [...prev, ...duplicateDates]);
          setFilteredExcludeDates((prev) => [...prev, ...duplicateDates])
        }

        // Set types of leave
        const validLeaveTypes = Object.keys(leaveReqs?.employee?.typesOfLeaveCount).map((type) => type);

        setTypOfLeave(validLeaveTypes || {});

      } else {
        toast.error("_id is not loaded in the app.");
      }
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      console.error("Error fetching leave requests:", error);
      toast.error("Failed to fetch leave requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  function handleLeaveType(e) {
    const { name, value } = e.target;
    if (["permission leave", "sick leave"].includes(value.toLowerCase())) {
      setExcludeDates([]);
      fetchHolidays();
      fillLeaveObj(value, name)
    } else {
      fetchHolidays();
      setExcludeDates(filteredExcludesDates);
      fillLeaveObj(value, name)
    }
  }

  function getFileData(e) {
    setPrescriptionFile(e.target.files[0])
  }

  async function gettingEmps() {
    try {
      const emps = await fetchAllEmployees();
      const filterEmps = emps.filter((emp) => emp._id !== _id)
      setEmployees(filterEmps.map((emp) => ({ label: emp.FirstName + " " + emp.LastName, value: emp._id })))
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      console.log(error);
    }
  }

  async function fetchHolidays() {
    try {
      const res = await getHoliday();
      setExcludeDates(res.holidays.map(holiday => new Date(holiday.date)));
    } catch (error) {
      if (error?.message === "Network Error") {
        navigate("/network-issue")
      }
      console.error("Failed to fetch holidays", error);
    }
  }

  function fillLeaveObj(value, name) {
    setLeaveRequestObj((pre) => ({
      ...pre,
      [name]: value
    }))
  }

  useEffect(() => {
    gettingLeaveRequests();
    if (id) {
      fetchLeaveRequest()
    }
  }, [_id, leaveRequestObj.applyFor]);

  useEffect(() => {
    const leaveType = leaveRequestObj.leaveType?.toLowerCase();
    if (leaveType === "permission leave") {
      setIsShowPeriodOfLeave(true);
    } else {
      setIsShowPeriodOfLeave(false);
    }
  }, [leaveRequestObj.leaveType]);

  useEffect(() => {
    if (whoIs !== "emp") {
      gettingEmps()
    }
  }, [whoIs])

  useEffect(() => {
    if (["admin", "hr"].includes(whoIs)) {
      toaster.push(
        <Notification
          header={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={company.logo} alt="Company Logo" style={{ width: 50, height: 50, marginRight: 10 }} />
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{company.CompanyName}</span>
            </div>
          }
          closable
        >
          <strong className="text-danger">Important notice</strong>
          <p className="my-1">If you want to apply leave for an employee, please select the "Apply Leave For Employee" option.</p>
          <p className="my-1">If you are applying leave for yourself, please do not select the "Apply Leave For Employee" option.</p>
        </Notification>,
        { placement: 'topCenter' }
      );
    }
  }, [])

  return (
    isLoading ? <Loading height="80vh" /> :
      <form onSubmit={handleSubmit}>
        <div className="leaveFormContainer">
          <div className="leaveFormParent" style={{ width: "600px" }}>
            <div className="heading">
              <h5 className="my-3">
                <LibraryBooksIcon /> Leave Request Form
              </h5>
              {leaveRequestObj._id ? (
                <p className="text-dark">Update the required fields below to modify your annual leave request</p>
              ) : (
                <p className="text-dark">Fill the required fields below to apply for annual leave</p>
              )}
            </div>

            {/* Apply leave for employees */}
            {["hr", "admin"].includes(whoIs) && (
              <div className="my-3">
                <span className="inputLabel">Apply Leave for Employee</span>
                <select
                  name="applyFor"
                  className={`selectInput ${errorData?.includes("applyFor") ? "error" : ""}`}
                  onChange={type === "view" ? null : (e) => fillLeaveObj(e.target.value, "applyFor")}
                  value={leaveRequestObj.applyFor}
                  disabled={type === "view"}
                >
                  <option>Select Employee</option>
                  {employees.map((emp) => (
                    <option value={emp.value}>{emp.label}</option>
                  ))}
                </select>
                {errorData?.includes("applyFor") && <div className="text-center text-danger">Please select an employee</div>}
              </div>
            )}

            {/* Leave Type */}
            <div className="my-3">
              <span className="inputLabel">Leave Type</span>
              <select
                name="leaveType"
                className={`selectInput ${errorData?.includes("leaveType") ? "error" : ""}`}
                onChange={type === "view" ? null : handleLeaveType}
                value={leaveRequestObj.leaveType}
                disabled={type === "view"}
              >
                <option value="">Select Leave Type</option>
                {typeOfLeave?.length > 0 &&
                  typeOfLeave.map((data, index) => (
                    <option key={index} value={data}>
                      {data[0]?.toUpperCase() + data.slice(1)}
                    </option>
                  ))}
              </select>
              {errorData?.includes("leaveType") && <div className="text-center text-danger">Leave type is required</div>}
            </div>

            {/* Date Picker */}
            <div className="row my-3">
              <div className="col-12 col-lg-6 col-md-6">
                <span className="inputLabel">From Date</span>
                <DatePicker
                  showTimeSelect
                  dateFormat="Pp"
                  disabled={type === "view"}
                  className={`inputField ${errorData?.includes("fromDate") ? "error" : ""} w-100`}
                  selected={leaveRequestObj.fromDate ? new Date(leaveRequestObj.fromDate) : null}
                  onChange={(date) => type !== "view" && fillLeaveObj(date, "fromDate")}
                  minDate={["admin", "hr"].includes(whoIs) ? null : now}
                  minTime={leaveRequestObj.leaveType?.toLowerCase()?.includes("permission") ? now : null}
                  maxTime={leaveRequestObj.leaveType?.toLowerCase()?.includes("permission") ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59) : null}
                  excludeDates={!leaveRequestObj.leaveType?.toLowerCase()?.includes("permission") && excludedDates}
                  onKeyDown={(e) => e.preventDefault()}
                />

                {errorData?.includes("fromDate") && <div className="text-center text-danger">{errorData}</div>}
              </div>
              <div className="col-12 col-lg-6 col-md-6">
                <span className="inputLabel">To Date</span>
                <DatePicker
                  showTimeSelect
                  dateFormat="Pp"
                  disabled={type === "view"}
                  className={`inputField ${errorData?.includes("toDate") ? "error" : ""} w-100`}
                  selected={leaveRequestObj.toDate ? new Date(leaveRequestObj.toDate) : null}
                  onChange={(date) => type !== "view" && fillLeaveObj(date, "toDate")}
                  minDate={leaveRequestObj.fromDate || (["admin", "hr"].includes(whoIs) ? null : now)}
                  minTime={leaveRequestObj.leaveType?.toLowerCase()?.includes("permission") ? now : null}
                  maxTime={leaveRequestObj.leaveType?.toLowerCase()?.includes("permission") ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59) : null}
                  excludeDates={!leaveRequestObj.leaveType?.toLowerCase()?.includes("permission") && excludedDates}
                  onKeyDown={(e) => e.preventDefault()}
                />

                {errorData?.includes("toDate") && <div className="text-center text-danger">{errorData}</div>}
              </div>
            </div>

            {/* Period of Leave */}
            {isShowPeriodOfLeave && (
              <div className="my-3">
                <span className="inputLabel">Period Of Leave</span>
                <select
                  name="periodOfLeave"
                  className={`selectInput ${errorData?.includes("periodOfLeave") ? "error" : ""}`}
                  onChange={type === "view" ? null : (e) => fillLeaveObj(e.target.value, "periodOfLeave")}
                  value={leaveRequestObj.periodOfLeave}
                  disabled={type === "view"}
                >
                  <option>Select Leave Period</option>
                  <option value="full day">Full Day</option>
                  <option value="half day">Half Day</option>
                </select>
              </div>
            )}

            {/* Reason for Leave */}
            <div className="my-3">
              <span className="inputLabel">Reason for Leave</span>
              <TextEditor
                handleChange={(e) => type === "view" ? null : fillLeaveObj(e, "reasonForLeave")}
                content={leaveRequestObj.reasonForLeave}
                isDisabled={type === "view"}
              />
              {errorData?.includes("reasonForLeave") && <div className="text-center text-danger">{errorData}</div>}
            </div>

            {/* Attach file */}
            <div className="my-3">
              <span className="inputLabel">Attach handover document (pdf, jpg, docx or any other format)</span>
              <input
                type="file"
                name="prescription"
                className="fileInput"
                onChange={type === "view" ? null : getFileData}
                disabled={type === "view"}
              />
            </div>

            {/* Action buttons */}
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
                    {isWorkingApi ? <Loading size={20} color="white" /> : leaveRequestObj._id ? "Update" : "Submit"}
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
  )
};

export default LeaveRequestForm;
