import React, { useContext, useEffect, useState } from 'react';
import "./projectndTask.css"
import { Input, SelectPicker } from 'rsuite';
import LeaveTable from './LeaveTable';
import { EssentialValues } from '../App';
import axios from 'axios';
import NoDataFound from './payslip/NoDataFound';
import Loading from './Loader';
import CommonModel from './Administration/CommonModel';
import { toast } from 'react-toastify';
import { getDepartments } from './ReuseableAPI';
import { Skeleton } from '@mui/material';

export default function Reports() {
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const [employees, setEmployees] = useState([]);
    const [empId, setEmpId] = useState(data?._id);
    const [reports, setReports] = useState([]);
    const [reportObj, setReportObj] = useState({});
    const [filterReports, setFilterReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddReport, setIsAddReport] = useState(false);
    const [isViewReport, setIsViewReport] = useState(false);
    const [isEditReport, setIsEditReport] = useState(false);
    const [isDeleteReport, setIsDeleteReport] = useState({ type: false, value: [] });
    const [departments, setDepartments] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isWorkingApi, setIsWorkingApi] = useState(false);

    async function fetchProjects() {
        try {
            const res = await axios.get(`${url}/api/project`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setProjects(res.data.map((project) => ({ label: project.name, value: project._id })));
        } catch (error) {
            toast.error(error.response.data.error)
        }
    }

    function handleEditReport() {
        if (isEditReport) {
            setReportObj({})
        }
        setIsEditReport(!isEditReport)
    }

    function handleDeleteReport() {
        setIsDeleteReport((pre) => ({
            ...pre,
            type: !pre.type
        }));
    }

    function handleDelete(data) {
        setIsDeleteReport((pre) => ({
            ...pre,
            value: [data._id, data.project]
        }))
        handleDeleteReport()
    }

    async function deleteReport() {
        try {
            const res = await axios.delete(`${url}/api/report/${isDeleteReport.value[0]}/${isDeleteReport.value[1]}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            handleDeleteReport();
        } catch (error) {
            console.log(error);

        }
    }

    // Fetch companies data
    const fetchCompanies = async () => {
        try {
            const response = await axios.get(url + "/api/company", {
                headers: {
                    authorization: data.token || ""
                }
            });
            setCompanies(response.data.map((data) => ({ label: data.CompanyName, value: data._id })));
        } catch (err) {
            console.error("Error fetching companies:", err.message || err);
        }
    };

    function handleAddReport() {
        setIsAddReport(!isAddReport);
    }

    function changeReport(value, name) {
        setReportObj((pre) => ({
            ...pre,
            [name]: value
        }))
    }

    function filterByName(value) {
        if (["", null].includes(value)) {
            setReports(filterReports)
        } else {
            setReports(filterReports.filter((report) => report?.name?.includes(value)))
        }
    }

    async function addReport() {
        setIsWorkingApi(true);
        try {
            let newReportObj = {
                ...reportObj,
                employees: Array.isArray(reportObj?.employees) && reportObj.employees.includes(data._id)
                    ? reportObj.employees
                    : [...(reportObj?.employees || []), data._id]
            }
            const res = await axios.post(`${url}/api/report/${data._id}`, newReportObj, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            handleAddReport();
            setReportObj({});
            toast.success(res.data.message);
        } catch (error) {
            console.log(error);

            // toast.error(error.response.data.error);
        } finally {
            setIsWorkingApi(false);
        }
    }


    async function editReport(updatedReport) {
        setIsWorkingApi(true);
        try {
            const res = await axios.put(`${url}/api/report/${data._id}/${updatedReport._id}`, updatedReport, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setIsAddReport(false);
            setIsEditReport(false)
            setReportObj({});
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response.data.error)
        }
        setIsWorkingApi(false);
    }

    async function fetchDepartments() {
        try {
            const res = await getDepartments();
            setDepartments(res.map((dept) => ({ label: dept.DepartmentName, value: dept._id })));
        } catch (error) {
            console.log(error);
        }
    }

    function handleViewReport() {
        setIsViewReport(!isViewReport)
    }

    async function fetchReportById(id, type) {
        if (type === "Cancel") {
            setReportObj({});
            handleViewReport();
        } else {

            try {
                const res = await axios.get(`${url}/api/report/${id}`, {
                    headers: {
                        Authorization: data.token || ""
                    }
                })
                setReportObj(res.data);
                if (type === "Edit") {
                    handleEditReport();
                } else if (type === "View") {
                    handleViewReport()
                }
            } catch (error) {
                console.log(error);
            }
        }
    }

    async function fetchProjectEmps() {
        try {
            const res = await axios.get(`${url}/api/project/employees/${reportObj?.project}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setEmployees(res.data.map((emp) => ({ label: emp.FirstName + " " + emp.LastName, value: emp._id })))
        } catch (error) {
            console.log("error in fetch employess", error);
        }
    }

    // fetch prject of employees
    useEffect(() => {
        if (reportObj?.project) {
            fetchProjectEmps()
        }
    }, [reportObj?.project])

    useEffect(() => {
        async function fetchReportsByEmp() {
            setIsLoading(true);
            try {
                const res = await axios.get(`${url}/api/report/createdby/${empId}`, {
                    headers: {
                        Authorization: data.token || ""
                    }
                })
                setReports(res.data.reports);
                setFilterReports(res.data.reports);
            } catch (error) {
                console.log(error);
            }
            setIsLoading(false)
        }
        if (empId) {
            fetchReportsByEmp()
        }
        fetchDepartments();
        fetchCompanies();
        fetchProjects();
    }, [empId, isAddReport, isEditReport, isDeleteReport.type])

    return (
        isViewReport ? <CommonModel type="Report View" isAddData={isViewReport} modifyData={fetchReportById} dataObj={reportObj} projects={projects} comps={companies} departments={departments} employees={employees} /> :
            isDeleteReport.type ? <CommonModel type="Report Confirmation" modifyData={handleDeleteReport} deleteData={deleteReport} isAddData={isDeleteReport.type} /> :
                isAddReport ? <CommonModel type="Report" isWorkingApi={isWorkingApi} isAddData={isAddReport} projects={projects} comps={companies} departments={departments} modifyData={handleAddReport} changeData={changeReport} addData={addReport} dataObj={reportObj} editData={editReport} employees={employees} /> :
                    isEditReport ? <CommonModel type="Report" isWorkingApi={isWorkingApi} isAddData={isEditReport} projects={projects} comps={companies} departments={departments} modifyData={handleEditReport} changeData={changeReport} dataObj={reportObj} editData={editReport} employees={employees} /> :
                        <>
                            <div className="projectParent">
                                <div className="projectTitle col-lg-6 ">Reports</div>
                                <div className="col-lg-6 projectChild">
                                    <SelectPicker
                                        data={employees}
                                        size="lg"
                                        appearance="default"
                                        style={{ width: 300 }}
                                        placeholder="Search By Created Person"
                                        value={empId}
                                        onChange={(e) => setEmpId(e)}
                                    />
                                    <div className="button" onClick={handleAddReport}>
                                        New Report +
                                    </div>
                                </div>
                            </div >
                            <div className="projectBody">
                                <div className="d-flex justify-content-end">
                                    <div className="col-lg-3">
                                        <div className="modelInput">
                                            <Input size="lg" appearance="default" placeholder="Search" onChange={filterByName} />
                                        </div>
                                    </div>
                                </div>
                                {
                                    isLoading ? <Skeleton
                                        sx={{ bgcolor: 'grey.500' }}
                                        variant="rectangular"
                                        width={"100%"}
                                        height={"50vh"}
                                    /> :
                                        reports.length > 0 ?
                                            <LeaveTable data={reports} handleDelete={handleDelete} fetchReportById={fetchReportById} />
                                            : <NoDataFound message={"Reports Not Found"} />
                                }
                            </div>
                        </>
    )
}
