import React, { useContext, useEffect, useState } from 'react';
import "./projectndTask.css"
import { SelectPicker } from 'rsuite';
import LeaveTable from './LeaveTable';
import { EssentialValues } from '../App';
import axios from 'axios';
import NoDataFound from './payslip/NoDataFound';
import Loading from './Loader';
import CommonModel from './Administration/CommonModel';
import { toast } from 'react-toastify';
import { getDepartments } from './ReuseableAPI';

export default function Reports({ employees }) {
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const [empId, setEmpId] = useState(data?._id);
    const [reports, setReports] = useState([]);
    const [reportObj, setReportObj] = useState({});
    const [filterReports, setFilterReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddReport, setIsAddReport] = useState(false);
    const [isEditReport, setIsEditReport] = useState(false);
    const [isDeleteReport, setIsDeleteReport] = useState({ type: false, value: "" });
    const [departments, setDepartments] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [projects, setProjects] = useState([]);

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
        setIsEditReport(!isEditReport)
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
        console.log(value, name);
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
        try {
            const res = await axios.post(`${url}/api/report/${data._id}`, reportObj, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            handleAddReport();
            setReportObj({});
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.reponse.data.error);
        }
    }


    async function editReport(updatedReport) {
        try {
            const res = await axios.put(`${url}/api/report/${updatedReport._id}`, updatedReport, {
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
    }

    async function fetchDepartments() {
        try {
            const res = await getDepartments();
            setDepartments(res.map((dept) => ({ label: dept.DepartmentName, value: dept._id })));
        } catch (error) {
            console.log(error);
        }
    }

    async function fetchReportById(id) {
        try {
            const res = await axios.get(`${url}/api/report/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setReportObj(res.data);
            handleEditReport();
        } catch (error) {
            console.log(error);
        }
    }

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
    }, [empId, isAddReport, isEditReport])

    return (
        isAddReport ? <CommonModel type="Report" isAddData={isAddReport} projects={projects} comps={companies} departments={departments} modifyData={handleAddReport} changeData={changeReport} addData={addReport} dataObj={reportObj} editData={editReport} employees={employees} /> :
            isEditReport ? <CommonModel type="Report" isAddData={isEditReport} projects={projects} comps={companies} departments={departments} modifyData={handleEditReport} changeData={changeReport} dataObj={reportObj} editData={editReport} employees={employees} /> :
                <>
                    <div className="projectParent ">
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
                        {
                            isLoading ? <Loading /> :
                                reports.length > 0 ?
                                    <LeaveTable data={reports} fetchReportById={fetchReportById} />
                                    : <NoDataFound message={"Reports Not Found"} />
                        }
                    </div>
                </>
    )
}
