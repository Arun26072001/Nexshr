import React, { useContext, useEffect, useState } from 'react'
import { Dropdown, Input, Popover, SelectPicker, Whisper } from 'rsuite'
import { fetchEmployees, fetchTeams } from './ReuseableAPI';
import "./projectndTask.css";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { EssentialValues } from '../App';
import axios from 'axios';
import { toast } from 'react-toastify';
import CommonModel from './Administration/CommonModel';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import Loading from './Loader';
import NoDataFound from './payslip/NoDataFound';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

export default function Projects() {
    const { whoIs, data } = useContext(EssentialValues);
    const [teams, setTeams] = useState([]);
    const [isDelete, setIsDelete] = useState({ type: false, value: "" });
    const [isEdit, setIsEdit] = useState(false);
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState("");
    const [filterProjects, setFilterProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [projectObj, setProjectObj] = useState({});
    const [isAddProject, setIsAddProject] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const url = process.env.REACT_APP_API_URL;
    const [companies, setCompanies] = useState([]);

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

    function handleAddProject() {
        setIsAddProject(!isAddProject);
    }

    function handleDeleteProject() {
        setIsDelete((pre) => ({
            ...pre,
            type: !pre.type
        }));
    }

    function changeProject(value, name) {
        console.log(value, name);
        setProjectObj((pre) => ({
            ...pre,
            [name]: value
        }))
    }

    async function gettingEmps() {
        try {
            const emps = await fetchEmployees();
            setEmployees(emps.map((emp) => ({ label: emp.FirstName + " " + emp.LastName, value: emp._id })))
        } catch (error) {
            console.log(error);

        }
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
            toast.error(error.response.data.error)
        }
    }

    async function fetchProjects() {
        setIsLoading(true)
        try {
            const res = await axios.get(`${url}/api/project`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setProjects(res.data);
            setFilterProjects(res.data);
        } catch (error) {
            toast.error(error.response.data.error)
        }
        setIsLoading(false)
    }

    async function updateProject() {
        try {
            const res = await axios.put(`${url}/api/project/${projectObj?._id}`, projectObj, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            setIsEdit(false)
            setIsAddProject(false)
            setProjectObj({})
        } catch (error) {
            toast.error(error.response.data.error)
        }
    }

    async function addProject() {
        try {
            const res = await axios.post(`${url}/api/project/${data._id}`, projectObj, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            setProjectObj({});
            handleAddProject();
        } catch (error) {
            toast.error(error.response.data.error)
        }
    }

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
        // fetchProjects();
        if (whoIs === "admin") {
            fetchProjects();
            gettingEmps();
        }
    }, [isAddProject, isDelete.type, isEdit])

    function filterByName(name) {

        setName(name);
        if (["", null].includes(name)) {
            setProjects(filterProjects)
        } else {
            setProjects(filterProjects.filter((project) => project.name.toLowerCase().includes(name?.toLowerCase()) || project.status.includes(name) || project.company._id.includes(name)))
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
            toast.error(error.response.data.error)
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
        setIsEdit(!isEdit)
    }

    useEffect(() => {
        fetchCompanies();
    }, [])

    const renderMenu = (project) => ({ onClose, right, top, className }, ref) => {
        const handleSelect = (eventKey) => {
            if (eventKey === 1) {
                if (project._id) {
                    fetchProjectById(project._id)
                }
                handleAddProject();
            } else if (eventKey === 2) {
                handleDelete(project); // Use project data here
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
                            <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Delete
                        </b>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Popover>
        );
    };

    return (
        isEdit ? <CommonModel type="Assign" isAddData={isEdit} emps={employees} changeData={changeProject} dataObj={projectObj} editData={updateProject} modifyData={handleEditProject} /> :
            isDelete.type ? <CommonModel type="Confirmation" modifyData={handleDeleteProject} deleteData={deleteProject} isAddData={isDelete} /> :
                isAddProject ? <CommonModel
                    comps={companies}
                    dataObj={projectObj}
                    isAddData={isAddProject}
                    changeData={changeProject}
                    teams={teams}
                    addData={addProject}
                    type="Project"
                    editData={updateProject}
                    emps={employees}
                    modifyData={handleAddProject} />
                    : isLoading ? < Loading /> : <>
                        <div className="projectParent">
                            <div className="projectTitle col-lg-6">Projects</div>
                            <div className="col-lg-6 projectChild">
                                <SelectPicker
                                    data={companies}
                                    size="lg"
                                    appearance="default"
                                    style={{ width: 300 }}
                                    placeholder="Search By Company"
                                    onChange={filterByName}
                                    value={name}
                                />
                                <div className="button" onClick={handleAddProject}>
                                    + Add Project
                                </div>
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
                                    {projects.length > 0 ? (
                                        projects.map((project) => (
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
                                                    <div className="d-flex align-items-center gap-2 my-3">
                                                        {project.employees.map((emp) => (
                                                            <div className="nameHolder" style={{ width: "35px", height: "35px" }} key={emp._id}>
                                                                {emp.FirstName[0].toUpperCase() +
                                                                    emp.LastName[0].toUpperCase()}
                                                            </div>
                                                        ))}
                                                        <AddCircleOutlineRoundedIcon fontSize="large" sx={{ cursor: "pointer" }} color="disabled" onClick={() => {
                                                            fetchProjectById(project._id)
                                                            handleEditProject()
                                                        }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <NoDataFound message={"Project Not Found"} />
                                    )}
                                </div>
                            </div>

                        </div>
                    </>
    )
}
