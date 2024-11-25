import React, { useState } from "react";
import Logo from "../imgs/webnexs_logo.png";
import "./landinPage.css";
import { allCountries, phoneCodes } from "./countryCode";
import { Input, SelectPicker, Form, InputGroup } from "rsuite";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import Cookies from "universal-cookie";

export default function LandingPage() {
    const [registerData, setRegisterData] = useState({
        name: "",
        email: "",
        password: "",
        countryCode: "",
        phone: "",
    });
    const [errorData, setErrorData] = useState({});
    const [visible, setVisible] = useState(false);
    const url = process.env.REACT_APP_API_URL;
    const cookies = new Cookies();
    const token = cookies.get("token");

    // Toggle Password Visibility
    const togglePasswordVisibility = () => setVisible((prev) => !prev);

    // Handle Input Change
    const handleInputChange = (value, name) => {
        console.log(value, name);

        setRegisterData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setErrorData((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    // Form Validation
    const validateForm = () => {
        const errors = {};
        if (!registerData.name) errors.name = "Name is required.";
        if (!registerData.email) errors.email = "Email is required.";
        if (!registerData.password) errors.password = "Password is required.";
        if (!registerData.countryCode) errors.countryCode = "Country code is required.";
        if (!registerData.phone) errors.phone = "Phone number is required.";
        if (registerData.phone && !/^\d+$/.test(registerData.phone)) {
            errors.phone = "Phone number must contain only digits.";
        }
        return errors;
    };

    // Handle Form Submission
    const handleSubmit = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setErrorData(errors);
            return;
        }

        try {
            const response = await axios.post(
                `${url}/api/user-account`,
                registerData,
                {
                    headers: {
                      Authorization: `Bearer ${token}` || ""
                    },
                }
            );
            toast.success(response.data.message);
            setRegisterData({
                name: "",
                email: "",
                password: "",
                countryCode: "",
                phone: "",
            });
        } catch (error) {
            setErrorData((prev) => ({
                ...prev,
                general: error.response?.data?.error || "An error occurred.",
            }));
        }
    };

    return (
        <div className="body">
            <ToastContainer />
            <div className="container">
                <div className="row justify-content-center align-items-center">
                    {/* Left Section */}
                    <div className="col-lg-6 col-md-12">
                        <div className="d-flex align-items-center justify-content-center">
                            <img src={Logo} alt="product_logo" className="logo" />
                            <p className="logo_font">NexsHR</p>
                        </div>
                        <p className="sub_title">
                            Manage employees, track attendance, and simplify HR workflows.
                        </p>
                        <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                            <li>Employee Database Management</li>
                            <li>Attendance and Time Tracking</li>
                            <li>Payroll Management</li>
                            <li>Performance Management</li>
                            <li>Leave and Holiday Management</li>
                            <li>Task and Project Management</li>
                            <li>Training and Development</li>
                            <li>Team Management</li>
                        </ul>
                    </div>

                    {/* Right Section */}
                    <div className="col-lg-6 col-md-12">
                        <div className="leaveFormParent">
                            <div className="titleText">
                                Fill up the form to start using the free trial
                            </div>
                            <Form fluid>
                                {/* Name Field */}
                                <Form.Group>
                                    <Input
                                        placeholder="Name"
                                        size="lg"
                                        value={registerData.name}
                                        onChange={(value) => handleInputChange(value, "name")}
                                    />
                                    {errorData.name && (
                                        <Form.HelpText style={{ color: "red" }}>
                                            {errorData.name}
                                        </Form.HelpText>
                                    )}
                                </Form.Group>

                                {/* Email Field */}
                                <Form.Group>
                                    <Input
                                        placeholder="Email"
                                        size="lg"
                                        value={registerData.email}
                                        onChange={(value) => handleInputChange(value, "email")}
                                    />
                                    {errorData.email && (
                                        <Form.HelpText style={{ color: "red" }}>
                                            {errorData.email}
                                        </Form.HelpText>
                                    )}
                                </Form.Group>

                                {/* Password Field */}
                                <Form.Group>
                                    <InputGroup inside size="lg">
                                        <Input
                                            placeholder="Password"
                                            type={visible ? "text" : "password"}
                                            value={registerData.password}
                                            onChange={(value) => handleInputChange(value, "password")}
                                        />
                                        <InputGroup.Button onClick={togglePasswordVisibility} size="lg">
                                            {visible ? (
                                                <VisibilityOutlinedIcon />
                                            ) : (
                                                <VisibilityOffOutlinedIcon />
                                            )}
                                        </InputGroup.Button>
                                    </InputGroup>
                                    {errorData.password && (
                                        <Form.HelpText style={{ color: "red" }}>
                                            {errorData.password}
                                        </Form.HelpText>
                                    )}
                                </Form.Group>

                                {/* Country Code and Phone Fields */}
                                <div className="row">
                                    <div className="col-lg-4 col-md-4 col-4">
                                        <SelectPicker
                                            className="mt-1"
                                            style={{ width: "fit-content" }}
                                            size="lg"
                                            data={allCountries}
                                            labelKey="name"
                                            valueKey="abbr"
                                            value={registerData.countryCode}
                                            onChange={(value) => handleInputChange(value, "countryCode")}
                                            placeholder="Choose a Country"
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
                                        {errorData.countryCode && (
                                            <Form.HelpText style={{ color: "red" }}>
                                                {errorData.countryCode}
                                            </Form.HelpText>
                                        )}
                                    </div>
                                    <div className="col-lg-8 col-md-8 col-8">
                                        <Input
                                            placeholder="Phone"
                                            size="lg"
                                            value={registerData.phone}
                                            onChange={(value) => handleInputChange(value, "phone")}
                                        />
                                        {errorData.phone && (
                                            <Form.HelpText style={{ color: "red" }}>
                                                {errorData.phone}
                                            </Form.HelpText>
                                        )}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="row d-flex align-items-center justify-content-end my-4">
                                    <div className="col-lg-5">
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            className="btn btn-dark w-100"
                                            style={{ height: "50px" }}
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>

                                {errorData.general && (
                                    <div style={{ color: "red", textAlign: "center" }}>
                                        {errorData.general}
                                    </div>
                                )}
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
