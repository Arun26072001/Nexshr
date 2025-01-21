import React, { useContext, useEffect, useState } from 'react'
import { Input, SelectPicker } from 'rsuite'
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

export default function Projects() {
    const { whoIs, data } = useContext(EssentialValues);
    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState("");
    const [filterProjects, setFilterProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [projectObj, setProjectObj] = useState({});
    const [isAddProject, setIsAddProject] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const url = process.env.REACT_APP_API_URL;

    function handleAddProject() {
        setIsAddProject(!isAddProject);
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
    }, [isAddProject])

    function filterByName(name) {
        setName(name);
        if (["", null].includes(name)) {
            setProjects(filterProjects)
        } else {
            setProjects(filterProjects.filter((project) => project.name.toLowerCase().includes(name?.toLowerCase()) || project.status.includes(name)))
        }
    }

    return (

        isAddProject ? <CommonModel
            dataObj={projectObj}
            isAddData={isAddProject}
            changeData={changeProject}
            teams={teams}
            addData={addProject}
            type="Project"
            emps={employees}
            modifyData={handleAddProject} />
            : isLoading ? < Loading /> : <>
                <div className="projectParent">
                    <div className="projectTitle col-lg-6">Projects</div>
                    <div className="col-lg-6 projectChild">
                        <SelectPicker
                            data={teams}
                            size="lg"
                            appearance="default"
                            style={{ width: 300 }}
                            placeholder="Select Team"
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

                    <div className="row d-flex justfy-content-center mx-2 gap-2">
                        {
                            projects.length > 0 ?
                                projects.map((project) => (
                                    <div key={project._id} className="box-content col-lg-4">
                                        <div className="progress my-2">
                                            <div
                                                className="progress-bar progress-bar-striped"
                                                role="progressbar"
                                                style={{ width: `${10}%` }}
                                                aria-valuenow={project.progress || 0}
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            ></div>
                                        </div>
                                        <div className="projectDetails my-3">
                                            <h5>({project.prefix}) - {project.name}</h5>
                                            <span style={{ cursor: "pointer" }}><MoreVertIcon /></span>
                                        </div>
                                        <div className="projectDetails m-0">
                                            <span className='defaultDesign'>({project.status})</span>
                                            <span><b>{project.tasks.length}</b> Pending Task(s)</span>
                                        </div>
                                        <div className="d-flex justify-content-end" style={{ color: "#6c757d" }}>
                                            Client: {project?.company?.CompanyName}
                                        </div>
                                        <div className="d-flex align-items-center gap-2 my-3">
                                            {
                                                project.employees.map((emp) => (
                                                    <div className="nameHolder" key={emp._id}>
                                                        {emp.FirstName[0].toUpperCase() + emp.LastName[0].toUpperCase()}
                                                    </div>
                                                ))
                                            }
                                            <AddCircleOutlineRoundedIcon fontSize='large' color='disabled' />
                                        </div>
                                    </div>
                                )) : <NoDataFound message={"Project No Found"} />
                        }
                    </div>
                </div>
            </>
    )
}
