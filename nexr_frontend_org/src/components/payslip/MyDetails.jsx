import React, { useContext, useEffect, useState } from "react"
import { fetchEmployeeData } from "../ReuseableAPI";
import { EssentialValues } from "../../App";
import NoDataFound from "./NoDataFound";
import { Skeleton } from "@mui/material";

const MyDetails = () => {
    const [empObj, setEmpObj] = useState({});
    const [error, setError] = useState("");
    const { data } = useContext(EssentialValues);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function getEmp() {
            setIsLoading(true);
            try {
                const empData = await fetchEmployeeData(data._id);
                setEmpObj(empData);
            } catch (error) {
                setError(error.response.data.error);
            }
            setIsLoading(false);
        }
        if (data._id) {
            getEmp();
        }
    }, [data._id])

    return (
        error ? <NoDataFound message={error} /> :
            // isLoading ? <Loading height="80vh" /> :
            <div>

                {
                    isLoading ?
                        <>
                            {
                                [...Array(4)].map((_, index) => {
                                    return <Skeleton varient="text" key={index} height={50} width={index === 0 ? 250 : 200} />
                                })
                            }
                        </> :
                        empObj?.FirstName && empObj?.LastName && (
                            <>
                                <p className="sub_title">Personal Details</p>
                                <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                                    {empObj?.FirstName && empObj?.LastName && (
                                        <li>
                                            Name: {empObj?.FirstName[0]?.toUpperCase() + empObj?.FirstName?.slice(1)} {empObj.LastName}
                                        </li>
                                    )}
                                    {empObj?.Email && <li>Email: {empObj?.Email}</li>}
                                    {empObj?.DOB && <li>DOB: {empObj?.DOB.split("T")[0]}</li>}
                                    {empObj?.countryCode && empObj?.phone && <li>Phone: {empObj.countryCode} {empObj.phone}</li>}
                                    {empObj?.gender && <li>Gender: {empObj?.gender}</li>}
                                </ul>
                            </>
                        )
                }

                {isLoading ?
                    <div className="my-2">
                        {
                            [...Array(4)].map((_, index) => {
                                return <Skeleton varient="text" key={index} height={50} width={index === 0 ? 250 : 200} />
                            })
                        }
                    </div> :
                    empObj?.role && empObj?.position && empObj?.department && (
                        <>
                            <p className="sub_title">Employment Details</p>
                            <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                                {empObj.role?.[0]?.RoleName && <li>Role: {empObj.role[0].RoleName}</li>}
                                {empObj.position?.[0]?.PositionName && <li>Position: {empObj.position[0].PositionName}</li>}
                                {empObj.department?.[0]?.DepartmentName && <li>Department: {empObj.department[0].DepartmentName}</li>}
                                {empObj?.employmentType && <li>Employment Type: {empObj.employmentType}</li>}
                                {empObj?.dateOfJoining && <li>DOJ: {empObj.dateOfJoining}</li>}
                            </ul>
                        </>
                    )}

                {isLoading ?
                    <div className="my-2">
                        {
                            [...Array(4)].map((_, index) => {
                                return <Skeleton varient="text" key={index} height={50} width={index === 0 ? 250 : 200} />
                            })
                        }
                    </div> :
                    empObj?.workingTimePattern && (
                        <>
                            <p className="sub_title">Job Details</p>
                            <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                                {empObj.workingTimePattern?.PatternName &&
                                    empObj.workingTimePattern?.StartingTime &&
                                    empObj.workingTimePattern?.FinishingTime && (
                                        <li>
                                            Worktime Pattern: {empObj.workingTimePattern.PatternName} (
                                            {empObj.workingTimePattern.StartingTime} - {empObj.workingTimePattern.FinishingTime})
                                        </li>
                                    )}
                                {empObj?.team && empObj?.team.manager.length && (
                                    <li>
                                        Manager: {empObj?.team.manager.map((member) => (
                                            member.FirstName[0].toUpperCase() + member.FirstName.slice(1) + " ,"
                                        ))}
                                    </li>
                                )}
                                {empObj?.team && empObj?.team.lead.length && (
                                    <li>
                                        Lead: {empObj?.team.lead.map((member) => (
                                            member.FirstName[0].toUpperCase() + member.FirstName.slice(1) + " ,"
                                        ))}
                                    </li>
                                )}
                                {empObj?.team && empObj?.team.head.length && (
                                    <li>
                                        Head: {empObj?.team.head.map((member) => (
                                            member.FirstName[0].toUpperCase() + member.FirstName.slice(1) + " ,"
                                        ))}
                                    </li>
                                )}
                                {empObj?.description && <li>Description: {empObj.description}</li>}
                                {empObj?.annualLeaveYearStart && <li>Annual Leave Year Start Date: {empObj.annualLeaveYearStart.split("T")[0]}</li>}
                            </ul>
                        </>
                    )}

                {isLoading ?
                    <div className="my-2">
                        {
                            [...Array(4)].map((_, index) => {
                                return <Skeleton varient="text" key={index} height={50} width={index === 0 ? 250 : 200} />
                            })
                        }
                    </div> :
                    empObj?.typesOfLeaveCount && Object.keys(empObj.typesOfLeaveCount).length > 0 && (
                        <>
                            <p className="sub_title">Annual Leave Entitlement</p>
                            <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                                {Object.entries(empObj.typesOfLeaveCount).map(([key, value]) => (
                                    <li key={key}>{key[0].toUpperCase() + key.slice(1)}: {value}</li>
                                ))}
                            </ul>
                        </>
                    )}

                {isLoading ?
                    <div className="my-2">
                        {
                            [...Array(4)].map((_, index) => {
                                return <Skeleton varient="text" key={index} height={50} width={index === 0 ? 250 : 200} />
                            })
                        }
                    </div> : empObj?.basicSalary && empObj?.accountNo && empObj?.bankName && empObj?.IFSCcode && (
                        <>
                            <p className="sub_title">Bank Details</p>
                            <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                                {empObj.basicSalary && <li>Basic Salary: {empObj.basicSalary}</li>}
                                {empObj.accountNo && <li>Account No: {empObj.accountNo}</li>}
                                {empObj.bankName && <li>Bank Name: {empObj.bankName}</li>}
                                {empObj.IFSCcode && <li>IFSC Code: {empObj.IFSCcode}</li>}
                            </ul>
                        </>
                    )}

                {isLoading ?
                    <div className="my-2">
                        {
                            [...Array(4)].map((_, index) => {
                                return <Skeleton varient="text" key={index} height={50} width={index === 0 ? 250 : 200} />
                            })
                        }
                    </div> :
                    empObj?.payslipFields && Object.keys(empObj.payslipFields).length > 0 && (
                        <>
                            <p className="sub_title">Payslip Details</p>
                            <ul className="my-3 list_style" style={{ listStyleType: "disc" }}>
                                {Object.entries(empObj.payslipFields).map(([key, value]) => (
                                    <li key={key}>{key[0].toUpperCase() + key.slice(1)}: {value}</li>
                                ))}
                            </ul>
                        </>
                    )}
            </div>

    )
};

export default MyDetails;
