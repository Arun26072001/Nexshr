import React, { useEffect, useState } from "react";
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { useNavigate, useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../Loader";
import { fetchLeaveRequests } from "../ReuseableAPI";
import Cookies from "universal-cookie";
import { jwtDecode } from "jwt-decode";

const LeaveRequestForm = (props) => {
  const url = process.env.REACT_APP_API_URL;
  const cookies = new Cookies();
  const token = cookies.get("token");
  const {_id} = jwtDecode(token);
  const [collegues, setCollegues] = useState([])
  const [error, setError] = useState("");
  const [isShowPeriodOfLeave, setIsShowPeriodOfLeave] = useState(false);
  const navigate = useNavigate();
  const [typeOfLeave, setTypOfLeave] = useState(null);

  let leaveObj = {
    leaveType: "",
    fromDate: "",
    toDate: "",
    reasonForLeave: "",
    prescription: "",
    periodOfLeave: "full time",
    coverBy: ""
  }

  let leaveObjValidation = Yup.object().shape({
    leaveType: Yup.string().required("Leave type is required!"),
    fromDate: Yup.date()
      .min(new Date(), "You can select a date from tomorrow")
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
    toDate: Yup.date().min(new Date(), "You can select date from Tomarrow")
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
  })

  const formik = useFormik({
    initialValues: leaveObj,
    validationSchema: leaveObjValidation,
    validateOnChange: true,
    onSubmit: async (values, { resetForm }) => {
      if (error === "") {
        try {
          const res = await axios.post(`${url}/api/leave-application/${_id}`, values, {
            headers: {
              authorization: token || ""
            }
          })
          toast.success(res.data.message);
          resetForm();
          navigate(-1);
        } catch (err) {
            toast.error(err?.response?.data?.message)
            console.log(err);
        }
      }
    }
  })
  function handleShowPeriodOfLeave() {
    setIsShowPeriodOfLeave(!isShowPeriodOfLeave)
  }

  useEffect(() => {
    if (formik.values.fromDate && formik.values.toDate) {
      let fromDateTime = new Date(formik.values.fromDate).getTime();
      let toDateTime = new Date(formik.values.toDate).getTime();
      if (fromDateTime > toDateTime) {
        return setError("Please select next start date");
      } else if (formik.values.fromDate == formik.values.toDate) {
        return handleShowPeriodOfLeave();
      }
      else {
        setError("");
      }
    }
  }, [formik.values.fromDate, formik.values.toDate]);

  useEffect(() => {
    const gettingLeaveRequests = async () => {
      if (_id) {
        const leaveReqs = await fetchLeaveRequests(_id);
        console.log(leaveReqs);

        // fetch leave types from db
        setTypOfLeave(leaveReqs?.requests?.typesOfLeaveCount)
        const emps = leaveReqs.collegues.filter((emp) => (emp._id !== _id))
        setCollegues(emps)
      } else {
        toast.error("_id still not load in app.")
      }
    }
    gettingLeaveRequests();
    // if (leaveType) {  // assign leavetType initially from params
    //   leaveObj.leaveType = leaveType;
    // }
  }, [_id])


  return (
    typeOfLeave ?
      (<form onSubmit={formik.handleSubmit} >
        <div className="leaveFormContainer">
          <div className="leaveFormParent">
            <div className="heading">
              <h5 className="my-3"><LibraryBooksIcon /> Leave Request Form</h5>
              <p className="text-dark">Fill the required fields below to apply for annual leave</p>
            </div>

            <div className="my-3">
              <span className="inputLabel">Leave Type</span>
              <select name="leaveType" className={`selectInput ${formik.touched.leaveType && formik.errors.leaveType ? "error" : ""}`}
                onChange={formik.handleChange}
                value={formik.values.leaveType}>
                <option >Select Leave type</option>
                {
                  Object.entries(typeOfLeave).map((data) => {
                    return <option value={`${data[0]} leave`} >{data[0].charAt(0).toUpperCase()+data[0].slice(1)} Leave</option>
                  })
                }
              </select>
              {formik.touched.leaveType && formik.errors.leaveType ? (
                <div className="text-center text-danger">{formik.errors.leaveType}</div>
              ) : null}
            </div>

            <div className="row my-3">
              <div className="col-12 col-lg-6 col-md-6">
                <span className="inputLabel">Start Date</span>
                <input type="date" name="fromDate" min={new Date().toISOString().split("T")[0]} className={`inputField ${formik.touched.fromDate && formik.errors.fromDate ? "error" : ""}`}
                  onChange={formik.handleChange}
                  value={formik.values.fromDate} />
                {formik.touched.fromDate && formik.errors.fromDate ? (
                  <div className="text-center text-danger">{formik.errors.fromDate}</div>
                ) : null}
              </div>
              <div className="col-12 col-lg-6 col-md-6">
                <span className="inputLabel">End Date</span>
                <input type="date" name="toDate" className={`inputField ${formik.touched.toDate && formik.errors.toDate ? "error" : ""}`}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={formik.handleChange}
                  value={formik.values.toDate} />
                {formik.errors.toDate && formik.touched.toDate ? (
                  <div className="text-center text-danger">{formik.errors.toDate}</div>
                ) : error && <div className="text-center text-danger">{error}</div>}
              </div>
            </div>

            {isShowPeriodOfLeave &&
              <div className="my-3">
                <span className="inputLabel">Period Of Leave</span>
                <select name="periodOfLeave" className={`selectInput`}
                  onChange={formik.handleChange}
                  value={formik.values.periodOfLeave}>
                  <option >Select Leave type</option>
                  <option value="full day">Full Day</option>
                  <option value="half day">Half Day</option>
                </select>
              </div>
            }

            <div className="my-3">
              <span className="inputLabel">
                Reason for Leave
              </span>
              <input type="text" name="reasonForLeave" className={`inputField ${formik.touched.reasonForLeave && formik.errors.reasonForLeave ? "error" : ""}`}
                onChange={formik.handleChange}
                value={formik.values.reasonForLeave} />
              {formik.touched.reasonForLeave && formik.errors.reasonForLeave ? (
                <div className="text-center text-danger">{formik.errors.reasonForLeave}</div>
              ) : null}
            </div>

            <div className="my-3">
              <span className="inputLabel">
                Attach handover document (pdf, jpg, docx or any other format)
              </span>
              <input type="file" name="prescription" className="fileInput"
                onChange={formik.handleChange}
                value={formik.values.prescription} />
            </div>

            <div className="my-3">
              <span className="inputLabel">
                Choose Relief Officer
              </span>
              <select name="coverBy" className="selectInput"
                onChange={formik.handleChange}
                value={formik.values.coverBy}>
                <option >Select a Relief Officer</option>
                {
                  collegues.map((emp) => (
                    <option value={emp._id}>{emp.FirstName}</option>
                  ))
                }
              </select>
            </div>
            <div className="row gap-2 d-flex align-items-center justify-content-center my-4">
              <div className="col-12 col-lg-5 col-md-5">
                <button type="button" className="btn btn-outline-dark w-100" onClick={() => navigate(-1)}>
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
      </form>) : <Loading />
  )
};

export default LeaveRequestForm;
