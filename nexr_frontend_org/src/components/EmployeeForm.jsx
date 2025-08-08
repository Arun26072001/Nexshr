import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Input, SelectPicker, TagPicker, Toggle } from "rsuite";
import Loading from "./Loader";
import NoDataFound from "./payslip/NoDataFound";
import { EssentialValues } from "../App";
import "./leaveForm.css";
import { fetchPayslipInfo } from "./ReuseableAPI";

const EmployeeForm = ({
    details, handleScroll, timePatterns, personalRef, stateData, employeeObj, handleTagSelector,
    contactRef, employmentRef, jobRef, financialRef, payslipRef, setEmployeeObj, selectedLeaveTypes,
    countries, companies, departments, positions, roles, fillEmpObj, preview, changeImg, changeLeaveTypeManual
}) => {
    const isView = window.location.pathname.includes("view");

    const navigate = useNavigate();
    const { whoIs, data, handleEditEmp } = useContext(EssentialValues);
    const [timeDifference, setTimeDifference] = useState(0);
    const [payslipFields, setPayslipFields] = useState([]);
    const url = process.env.REACT_APP_API_URL;
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isWorkingApi, setIsWorkingApi] = useState(false);
    const requiredFields = [
        "FirstName",
        "LastName",
        "Email",
        "Password",
        "company",
        "position",
        "department",
        "role",
        "employmentType",
        "dateOfJoining",
        "workingTimePattern",
        "annualLeaveYearStart",
        "annualLeaveEntitlement",
        // ""
    ];
    const [errors, setErrors] = useState({});

    // Fetch payslip info on component mount
    useEffect(() => {
        const getPayslipInfo = async () => {
            try {
                const payslipInfo = await fetchPayslipInfo();
                if (payslipInfo?.payslipFields) {
                    const fields = payslipInfo.payslipFields.filter((field) => !["basicsalary", "lossofpay"].includes(field.fieldName.toLowerCase()));
                    const additionalFields = fields.reduce((acc, field) => {
                        acc[field.fieldName] = employeeObj?.payslipFields?.[field.fieldName] || "";
                        return acc;
                    }, {});

                    setEmployeeObj(prev => ({
                        ...prev,
                        ...additionalFields
                    }));
                    setPayslipFields(fields);
                } else {
                    setPayslipFields([]);
                }
            } catch (err) {
                console.error("Error fetching payslip info:", err.message);
            }
        };

        getPayslipInfo();
    }, []);

    // Calculate working hours difference when time pattern changes
    useEffect(() => {
        const calculateTimeDifference = () => {
            if (!timePatterns.length || !employeeObj?.workingTimePattern) return;

            const selectedPattern = timePatterns.find(
                pattern => pattern._id === employeeObj?.workingTimePattern
            );

            if (selectedPattern?.StartingTime && selectedPattern?.FinishingTime) {
                const startDate = new Date(selectedPattern?.StartingTime);
                const endDate = new Date(selectedPattern?.FinishingTime);

                const timeDiff = endDate.getTime() - startDate.getTime();
                const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

                setTimeDifference(
                    ((hoursDiff * 60 + minutesDiff) / 60) * (selectedPattern.WeeklyDays?.length || 0)
                );
            }
        };

        calculateTimeDifference();
    }, [employeeObj?.workingTimePattern, timePatterns]);

    // Fetch leave types on component mount
    useEffect(() => {
        const gettingLeaveTypes = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`${url}/api/leave-type`, {
                    headers: {
                        Authorization: data.token || ""
                    }
                });
                setLeaveTypes(
                    response.data.map(leave => ({
                        label: `${leave.LeaveName}`,
                        value: `${leave.LeaveName}`
                    }))
                );
            } catch (error) {
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
                console.error("Error fetching leave types:", error);
                toast.error(error.response?.data?.error || "Failed to fetch leave types");
            } finally {
                setIsLoading(false);
            }
        };

        gettingLeaveTypes();
    }, [url, data.token]);

    const hourAndMin = timeDifference.toString().split(/[:.]+/);
    const [hour = 0, min = 0] = hourAndMin;

    const updateEmployee = async (employeeObj) => {
        try {
            // setIsWorkingApi(true);
            const res = await axios.put(
                `${url}/api/employee/${employeeObj?._id}`,
                employeeObj,
                {
                    headers: {
                        Authorization: data.token || ""
                    }
                }
            );
            if (["emp", "sys-admin"].includes(whoIs)) {
                navigate(`/${whoIs}`)
            } else {
                navigate(`/${whoIs}/employee`);
            }
            setEmployeeObj({});
            toast.success(res.data.message);
            handleEditEmp();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            const errorMsg = error?.response?.data?.error;
            requiredFields.forEach((field) => {
                if (errorMsg.includes(field)) {
                    setErrors((pre) => ({
                        ...pre,
                        [field]: errorMsg
                    }))
                }
            })
            console.error("Error updating employee:", error);
            toast.error(errorMsg || "Failed to update employee");
        }
    };

    const addEmployee = async (employeeObj) => {
        try {
            // setIsWorkingApi(true);
            const res = await axios.post(
                `${url}/api/employee/${data._id}`,
                employeeObj,
                {
                    headers: {
                        Authorization: data.token || ""
                    }
                }
            );
            if (whoIs !== "emp") {
                navigate(`/${whoIs}/employee`);
            } else {
                navigate(`/${whoIs}`)
            }
            setEmployeeObj({});
            handleEditEmp();
            toast.success(res.data.message);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            const errorMsg = error?.response?.data?.error;
            requiredFields.forEach((field) => {
                if (errorMsg.includes(field)) {
                    setErrors((pre) => ({
                        ...pre,
                        [field]: errorMsg
                    }))
                }
            })
            navToError();
            console.error("Error adding employee:", error);
            toast.error(errorMsg || "Failed to add employee");
        }
    };


    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            navToError();
        }
    }, [errors]);

    const validationForm = () => {
        const newError = {};

        // Required field validations
        requiredFields.forEach((field) => {
            if (!employeeObj?.[field]) {
                newError[field] = `${field} is required`;
            }
        })
        // if (!employeeObj?.LastName) newError.LastName = "Last name is required";
        // if (!employeeObj?.Email) newError.Email = "Email is required";
        // if (!employeeObj?.Password) newError.Password = "Password is required";
        // if (!employeeObj?.company) newError.company = "Company is required";
        // if (!employeeObj?.position) newError.position = "Position is required";
        // if (!employeeObj?.department) newError.department = "Department is required";
        // if (!employeeObj?.role) newError.role = "Role is required";
        // if (!employeeObj?.employmentType) newError.employmentType = "Employment type is required";
        // if (!employeeObj?.workingTimePattern) newError.workingTimePattern = "Working time pattern is required";
        // if (!employeeObj?.annualLeaveYearStart) newError.annualLeaveYearStart = "AnnualLeaveYearStart date is required";
        // if (!employeeObj?.annualLeaveEntitlement) newError.annualLeaveEntitlement = "Annual leave entitlement is required";
        // if (!employeeObj?.basicSalary) newError.basicSalary = "Basic salary is required";
        // if (!employeeObj?.bankName) newError.bankName = "Bank name is required";
        // if (!employeeObj?.accountNo) newError.accountNo = "Account number is required";
        // if (!employeeObj?.accountHolderName) newError.accountHolderName = "Account holder name is required";
        // if (!employeeObj?.IFSCcode) newError.IFSCcode = "IFSC code is required";

        // Email validation
        if (employeeObj?.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeObj?.Email)) {
            newError.Email = "Please enter a valid email address";
        }

        // Password strength validation
        if (employeeObj?.Password && employeeObj?.Password.length < 8) {
            newError.Password = "Password must be at least 8 characters";
        }

        setErrors(newError);
        return Object.keys(newError).length === 0;
    };

    const navToError = () => {
        const errorFields = Object.keys(errors);
        if (!errorFields.length) return;

        const fieldSections = {
            personal: ["FirstName", "LastName", "gender", "role"],
            contact: ["Email", "Password", "phone"],
            employment: ["workingTimePattern", "company", "dateOfJoining", "employmentType", "Annual Leave Year Start", "code"],
            job: ["department", "position"],
            // financial: ["basicSalary", "bankName", "accountNo", "accountHolderName", "IFSCcode"]
        };

        for (const [section, fields] of Object.entries(fieldSections)) {
            if (fields.some(field => errorFields.includes(field))) {
                handleScroll(section);
                return;
            }
        }

        // Check payslip fields if no other errors found
        if (payslipFields.some(field => errorFields.includes(field.fieldName))) {
            handleScroll("payslip");
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!["emp", "sys-admin"].includes(whoIs)) {
            if (!validationForm()) {
                navToError();
                toast.error("Please fill the required fields in the form.");
                return;
            }
        }

        try {
            setIsWorkingApi(true)
            let updatedEmp = {
                ...employeeObj
            }
            // Check if profile is a File (new upload), and has image type
            if (employeeObj?.profile instanceof File && employeeObj?.profile.type?.includes("image")) {
                const formData = new FormData();
                formData.append("documents", employeeObj?.profile);

                const uploadRes = await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/upload`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                const uploadedFile = uploadRes?.data?.files?.[0]?.originalFile;
                updatedEmp = {
                    ...updatedEmp,
                    "profile": uploadedFile
                }
            }
            if (employeeObj?._id) {
                await updateEmployee(updatedEmp);
            } else {
                await addEmployee(updatedEmp);
            }
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error("Form submission error:", error);
        } finally {
            setIsWorkingApi(false);
        }
    };

    if (isLoading) return <Loading height="80vh" />;
    return (
        <form onSubmit={handleSubmit}>
            <div className="empForm">
                <div className="catogaries-container">
                    <div className="catogaries">
                        {["personal", "contact", "employment", "job", "financial", "payslip"].map(section => {
                            // console.log(details === section, details, section)
                            return <div
                                key={section}
                                className={`catogary ${details === section ? "view" : ""}`}
                                onClick={() => handleScroll(section)}
                            >
                                {section.charAt(0).toUpperCase() + section.slice(1)} Details
                            </div>
                        })}
                    </div>
                </div>

                <div className="detailsParent">
                    {/* Personal Details Section */}
                    <div className="personalDetails" ref={personalRef}>
                        <div className="row my-3 d-flex justify-content-center">
                            <div className="titleText col-lg-12">Personal Details</div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">First Name</div>
                                <input
                                    readOnly={isView}
                                    type="text"
                                    name="FirstName"
                                    className={`inputField ${errors?.FirstName ? "error" : ""}`}
                                    onChange={e => fillEmpObj(e.target.value, "FirstName")}
                                    value={employeeObj?.FirstName || ""}
                                />
                                {errors?.FirstName && <div className="text-center text-danger">{errors?.FirstName}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Last Name</div>
                                <input
                                    type="text"
                                    readOnly={isView}
                                    className={`inputField ${errors?.LastName ? "error" : ""}`}
                                    name="LastName"
                                    onChange={e => fillEmpObj(e.target.value, "LastName")}
                                    value={employeeObj?.LastName || ""}
                                />
                                {errors?.LastName && <div className="text-center text-danger">{errors?.LastName}</div>}
                            </div>
                        </div>

                        <div className="row my-3 d-flex align-items-center justify-content-center">
                            <div className="col-lg-6">
                                <div className="inputLabel">Gender</div>
                                <select
                                    name="gender"
                                    disabled={isView}
                                    className={`selectInput ${errors?.gender ? "error" : ""}`}
                                    onChange={e => fillEmpObj(e.target.value, "gender")}
                                    value={employeeObj?.gender || ""}
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                {errors?.gender && <div className="text-center text-danger">{errors?.gender}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel">Date Of Birth</div>
                                <input
                                    type="date"
                                    readOnly={isView}
                                    className="inputField"
                                    name="dateOfBirth"
                                    onChange={e => fillEmpObj(e.target.value, "dateOfBirth")}
                                    value={employeeObj?.dateOfBirth || ""}
                                />
                            </div>
                        </div>

                        <div className="row my-3 d-flex align-items-center justify-content-center">
                            <div className="col-lg-6">
                                <div className="inputLabel important">Role</div>
                                <select
                                    name="role"
                                    disabled={isView ? true : (["admin", "hr"].includes(whoIs) ? false : true)}
                                    className={`selectInput ${errors?.role ? "error" : ""}`}
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "role") : () => { }}
                                    value={employeeObj?.role || ""}
                                >
                                    <option value="">Select Role</option>
                                    {roles.map(role => (
                                        <option key={role._id} value={role._id}>
                                            {role.RoleName}
                                        </option>
                                    ))}
                                </select>
                                {errors?.role && <div className="text-center text-danger">{errors?.role}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Employment Type</div>
                                <select
                                    name="employmentType"
                                    disabled={isView ? true : (["admin", "hr"].includes(whoIs) ? false : true)}
                                    className={`selectInput ${errors?.employmentType ? "error" : ""}`}
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "employmentType") : () => { }}
                                    value={employeeObj?.employmentType || ""}
                                >
                                    <option value="">Employment Type</option>
                                    <option value="full-time">Full Time</option>
                                    <option value="part-time">Part Time</option>
                                    <option value="intern">Contract</option>
                                </select>
                                {errors?.employmentType && (
                                    <div className="text-center text-danger">{errors?.employmentType}</div>
                                )}
                            </div>
                        </div>

                        <div className="my-3">
                            <span className="inputLabel">
                                Attach Employee profile (recommended for JPG)
                            </span>
                            <input type="file" name="profile" className="fileInput"
                                accept=".jpeg,.png,.jpg,.webp"
                                readOnly={isView}
                                onChange={(e) => changeImg(e)}
                            />
                        </div>
                        {preview && (
                            <div className="position-relative">
                                <img
                                    src={preview}
                                    alt="uploaded file preview"
                                    style={{ borderRadius: "4px", width: "100px", height: "auto" }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Contact Details Section */}
                    <div className="contactDetails" ref={contactRef}>
                        <div className="row d-flex justify-content-center my-3">
                            <div className="titleText col-lg-12">Contact Details</div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Email</div>
                                <input
                                    readOnly={isView}
                                    type="email"
                                    className={`inputField ${errors?.Email ? "error" : ""}`}
                                    name="Email"
                                    onChange={e => fillEmpObj(e.target.value, "Email")}
                                    value={employeeObj?.Email || ""}
                                />
                                {errors?.Email && <div className="text-center text-danger">{errors?.Email}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Password</div>
                                <input
                                    readOnly={isView}
                                    type="text"
                                    className={`inputField ${errors?.Password ? "error" : ""}`}
                                    name="Password"
                                    onChange={e => fillEmpObj(e.target.value, "Password")}
                                    value={employeeObj?.Password || ""}
                                />
                                {errors?.Password && <div className="text-center text-danger">{errors?.Password}</div>}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-6 col-md-6 col-6">
                                <div className="inputLabel">Country Code</div>
                                <SelectPicker
                                    readOnly={isView}
                                    className="p-0 mt-1 selectInput"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        marginTop: "0px",
                                        position: "relative",
                                        zIndex: 0
                                    }}
                                    size="lg"
                                    data={countries}
                                    appearance="subtle"
                                    labelKey="code"
                                    valueKey="code"
                                    value={employeeObj?.countryCode}
                                    onChange={value => fillEmpObj(value, "countryCode")}
                                    placeholder="Select Country Code"
                                    renderMenuItem={(label, item) => (
                                        <div>
                                            {item.icon} {label} ({item.abbr}) +{item.code}
                                        </div>
                                    )}
                                    renderValue={(value, item) =>
                                        item ? (
                                            <div>
                                                {item.icon} {item.name} ({item.abbr})
                                            </div>
                                        ) : () => { }
                                    }
                                />
                            </div>
                            <div className="col-lg-6 col-md-6 col-6 my-2">
                                <div className="inputLabel">Phone</div>
                                <input
                                    readOnly={isView}
                                    type="tel"
                                    className={`inputField ${errors?.phone ? "error" : ""}`}
                                    name="phone"
                                    onChange={e => fillEmpObj(e.target.value, "phone")}
                                    value={employeeObj?.phone || ""}
                                />
                                {errors?.phone && <div className="text-center text-danger">{errors?.phone}</div>}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center my-3">
                            <div className="col-lg-6">
                                <div className="inputLabel">Country</div>
                                <SelectPicker
                                    readOnly={isView}
                                    className="selectInput p-0"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        position: "relative",
                                        zIndex: 0
                                    }}
                                    size="lg"
                                    appearance="subtle"
                                    data={countries}
                                    labelKey="name"
                                    valueKey="name"
                                    value={employeeObj?.address?.country}
                                    onChange={value => fillEmpObj(value, "country")}
                                    placeholder="Choose a Country"
                                    renderMenuItem={label => <div>{label}</div>}
                                    renderValue={(value, item) => (item ? <div>{item.name}</div> : () => { })}
                                />
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel">State</div>
                                <SelectPicker
                                    readOnly={isView}
                                    className="selectInput p-0"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        position: "relative",
                                        zIndex: 0
                                    }}
                                    size="lg"
                                    appearance="subtle"
                                    value={employeeObj?.address?.state}
                                    onChange={e => fillEmpObj(e, "state")}
                                    data={stateData?.map(item => ({ label: item, value: item }))}
                                />
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center my-3">
                            <div className="col-lg-6">
                                <div className="inputLabel">City</div>
                                <input
                                    readOnly={isView}
                                    type="text"
                                    value={employeeObj?.address?.city || ""}
                                    onChange={e => fillEmpObj(e.target.value, "city")}
                                    name="city"
                                    className="inputField"
                                />
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel">Zip Code</div>
                                <input
                                    readOnly={isView}
                                    type="number"
                                    value={employeeObj?.address?.zipCode || ""}
                                    onChange={e => fillEmpObj(e.target.value, "zipCode")}
                                    name="zipCode"
                                    className="inputField"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Employment Details Section */}
                    <div className="employementDetails" ref={employmentRef}>
                        <div className="row d-flex justify-content-center my-3">
                            <div className="titleText col-lg-12">Employment Details</div>
                            <div className="col-lg-12">
                                <div className="inputLabel important">WorkingTime Pattern</div>
                                <select
                                    className={`selectInput ${errors?.workingTimePattern ? "error" : ""}`}
                                    name="workingTimePattern"
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "workingTimePattern") : () => { }}
                                    value={employeeObj?.workingTimePattern || ""}
                                    disabled={isView ? true : (["admin", "hr"].includes(whoIs) ? false : true)}
                                >
                                    <option value="">Select Work Time Pattern</option>
                                    {timePatterns.map(pattern => (
                                        <option key={pattern._id} value={pattern._id}>
                                            {pattern.PatternName} ({new Date(pattern.StartingTime).toLocaleTimeString()} - {new Date(pattern.FinishingTime).toLocaleTimeString()})
                                        </option>
                                    ))}
                                </select>
                                {errors?.workingTimePattern && (
                                    <div className="text-center text-danger">{errors?.workingTimePattern}</div>
                                )}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-4 col-md-4 col-12">
                                <div className="inputLabel important">Company</div>
                                <select
                                    className={`selectInput ${errors?.company ? "error" : ""}`}
                                    name="company"
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "company") : () => { }}
                                    value={employeeObj?.company || ""}
                                    disabled={isView ? true : (["admin", "hr"].includes(whoIs) ? false : true)}
                                >
                                    <option value="">Select Company</option>
                                    {companies.map(company => (
                                        <option key={company._id} value={company._id}>
                                            {company.CompanyName}
                                        </option>
                                    ))}
                                </select>
                                {errors?.company && <div className="text-center text-danger">{errors?.company}</div>}
                            </div>
                            <div className="col-lg-4 col-md-4 col-12 text-center">
                                <div className="inputLabel">isPermanentWFH</div>
                                <Toggle
                                    readOnly={isView}
                                    size="lg"
                                    checked={employeeObj?.isPermanentWFH || false}
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e, "isPermanentWFH") : () => { }}
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                />
                            </div>
                            <div className="col-lg-4 col-md-4 col-12">
                                <div className="inputLabel important">Employee Code</div>
                                <Input type="text" readOnly={isView} value={employeeObj?.code} onChange={(e) => fillEmpObj(e, "code")} style={{ width: "100%" }} className={`inputField ${errors?.code ? "error" : ""}`} />
                            </div>
                            {errors?.code && <div className="text-center text-danger">{errors?.code}</div>}
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-6 my-2">
                                <div className="inputLabel important">Date Of Joining</div>
                                <input
                                    readOnly={isView}
                                    type="date"
                                    className={`inputField ${errors?.dateOfJoining ? "error" : ""}`}
                                    name="dateOfJoining"
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "dateOfJoining") : () => { }}
                                    value={employeeObj?.dateOfJoining || ""}
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                />
                                {errors?.dateOfJoining && (
                                    <div className="text-center text-danger">{errors?.dateOfJoining}</div>
                                )}
                            </div>
                            <div className="col-lg-6 my-2">
                                <div className="inputLabel important">Annual Leave Year Start</div>
                                <input
                                    readOnly={isView}
                                    type="date"
                                    className={`inputField ${errors?.annualLeaveYearStart ? "error" : ""}`}
                                    name="annualLeaveYearStart"
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "annualLeaveYearStart") : () => { }}
                                    value={employeeObj?.annualLeaveYearStart || ""}
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                />
                                {errors?.annualLeaveYearStart && (
                                    <div className="text-center text-danger">{errors?.annualLeaveYearStart}</div>
                                )}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="inputLabel col-lg-12 mt-4">
                                Company Working Hours per Week
                            </div>
                            <div className="col-lg-6 my-2 position-relative">
                                <input
                                    type="number"
                                    value={hour}
                                    className="inputField"
                                    readOnly
                                />
                                <div className="timeIndicator">Hours</div>
                            </div>
                            <div className="col-lg-6 my-2 position-relative">
                                <input
                                    type="number"
                                    value={min}
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
                                    readOnly={isView}
                                    className="selectInput p-0"
                                    style={{
                                        width: 300,
                                        border: "none",
                                        marginTop: "0px",
                                        position: "relative",
                                        zIndex: 0
                                    }}
                                    size="lg"
                                    block
                                    appearance="subtle"
                                    name="publicHoliday"
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                    value={employeeObj?.publicHoliday}
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e, "publicHoliday") : () => { }}
                                    data={countries?.map(item => ({ label: item.name, value: item.name }))}
                                />
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel">Warning Limit</div>
                                <input
                                    readOnly={isView}
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={employeeObj?.warnings}
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "warnings") : () => { }}
                                    name="warnings"
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                    className={`inputField ${errors?.warnings ? "error" : ""}`}
                                />
                                {errors?.warnings && (
                                    <div className="text-center text-danger">{errors?.warnings}</div>
                                )}
                            </div>
                            {/* <div className="col-lg-4">
                                <div className="inputLabel important">Monthly Permissions</div>
                                <input
                                    readOnly={isView}
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={employeeObj?.monthlyPermissions || ""}
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "monthlyPermissions") : () => { }}
                                    name="monthlyPermissions"
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                    className={`inputField ${errors?.monthlyPermissions ? "error" : ""}`}
                                />
                                {errors?.monthlyPermissions && (
                                    <div className="text-center text-danger">{errors?.monthlyPermissions}</div>
                                )}
                            </div> */}
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-6 my-2">
                                <div className="inputLabel important">Select Leave Types</div>
                                <TagPicker
                                    readOnly={isView}
                                    data={leaveTypes}
                                    size="lg"
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                    onChange={["admin", "hr"].includes(whoIs) ? handleTagSelector : () => { }}
                                    value={selectedLeaveTypes}
                                    className={
                                        employeeObj?.annualLeaveEntitlement
                                            ? "rsuite_selector"
                                            : "rsuite_selector_disabled"
                                    }
                                    style={{ width: 300, border: "none" }}
                                />
                            </div>
                            <div className="col-lg-6 my-2">
                                <div className="inputLabel important">Annual Leave Entitlement</div>
                                <input
                                    readOnly={isView}
                                    type="number"
                                    value={employeeObj?.annualLeaveEntitlement || ""}
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "annualLeaveEntitlement") : () => { }}
                                    name="annualLeaveEntitlement"
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                    className={`inputField ${errors?.annualLeaveEntitlement ? "error" : ""}`}
                                />
                                {errors?.annualLeaveEntitlement && (
                                    <div className="text-center text-danger">{errors?.annualLeaveEntitlement}</div>
                                )}
                            </div>
                        </div>
                        <div className="row d-flex justify-content-center">
                            {selectedLeaveTypes?.map((leaveName, index) => {
                                const actualName = leaveName.split(" ")[0] + " " + leaveName.split(" ")[1];

                                return <div key={index} className="col-lg-6 my-2">
                                    <div className="inputLabel">Choose {actualName} count</div>
                                    <input
                                        readOnly={isView}
                                        type="number"
                                        value={employeeObj.typesOfLeaveCount[actualName]}                                        // readOnly
                                        onChange={(e) => changeLeaveTypeManual(e.target.value, `${leaveName}`)}
                                        name={leaveName}
                                        className="inputField"
                                    />
                                </div>
                            })}
                        </div>
                    </div>

                    {/* Job Details Section */}
                    <div className="jobDetails" ref={jobRef}>
                        <div className="row d-flex justify-content-center my-3">
                            <div className="titleText col-lg-12">Job Details</div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-6">
                                <div className="inputLabel important">Position</div>
                                <select
                                    name="position"
                                    className={`selectInput ${errors?.position ? "error" : ""}`}
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "position") : () => { }}
                                    value={employeeObj?.position || ""}
                                    disabled={isView ? true : (["admin", "hr"].includes(whoIs) ? false : true)}
                                >
                                    <option value="">Select Position</option>
                                    {positions.map(position => (
                                        <option key={position._id} value={position._id}>
                                            {position.PositionName}
                                        </option>
                                    ))}
                                </select>
                                {errors?.position && <div className="text-center text-danger">{errors?.position}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Department</div>
                                <select
                                    name="department"
                                    disabled={isView ? true : (["admin", "hr"].includes(whoIs) ? false : true)}
                                    className={`selectInput ${errors?.department ? "error" : ""}`}
                                    onChange={isView || ["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "department") : () => { }}
                                    value={employeeObj?.department || ""}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(department => (
                                        <option key={department._id} value={department._id}>
                                            {department.DepartmentName}
                                        </option>
                                    ))}
                                </select>
                                {errors?.department && <div className="text-center text-danger">{errors?.department}</div>}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-12 my-2">
                                <div className="inputLabel">Description</div>
                                <textarea
                                    readOnly={isView}
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "description") : () => { }}
                                    name="description"
                                    className="inputField"
                                    cols={50}
                                    rows={10}
                                    style={{ height: "100px" }}
                                    value={employeeObj?.description || ""}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Details Section */}
                    <div className="financialDetails" ref={financialRef}>
                        <div className="row d-flex justify-content-center my-3">
                            <div className="titleText col-lg-12">Financial Details</div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Basic Salary</div>
                                <input
                                    readOnly={isView}
                                    type="number"
                                    className={`inputField ${errors?.basicSalary ? "error" : ""}`}
                                    name="basicSalary"
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "basicSalary") : () => { }}
                                    value={employeeObj?.basicSalary}
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                />
                                {errors?.basicSalary && <div className="text-center text-danger">{errors?.basicSalary}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Bank Name</div>
                                <input
                                    readOnly={isView}
                                    type="text"
                                    className={`inputField ${errors?.bankName ? "error" : ""}`}
                                    name="bankName"
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "bankName") : () => { }}
                                    value={employeeObj?.bankName || ""}
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                />
                                {errors?.bankName && <div className="text-center text-danger">{errors?.bankName}</div>}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-12 my-2">
                                <div className="inputLabel important">Account No</div>
                                <input
                                    readOnly={isView}
                                    type="number"
                                    className={`inputField ${errors?.accountNo ? "error" : ""}`}
                                    name="accountNo"
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "accountNo") : () => { }}
                                    value={employeeObj?.accountNo || ""}
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                />
                                {errors?.accountNo && <div className="text-center text-danger">{errors?.accountNo}</div>}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center my-3">
                            <div className="col-lg-6">
                                <div className="inputLabel important">Account Holder Name</div>
                                <input
                                    readOnly={isView}
                                    type="text"
                                    className={`inputField ${errors?.accountHolderName ? "error" : ""}`}
                                    name="accountHolderName"
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "accountHolderName") : () => { }}
                                    value={employeeObj?.accountHolderName || ""}
                                />
                                {errors?.accountHolderName && (
                                    <div className="text-center text-danger">{errors?.accountHolderName}</div>
                                )}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel">Tax Deducation</div>
                                <input
                                    readOnly={isView}
                                    type="number"
                                    className="inputField"
                                    name="taxDeduction"
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "taxDeduction") : () => { }}
                                    value={employeeObj?.taxDeduction || ""}
                                />
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-12 my-2">
                                <div className="inputLabel important">IFSC Code</div>
                                <input
                                    readOnly={isView}
                                    type="text"
                                    className={`inputField ${errors?.IFSCcode ? "error" : ""}`}
                                    name="IFSCcode"
                                    onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, "IFSCcode") : () => { }}
                                    value={employeeObj?.IFSCcode || ""}
                                    disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                />
                                {errors?.IFSCcode && <div className="text-center text-danger">{errors?.IFSCcode}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Payslip Details Section */}
                    <div className="payslipDetails" ref={payslipRef}>
                        <div className="row d-flex justify-content-center my-3">
                            <div className="titleText col-lg-12">Payslip Details</div>
                            {payslipFields.length > 0 ? (
                                payslipFields.map((field, index) => (
                                    <div className="col-lg-6" key={index}>
                                        <div className="inputLabel">
                                            {field.fieldName[0].toUpperCase() + field.fieldName.slice(1)}
                                        </div>
                                        <input
                                            readOnly={isView}
                                            type={field.type}
                                            className={`inputField ${errors[field.fieldName] ? "error" : ""}`}
                                            name={field.fieldName}
                                            onChange={["admin", "hr"].includes(whoIs) ? e => fillEmpObj(e.target.value, field.fieldName) : () => { }}
                                            value={employeeObj?.payslipFields?.[field.fieldName] || ""}
                                            disabled={["admin", "hr"].includes(whoIs) ? false : true}
                                        />
                                        {errors[field.fieldName] && (
                                            <div className="text-center text-danger">{errors[field.fieldName]}</div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <NoDataFound message="Please add Payslip fields" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Action Buttons */}
            <div className="btnBackground">
                <div className="fixedPositionBtns">
                    <div className="w-50">
                        <button
                            type="button"
                            className="outline-btn mx-2"
                            onClick={() =>
                                ["emp", "sys-admin"].includes(whoIs)
                                    ? navigate(`/${whoIs}`)
                                    : navigate(`/${whoIs}/employee`)
                            }
                        >
                            Cancel
                        </button>
                    </div>
                    <div className="w-50">
                        <button
                            type="submit"
                            disabled={isWorkingApi}
                            className="btn btn-dark"
                            style={{
                                cursor: isWorkingApi ? "progress" : "pointer"
                            }}
                        >
                            {isWorkingApi ? <Loading size={20} color="white" /> : employeeObj?._id ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default EmployeeForm;