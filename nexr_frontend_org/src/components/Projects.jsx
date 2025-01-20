import React, { useContext, useEffect, useState } from 'react'
import { SelectPicker } from 'rsuite'
import { fetchEmployees, fetchTeams } from './ReuseableAPI';
import "./projectndTask.css";
// import 'rsuite/dist/rsuite.min.css';
import { EssentialValues } from '../App';
import axios from 'axios';
import { toast } from 'react-toastify';
import CommonModel from './Administration/CommonModel';

export default function Projects() {
    const { whoIs, data } = useContext(EssentialValues);
    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [projectObj, setProjectObj] = useState({});
    const [isAddProject, setIsAddProject] = useState(false);
    const url = process.env.REACT_APP_API_URL;

    function handleAddProject() {
        setIsAddProject(!isAddProject);
    }

    function changeProject(e) {
        const { name, value } = e.target;
        setProjectObj((pre) => ({
            ...pre,
            [name]: value
        }))
    }

    async function gettingEmps() {
        try {
            const emps = await fetchEmployees();
            console.log(emps);
            
            setEmployees(emps.map((emp) => ({ label: emp.FirstName + " " + emp.LastName, value: emp._id })))
        } catch (error) {
            console.log(error);

        }
    }

    async function fetchProjects() {
        try {
            const res = await axios.get(`${url}/api/project`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setProjects(res.data);
        } catch (error) {
            toast.error(error.response.data.error)
        }
    }

    async function addProject() {
        try {
            const res = await axios.post(`${url}/api/project`, projectObj, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
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
        fetchProjects();
        if (whoIs === "admin") {
            fetchProjects();
            gettingEmps();
        }
    }, [])
    return (
        <>
            {
                isAddProject &&
                <CommonModel dataObj={projectObj}
                    isAddData={isAddProject}
                    changeData={changeProject}
                    teams={teams} addData={addProject}
                    type={"Project"}
                    emps={employees}
                    modifyData={handleAddProject} />
            }
            <div className='projectParent'>
                <div className="projectTitle col-lg-6">Projects</div>
                <div className="col-lg-6 projectChild">
                    <SelectPicker data={teams} size="lg" appearance='default' style={{ width: 300 }} placeholder="Select Team" />
                    <div className="button" onClick={handleAddProject} >
                        + Add Project
                    </div>
                </div>
            </div>

            <div className="employee">
                {
                    projects.map((data) => {
                        return <div key={data._id}>

                        </div>
                    })
                }
            </div>
        </>
    )
}
