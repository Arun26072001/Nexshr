import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { SelectPicker, TagPicker, Toggle } from "rsuite";
import Loading from "./Loader";
import NoDataFound from "./payslip/NoDataFound";
import { EssentialValues } from "../App";
import "./leaveForm.css";
import { fetchPayslipInfo } from "./ReuseableAPI";

const AddEmployeeForm = ({
    details,
    handleScroll,
    timePatterns,
    personalRef,
    contactRef,
    employmentRef,
    jobRef,
    financialRef,
    payslipRef,
    countries,
    companies,
    departments,
    positions,
    roles
}) => {
    const navigate = useNavigate();
    const { whoIs, data } = useContext(EssentialValues);
    const [timeDifference, setTimeDifference] = useState(0);
    const [payslipFields, setPayslipFields] = useState([]);
    const url = process.env.REACT_APP_API_URL;
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isWorkingApi, setIsWorkingApi] = useState(false);
    const [stateData, setStateData] = useState([]);
    const [selectedLeaveTypes, setSelectedLeavetypes] = useState([]);
    const [employeeObj, setEmployeeObj] = useState({
        address: {} // Initialize address object to prevent undefined errors
    });
    const [preview, setPreview] = useState("");
    const [errors, setErrors] = useState({});

    // Fetch payslip info on component mount
    useEffect(() => {
        const getPayslipInfo = async () => {
            try {
                const payslipInfo = await fetchPayslipInfo();
                if (payslipInfo?.payslipFields) {
                    const fields = payslipInfo.payslipFields;
                    const additionalFields = fields.reduce((acc, field) => {
                        acc[field.fieldName] = "";
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
                pattern => pattern._id === employeeObj.workingTimePattern
            );

            if (selectedPattern?.StartingTime && selectedPattern?.FinishingTime) {
                const [startHour, startMinute] = selectedPattern.StartingTime.split(".").map(Number);
                const [endHour, endMinute] = selectedPattern.FinishingTime.split(".").map(Number);

                const startDate = new Date();
                startDate.setHours(startHour, startMinute);

                const endDate = new Date();
                endDate.setHours(endHour, endMinute);

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
                        label: `${leave.LeaveName} ${leave.limitDays}`,
                        value: `${leave.LeaveName} ${leave.limitDays}`
                    }))
                );
            } catch (error) {
                console.error("Error fetching leave types:", error);
                toast.error(error.response?.data?.error || "Failed to fetch leave types");
            } finally {
                setIsLoading(false);
            }
        };

        gettingLeaveTypes();
    }, [url, data.token]);

    const hourAndMin = timeDifference.toString().split(".");
    const [hour = 0, min = 0] = hourAndMin;

    const updateEmployee = async () => {
        try {
            setIsWorkingApi(true);
            const res = await axios.put(
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
            toast.success(res.data.message);
        } catch (error) {
            console.error("Error updating employee:", error);
            toast.error(error.response?.data?.error || "Failed to update employee");
        } finally {
            setIsWorkingApi(false);
        }
    };

    const addEmployee = async () => {
        try {
            setIsWorkingApi(true);
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
            toast.success(res.data.message);
        } catch (error) {
            console.error("Error adding employee:", error);
            toast.error(error?.response?.data?.error || "Failed to add employee");
        } finally {
            setIsWorkingApi(false);
        }
    };

    const changeImg = event => {
        const { name, files } = event.target;
        if (files && files[0]) {
            setPreview(URL.createObjectURL(files[0]));
            setEmployeeObj(pre => ({
                ...pre,
                [name]: files[0]
            }));
        }
    };

    const fillEmpObj = (value, name) => {
        let countryFullData;

        if (name === "country") {
            countryFullData = countries.find(country =>
                Object.values(country).includes(value)
            );
            setStateData(countryFullData?.states || []);
            setEmployeeObj(pre => ({
                ...pre,
                countryCode: countryFullData?.code || ""
            }));
        }

        setEmployeeObj(prev => {
            if (["country", "state", "city", "zipCode"].includes(name)) {
                return {
                    ...prev,
                    address: {
                        ...prev.address,
                        [name]: name === "country" && countryFullData ? countryFullData.name : value
                    }
                };
            }

            return {
                ...prev,
                [name]: value
            };
        });
    };

    const handleTagSelector = value => {
        let leaveCount = 0;
        const leaveTypeCount = {};

        value.forEach(type => {
            const key = type.split(" ").slice(0, 2).join(" ");
            leaveTypeCount[key] = type.split(" ")[0];
            leaveCount += Number(type.split(" ").at(-1));
        });

        setEmployeeObj(pre => ({
            ...pre,
            annualLeaveEntitlement: leaveCount,
            typesOfLeaveCount: leaveTypeCount
        }));
        setSelectedLeavetypes(value);
    };

    const validationForm = () => {
        const newError = {};

        // Required field validations
        if (!employeeObj.FirstName) newError.FirstName = "First name is required";
        if (!employeeObj.LastName) newError.LastName = "Last name is required";
        if (!employeeObj.Email) newError.Email = "Email is required";
        if (!employeeObj.Password) newError.Password = "Password is required";
        if (!employeeObj.company) newError.company = "Company is required";
        if (!employeeObj.position) newError.position = "Position is required";
        if (!employeeObj.department) newError.department = "Department is required";
        if (!employeeObj.role) newError.role = "Role is required";
        if (!employeeObj.employmentType) newError.employmentType = "Employment type is required";
        if (!employeeObj.workingTimePattern) newError.workingTimePattern = "Working time pattern is required";
        if (!employeeObj.annualLeaveYearStart) newError.annualLeaveYearStart = "AnnualLeaveYearStart date is required";
        if (!employeeObj.annualLeaveEntitlement) newError.annualLeaveEntitlement = "Annual leave entitlement is required";
        if (!employeeObj.basicSalary) newError.basicSalary = "Basic salary is required";
        if (!employeeObj.bankName) newError.bankName = "Bank name is required";
        if (!employeeObj.accountNo) newError.accountNo = "Account number is required";
        if (!employeeObj.accountHolderName) newError.accountHolderName = "Account holder name is required";
        if (!employeeObj.IFSCcode) newError.IFSCcode = "IFSC code is required";

        // Email validation
        if (employeeObj.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeObj.Email)) {
            newError.Email = "Please enter a valid email address";
        }

        // Password strength validation
        if (employeeObj.Password && employeeObj.Password.length < 8) {
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
            employment: ["workingTimePattern", "company", "dateOfJoining", "employmentType", "monthlyPermissions"],
            job: ["department", "position"],
            financial: ["basicSalary", "bankName", "accountNo", "accountHolderName", "IFSCcode"]
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
        if (!validationForm()) {
            toast.error("Please fix the errors in the form.");
            navToError();
            return;
        }

        try {
            if (employeeObj._id) {
                await updateEmployee();
            } else {
                await addEmployee();
            }
        } catch (error) {
            console.error("Form submission error:", error);
        }
    };

    if (isLoading) return <Loading height="80vh" />;

    return (
        <form onSubmit={handleSubmit}>
            <div className="empForm">
                <div className="catogaries-container">
                    <div className="catogaries">
                        {["personal", "contact", "employment", "job", "financial", "payslip"].map(section => (
                            <div
                                key={section}
                                className={`catogary ${details === section ? "view" : ""}`}
                                onClick={() => handleScroll(section)}
                            >
                                {section.charAt(0).toUpperCase() + section.slice(1)} Details
                            </div>
                        ))}
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
                                    type="text"
                                    name="FirstName"
                                    className={`inputField ${errors.FirstName ? "error" : ""}`}
                                    onChange={e => fillEmpObj(e.target.value, "FirstName")}
                                    value={employeeObj.FirstName || ""}
                                />
                                {errors.FirstName && <div className="text-center text-danger">{errors.FirstName}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Last Name</div>
                                <input
                                    type="text"
                                    className={`inputField ${errors.LastName ? "error" : ""}`}
                                    name="LastName"
                                    onChange={e => fillEmpObj(e.target.value, "LastName")}
                                    value={employeeObj.LastName || ""}
                                />
                                {errors.LastName && <div className="text-center text-danger">{errors.LastName}</div>}
                            </div>
                        </div>

                        <div className="row my-3 d-flex align-items-center justify-content-center">
                            <div className="col-lg-6">
                                <div className="inputLabel">Gender</div>
                                <select
                                    name="gender"
                                    className={`selectInput ${errors.gender ? "error" : ""}`}
                                    onChange={e => fillEmpObj(e.target.value, "gender")}
                                    value={employeeObj.gender || ""}
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                {errors.gender && <div className="text-center text-danger">{errors.gender}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel">Date Of Birth</div>
                                <input
                                    type="date"
                                    className="inputField"
                                    name="dateOfBirth"
                                    onChange={e => fillEmpObj(e.target.value, "dateOfBirth")}
                                    value={employeeObj.dateOfBirth || ""}
                                />
                            </div>
                        </div>

                        <div className="row my-3 d-flex align-items-center justify-content-center">
                            <div className="col-lg-6">
                                <div className="inputLabel important">Role</div>
                                <select
                                    name="role"
                                    className={`selectInput ${errors.role ? "error" : ""}`}
                                    onChange={e => fillEmpObj(e.target.value, "role")}
                                    value={employeeObj.role || ""}
                                >
                                    <option value="">Select Role</option>
                                    {roles.map(role => (
                                        <option key={role._id} value={role._id}>
                                            {role.RoleName}
                                        </option>
                                    ))}
                                </select>
                                {errors.role && <div className="text-center text-danger">{errors.role}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Employment Type</div>
                                <select
                                    name="employmentType"
                                    className={`selectInput ${errors.employmentType ? "error" : ""}`}
                                    onChange={e => fillEmpObj(e.target.value, "employmentType")}
                                    value={employeeObj.employmentType || ""}
                                >
                                    <option value="">Employment Type</option>
                                    <option value="full-time">Full Time</option>
                                    <option value="part-time">Part Time</option>
                                    <option value="intern">Contract</option>
                                </select>
                                {errors.employmentType && (
                                    <div className="text-center text-danger">{errors.employmentType}</div>
                                )}
                            </div>
                        </div>

                        <div className="my-3">
                            <span className="inputLabel">
                                Attach Employee profile (recommended for JPG)
                            </span>
                            <input
                                type="file"
                                name="profile"
                                className="fileInput"
                                onChange={changeImg}
                                accept="image/*"
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
                                    type="email"
                                    className={`inputField ${errors.Email ? "error" : ""}`}
                                    name="Email"
                                    onChange={e => fillEmpObj(e.target.value, "Email")}
                                    value={employeeObj.Email || ""}
                                />
                                {errors.Email && <div className="text-center text-danger">{errors.Email}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Password</div>
                                <input
                                    type="password"
                                    className={`inputField ${errors.Password ? "error" : ""}`}
                                    name="Password"
                                    onChange={e => fillEmpObj(e.target.value, "Password")}
                                    value={employeeObj.Password || ""}
                                />
                                {errors.Password && <div className="text-center text-danger">{errors.Password}</div>}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-6 col-md-6 col-6">
                                <div className="inputLabel">Country Code</div>
                                <SelectPicker
                                    className="mt-2 selectInput"
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
                                    value={employeeObj.countryCode}
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
                                        ) : null
                                    }
                                />
                            </div>
                            <div className="col-lg-6 col-md-6 col-6 my-2">
                                <div className="inputLabel">Phone</div>
                                <input
                                    type="tel"
                                    className={`inputField ${errors.phone ? "error" : ""}`}
                                    name="phone"
                                    onChange={e => fillEmpObj(e.target.value, "phone")}
                                    value={employeeObj.phone || ""}
                                />
                                {errors.phone && <div className="text-center text-danger">{errors.phone}</div>}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center my-3">
                            <div className="col-lg-6">
                                <div className="inputLabel">Country</div>
                                <SelectPicker
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
                                    renderValue={(value, item) => (item ? <div>{item.name}</div> : null)}
                                />
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel">State</div>
                                <SelectPicker
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
                                    disabled={!stateData.length}
                                />
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center my-3">
                            <div className="col-lg-6">
                                <div className="inputLabel">City</div>
                                <input
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
                                    className={`selectInput ${errors.workingTimePattern ? "error" : ""}`}
                                    name="workingTimePattern"
                                    onChange={e => fillEmpObj(e.target.value, "workingTimePattern")}
                                    value={employeeObj.workingTimePattern || ""}
                                >
                                    <option value="">Select Work Time Pattern</option>
                                    {timePatterns.map(pattern => (
                                        <option key={pattern._id} value={pattern._id}>
                                            {pattern.PatternName} ({pattern.StartingTime} - {pattern.FinishingTime})
                                        </option>
                                    ))}
                                </select>
                                {errors.workingTimePattern && (
                                    <div className="text-center text-danger">{errors.workingTimePattern}</div>
                                )}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-6">
                                <div className="inputLabel important">Company</div>
                                <select
                                    className={`selectInput ${errors.company ? "error" : ""}`}
                                    name="company"
                                    onChange={e => fillEmpObj(e.target.value, "company")}
                                    value={employeeObj.company || ""}
                                >
                                    <option value="">Select Company</option>
                                    {companies.map(company => (
                                        <option key={company._id} value={company._id}>
                                            {company.CompanyName}
                                        </option>
                                    ))}
                                </select>
                                {errors.company && <div className="text-center text-danger">{errors.company}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel">isPermanentWFH</div>
                                <Toggle
                                    size="lg"
                                    checked={employeeObj?.isPermanentWFH || false}
                                    onChange={e => fillEmpObj(e, "isPermanentWFH")}
                                />
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-6 my-2">
                                <div className="inputLabel important">Date Of Joining</div>
                                <input
                                    type="date"
                                    className={`inputField ${errors.dateOfJoining ? "error" : ""}`}
                                    name="dateOfJoining"
                                    onChange={e => fillEmpObj(e.target.value, "dateOfJoining")}
                                    value={employeeObj.dateOfJoining || ""}
                                />
                                {errors.dateOfJoining && (
                                    <div className="text-center text-danger">{errors.dateOfJoining}</div>
                                )}
                            </div>
                            <div className="col-lg-6 my-2">
                                <div className="inputLabel important">Annual Leave Year Start</div>
                                <input
                                    type="date"
                                    className={`inputField ${errors.annualLeaveYearStart ? "error" : ""}`}
                                    name="annualLeaveYearStart"
                                    onChange={e => fillEmpObj(e.target.value, "annualLeaveYearStart")}
                                    value={employeeObj?.annualLeaveYearStart || ""}
                                />
                                {errors.annualLeaveYearStart && (
                                    <div className="text-center text-danger">{errors.annualLeaveYearStart}</div>
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
                                    value={employeeObj?.publicHoliday}
                                    onChange={e => fillEmpObj(e, "publicHoliday")}
                                    data={countries?.map(item => ({ label: item.name, value: item.name }))}
                                />
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel">Monthly Permissions</div>
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={employeeObj?.monthlyPermissions || ""}
                                    onChange={e => fillEmpObj(e.target.value, "monthlyPermissions")}
                                    name="monthlyPermissions"
                                    className={`inputField ${errors.monthlyPermissions ? "error" : ""}`}
                                />
                                {errors.monthlyPermissions && (
                                    <div className="text-center text-danger">{errors.monthlyPermissions}</div>
                                )}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-6 my-2">
                                <div className="inputLabel important">Select Leave Types</div>
                                <TagPicker
                                    data={leaveTypes}
                                    size="lg"
                                    onChange={handleTagSelector}
                                    value={selectedLeaveTypes}
                                    className={
                                        employeeObj.annualLeaveEntitlement
                                            ? "rsuite_selector"
                                            : "rsuite_selector_disabled"
                                    }
                                    style={{ width: 300, border: "none" }}
                                />
                            </div>
                            <div className="col-lg-6 my-2">
                                <div className="inputLabel important">Annual Leave Entitlement</div>
                                <input
                                    type="number"
                                    value={employeeObj.annualLeaveEntitlement || ""}
                                    onChange={e => fillEmpObj(e.target.value, "annualLeaveEntitlement")}
                                    name="annualLeaveEntitlement"
                                    className={`inputField ${errors.annualLeaveEntitlement ? "error" : ""}`}
                                />
                                {errors.annualLeaveEntitlement && (
                                    <div className="text-center text-danger">{errors.annualLeaveEntitlement}</div>
                                )}
                            </div>
                        </div>
                        <div className="row d-flex justify-content-center">
                            {selectedLeaveTypes?.map((leaveName, index) => (
                                <div key={index} className="col-lg-6 my-2">
                                    <div className="inputLabel">Choose {leaveName} count</div>
                                    <input
                                        type="number"
                                        value={leaveName.split(" ").at(-1)}
                                        disabled
                                        name={leaveName}
                                        className="inputField"
                                    />
                                </div>
                            ))}
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
                                    className={`selectInput ${errors.position ? "error" : ""}`}
                                    onChange={e => fillEmpObj(e.target.value, "position")}
                                    value={employeeObj.position || ""}
                                >
                                    <option value="">Select Position</option>
                                    {positions.map(position => (
                                        <option key={position._id} value={position._id}>
                                            {position.PositionName}
                                        </option>
                                    ))}
                                </select>
                                {errors.position && <div className="text-center text-danger">{errors.position}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Department</div>
                                <select
                                    name="department"
                                    className={`selectInput ${errors.department ? "error" : ""}`}
                                    onChange={e => fillEmpObj(e.target.value, "department")}
                                    value={employeeObj.department || ""}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(department => (
                                        <option key={department._id} value={department._id}>
                                            {department.DepartmentName}
                                        </option>
                                    ))}
                                </select>
                                {errors.department && <div className="text-center text-danger">{errors.department}</div>}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-12 my-2">
                                <div className="inputLabel">Description</div>
                                <textarea
                                    onChange={e => fillEmpObj(e.target.value, "description")}
                                    name="description"
                                    className="inputField"
                                    cols={50}
                                    rows={10}
                                    style={{ height: "100px" }}
                                    value={employeeObj.description || ""}
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
                                    type="number"
                                    className={`inputField ${errors.basicSalary ? "error" : ""}`}
                                    name="basicSalary"
                                    onChange={e => fillEmpObj(e.target.value, "basicSalary")}
                                    value={employeeObj.basicSalary || ""}
                                />
                                {errors.basicSalary && <div className="text-center text-danger">{errors.basicSalary}</div>}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel important">Bank Name</div>
                                <input
                                    type="text"
                                    className={`inputField ${errors.bankName ? "error" : ""}`}
                                    name="bankName"
                                    onChange={e => fillEmpObj(e.target.value, "bankName")}
                                    value={employeeObj.bankName || ""}
                                />
                                {errors.bankName && <div className="text-center text-danger">{errors.bankName}</div>}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-12 my-2">
                                <div className="inputLabel important">Account No</div>
                                <input
                                    type="number"
                                    className={`inputField ${errors.accountNo ? "error" : ""}`}
                                    name="accountNo"
                                    onChange={e => fillEmpObj(e.target.value, "accountNo")}
                                    value={employeeObj.accountNo || ""}
                                />
                                {errors.accountNo && <div className="text-center text-danger">{errors.accountNo}</div>}
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center my-3">
                            <div className="col-lg-6">
                                <div className="inputLabel important">Account Holder Name</div>
                                <input
                                    type="text"
                                    className={`inputField ${errors.accountHolderName ? "error" : ""}`}
                                    name="accountHolderName"
                                    onChange={e => fillEmpObj(e.target.value, "accountHolderName")}
                                    value={employeeObj.accountHolderName || ""}
                                />
                                {errors.accountHolderName && (
                                    <div className="text-center text-danger">{errors.accountHolderName}</div>
                                )}
                            </div>
                            <div className="col-lg-6">
                                <div className="inputLabel">Tax Deducation</div>
                                <input
                                    type="number"
                                    className="inputField"
                                    name="taxDeduction"
                                    onChange={e => fillEmpObj(e.target.value, "taxDeduction")}
                                    value={employeeObj.taxDeduction || ""}
                                />
                            </div>
                        </div>

                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-12 my-2">
                                <div className="inputLabel important">IFSC Code</div>
                                <input
                                    type="text"
                                    className={`inputField ${errors.IFSCcode ? "error" : ""}`}
                                    name="IFSCcode"
                                    onChange={e => fillEmpObj(e.target.value, "IFSCcode")}
                                    value={employeeObj.IFSCcode || ""}
                                />
                                {errors.IFSCcode && <div className="text-center text-danger">{errors.IFSCcode}</div>}
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
                                            type={field.type}
                                            className={`inputField ${errors[field.fieldName] ? "error" : ""}`}
                                            name={field.fieldName}
                                            onChange={e => fillEmpObj(e.target.value, field.fieldName)}
                                            value={employeeObj?.[field.fieldName] || ""}
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
                                whoIs === "emp"
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
                            className="button"
                            style={{
                                padding: "12px",
                                cursor: isWorkingApi ? "progress" : "pointer"
                            }}
                        >
                            {isWorkingApi ? <Loading size={20} color="white" /> : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default AddEmployeeForm;