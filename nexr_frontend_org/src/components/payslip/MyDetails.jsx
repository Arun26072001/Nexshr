import React, { useContext, useEffect, useState } from "react"
import { fetchEmployeeData } from "../ReuseableAPI";
import { EssentialValues } from "../../App";
import NoDataFound from "./NoDataFound";

const MyDetails = () => {
    const [empObj, setEmpObj] = useState({});
    const [error, setError] = useState("");
    const { data } = useContext(EssentialValues);

    useEffect(() => {
        async function getEmp() {
            try {
                const empData = await fetchEmployeeData(data._id);
                setEmpObj(empData);
            } catch (error) {
                setError(error.response.data.error);
            }
        }
        getEmp();
    }, [])

    return (
        error ? <NoDataFound message={error} /> :
            <div>
                <p className="sub_title">
                    Personal Details
                </p>
                <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                    <li>Name : {empObj?.FirstName[0]?.toUpperCase() + empObj?.FirstName?.slice(1)} {empObj.LastName}</li>
                    <li>Email : {empObj?.Email}</li>
                    <li>DOB : {empObj?.DOB.split("T")[0]}</li>
                    <li>Phone : {empObj?.countryCode} {empObj.phone}</li>
                    <li>Gender: {empObj?.gender}</li>
                </ul>

                <p className="sub_title">
                    Employement Details
                </p>
                <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                    <li>Role: {empObj.role[0].RoleName}</li>
                    <li>Position: {empObj.position[0].PositionName}</li>
                    <li>Department: {empObj.department[0].DepartmentName}</li>
                    <li>Employement Type: {empObj.employmentType}</li>
                    <li>DOJ: {empObj.dateOfJoining}</li>
                </ul>

                <p className="sub_title">
                    Job Details
                </p>
                <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                    <li>Worktime Pattern : {empObj.workingTimePattern.PatternName} ({empObj.workingTimePattern.StartingTime} - {empObj.workingTimePattern.FinishingTime})</li>
                    <li>Manager : {empObj?.managerId[0]?.FirstName[0].toUpperCase() + empObj?.managerId[0]?.FirstName[0].toUpperCase()}</li>
                    <li>Team Lead : {empObj?.teamLead[0]?.FirstName[0].toUpperCase() + empObj?.teamLead[0]?.FirstName[0].toUpperCase()}</li>
                    <li>Description : {empObj.description}</li>
                    <li>AnnualLeave Year start Date: {empObj.annualLeaveYearStart.split("T")[0]}</li>
                </ul>

                <p className="sub_title">
                    AnnualLeave Entitlement
                </p>
                <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                    {
                        Object.entries(empObj.typesOfLeaveCount).map(([key, value]) => {
                            return <li>{key} : {value}</li>
                        })
                    }
                </ul>
                <p className="sub_title">
                    Bank Details
                </p>
                <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                    <li>Basic Salary : {empObj.basicSalary}</li>
                    <li>Account No : {empObj.accountNo}</li>
                    <li>Bank Name : {empObj.bankName}</li>
                    <li>IFSC Code : {empObj.IFSCcode}</li>
                </ul>
                <p className="sub_title">
                    Payslip Details
                </p>
                <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                    {
                        Object.entries(empObj.payslipFields).map(([key, value]) => {
                            return <li>{key[0].toUpperCase() + key.slice(1)} : {value}</li>
                        })
                    }
                </ul>
            </div>
    )
};

export default MyDetails;
