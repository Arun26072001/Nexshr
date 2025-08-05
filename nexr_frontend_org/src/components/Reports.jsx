import React, { useContext, useEffect, useState } from 'react';
import "./projectndTask.css"
import { Input, SelectPicker } from 'rsuite';
import LeaveTable from './LeaveTable';
import { EssentialValues } from '../App';
import axios from 'axios';
import NoDataFound from './payslip/NoDataFound';
import CommonModel from './Administration/CommonModel';
import { toast } from 'react-toastify';
import { fetchTeamEmps, fileUploadInServer, getDepartments } from './ReuseableAPI';
import { Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function Reports() {
    const navigate = useNavigate();
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const { isTeamLead, isTeamHead, isTeamManager } = jwtDecode(data.token);
    const [employees, setEmployees] = useState([]);
    const [empId, setEmpId] = useState(data?._id);
    const [reports, setReports] = useState([]);
    const [teamsEmps, setTeamEmps] = useState([]);
    const [reportObj, setReportObj] = useState({});
    const [errorData, setErrorData] = useState("");
    const [filterReports, setFilterReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddReport, setIsAddReport] = useState(false);
    const [isViewReport, setIsViewReport] = useState(false);
    const [isEditReport, setIsEditReport] = useState(false);
    const [previewList, setPreviewList] = useState([]);
    const [isDeleteReport, setIsDeleteReport] = useState({ type: false, value: [] });
    const [tasks, setTasks] = useState([]);
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
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
        }
    }

    function handleEditReport() {
        if (isEditReport) {
            setReportObj({});
            setErrorData("");
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
            value: [data._id, data.project._id]
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
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error.response.data.error)
            console.log("error in delete report", error);
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
        if (isAddReport) {
            setReportObj({});
            setErrorData("")
        }
        setIsAddReport(!isAddReport);
    }

    function removeAttachment(value, fileIndex) {
        const updatedPreviewList = previewList.filter((imgFile) => imgFile !== value);
        setPreviewList(updatedPreviewList);

        const updatedAttachments = (reportObj.attachments || []).filter((file, index) => index !== fileIndex);
        setReportObj(prev => ({
            ...prev,
            attachments: updatedAttachments
        }));
    }

    function changeReport(value, name) {
        if (name === "attachments" || name.includes("attachments")) {
            const files = Array.from(value.target.files); // Ensure it's a FileList or array of files
            const imgUrls = files.map(file => URL.createObjectURL(file));

            setPreviewList(prev => [...prev, ...imgUrls]);

            setReportObj(prev => ({
                ...prev,
                attachments: [...(prev.attachments || []), ...files]
            }));
        } else {
            setReportObj(prev => ({
                ...prev,
                [name]: value
            }));
        }
    }

    function filterByName(value) {
        if (["", null].includes(value)) {
            setReports(filterReports)
        } else {
            setReports(filterReports.filter((report) => report?.name.toLowerCase()?.includes(value.toLowerCase())))
        }
    }

    async function addReport() {
        setIsWorkingApi(true);
        setErrorData("");
        try {
            let newReportObj = {
                ...reportObj,
                employees: Array.isArray(reportObj?.employees) && reportObj.employees.includes(data._id)
                    ? reportObj.employees
                    : [...(reportObj?.employees || []), data._id]
            };

            // Upload attachments if present in reportObj
            if (reportObj?.attachments?.length > 0) {
                try {
                    const files = reportObj.attachments;
                    const responseData = await fileUploadInServer(files);

                    newReportObj = {
                        ...newReportObj,
                        attachments: responseData.files.map(file => file.originalFile)
                    };
                } catch (error) {
                    if (error?.message === "Network Error") {
                        navigate("/network-issue");
                    }
                    console.error("Upload error:", error);
                    toast.error("File upload failed");
                }
            }

            const res = await axios.post(`${url}/api/report/${data._id}`, newReportObj, {
                headers: {
                    Authorization: data.token || ""
                }
            });

            handleAddReport();
            setReportObj({});
            toast.success(res.data.message);
        } catch (error) {
            console.log("error in add report", error);
            if (error?.message === "Network Error") {
                navigate("/network-issue");
            }
            const errorMsg = error?.response?.data?.error;
            setErrorData(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsWorkingApi(false);
        }
    }


    async function editReport(updatedReport) {
        setIsWorkingApi(true);
        setErrorData("");

        try {
            let updatedReportObj = {
                ...updatedReport,
                employees: Array.isArray(updatedReport?.employees) && updatedReport.employees.includes(data._id)
                    ? updatedReport.employees
                    : [...(updatedReport?.employees || []), data._id]
            };

            // If there are new attachments to upload
            if (updatedReport?.attachments?.length > 0) {
                try {
                    const files = updatedReport.attachments;

                    // If files contain objects with 'originalFile', assume already uploaded
                    const needsUpload = files.some(file => file instanceof File || file instanceof Blob);
                    if (needsUpload) {
                        const responseData = await fileUploadInServer(files);
                        updatedReportObj.attachments = responseData.files.map(file => file.originalFile);
                    }
                } catch (error) {
                    if (error?.message === "Network Error") {
                        navigate("/network-issue");
                    }
                    console.error("Upload error:", error);
                    toast.error("File upload failed");
                }
            }

            const res = await axios.put(
                `${url}/api/report/${data._id}/${updatedReport._id}`,
                updatedReportObj,
                {
                    headers: {
                        Authorization: data.token || ""
                    }
                }
            );

            setIsAddReport(false);
            setIsEditReport(false);
            setReportObj({});
            toast.success(res.data.message);
        } catch (error) {
            console.log("Error editing report", error);
            if (error?.message === "Network Error") {
                navigate("/network-issue");
            }
            const errorMsg = error?.response?.data?.error;
            setErrorData(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsWorkingApi(false);
        }
    }


    async function fetchEmpAssignedTasks() {
        try {
            const res = await axios.get(`${url}/api/task/assigned/${data._id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            const taskData = res.data;
            const empTasks = taskData.tasks || [];
            setTasks(empTasks?.map((task) => ({ label: `${task.title} (${task.status})`, value: task._id })));
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in fetch emp's tasks", error);
        }
    }

    function handleViewReport() {
        if (isViewReport) {
            setReportObj({});
            setErrorData("");
        }
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
                const report = res.data;
                if (report.attachments.length > 0) {
                    setPreviewList(report.attachments)
                }
                setReportObj(report);
                if (type === "Edit") {
                    handleEditReport();
                } else if (type === "View") {
                    handleViewReport()
                }
            } catch (error) {
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
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
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log("error in fetch employess", error);
        }
    }

    async function gettingTeamEmp() {
        const emps = await fetchTeamEmps();
        if (Array.isArray(emps) && emps.length > 0) {
            setEmployees(emps);
        }
    }

    // fetch prject of employees
    useEffect(() => {
        if (reportObj?.project) {
            fetchProjectEmps()
        } else {
            gettingTeamEmp()
        }
    }, [reportObj?.project])

    useEffect(() => {
        async function gettingTeamEmp() {
            const emps = await fetchTeamEmps();
            if (Array.isArray(emps) && emps.length > 0) {
                setTeamEmps(emps);
            }
        }
        if ([isTeamLead, isTeamHead, isTeamManager].includes(true)) {
            gettingTeamEmp();
        }
    }, [])

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
                if (error?.message === "Network Error") {
                    navigate("/network-issue")
                }
                console.log(error);
            }
            setIsLoading(false)
        }
        if (empId) {
            fetchReportsByEmp()
        }
        fetchEmpAssignedTasks();
        fetchCompanies();
        fetchProjects();
    }, [empId, isAddReport, isEditReport, isDeleteReport.type])
    console.log("previewList", previewList)
    return (
        isViewReport ? <CommonModel type="Report View" previewList={previewList} errorMsg={errorData} isAddData={isViewReport} modifyData={fetchReportById} dataObj={reportObj} projects={projects} comps={companies} tasks={tasks} employees={employees} /> :
            isDeleteReport.type ? <CommonModel type="Report Confirmation" modifyData={handleDeleteReport} deleteData={deleteReport} isAddData={isDeleteReport.type} /> :
                isAddReport ? <CommonModel type="Report" previewList={previewList} removeAttachment={removeAttachment} errorMsg={errorData} isWorkingApi={isWorkingApi} isAddData={isAddReport} projects={projects} comps={companies} tasks={tasks} modifyData={handleAddReport} changeData={changeReport} addData={addReport} dataObj={reportObj} editData={editReport} employees={employees} /> :
                    isEditReport ? <CommonModel type="Report" previewList={previewList} removeAttachment={removeAttachment} errorMsg={errorData} isWorkingApi={isWorkingApi} isAddData={isEditReport} projects={projects} comps={companies} tasks={tasks} modifyData={handleEditReport} changeData={changeReport} dataObj={reportObj} editData={editReport} employees={employees} /> :
                        <>
                            <div className="projectParent">
                                <div className="projectTitle col-lg-6 col-md-4 col-12">Reports</div>
                                <div className="col-lg-6 col-md-8 col-12 projectChild flex-wrap justify-content-end">
                                    {
                                        [isTeamLead, isTeamHead, isTeamManager].includes(true) ?
                                            <SelectPicker
                                                data={teamsEmps}
                                                size="lg"
                                                appearance="default"
                                                style={{ width: 300 }}
                                                placeholder="Search By Created Person"
                                                value={empId}
                                                onChange={(e) => setEmpId(e)}
                                            /> : null
                                    }
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
