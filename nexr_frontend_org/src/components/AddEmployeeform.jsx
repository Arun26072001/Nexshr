import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import "./leaveForm.css";
import { fetchPayslipInfo } from "./ReuseableAPI";
import { useNavigate } from "react-router-dom";
import { Form, SelectPicker, TagPicker } from "rsuite";
import Loading from "./Loader";
import { allCountries } from "./countryCode";

const AddEmployeeForm = ({ details, handleScroll, handlePersonal, handleFinancial, handleJob, handleContact, handleEmployment, timePatterns, personalRef, contactRef, employmentRef, jobRef, financialRef, payslipRef, countries, companies, departments, positions, roles, leads, managers }) => {
    const navigate = useNavigate()
    const [timeDifference, setTimeDifference] = useState(0);
    const [payslipFields, setPayslipFields] = useState([]);
    const token = localStorage.getItem("token");
    const url = process.env.REACT_APP_API_URL;
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stateData, setStateData] = useState([]);
    const [cityData, setCityData] = useState([]);
    const [selectedLeaveTypes, setSelectedLeavetypes] = useState([]);
    const [splitError, setSplitError] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [employeeObj, setEmployeeObj] = useState({
        FirstName: "",
        LastName: "",
        Email: "",
        Password: "",
        teamLead: "",
        managerId: "",
        countryCode: "",
        phone: "",
        company: "",
        dateOfBirth: "",
        gender: "",
        address: {
            city: "",
            state: "",
            country: "",
            zipCode: ""
        },
        position: "",
        department: "",
        role: "",
        description: "",
        dateOfJoining: "",
        employmentType: "",
        workingTimePattern: "",
        annualLeaveYearStart: "",
        companyWorkingHourPerWeek: "",
        publicHoliday: "",
        annualLeaveEntitlement: "",
        basicSalary: "",
        bankName: "",
        accountNo: "",
        accountHolderName: "",
        IFSCcode: "",
        taxDeduction: "",

    });

    useEffect(() => {
        const additionalFields = payslipFields.reduce((acc, field) => {
            acc[field.fieldName] = ""; // Set default value as an empty string
            return acc;
        }, {});

        setEmployeeObj((prev) => ({
            ...prev,
            ...additionalFields,
        }));
    }, [payslipFields]);

    const empFormValidation = Yup.object().shape({
        FirstName: Yup.string().required('First Name is required'),
        LastName: Yup.string().required('Last Name is required'),
        Email: Yup.string().email('Invalid email format').required('Email is required'),
        Password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
        company: Yup.string().notOneOf(["Select Company"]).required("company is required"),
        teamLead: Yup.string().required("teamLead is required"), // assuming it's an ObjectId or string
        managerId: Yup.string().required("manager is required"),
        countryCode: Yup.string().required("manager is required"),
        phone: Yup.string().min(10, "Phone number must be 10 degits").max(10, "Phone number must be 10 degits").required("Phone is Required"), // can add phone validation if needed
        dateOfBirth: Yup.string().required("Date of Birth is required"),
        gender: Yup.string().oneOf(['male', 'female'], 'invalid gender').required('Gender is required'),
        address: Yup.object().shape({
            city: Yup.string().optional(),
            state: Yup.string().optional(),
            country: Yup.string().optional(),
            zipCode: Yup.string().optional(),
        }).optional(),
        position: Yup.string().required("Position is Required"),
        department: Yup.string().required("Department is Required"),
        role: Yup.string().required("Role is required"),
        description: Yup.string().min(10, "mininum 10 characters must be in description").required("Description is required"),
        dateOfJoining: Yup.string().required("Joining date is Required"),
        employmentType: Yup.string().oneOf(['full-time', 'part-time', 'contract'], 'Invalid employment type').required("Employment type is Required"),
        workingTimePattern: Yup.string().notOneOf(["Select Work Time Pattern"]).required("Time pattern is Required"),
        annualLeaveYearStart: Yup.date().optional().nullable(),
        publicHoliday: Yup.string().required("public holiday field is required"),
        annualLeaveEntitlement: Yup.number().required("leave Entitlemenet is Required"),
        basicSalary: Yup.string().min(4, "invalid Salary").max(10).required("Salary is required"),
        bankName: Yup.string().min(2, "invalid Bank name").max(200).required("Bank name is required"),
        accountNo: Yup.string().min(10, "Account No digits must be between 10 to 14").max(14, "Account No digits must be between 10 to 14").required("Account No is required"),
        accountHolderName: Yup.string().min(2, "invalid Holder Name").max(50).required("Holder name is Required"),
        IFSCcode: Yup.string().min(11, "IFSC code must be 11 characters").max(11, "IFSC code must be 11 characters").required("IFSC code is required"),
        taxDeduction: Yup.string().min(2, "invalid value").required("Tax deduction is required"),

    });

    const formik = useFormik({
        initialValues: employeeObj,
        validationSchema: empFormValidation,
        onSubmit: async (values, { resetForm }) => {
            try {
                const res = await axios.post(`${url}/api/employee`, values, {
                    headers: {
                        authorization: token || ""
                    }
                })
                toast.success(res.data.message);
                resetForm();

            } catch (err) {
                console.log(err);
                if (err.response && err.response.data && err.response.data.error) {
                    toast.error(err.response.data.error)
                } else {
                    console.log("error occured!");
                }
            }
        }
    })

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
    console.log(formik.values);
    console.log(formik.errors);

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
                    console.log((((hoursDiff * 60) + minutesDiff) / 60) * selectedPattern.WeeklyDays);
                }
            }
        };

        calculateTimeDifference();
    }, [formik.values.workingTimePattern]);

    useEffect(() => {
        async function getPayslipInfo() {
            try {
                const payslipInfo = await fetchPayslipInfo();
                if (payslipInfo && payslipInfo?.payslipFields) {
                    const fields = payslipInfo.payslipFields;

                    fields.forEach((field) => {
                        // Update employee object for each field
                        setEmployeeObj((preEmpdata) => ({
                            ...preEmpdata,
                            [field.fieldName]: ""
                        }));
                    });

                    // Set the payslip fields
                    setPayslipFields(fields);
                } else {
                    // If no fields found, set an empty array
                    setPayslipFields([]);
                }
            } catch (err) {
                console.log(err.message);
            }
        }

        getPayslipInfo();
    }, []);

    const hourAndMin = timeDifference.toString().split(".");
    const [hour, min] = hourAndMin;

    async function changeImg(event) {
        const files = event.target.files;
        if (files.length > 0) {
            const file = files[0];

            const formData = new FormData();
            formData.append('profile', file);

            try {
                const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                const filename = response.data.file.filename;
                formik.setFieldValue("profile", filename)

            } catch (error) {
                console.error("Error uploading file:", error.response.data.message);
            }
        }
    }

    function handleTagSelector(value) {
        setSelectedLeavetypes(value);
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
        const gettingLeaveTypes = async () => {
            try {
                const leaveTypes = await axios.get(`${url}/api/leave-type`, {
                    headers: {
                        Authorization: `${token}` || ""
                    }
                });
                setLeaveTypes(leaveTypes.data.map((leave) => ({ label: leave.LeaveName, value: leave.LeaveName })));
            } catch (error) {
                toast.error(error.response.data.error)
            }
        }

        setIsLoading(true);
        gettingLeaveTypes();
        setIsLoading(false);
    }, []);

    async function onChangeAddress(e) {
        const { name, value } = e.target;
        // Update the field dynamically in formik
        formik.setFieldValue(`address.${name}`, value);
        try {
            if (name === "country") {
                const { data } = await axios.get(`${url}/api/country/${value}`, {
                    headers: { Authorization: token || "" }
                });

                setStateData(data.states || []);
            } else if (name === "state") {
                const { data } = await axios.get(`${url}/api/state/${value}`, {
                    headers: { Authorization: token || "" }
                });
                setCityData(data.cities || []);
            }
        } catch (err) {
            console.error(err);
            toast.error(`Error fetching ${name === "country" ? "states" : "cities"}`);
        }
    }

    function changeCountry(value, name) {
        setSelectedCountry(value);
        const countryFullData = allCountries.find((country) => Object.values(country).includes(value))
        formik.setFieldValue(name, `${countryFullData.code}`)
    }

    return (
        isLoading ? <Loading /> :
            <form onSubmit={formik.handleSubmit}>
                <div className="empForm">
                    <div className="catogaries-container">
                        <div className="catogaries">
                            <div className={`catogary ${details === "personal" ? "view" : ""}`} onClick={() => handleScroll("personal")}>Personal Details</div>
                            <div className={`catogary ${details === "contact" ? "view" : ""}`} onClick={() => handleScroll("contact")}>Contact Details</div>
                            <div className={`catogary ${details === "employment" ? "view" : ""}`} onClick={() => handleScroll("employment")}>Employment Details</div>
                            <div className={`catogary ${details === "job" ? "view" : ""}`} onClick={() => handleScroll("job")}>Job Details</div>
                            <div className={`catogary ${details === "financial" ? "view" : ""}`} onClick={() => handleScroll("financial")}>Financial Details</div>
                            <div className={`catogary ${details === "payslip" ? "view" : ""}`} onClick={() => handleScroll("payslip")}>Payslip Details</div>
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
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                    {formik.touched.gender && formik.errors.gender ? (
                                        <div className="text-center text-danger">{formik.errors.gender}</div>
                                    ) : null}
                                </div>
                                <div className="col-lg-6">
                                    <div className="inputLabel">Department</div>
                                    <select name="department" className={`selectInput ${formik.touched.department && formik.errors.department ? "error" : ""}`}
                                        onChange={formik.handleChange}
                                        value={formik.values.department}>
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
                                <div className="col-lg-6">
                                    <div className="inputLabel">Position</div>
                                    <select name="position" className={`selectInput ${formik.touched.position && formik.errors.position ? "error" : ""}`}
                                        onChange={formik.handleChange}
                                        value={formik.values.position}>
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

                                <div className="col-lg-6">
                                    <div className="inputLabel">Date Of Birth</div>
                                    <input
                                        type="date"
                                        className={`inputField ${formik.touched.dateOfBirth && formik.errors.dateOfBirth ? "error" : ""}`}
                                        name="dateOfBirth"
                                        onChange={formik.handleChange}
                                        value={formik.values.dateOfBirth}
                                    />
                                    {formik.touched.dateOfBirth && formik.errors.dateOfBirth ? (
                                        <div className="text-center text-danger">{formik.errors.dateOfBirth}</div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="row my-3 d-flex align-items-center justify-content-center">
                                <div className="col-lg-6">
                                    <div className="inputLabel">Role</div>
                                    <select name="role" className={`selectInput ${formik.touched.role && formik.errors.role ? "error" : ""}`}
                                        onChange={formik.handleChange}
                                        value={formik.values.role}>
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
                                        onChange={formik.handleChange}
                                        value={formik.values.employmentType}>
                                        <option >Employment Type</option>
                                        <option value="full-time">Full Time</option>
                                        <option value="part-time">Part Time</option>
                                        <option value="intern">Contract</option>
                                    </select>
                                    {formik.touched.employmentType && formik.errors.employmentType ? (
                                        <div className="text-center text-danger">{formik.errors.employmentType}</div>
                                    ) : null}
                                </div>

                                <div className="my-3">
                                    <span className="inputLabel">
                                        Attach Employee profile (recommended for JPG)
                                    </span>
                                    <input type="file" name="profile" className="fileInput"
                                        onChange={(e) => changeImg(e)}
                                    />

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
                                        onChange={formik.handleChange}
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
                                        onChange={formik.handleChange}
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
                                        className={`selectInput ${formik.touched.countryCode && formik.errors.countryCode ? "error" : ""}`}
                                        style={{ background: "none", border: "none" }}
                                        size="lg"
                                        data={allCountries}
                                        appearance="subtle"
                                        labelKey="name"
                                        valueKey="abbr"
                                        value={selectedCountry}
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
                                <div className="col-lg-6 col-md-6 col-6 my-2">
                                    <div className="inputLabel">
                                        Phone
                                    </div>
                                    <input type="number"
                                        className={`inputField ${formik.touched.phone && formik.errors.phone ? "error" : ""}`}
                                        name="phone"
                                        onChange={formik.handleChange}
                                        value={formik.values.phone} />
                                    {formik.touched.phone && formik.errors.phone ? (
                                        <div className="text-center text-danger">{formik.errors.phone}</div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="row d-flex justify-content-center my-3">
                                <div className="col-lg-6">
                                    <div className="inputLabel">Country</div>
                                    <select
                                        className={`selectInput ${formik.touched.country && formik.errors.country ? "error" : ""}`}
                                        name="country"
                                        onChange={(e) => onChangeAddress(e)}
                                        value={formik.values.country} >
                                        <option>Select the Country</option>
                                        {
                                            countries.map((country) => (
                                                <option key={country._id} value={country.CountryName}>{country.CountryName}</option>
                                            ))
                                        }
                                    </select>
                                    {formik.touched.country && formik.errors.country ? (
                                        <div className="text-center text-danger">{formik.errors.country}</div>
                                    ) : null}
                                </div>
                                <div className="col-lg-6">
                                    <div className="inputLabel">State</div>
                                    <select
                                        disabled={!stateData.length > 0}
                                        className={`selectInput ${formik.touched.state && formik.errors.state ? "error" : ""}`}
                                        name="state"
                                        onChange={(e) => onChangeAddress(e)}
                                        value={formik.values.state} >
                                        <option>Select the State</option>
                                        {
                                            stateData?.map((state) => (
                                                <option key={state._id} value={state.StateName}>{state.StateName}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="row d-flex justify-content-center my-3">
                                <div className="col-lg-6">
                                    <div className="inputLabel">City</div>
                                    {/* <input type="text" onChange={formik.handleChange} name="city" className="inputField" /> */}
                                    <select
                                        disabled={!cityData.length > 0}
                                        className={`selectInput ${formik.touched.city && formik.errors.city ? "error" : ""}`}
                                        name="city"
                                        onChange={(e) => onChangeAddress(e)}
                                        value={formik.values.city} >
                                        <option>Select the City</option>
                                        {
                                            cityData?.map((city) => (
                                                <option key={city._id} value={city.StateName}>{city.CityName}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="col-lg-6">
                                    <div className="inputLabel">Zip Code</div>
                                    <input type="number" onChange={formik.handleChange} name="zipCode" className="inputField" />
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
                                        onChange={formik.handleChange}
                                        value={formik.values.workingTimePattern} >
                                        <option>Select Work Time Pattern</option>
                                        {
                                            timePatterns.map((pattern) => (
                                                <option key={pattern._id} value={pattern._id}>{pattern.PatternName}</option>
                                            ))
                                        }
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
                                        onChange={formik.handleChange}
                                        value={formik.values.company} >
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
                                        onChange={formik.handleChange}
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
                                        onChange={formik.handleChange}
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
                                <div className="col-lg-12">
                                    <div className="inputLabel">Public Holidays by</div>
                                    <select
                                        className={`selectInput ${formik.touched.publicHoliday && formik.errors.publicHoliday ? "error" : ""}`}
                                        name="publicHoliday"
                                        onChange={formik.handleChange}
                                        value={formik.values.publicHoliday} >
                                        <option>Select Public holiday</option>
                                        {
                                            countries.map((country) => (
                                                <option key={country._id} value={country.CountryName}>{country.CountryName}</option>
                                            ))
                                        }
                                    </select>
                                    {formik.touched.publicHoliday && formik.errors.publicHoliday ? (
                                        <div className="text-center text-danger">{formik.errors.publicHoliday}</div>
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
                                        onChange={formik.handleChange}
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
                                    <TagPicker data={leaveTypes} disabled={formik.values.annualLeaveEntitlement ? false : true} title={!formik.values.annualLeaveEntitlement && "Please Enter Annual Leave"} size="lg" onChange={handleTagSelector} value={selectedLeaveTypes} className={formik.values.annualLeaveEntitlement ? "rsuite_selector" : "rsuite_selector_disabled"} style={{ width: 300, marginTop: "5px", border: "none" }} />
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
                                                onChange={(e) => getValueforLeave(e)}
                                                name={leaveName}
                                                className={`inputField`} />
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
                                    <select name="managerId" onChange={formik.handleChange} className={`inputField ${formik.touched.managerId && formik.errors.managerId ? "error" : ""}`}
                                        value={formik.values.managerId || ""}
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
                                    <select name="teamLead" onChange={formik.handleChange} className={`selectInput ${formik.touched.teamLead && formik.errors.teamLead ? "error" : ""}`}
                                        value={formik.values.teamLead || ""}
                                    >
                                        <option >Select TeamLead</option>
                                        {leads.map((lead) => (
                                            <option key={lead._id} value={lead._id}>{lead.FirstName}</option>
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
                                        onChange={formik.handleChange}
                                        name="description"
                                        className={`inputField ${formik.touched.description && formik.errors.description ? "error" : ""}`}
                                        cols={50}
                                        rows={10}
                                        style={{ height: "100px" }}
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
                                        onChange={formik.handleChange}
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
                                        onChange={formik.handleChange}
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
                                        onChange={formik.handleChange}
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
                                        onChange={formik.handleChange}
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
                                        onChange={formik.handleChange}
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
                                        onChange={formik.handleChange}
                                        value={formik.values.IFSCcode} />
                                    {formik.touched.IFSCcode && formik.errors.IFSCcode ? (
                                        <div className="text-center text-danger">{formik.errors.IFSCcode}</div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="payslipDetails" ref={payslipRef}>
                            <div className="row d-flex justify-content-center my-3">
                                <div className="titleText col-lg-12">
                                    Payslip Details
                                </div>

                                {
                                    payslipFields.length > 0 &&
                                    payslipFields.map((data, index) => {
                                        // let calculatedValue = "";
                                        // if (data.fieldName === "basicSalary") {
                                        //     return null;
                                        // }
                                        // if (data.fieldName === "incomeTax") {
                                        //     const salary = Number(formik.values.basicSalary);

                                        //     if (salary >= 84000) {
                                        //         calculatedValue = (30 / 100) * salary; // 30% tax for <= 25,000
                                        //     } else if (salary > 42000) {
                                        //         calculatedValue = (20 / 100) * salary; // 20% tax for > 42,000
                                        //     } else if (salary >= 25000) {
                                        //         calculatedValue = (5 / 100) * salary;  // 5% tax for between 25,001 and 42,000
                                        //     } else {
                                        //         calculatedValue = 0;
                                        //     }
                                        // } else if (
                                        //     data.fieldName === "houseRentAllowance" ||
                                        //     data.fieldName === "conveyanceAllowance" ||
                                        //     data.fieldName === "othersAllowance" ||
                                        //     data.fieldName === "bonusAllowance"
                                        // ) {
                                        //     calculatedValue = (data.value / 100) * Number(formik.values.basicSalary);
                                        // } else if (data.fieldName === "ProvidentFund" && Number(formik.values.basicSalary) > 15000) {
                                        //     calculatedValue = (12 / 100) * Number(formik.values.basicSalary);
                                        // } else if (data.fieldName === "ProfessionalTax" && Number(formik.values.basicSalary) > 21000) {
                                        //     calculatedValue = 130;
                                        // } else if (data.fieldName === "ESI" && Number(formik.values.basicSalary) > 21000) {
                                        //     calculatedValue = Number(formik.values.basicSalary) * .75 / 100;
                                        // } else {
                                        //     calculatedValue = 0;
                                        // }

                                        return (
                                            <div className="col-lg-6" key={index}>
                                                <div className="inputLabel">
                                                    {data.fieldName[0].toUpperCase() + data.fieldName.slice(1)}
                                                </div>
                                                <input
                                                    type={data.type}
                                                    className={`inputField`}
                                                    name={data.fieldName}
                                                    onChange={formik.handleChange}
                                                    value={formik.values?.[data.fieldName]}
                                                />
                                            </div>
                                        )
                                    })

                                }

                            </div>
                        </div>

                    </div>
                </div>
                <div className="btnBackground">
                    <div className="fixedPositionBtns">
                        <div className="w-50">
                            <button type="button" className="outline-btn mx-2" onClick={() => navigate(-1)} >
                                Cancel
                            </button>
                        </div>
                        <div className="w-50">
                            <button type="submit" className="button" style={{ padding: "12px" }} onClick={navToError}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </form>
    )
};

export default AddEmployeeForm;
