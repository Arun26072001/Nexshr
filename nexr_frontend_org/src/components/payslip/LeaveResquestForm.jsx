import React, { useContext, useEffect, useState } from "react";
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import { fetchLeaveRequests, getHoliday } from "../ReuseableAPI";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import TextEditor from "./TextEditor";
import { EssentialValues } from "../../App";
import Loading from "../Loader";

const LeaveRequestForm = () => {
  const url = process.env.REACT_APP_API_URL;
  const empId = localStorage.getItem("_id");
  const { whoIs } = useContext(EssentialValues);
  const token = localStorage.getItem("token");
  const [collegues, setCollegues] = useState([]);
  const [error, setError] = useState("");
  const [isShowPeriodOfLeave, setIsShowPeriodOfLeave] = useState(false);
  const navigate = useNavigate();
  const [typeOfLeave, setTypOfLeave] = useState({});
  const [excludedDates, setExcludeDates] = useState([]);
  const [prescriptionFile, setPrescriptionFile] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false)

  let leaveObj = {
    leaveType: "",
    fromDate: "",
    toDate: "",
    reasonForLeave: "",
    prescription: "",
    periodOfLeave: "full time",
    coverBy: ""
  };

  let leaveObjValidation = Yup.object().shape({
    leaveType: Yup.string().required("Leave type is required!"),
    fromDate: Yup.date()
      .test(
        "min-date",
        "You can select a date from tomorrow",
        function (value) {
          const { leaveType } = this.parent;
          console.log(leaveType);
          // Accessing another field
          if (leaveType !== "Permission Leave" && value) {
            return value >= new Date(); // Ensure the date is in the future
          }
          return true;
        }
      )
      .required("From Date is required")
      .test(
        "weekend check",
        "Weekends are not allowed",
        (value) => {
          if (value) {
            const day = new Date(value).getDay();
            return day !== 0 && day !== 6;
          }
          return true;
        }
      ),
    toDate: Yup.date()
      .test(
        "min-date",
        "To Date must be after From Date",
        function (value) {
          const { fromDate } = this.parent; // Accessing another field
          if (value && fromDate) {
            return value >= fromDate; // Ensure `toDate` is not before `fromDate`
          }
          return true;
        }
      )
      .test("check weekend",
        "Weekend is not allowed",
        (date) => {
          if (date) {
            const day = new Date(date).getDay();
            return day !== 0 && day !== 6;
          }
          return true;
        }
      )
      .required("ToDate is required"),
    reasonForLeave: Yup.string().required("Reason for Leave is required"),
    periodOfLeave: Yup.string().notRequired(),
    prescription: Yup.string().notRequired(),
    coverBy: Yup.string().notRequired()
  });
  const formik = useFormik({
    initialValues: leaveObj,
    validationSchema: leaveObjValidation,
    validateOnChange: true,
    onSubmit: async (values, { resetForm }) => {
      if (error === "") {
        const formData = new FormData();
        formData.append("leaveType", formik.values.leaveType);
        formData.append("fromDate", formik.values.fromDate);
        formData.append("toDate", formik.values.toDate);
        formData.append("periodOfLeave", formik.values.periodOfLeave);
        formData.append("reasonForLeave", formik.values.reasonForLeave);
        formData.append("prescription", prescriptionFile); // Assuming `file` is the file object
        formData.append("coverBy", formik.values.coverBy);
        try {
          // Leave request submission
          const res = await axios.post(`${url}/api/leave-application/${empId}`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              authorization: token || "",
            },
          });
          toast.success(res.data.message);
          resetForm();
          setContent("")
          navigate(`/${whoIs}/`); // Navigate back
        } catch (err) {
          toast.error(err?.response?.data?.error);
          console.log(err);
        }
      }
    },
  });

  useEffect(() => {
    if (formik.values.fromDate && formik.values.toDate) {
      let fromDateTime = new Date(formik.values.fromDate).getTime();
      let toDateTime = new Date(formik.values.toDate).getTime();
      if (fromDateTime > toDateTime) {
        return setError("Please select next start date");
      } else if (new Date(formik.values.fromDate).getTime() === new Date(formik.values.toDate).getTime()) {
        return setIsShowPeriodOfLeave(true);
      } else {
        setIsShowPeriodOfLeave(false)
        setError("");
      }
    }
  }, [formik.values.fromDate, formik.values.toDate]);

  const gettingLeaveRequests = async () => {
    setIsLoading(true)
    try {
      if (empId) {
        const leaveReqs = await fetchLeaveRequests(empId);

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
        }

        // Set types of leave
        setTypOfLeave(leaveReqs?.employee?.typesOfLeaveCount || {});

        // Filter colleagues 
        // const emps = leaveReqs.colleagues.filter((emp) => emp._id !== empId);
        setCollegues(leaveReqs.colleagues);
      } else {
        toast.error("empId is not loaded in the app.");
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error("Failed to fetch leave requests. Please try again.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    gettingLeaveRequests();
  }, [empId]);

  function handleLeaveType(e) {
    const { name, value } = e.target;
    if (['sick leave', 'medical leave', "permission leave"].includes(value.toLowerCase())) {
      setExcludeDates([]);
      formik.setFieldValue(`${name}`, value);
    } else {
      formik.setFieldValue(`${name}`, value);
      // gettingLeaveRequests();
    }
  }

  function getFileData(e) {
    setPrescriptionFile(e.target.files[0])
  }

  function handleChange(value) {
    setContent(value);
    formik.setFieldValue("reasonForLeave", value)
  }

  useEffect(() => {
    async function gettingHoliday() {
      try {
        const res = await getHoliday();
        setExcludeDates(res.map((data) => new Date(data)))
      } catch (error) {
        toast.error(error)
      }
    }
    gettingHoliday();
  }, [])
  console.log(formik.values);

  return (
    isLoading ? <Loading /> :
      <form onSubmit={formik.handleSubmit}>
        <div className="leaveFormContainer">
          <div className="leaveFormParent" style={{ width: "600px" }}>
            <div className="heading">
              <h5 className="my-3">
                <LibraryBooksIcon /> Leave Request Form
              </h5>
              <p className="text-dark">Fill the required fields below to apply for annual leave</p>
            </div>

            {/* Leave Type */}
            <div className="my-3">
              <span className="inputLabel">Leave Type</span>
              <select
                name="leaveType"
                className={`selectInput ${formik.touched.leaveType && formik.errors.leaveType ? "error" : ""}`}
                onChange={(e) => handleLeaveType(e)}
                value={formik.values.leaveType}
              >
                <option>Select Leave type</option>
                {Object.entries(typeOfLeave)?.length > 0 &&
                  Object.entries(typeOfLeave)?.map((data) => {
                    return <option value={`${data[0]}`}>{data[0]?.charAt(0)?.toUpperCase() + data[0]?.slice(1)} Leave</option>;
                  })
                }
              </select>
              {formik.touched.leaveType && formik.errors.leaveType ? (
                <div className="text-center text-danger">{formik.errors.leaveType}</div>
              ) : null}
            </div>

            {/* Date Picker */}
            <div className="row my-3">
              <div className="col-12 col-lg-6 col-md-6">
                <span className="inputLabel">Start Date</span>
                <DatePicker showTimeSelect
                  dateFormat="Pp"
                  className={`inputField ${formik.touched.fromDate && formik.errors.fromDate ? "error" : ""} w-100`}
                  selected={formik.values.fromDate}
                  onChange={(date) => formik.setFieldValue("fromDate", date)}
                  minDate={new Date()}
                  excludeDates={excludedDates} />

                {formik.touched.fromDate && formik.errors.fromDate ? (
                  <div className="text-center text-danger">{formik.errors.fromDate}</div>
                ) : null}
              </div>
              <div className="col-12 col-lg-6 col-md-6">
                <span className="inputLabel">End Date</span>
                <DatePicker
                  showTimeSelect
                  dateFormat="Pp"
                  className={`inputField ${formik.touched.toDate && formik.errors.toDate ? "error" : ""}`}
                  selected={formik.values.toDate}
                  onChange={(date) => formik.setFieldValue("toDate", date)}
                  minDate={new Date()}
                  excludeDates={excludedDates}
                />
                {formik.errors.toDate && formik.touched.toDate ? (
                  <div className="text-center text-danger">{formik.errors.toDate}</div>
                ) : error && <div className="text-center text-danger">{error}</div>}
              </div>
            </div>

            {/* Period of Leave */}
            {isShowPeriodOfLeave && (
              <div className="my-3">
                <span className="inputLabel">Period Of Leave</span>
                <select
                  name="periodOfLeave"
                  className="selectInput"
                  onChange={formik.handleChange}
                  value={formik.values.periodOfLeave}
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
              <TextEditor handleChange={handleChange} content={content} />

              {formik.touched.reasonForLeave && formik.errors.reasonForLeave ? (
                <div className="text-center text-danger">{formik.errors.reasonForLeave}</div>
              ) : null}
            </div>

            {/* Attach file */}
            <div className="my-3">
              <span className="inputLabel">Attach handover document (pdf, jpg, docx or any other format)</span>
              <input
                type="file"
                name="prescription"
                className="fileInput"
                onChange={getFileData} // Set the actual file, not just the name
              />
            </div>

            {/* Select Relief Officer */}
            <div className="my-3">
              <span className="inputLabel">Choose Relief Officer</span>
              <select
                name="coverBy"
                className="selectInput"
                onChange={formik.handleChange}
                value={formik.values.coverBy}
              >
                <option>Select a Relief Officer</option>
                {collegues?.map((emp) => (
                  <option value={emp._id}>{emp.FirstName}</option>
                ))}
              </select>
            </div>

            {/* Action buttons */}
            <div className="row gap-2 d-flex align-items-center justify-content-center my-4">
              <div className="col-12 col-lg-5 col-md-5">
                <button
                  type="button"
                  className="btn btn-outline-dark w-100"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
              </div>
              <div className="col-12 col-lg-5 my-2 col-md-5">
                <button type="submit" className="btn btn-dark w-100">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
  )
};

export default LeaveRequestForm;
