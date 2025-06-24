import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { EssentialValues } from '../../App';
import { Input } from 'rsuite';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import CommonModel from '../Administration/CommonModel';
import { Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AdminOrganizations = ({ organizations, isLoading, handleChangeToRefetchOrgs }) => {
    const navigate = useNavigate();
    const { data } = useContext(EssentialValues);
    const [orgName, setOrgName] = useState("")
    const [filterOrgs, setFilterOrgs] = useState([]);
    const [isChangeOrg, setIsChangeOrg] = useState({
        isEdit: false,
        isAdd: false
    });
    const url = process.env.REACT_APP_API_URL;
    const [orgObj, setOrgObj] = useState({});
    const [preview, setPreview] = useState("");

    const handleChange = (value, name) => {
        let file;
        if (name === "orgImg") {
            setPreview(URL.createObjectURL(value.target.files[0]))
            file = value.target.files[0];
        }
        setOrgObj((prevData) => ({
            ...prevData,
            [name]: name === "orgImg" ? file : value,
        }));
    };

    function handleChangeOrg(type) {
        if (type === "Edit") {
            setIsChangeOrg((pre) => ({
                ...pre,
                isEdit: !pre.isEdit
            }))
        } else {
            setIsChangeOrg((pre) => ({
                ...pre,
                isAdd: !pre.isAdd
            }))
        }
    }

    function removePreview() {
        setOrgObj((pre) => ({
            ...pre,
            orgImg: ""
        }))
        setPreview("");
    }

    async function fetchOrgData(orgId, type) {
        try {
            const res = await axios.get(`${url}api/organization/${orgId}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            setOrgObj(res.data);
            setPreview(res.data.orgImg);
            handleChangeOrg(type);
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
        }
    }
    // add organization 
    async function addOrganization() {
        try {
            let newOrg = {
                ...orgObj
            }
            if (orgObj.orgImg) {
                // upload org image
                const formData = new FormData();
                formData.append("documents", orgObj.orgImg);
                const uploadedData = await axios.post(`${url}api/upload`, formData);
                newOrg = {
                    ...orgObj,
                    orgImg: uploadedData.data.files[0].originalFile
                }
            }
            // add organization
            const response = await axios.post(
                `${url}api/organization/${data._id}`,
                newOrg,
                {
                    headers: {
                        Authorization: data.token,
                    },
                }
            );
            toast.success(response.data.message)
            handleChangeToRefetchOrgs();
            handleChangeOrg("Add");
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error('Error creating org:', error.response?.data?.message || error.message);
            // Handle error (show error message to the user)
            toast.error(error.response?.data?.message)
        }
    }
    console.log(orgObj);


    async function editOrganization() {
        try {
            let updatedOrg = {
                ...orgObj
            }
            if (orgObj?.orgImg?.type === "image/png") {
                // upload org image
                const formData = new FormData();
                formData.append("documents", orgObj.orgImg);
                const uploadedData = await axios.post(`${url}api/upload`, formData);
                updatedOrg = {
                    ...orgObj,
                    orgImg: uploadedData.files[0].originalFile
                }
            }
            const response = await axios.put(`${url}api/organization/${orgObj._id}`, updatedOrg,
                {
                    headers: {
                        Authorization: data.token || "",
                    },
                }
            );
            toast.success(response.data.message)
            handleChangeOrg("Edit");
            handleChangeToRefetchOrgs();
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
            toast.error(error?.response?.data?.error)
        }
    }

    useEffect(() => {
        if (orgName === "") {
            setFilterOrgs(organizations)
        } else {
            setFilterOrgs(organizations.filter((org) => org.orgName.includes(orgName)))
        }

        return () => {
            setFilterOrgs(organizations)
        }
    }, [orgName, organizations])

    return (
        isChangeOrg.isAdd ? <CommonModel type={"Organization"} isAddData={isChangeOrg.isAdd} modifyData={handleChangeOrg} dataObj={orgObj} changeData={handleChange} addData={addOrganization} /> :
            isChangeOrg.isEdit ? <CommonModel type={"Organization"} preview={preview} removePreview={removePreview} isAddData={isChangeOrg.isEdit} modifyData={handleChangeOrg} dataObj={orgObj} changeData={handleChange} editData={editOrganization} /> :
                <main className="p-4 w-100 main-container">
                    <div className='d-flex justify-content-between'>
                        <div>
                            <p className="mb-4 titleText">Organizations</p>
                        </div>
                        <div>
                            <button className='button' onClick={handleChangeOrg}>
                                Add Organization
                            </button>
                        </div>

                    </div>
                    <div className="mb-3 d-flex justify-content-between align-items-center px-3">
                        <div className="d-flex align-items-center">
                            <Input
                                required
                                size="lg"
                                style={{ width: "250px", height: 45 }}
                                type={"text"}
                                value={orgName}
                                placeholder='Search Organization'
                                appearance='default'
                                onChange={setOrgName}
                            />
                        </div>
                    </div>
                    {
                        isLoading ? <Skeleton
                            sx={{ bgcolor: 'grey.500' }}
                            variant="rectangular"
                            width={"100%"}
                            height={"50vh"}
                        /> :
                            filterOrgs.length > 0 ? <LeaveTable data={filterOrgs} fetchOrgData={fetchOrgData} /> : <NoDataFound message={"Organizations not found"} />
                    }
                </main>
    );
};

export default AdminOrganizations;
