// export default ViewOrganization
import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import CommonModel from '../Administration/CommonModel';

const ViewOrganization = ({ organizations, isLoading, handleChangeToRefetchOrgs }) => {
    const url = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();
    const { organizationId } = useParams();
    const token = localStorage.getItem('token');
    const [organization, setOrganization] = useState(organizations.find(org => org._id === organizationId));
    const [projects, setProjects] = useState([]);
    const [orgObj, setOrgObj] = useState({});
    const [isChangeOrg, setIschangeOrg] = useState(false);

    function handleChangeOrg() {
        if (!isChangeOrg) {
            fetchOrgData();
        }
        setIschangeOrg(!isChangeOrg)
    }

    async function editOrganization() {
        try {

            const response = await axios.put(`${url}/api/organization/${organizationId}`, orgObj,
                {
                    headers: {
                        Authorization: token || "",
                    },
                }
            );
            toast.success(response.data.message)
            handleChangeOrg();
            handleChangeToRefetchOrgs();
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.error)
        }
    }

    function changeOrg(value, name) {
        setOrgObj((pre) => ({
            ...pre,
            [name]: value
        }))
    }

    async function fetchOrgData() {
        try {
            const res = await axios.get(`${url}/api/organization/${organizationId}`, {
                headers: {
                    Authorization: token || ""
                }
            })
            setOrgObj(res.data);
        } catch (error) {
            console.log(error);
        }
    }

    return (
        isChangeOrg ? <CommonModel type={"Organization"} isAddData={isChangeOrg} modifyData={handleChangeOrg} dataObj={orgObj} changeData={changeOrg} editData={editOrganization} /> :
            <main className="p-4 w-100 main-container">
                <div className='d-flex align-items-center justify-content-between'>
                    <div>
                        <h1 className="mb-4">{orgObj.orgName}</h1>
                    </div>
                    <div>
                        <button
                            className='edirOrgBtn p-2 border rounded'
                            onClick={handleChangeOrg}
                        >
                            Edit Organization
                        </button>
                    </div>
                </div>
                <div className='d-flex justify-content-between'>
                    <div>
                        <h5>Owner: {orgObj.createdBy.FirstName}</h5>
                    </div>
                    <div>
                        <h5>Created at: {new Date(orgObj.createdAt).toDateString()}</h5>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6"
                        state={{
                            projects: projects?.projects,
                            organization: organization || {}
                        }}>
                        <div className={`box-content messageCount cardContent d-block text-align-center`} style={{ background: "white", boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px" }}>
                            <h5 className='text-dark'>Total Projects</h5>
                            <p className="fs-2 text-dark fw-bold">{0}</p>
                        </div>
                    </div>
                    <div className="col-md-6"
                        state={{ projects: projects?.projects }}>
                        <div className={`box-content messageCount cardContent d-block text-align-center`} style={{ background: "white", boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px" }}>
                            <h5 className='text-dark'>Total Members</h5>
                            <p className="fs-2 fw-bold text-dark">{organization?.members?.length}</p>
                        </div>
                    </div>
                </div>
            </main>
    );
};

export default ViewOrganization;
