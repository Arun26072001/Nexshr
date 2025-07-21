import React, { useContext, useEffect, useState } from 'react'
import { Dropdown, Input, Popover, SelectPicker, Whisper } from 'rsuite'
import { fetchTeams } from './ReuseableAPI';
import "./projectndTask.css";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { EssentialValues } from '../App';
import axios from 'axios';
import { toast } from 'react-toastify';
import CommonModel from './Administration/CommonModel';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import NoDataFound from './payslip/NoDataFound';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import RemoveRedEyeRoundedIcon from '@mui/icons-material/RemoveRedEyeRounded';
import { jwtDecode } from 'jwt-decode';
import { TimerStates } from './payslip/HRMDashboard';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@mui/material';
import defaultProfile from "../imgs/male_avatar.webp";

export default function Projects() {
    const navigate = useNavigate();
    const { whoIs, data,
        // socket 
    } = useContext(EssentialValues);
    const { isTeamLead, isTeamHead, isTeamManager } = jwtDecode(data.token);
    const { handleAddTask, employees } = useContext(TimerStates);
    const [teams, setTeams] = useState([]);
    const [errorData, setErrorData] = useState("");
    const [isDelete, setIsDelete] = useState({ type: false, value: "" });
    const [isEdit, setIsEdit] = useState(false);
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState(localStorage.getItem("selectedCompany"));
    const [filterProjects, setFilterProjects] = useState([]);
    const [projectObj, setProjectObj] = useState({});
    const [isAddProject, setIsAddProject] = useState(false);
    const [isViewProject, setIsViewProject] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const url = process.env.REACT_APP_API_URL;
    const [companies, setCompanies] = useState([]);
    const [isWorkingApi, setIsWorkingApi] = useState(false);

    // Fetch companies data
    const fetchCompanies = async () => {
        try {
            const response = await axios.get(url + "/api/company", {
                headers: {
                    authorization: data.token || ""
                }
            });
            setCompanies(response.data.map((company) => ({ label: company.CompanyName, value: company._id })));
        } catch (err) {
            console.error("Error fetching companies:", err.message || err);
        }
    };

    function handleAddProject() {
        if (isAddProject) {
            setProjectObj({});
            setErrorData("");
        }
        setIsAddProject(!isAddProject);
    }

    function handleDeleteProject() {
        setIsDelete((pre) => ({
            ...pre,
            type: !pre.type
        }));
    }

    function changeProject(value, name) {
        setProjectObj((pre) => ({
            ...pre,
            [name]: value
        }))
    }

    async function fetchProjectById(id) {
        try {
            const res = await axios.get(`${url}/api/project/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setProjectObj(res.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
        }
    }

    async function fetchProjects() {
        try {
            setIsLoading(true)
            const res = await axios.get(`${url}/api/project`, {
                headers: {
                    Authorization: data.token || ""
                }
            })

            setProjects(res.data);
            setFilterProjects(res.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
        } finally {
            setIsLoading(false)
        }
    }

    async function fetchEmpsProjects() {
        setIsLoading(true)
        try {
            const res = await axios.get(`${url}/api/project/emp/${data._id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })

            setProjects(res.data);
            setFilterProjects(res.data);
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
        }
        setIsLoading(false)
    }

    async function updateProject() {
        setIsWorkingApi(true);
        setErrorData("")
        try {
            const res = await axios.put(`${url}/api/project/${data._id}/${projectObj?._id}`, projectObj, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            setIsEdit(false)
            setIsAddProject(false)
            setProjectObj({})
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            setErrorData(error.response.data.error)
            toast.error(error?.response?.data?.error)
        }
        setIsWorkingApi(false);
    }

    async function addProject() {
        setIsWorkingApi(true);
        setErrorData("")
        try {
            let newProjectObj = {
                ...projectObj,
                "employees": Array.isArray(projectObj?.employees) && projectObj.employees.includes(data._id)
                    ? projectObj.employees
                    : [...(projectObj?.employees || []), data._id]
            }
            const res = await axios.post(`${url}/api/project/${data._id}`, newProjectObj, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            // socket.emit("send_notification_for_project", newProjectObj)
            setProjectObj({});
            handleAddProject();
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            setErrorData(error.response.data.error)
            toast.error(error?.response?.data?.error)
        }
        setIsWorkingApi(false);
    }


    function filterByName(name) {
        localStorage.setItem("selectedCompany", name)
        setName(name);
        if (["", null].includes(name)) {
            setProjects(filterProjects)
        } else {
            setProjects(filterProjects.filter((project) => project.name.toLowerCase().includes(name?.toLowerCase()) || project.status.includes(name) || project?.company?._id?.includes(name)))
        }
    }

    async function deleteProject() {
        try {
            const res = await axios.delete(`${url}/api/project/${isDelete.value}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            handleDeleteProject()
        } catch (error) {
            if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
        }
    }

    function handleDelete(data) {
        setIsDelete((pre) => ({
            ...pre,
            value: data._id
        }))
        handleDeleteProject()

    }

    function handleEditProject() {
        if (isEdit) {
            setProjectObj({});
            setErrorData("");
        }
        setIsEdit(!isEdit);
    }

    function handleViewProject() {
        if (isViewProject) {
            setProjectObj({});
            setErrorData("");
        }
        setIsViewProject(!isViewProject)
    }

    useEffect(() => {
        fetchCompanies();
    }, [])

    useEffect(() => {
        const gettingsTeams = async () => {
            try {
                const teamsData = await fetchTeams();
                setTeams(teamsData.map((data) => ({ label: data.teamName, value: data._id })));
            } catch (err) {
                console.log(err);
            }
        }
        gettingsTeams();
    }, [])
    useEffect(() => {
        if (whoIs === "admin" || isTeamLead || isTeamHead) {
            fetchProjects();
        } else {
            fetchEmpsProjects()
        }
    }, [isAddProject, isDelete.type, isEdit])
    const renderMenu = (project) => ({ onClose, right, top, className }, ref) => {
        const handleSelect = (eventKey) => {
            if (eventKey === 1) {
                if (project._id) {
                    fetchProjectById(project._id)
                }
                handleAddProject();
            } else if (eventKey === 2) {
                handleDelete(project); // Use project data here
            } else {
                fetchProjectById(project._id);
                handleViewProject();
            }
            onClose();
        };

        return (
            <Popover ref={ref} className={className} style={{ right, top }}>
                <Dropdown.Menu onSelect={handleSelect} title="Personal Settings">
                    <Dropdown.Item eventKey={1}>
                        <b>
                            <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                        </b>
                    </Dropdown.Item>
                    <Dropdown.Item eventKey={2}>
                        <b>
                            <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Put in the trash
                        </b>
                    </Dropdown.Item>
                    <Dropdown.Item eventKey={3}>
                        <b>
                            <RemoveRedEyeRoundedIcon sx={{ color: "#80C4E9" }} /> View
                        </b>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Popover>
        );
    };


    return (
        isViewProject ? <CommonModel type="Project View" errorMsg={errorData} comps={companies} teams={teams} isAddData={isViewProject} employees={employees} dataObj={projectObj} modifyData={handleViewProject} /> :
            isEdit ? <CommonModel type="Assign" isAddData={isEdit} isWorkingApi={isWorkingApi} employees={employees} changeData={changeProject} dataObj={projectObj} editData={updateProject} modifyData={handleEditProject} /> :
                isDelete.type ? <CommonModel type="Project Confirmation" modifyData={handleDeleteProject} deleteData={deleteProject} isAddData={isDelete} /> :
                    isAddProject ? <CommonModel
                        comps={companies}
                        errorMsg={errorData}
                        dataObj={projectObj}
                        isAddData={isAddProject}
                        changeData={changeProject}
                        teams={teams}
                        addData={addProject}
                        isWorkingApi={isWorkingApi}
                        type="Project"
                        editData={updateProject}
                        employees={employees}
                        modifyData={handleAddProject} />
                        : <>
                            <div className="projectParent">
                                <div className="projectTitle col-lg-6 col-12">Projects</div>
                                <div className="col-lg-6 col-12 projectChild justify-content-end gap-1">
                                    <SelectPicker
                                        data={companies}
                                        size="lg"
                                        appearance="default"
                                        style={{ width: "300px" }}
                                        placeholder="Search By Company"
                                        onChange={filterByName}
                                        value={name}
                                    />
                                    {
                                        ["admin", "hr"].includes(whoIs) || [isTeamHead, isTeamLead, isTeamManager].includes(true) &&
                                        <div className="button" onClick={handleAddProject}>
                                            + Add Project
                                        </div>
                                    }
                                </div>
                            </div>

                            <div className="projectBody" style={{ justifyContent: "end" }}>
                                <div className="row d-flex justify-content-end mb-2">
                                    <div className="col-lg-3">
                                        <div className="modelInput">
                                            <SelectPicker
                                                required
                                                data={['Not Started', 'In Progress', 'Completed', 'On Hold'].map((status) => ({
                                                    label: status,
                                                    value: status,
                                                }))}
                                                size="lg"
                                                appearance="default"
                                                style={{ width: "100%" }}
                                                onChange={filterByName}
                                                value={name}
                                                placeholder="Search by Status"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-lg-3">
                                        <div className="modelInput">
                                            <Input size="lg" appearance="default" placeholder="Search" onChange={filterByName} />
                                        </div>
                                    </div>
                                </div>
                                <div className="container">
                                    <div className="row mx-2">
                                        {isLoading ? [...Array(3)].map(((_, index) => {
                                            return <Skeleton variant='rounded' key={index} width={280} height={250} className='m-2' />
                                        })) :
                                            projects?.length > 0 ? (
                                                projects?.map((project) => (
                                                    <div key={project._id} className="col-lg-4 col-md-6 mb-4">
                                                        <div className="box-content">
                                                            <div className="progress my-2">
                                                                <div
                                                                    className="progress-bar progress-bar-striped"
                                                                    role="progressbar"
                                                                    style={{ width: `${project.progress || 0}%` }}
                                                                    aria-valuenow={project.progress || 0}
                                                                    aria-valuemin="0"
                                                                    aria-valuemax="100"
                                                                ></div>
                                                            </div>
                                                            <div className="projectDetails my-3">
                                                                <h5>
                                                                    ({project.prefix}) - {project.name}
                                                                </h5>
                                                                <span style={{ cursor: "pointer" }}>
                                                                    <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu(project)}>
                                                                        <MoreVertIcon />
                                                                    </Whisper>
                                                                </span>
                                                            </div>
                                                            <div className="projectDetails m-0">
                                                                <span className="defaultDesign">({project.status})</span>
                                                                <span>
                                                                    <b>{project?.pendingTasks?.length || 0}</b> Pending Task(s)
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="d-flex justify-content-end"
                                                                style={{ color: "#6c757d" }}
                                                            >
                                                                Client: {project?.company?.CompanyName}
                                                            </div>
                                                            <div className="d-flex align-items-center gap-2 my-3 flex-wrap" >
                                                                {project?.employees?.slice(0, 4).map((emp) => (
                                                                    <div className="nameHolder" style={{ width: "35px", height: "35px", background: "none" }} key={emp?._id} title={`${emp.FirstName + " " + emp.LastName}`}>
                                                                        <img src={emp?.profile || defaultProfile} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt={`${emp.FirstName + " " + emp.LastName}`} />
                                                                    </div>
                                                                ))} {
                                                                    (Array.isArray(project.employees) && project.employees.length > 4 ? "..." : "")
                                                                }
                                                                <AddCircleOutlineRoundedIcon fontSize="large" sx={{ cursor: "pointer" }} color="disabled" onClick={() => {
                                                                    fetchProjectById(project._id)
                                                                    handleEditProject()
                                                                }} />
                                                            </div>

                                                            <div className='w-100' onClick={() => {
                                                                navigate(`/${whoIs}/tasks`)
                                                                handleAddTask(project._id)
                                                            }} >
                                                                <button className='button' style={{ background: "#4b70f5", width: "100%", padding: "6px" }}>Add Task</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <NoDataFound message={"Project Not Found"} />
                                            )}
                                    </div>
                                </div>

                            </div >
                        </>
    )
}
