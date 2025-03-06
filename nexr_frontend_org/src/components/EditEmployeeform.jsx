import React, { useContext, useEffect, useState } from "react";
import { SelectPicker, TagPicker } from "rsuite";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import "./leaveForm.css";
import { updateEmp } from "./ReuseableAPI";
import { TimerStates } from "./payslip/HRMDashboard";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "./Loader";
import NoDataFound from "./payslip/NoDataFound";
import { EssentialValues } from "../App";

const EditEmployeeform = ({ details, empData, handleScroll, handlePersonal, handleFinancial, handleJob, handleContact, handleEmployment, timePatterns, personalRef, contactRef, employmentRef, jobRef, financialRef, countries, companies, departments, positions, roles, leads, managers }) => {
    const { id } = useParams();
    const navigate = useNavigate()
    const { changeEmpEditForm } = useContext(TimerStates);
    const [stateData, setStateData] = useState([]);
    const { whoIs } = useContext(EssentialValues);
    const [timeDifference, setTimeDifference] = useState(0);
    const [selectedCountryCode, setselectedCountryCode] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const token = localStorage.getItem("token");
    const url = process.env.REACT_APP_API_URL;
    const [selectedLeaveTypes, setSelectedLeavetypes] = useState([]);
    const [splitError, setSplitError] = useState("");
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorData, setErrorData] = useState("");
    const [employeeObj, setEmployeeObj] = useState(
        empData
    );

    const empFormValidation = Yup.object().shape({
        FirstName: Yup.string().required('First Name is required'),
        LastName: Yup.string().required('Last Name is required'),
        Email: Yup.string().email('Invalid email format').required('Email is required'),
        Password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
        company: Yup.string().optional(),
        teamLead: Yup.string().optional(), // assuming it's an ObjectId or string
        managerId: Yup.string().optional(),
        countryCode: Yup.string().optional(),
        phone: Yup.string().optional(), // can add phone validation if needed
        dateOfBirth: Yup.string().optional(),
        gender: Yup.string().optional(),
        address: Yup.object().shape({
            city: Yup.string().optional(),
            state: Yup.string().optional(),
            country: Yup.string().optional(),
            zipCode: Yup.string().optional(),
        }).optional(),
        position: Yup.string().optional(),
        department: Yup.string().optional(),
        role: Yup.string().optional(),
        // description: Yup.string().min(10, "mininum 10 characters must be in description").required("Description is required"),
        description: Yup.string().optional(),
        dateOfJoining: Yup.string().optional(),
        employmentType: Yup.string().optional(),
        workingTimePattern: Yup.string().optional(),
        annualLeaveYearStart: Yup.date().optional().nullable(),
        publicHoliday: Yup.string().optional(),
        monthlyPermissions: Yup.number().required("Monthly permissions is required"),
        annualLeaveEntitlement: Yup.number().optional(),
        // basicSalary: Yup.string().min(4, "invalid Salary").max(10).required("Salary is required"),
        basicSalary: Yup.string().optional(),
        // bankName: Yup.string().min(2, "invalid Bank name").max(200).required("Bank name is required"),
        bankName: Yup.string().optional(),
        // accountNo: Yup.string().min(10, "Account No digits must be between 10 to 14").max(14, "Account No digits must be between 10 to 14").required("Account No is required"),
        accountNo: Yup.string().optional(),
        // accountHolderName: Yup.string().min(2, "invalid Holder Name").max(50).required("Holder name is Required"),
        accountHolderName: Yup.string().optional(),
        // IFSCcode: Yup.string().min(11, "IFSC code must be 11 characters").max(11, "IFSC code must be 11 characters").required("IFSC code is required"),
        IFSCcode: Yup.string().optional(),
        // taxDeduction: Yup.string().min(2, "invalid value").required("Tax deduction is required"),
        taxDeduction: Yup.string().optional()

    });

    const formik = useFormik({
        initialValues: employeeObj,
        validationSchema: empFormValidation,
        onSubmit: async (values, { resetForm }) => {
            console.log("reset");

            try {
                const res = await updateEmp(values, id);
                console.log(res);
                if (res !== undefined) {
                    toast.success(res);
                    changeEmpEditForm();
                    resetForm();
                }
            } catch (err) {
                // console.log(err);
                // if (err.response && err.response.data && err.response.data.error) {
                //     toast.error(err.response.data.error)
                // } else {
                console.log("error occured in edit employee!");
                // }
            }
        }
    })

    function handleTagSelector(value) {
        setSelectedLeavetypes(value);
    }

    function navToError() {
        if (formik.errors.FirstName
            || formik.errors.LastName
            || formik.errors.gender
            || formik.errors.department
            || formik.errors.role
            || formik.errors.position) {
            handlePersonal()
        } else if (
            formik.errors.Email
            || formik.errors.Password
            || formik.errors.phone

        ) {
            handleContact()
        } else if (
            formik.errors.workingTimePattern || formik.touched.workingTimePattern
            || formik.errors.company || formik.touched.company
            || formik.errors.dateOfJoining
            || formik.errors.fullTimeAnnualLeave
        ) {
            handleEmployment()
        } else if (
            formik.errors.managerId
            || formik.errors.teamLead
            || formik.errors.description
        ) {
            handleJob()
        } else if (
            formik.errors.basicSalary
            || formik.errors.bankName
            || formik.errors.accountNo
            || formik.errors.accountHolderName
            || formik.errors.taxDeduction
            || formik.errors.IFSCcode
        ) {
            handleFinancial()
        }
    }


    function getValueforLeave(e) {
        const { name, value } = e.target;

        // Create a new object with the updated value for the specific leave type
        const updatedTypesOfLeaveCount = {
            ...formik.values.typesOfLeaveCount,
            [name]: Number(value),
        };

        // Calculate the total using the updated `typesOfLeaveCount`
        const totalOfSplited = Object.values(updatedTypesOfLeaveCount)
            .map(Number)
            .reduce((acc, curr) => acc + curr, 0);

        const annualLeaveEntitlement = Number(formik.values.annualLeaveEntitlement);

        // Check against the annual leave entitlement
        if (totalOfSplited > annualLeaveEntitlement) {
            setSplitError("Getting more than Annual leave value!");
        } else {
            // Update the Formik state with the new `typesOfLeaveCount`
            formik.setFieldValue("typesOfLeaveCount", updatedTypesOfLeaveCount);
            setSplitError("");
        }
    }

    useEffect(() => {
        // debugger;
        const calculateTimeDifference = () => {
            if (timePatterns.length > 0) {
                const selectedPattern = timePatterns.find(pattern => pattern._id === formik.values.workingTimePattern);
                if (selectedPattern && selectedPattern.StartingTime && selectedPattern.FinishingTime) {
                    const [startHour, startMinute] = selectedPattern.StartingTime.split(":").map(num => parseInt(num, 10));
                    const [endHour, endMinute] = selectedPattern.FinishingTime.split(":").map(num => parseInt(num, 10));

                    const startDate = new Date();
                    startDate.setHours(startHour);
                    startDate.setMinutes(startMinute);

                    const endDate = new Date();
                    endDate.setHours(endHour);
                    endDate.setMinutes(endMinute);

                    const timeDiff = endDate.getTime() - startDate.getTime();
                    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
                    const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

                    setTimeDifference((((hoursDiff * 60) + minutesDiff) / 60) * selectedPattern.WeeklyDays);
                }
            }
        };


        calculateTimeDifference();
    }, [formik.values.workingTimePattern]);

    useEffect(() => {
        setSelectedLeavetypes(Object.entries(empData.typesOfLeaveCount).map(([key, value]) => key))
    }, [empData])

    useEffect(() => {
        const gettingLeaveTypes = async () => {
            try {
                const leaveTypes = await axios.get(`${url}/api/leave-type`, {
                    headers: {
                        Authorization: `${token}` || ""
                    }
                });
                setLeaveTypes(leaveTypes.data.map((leave) => ({ label: leave.LeaveName, value: leave.LeaveName })));
            } catch (error) {
                setErrorData(error.response.data.error)
            }
        }
        setIsLoading(true);
        gettingLeaveTypes();
        setIsLoading(false);
        const countryFullData = countries.find((country) => Object.values(country).includes(empData?.countryCode));
        setselectedCountryCode(countryFullData?.abbr);
        setSelectedCountry(countryFullData?.name);
        setStateData(countryFullData?.states);
    }, []);


    const hourAndMin = timeDifference.toString().split(".");
    const [hour, min] = hourAndMin;

    function changeCountry(value, name) {
        const countryFullData = countries.find(country => Object.values(country).includes(value));

        if (name === "country") {
            setSelectedCountry(value || "");
            formik.setFieldValue(`address.${name}`, value || "");
            const states = countries.find(country => country.name === value)?.states || [];
            setStateData(states);
        } else if (["state", "city", "zipCode"].includes(name)) {
            formik.setFieldValue(`address.${name}`, value || "");
        } else if (name === "publicHoliday") {
            formik.setFieldValue(name, value)
        }
        else {
            setselectedCountryCode(value);
            formik.setFieldValue(name, countryFullData?.code || "");
        }
    }


    return (
        isLoading ? <Loading /> :
            <NoDataFound message={errorData} /> ?
                <form onSubmit={formik.handleSubmit}>
                    <div className="empForm">
                        <div className="catogaries-container">
                            <div className="catogaries">
                                <div className={`catogary ${details === "personal" ? "view" : ""}`} onClick={() => handleScroll("personal")}>Personal Details</div>
                                <div className={`catogary ${details === "contact" ? "view" : ""}`} onClick={() => handleScroll("contact")}>Contact Details</div>
                                <div className={`catogary ${details === "employment" ? "view" : ""}`} onClick={() => handleScroll("employment")}>Employment Details</div>
                                <div className={`catogary ${details === "job" ? "view" : ""}`} onClick={() => handleScroll("job")}>Job Details</div>
                                <div className={`catogary ${details === "financial" ? "view" : ""}`} onClick={() => handleScroll("financial")}>Financial Details</div>
                            </div>
                        </div>

                        <div className="detailsParent" >
                            <div className="personalDetails" ref={personalRef}>
                                <div className="row my-3 d-flex justify-content-center">
                                    <div className="titleText col-lg-12">
                                        Personal Details
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">First Name</div>
                                        <input type="text"
                                            className={`inputField ${formik.touched.FirstName && formik.errors.FirstName ? "error" : ""}`}
                                            name="FirstName"
                                            onChange={formik.handleChange}
                                            value={formik.values.FirstName} />
                                        {formik.touched.FirstName && formik.errors.FirstName ? (
                                            <div className="text-center text-danger">{formik.errors.FirstName}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Last Name</div>
                                        <input type="text"
                                            className={`inputField ${formik.touched.LastName && formik.errors.LastName ? "error" : ""}`}
                                            name="LastName"
                                            onChange={formik.handleChange}
                                            value={formik.values.LastName} />
                                        {formik.touched.LastName && formik.errors.LastName ? (
                                            <div className="text-center text-danger">{formik.errors.LastName}</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="row my-3 d-flex align-items-center justify-content-center">
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Gender</div>
                                        <select name="gender"
                                            className={`selectInput ${formik.touched.gender && formik.errors.gender ? "error" : ""}`}
                                            onChange={formik.handleChange}
                                            value={formik.values.gender}>
                                            <option >Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                        {formik.touched.gender && formik.errors.gender ? (
                                            <div className="text-center text-danger">{formik.errors.gender}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Department</div>
                                        <select name="department"
                                            className={`selectInput ${formik.touched.department && formik.errors.department ? "error" : ""}`}
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.department}
                                        >
                                            <option >Select Department</option>
                                            {
                                                departments.map((department) => (
                                                    <option key={department._id} value={department._id}>{department.DepartmentName}</option>
                                                ))
                                            }
                                        </select>
                                        {formik.touched.department && formik.errors.department ? (
                                            <div className="text-center text-danger">{formik.errors.department}</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center">
                                    <div className="col-lg-12">
                                        <div className="inputLabel">Position</div>
                                        <select name="position" className={`selectInput ${formik.touched.position && formik.errors.position ? "error" : ""}`}
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik?.values?.position || empData?.position || ""}>
                                            <option >Select Position</option>
                                            {
                                                positions.map((position) => (
                                                    <option key={position._id} value={position._id}>{position.PositionName}</option>
                                                ))
                                            }
                                        </select>
                                        {formik.touched.position && formik.errors.position ? (
                                            <div className="text-center text-danger">{formik.errors.position}</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="row my-3 d-flex align-items-center justify-content-center">
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Role</div>
                                        <select name="role" className={`selectInput ${formik.touched.role && formik.errors.role ? "error" : ""}`}
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.role || empData?.role || ""}>
                                            <option >Select Role</option>
                                            {
                                                roles.map((role) => (
                                                    <option key={role._id} value={role._id}>{role.RoleName}</option>
                                                ))
                                            }
                                        </select>
                                        {formik.touched.role && formik.errors.role ? (
                                            <div className="text-center text-danger">{formik.errors.role}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Employment Type</div>
                                        <select name="employmentType" className={`selectInput ${formik.touched.employmentType && formik.errors.employmentType ? "error" : ""}`}
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.employmentType.toLowerCase()}>
                                            <option >Employment Type</option>
                                            <option value="full-time">Full Time</option>
                                            <option value="part-time">Part Time</option>
                                            <option value="intern">Contract</option>
                                        </select>
                                        {formik.touched.employmentType && formik.errors.employmentType ? (
                                            <div className="text-center text-danger">{formik.errors.employmentType}</div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div className="contactDetails" ref={contactRef}>
                                <div className="row d-flex justify-content-center my-3">
                                    <div className="titleText col-lg-12">
                                        Contact Details
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Email</div>
                                        <input type="text"
                                            className={`inputField ${formik.touched.Email && formik.errors.Email ? "error" : ""}`}
                                            name="Email"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.Email} />
                                        {formik.touched.Email && formik.errors.Email ? (
                                            <div className="text-center text-danger">{formik.errors.Email}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Password</div>
                                        <input type="password"
                                            className={`inputField ${formik.touched.Password && formik.errors.Password ? "error" : ""}`}
                                            name="Password"
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            disabled={whoIs === "emp" ? true : false}
                                            value={formik.values.Password} />
                                        {formik.touched.Password && formik.errors.Password ? (
                                            <div className="text-center text-danger">{formik.errors.Password}</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center">
                                    <div className="col-lg-6 col-md-6 col-6">
                                        <div className="inputLabel">
                                            Country Code
                                        </div>
                                        <SelectPicker
                                            className={`selectInput p-0 ${formik.touched.countryCode && formik.errors.countryCode ? "error" : ""}`}
                                            style={{ background: "none", border: "none", position: "relative", zIndex: 0 }}
                                            size="lg"
                                            data={countries}
                                            appearance="subtle"
                                            labelKey="name"
                                            valueKey="abbr"
                                            value={selectedCountryCode || formik.values.countryCode}
                                            onChange={(value) => changeCountry(value, "countryCode")}
                                            placeholder="Choose a Country"
                                            renderMenuItem={(label, item) => (
                                                <div >
                                                    {item.icon} {label} ({item.abbr}) +{item.code}
                                                </div>
                                            )}
                                            renderValue={(value, item) =>
                                                item ? (
                                                    <div>
                                                        {item.icon} {item.name} ({item.abbr})
                                                    </div>
                                                ) : null
                                            }
                                        />
                                    </div>
                                    <div className="col-lg-6 col-md-6 col-6">
                                        <div className="inputLabel">
                                            Phone
                                        </div>
                                        <input type="number"
                                            className={`inputField ${formik.touched.phone && formik.errors.phone ? "error" : ""}`}
                                            name="phone"
                                            onChange={formik.handleChange}
                                            value={Number(formik.values.phone)} />
                                        {formik.touched.phone && formik.errors.phone ? (
                                            <div className="text-center text-danger">{formik.errors.phone}</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center my-3">
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Country</div>
                                        <SelectPicker
                                            className={`selectInput p-0 ${formik.touched.country && formik.errors.country ? "error" : ""}`}
                                            style={{ background: "none", border: "none", position: "relative", zIndex: 0 }}
                                            size="lg"
                                            appearance="subtle"
                                            data={countries}
                                            labelKey="name"
                                            valueKey="name"
                                            value={selectedCountry}
                                            onChange={(value) => changeCountry(value, "country")}
                                            placeholder="Choose a Country"
                                            renderMenuItem={(label, item) => (
                                                <div >
                                                    {label}
                                                </div>
                                            )}
                                            renderValue={(value, item) =>
                                                item ? (
                                                    <div>
                                                        {item.name}
                                                    </div>
                                                ) : null
                                            }
                                        />
                                        {formik.touched?.address?.country && formik.errors?.address?.country ? (
                                            <div className="text-center text-danger">{formik.errors?.address?.country}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">State</div>
                                        <SelectPicker
                                            className="selectInput p-0"
                                            style={{ background: "none", border: "none", position: "relative", zIndex: 0 }}
                                            size="lg"
                                            appearance="subtle"
                                            value={formik.values.address.state}
                                            onChange={(e) => changeCountry(e, "state")}
                                            data={stateData?.map((item) => ({ label: item, value: item }))}
                                        />
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center my-3">
                                    <div className="col-lg-6">
                                        <div className="inputLabel">City</div>
                                        <input type="text" value={formik.values.address.city} onChange={(e) => changeCountry(e.target.value, "city")} name="city" className="inputField" />
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Zip Code</div>
                                        <input type="number" onChange={(e) => changeCountry(e.target.value, "zipCode")} value={formik.values?.address?.zipCode || empData?.address?.zipCode || ""} name="zipCode" className="inputField" />
                                    </div>
                                </div>
                            </div>

                            <div className="employementDetails" ref={employmentRef}>
                                <div className="row d-flex justify-content-center my-3">
                                    <div className="titleText col-lg-12">
                                        Employment Details
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">WorkingTime Pattern</div>
                                        <select
                                            className={`selectInput ${formik.touched.workingTimePattern && formik.errors.workingTimePattern ? "error" : ""}`}
                                            name="workingTimePattern"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.workingTimePattern || empData?.workingTimePattern || ""} // Set initial value from empData if formik value is not set
                                        >
                                            <option value="">Select Work Time Pattern</option>
                                            {timePatterns.map((pattern) => (
                                                <option key={pattern._id} value={pattern._id}
                                                    selected={pattern._id === formik.values.workingTimePattern._id}
                                                >
                                                    {pattern.PatternName} ({pattern.StartingTime} - {pattern.FinishingTime})
                                                </option>
                                            ))}
                                        </select>

                                        {formik.touched.workingTimePattern && formik.errors.workingTimePattern ? (
                                            <div className="text-center text-danger">{formik.errors.workingTimePattern}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Company</div>
                                        <select
                                            className={`selectInput ${formik.touched.company && formik.errors.company ? "error" : ""}`}
                                            name="company"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.company || empData.company || ""} >
                                            <option>Select Company</option>
                                            {
                                                companies.map((company) => (
                                                    <option key={company._id} value={company._id}>{company.CompanyName}</option>
                                                ))
                                            }
                                        </select>
                                        {formik.touched.company && formik.errors.company ? (
                                            <div className="text-center text-danger">{formik.errors.company}</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center">
                                    <div className="col-lg-6 my-2">
                                        <div className="inputLabel">Date Of Joining</div>
                                        <input
                                            type="date"
                                            className={`inputField ${formik.touched.dateOfJoining && formik.errors.dateOfJoining ? "error" : ""}`}
                                            name="dateOfJoining"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.dateOfJoining}
                                        />
                                        {formik.touched.dateOfJoining && formik.errors.dateOfJoining ? (
                                            <div className="text-center text-danger">{formik.errors.dateOfJoining}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6 my-2">
                                        <div className="inputLabel">
                                            Annual Leave Year Start
                                        </div>
                                        <input type="date"
                                            className={`inputField`}
                                            name="annualLeaveYearStart"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.annualLeaveYearStart} />
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center">
                                    <div className="inputLabel col-lg-12 mt-4">
                                        Company Working Hours per Week
                                    </div>

                                    {/* Hours Input */}
                                    <div className="col-lg-6 my-2 position-relative">
                                        <input
                                            type="number"
                                            value={hour !== undefined ? hour : 0}
                                            className="inputField"
                                            readOnly
                                        />
                                        <div className="timeIndicator">Hours</div>
                                    </div>

                                    {/* Minutes Input */}
                                    <div className="col-lg-6 my-2 position-relative">
                                        <input
                                            type="number"
                                            value={min !== undefined ? min : 0}
                                            className="inputField"
                                            readOnly
                                        />
                                        <div className="timeIndicator">Mins</div>
                                    </div>

                                </div>

                                <div className="row d-flex justify-content-center my-3">
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Public Holidays by</div>
                                        <SelectPicker
                                            className="selectInput p-0"
                                            style={{ width: 300, border: "none", marginTop: "0px", position: "relative", zIndex: 0 }}
                                            size="lg"
                                            block
                                            appearance="subtle"
                                            name="publicHoliday"
                                            value={formik.values.publicHoliday}
                                            disabled={whoIs === "emp" ? true : false}
                                            // onChange={whoIs === "emp" ? null : formik.handleChange}
                                            onChange={whoIs === "emp" ? null : (e) => changeCountry(e, "publicHoliday")}
                                            data={countries?.map((item) => ({ label: item.name, value: item.name }))}
                                        />
                                        {formik.touched.publicHoliday && formik.errors.publicHoliday ? (
                                            <div className="text-center text-danger">{formik.errors.publicHoliday}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Monthly Permissions</div>
                                        <input type="number"
                                            min={0}
                                            max={10}
                                            value={formik.values.monthlyPermissions}
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            name="monthlyPermissions"
                                            className={`inputField ${formik.touched.monthlyPermissions && formik.errors.monthlyPermissions ? "error" : ""}`} />
                                        {formik.touched.monthlyPermissions && formik.errors.monthlyPermissions ? (
                                            <div className="text-center text-danger">{formik.errors.monthlyPermissions}</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center">
                                    {
                                        splitError &&
                                        <div className="text-center text-danger">{splitError}</div>
                                    }
                                    <div className="col-lg-6 my-2">
                                        <div className="inputLabel">
                                            Annual Leave Entitlement
                                        </div>
                                        <input type="number"
                                            value={formik.values.annualLeaveEntitlement}
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            name="annualLeaveEntitlement"
                                            className={`inputField ${formik.touched.annualLeaveEntitlement && formik.errors.annualLeaveEntitlement ? "error" : ""}`} />
                                        {formik.touched.annualLeaveEntitlement && formik.errors.annualLeaveEntitlement ? (
                                            <div className="text-center text-danger">{formik.errors.annualLeaveEntitlement}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6 my-2">
                                        <div className="inputLabel">
                                            Select Leave Types
                                        </div>
                                        <TagPicker data={leaveTypes} disabled={formik.values.annualLeaveEntitlement ? false : true}
                                            title={!formik.values.annualLeaveEntitlement && "Please Enter Annual Leave"}
                                            size="lg" readOnly={whoIs === "emp" ? true : false} onChange={whoIs === "emp" ? null : handleTagSelector}
                                            value={selectedLeaveTypes}
                                            className={formik.values.annualLeaveEntitlement ? "rsuite_selector" : "rsuite_selector_disabled"}
                                            style={{ width: 300, border: "none" }} />
                                    </div>
                                </div>
                                <div className="row d-flex justify-content-center">
                                    {
                                        selectedLeaveTypes?.map((leaveName, index) => {
                                            return <div key={index} className="col-lg-6 my-2">
                                                <div className="inputLabel">
                                                    Choose {leaveName} count
                                                </div>
                                                <input type="number"
                                                    // onChange={(e) => getValueforLeave(e)}
                                                    disabled={whoIs === "emp" ? true : false}
                                                    onChange={whoIs === "emp" ? null : (e) => getValueforLeave(e)}
                                                    name={leaveName}
                                                    className={`inputField`}
                                                    value={formik?.values?.typesOfLeaveCount[leaveName]}
                                                />

                                            </div>
                                        })
                                    }
                                </div>
                            </div>

                            <div className="jobDetails" ref={jobRef}>
                                <div className="row d-flex justify-content-center my-3">
                                    <div className="titleText col-lg-12">
                                        Job Details
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center my-3">
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Manager</div>
                                        <select name="managerId"
                                            className={`inputField ${formik.touched.managerId && formik.errors.managerId ? "error" : ""}`}
                                            value={formik.values.managerId || empData?.managerId || ""}
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                        >
                                            <option >Select Manager</option>
                                            {
                                                managers.map((manager) => (
                                                    <option key={manager._id} value={manager._id}>{manager.FirstName}</option>
                                                ))
                                            }
                                        </select>
                                        {formik.touched.managerId && formik.errors.managerId ? (
                                            <div className="text-center text-danger">{formik.errors.managerId}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Team Lead</div>
                                        <select
                                            name="teamLead"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            className={`selectInput ${formik.touched.teamLead && formik.errors.teamLead ? "error" : ""}`}
                                            value={formik.values.teamLead || empData?.teamLead || ""}
                                        >
                                            <option value="">Select Team Lead</option>
                                            {leads.map((lead) => (
                                                <option key={lead._id} value={lead._id}
                                                >
                                                    {lead.FirstName}
                                                </option>
                                            ))}
                                        </select>

                                        {formik.touched.teamLead && formik.errors.teamLead ? (
                                            <div className="text-center text-danger">{formik.errors.teamLead}</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center">
                                    <div className="col-lg-12 my-2">
                                        <div className="inputLabel">
                                            Description
                                        </div>
                                        <textarea
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            name="description"
                                            className={`inputField ${formik.touched.description && formik.errors.description ? "error" : ""}`}
                                            cols={50}
                                            rows={10}
                                            style={{ height: "100px" }}
                                            value={formik.values.description || empData.description || ""}
                                        />
                                        {formik.touched.description && formik.errors.description ? (
                                            <div className="text-center text-danger">{formik.errors.description}</div>
                                        ) : null}
                                    </div>

                                </div>
                            </div>

                            <div className="financialDetails" ref={financialRef}>
                                <div className="row d-flex justify-content-center my-3">
                                    <div className="titleText col-lg-12">
                                        Financial Details
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Basic Salary</div>
                                        <input type="number"
                                            className={`inputField ${formik.touched.basicSalary && formik.errors.basicSalary ? "error" : ""}`}
                                            name="basicSalary"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.basicSalary} />
                                        {formik.touched.basicSalary && formik.errors.basicSalary ? (
                                            <div className="text-center text-danger">{formik.errors.basicSalary}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Bank Name</div>
                                        <input type="text"
                                            className={`inputField ${formik.touched.bankName && formik.errors.bankName ? "error" : ""}`}
                                            name="bankName"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.bankName} />
                                        {formik.touched.bankName && formik.errors.bankName ? (
                                            <div className="text-center text-danger">{formik.errors.bankName}</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center">
                                    <div className="col-lg-12 my-2">
                                        <div className="inputLabel">
                                            Account No
                                        </div>
                                        <input type="number"
                                            className={`inputField ${formik.touched.accountNo && formik.errors.accountNo ? "error" : ""}`}
                                            name="accountNo"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.accountNo} />
                                        {formik.touched.accountNo && formik.errors.accountNo ? (
                                            <div className="text-center text-danger">{formik.errors.accountNo}</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center my-3">
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Account Holder Name</div>
                                        <input type="text"
                                            className={`inputField ${formik.touched.accountHolderName && formik.errors.accountHolderName ? "error" : ""}`}
                                            name="accountHolderName"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.accountHolderName} />
                                        {formik.touched.accountHolderName && formik.errors.accountHolderName ? (
                                            <div className="text-center text-danger">{formik.errors.accountHolderName}</div>
                                        ) : null}
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="inputLabel">Tax Deducation</div>
                                        <input type="number"
                                            className={`inputField ${formik.touched.taxDeduction && formik.errors.taxDeduction ? "error" : ""}`}
                                            name="taxDeduction"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.taxDeduction} />
                                        {formik.touched.taxDeduction && formik.errors.taxDeduction ? (
                                            <div className="text-center text-danger">{formik.errors.taxDeduction}</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="row d-flex justify-content-center">
                                    <div className="col-lg-12 my-2">
                                        <div className="inputLabel">
                                            IFSC Code
                                        </div>
                                        <input type="text"
                                            className={`inputField ${formik.touched.IFSCcode && formik.errors.IFSCcode ? "error" : ""}`}
                                            name="IFSCcode"
                                            disabled={whoIs === "emp" ? true : false}
                                            onChange={whoIs === "emp" ? null : formik.handleChange}
                                            value={formik.values.IFSCcode} />
                                        {formik.touched.IFSCcode && formik.errors.IFSCcode ? (
                                            <div className="text-center text-danger">{formik.errors.IFSCcode}</div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="btnBackground">
                        <div className="fixedPositionBtns">
                            <div className="w-50">
                                <button className="outline-btn mx-2" onClick={() => whoIs === "emp" ? navigate(`/${whoIs}`) : navigate(`/${whoIs}/employee`)}>
                                    Cancel
                                </button>
                            </div>
                            <div className="w-50">
                                <button type="submit"
                                    className="button"
                                    style={{ padding: "12px" }}
                                    onClick={navToError}
                                    disabled={splitError ? true : false}
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                </form> : null
    )
};

export default EditEmployeeform;

