import { Skeleton } from '@mui/material'
import React, { useContext, useEffect, useState } from 'react';
import axios from "axios";
import LeaveTable from '../LeaveTable';
import NoDataFound from './NoDataFound';
import { Input } from 'rsuite';
import { EssentialValues } from '../../App';
import Loading from '../Loader';
import CommonModel from '../Administration/CommonModel';
import { toast } from 'react-toastify';
import { fetchAllEmployees } from '../ReuseableAPI';

export default function EmailTemplates() {
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const [isLoading, setIsLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [filterTemplates, setfilterTemplates] = useState([]);
    const [templateObj, setTemplateObj] = useState({});
    const [empMails, setEmpMails] = useState([]);
    const [title, setTitle] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isWorkingApi, setIsWorkingApi] = useState(false);
    const [isChangeTemp, setIsChangeTemp] = useState({
        isEdit: false,
        isAdd: false
    })

    async function gettingEmps() {
        try {
            const emps = await fetchAllEmployees();
            // const withoutMyData = emps.filter((emp)=> emp._id !== _id);
            setEmpMails(emps.map((emp) => ({ label: emp?.Email, value: emp.Email })))
        } catch (error) {
            console.log(error);
        }
    }

    function handleChangeTemp(type, tempData) {
        if (type === "Edit") {
            if(tempData){
                setTemplateObj(tempData)
            } else{
                setTemplateObj({})
            }
            setIsChangeTemp((pre) => ({
                ...pre,
                isEdit: !pre.isEdit
            }))
        } else {
            if(isChangeTemp.isAdd){
                setTemplateObj({})
            }
            setIsChangeTemp((pre) => ({
                ...pre,
                isAdd: !pre.isAdd
            }))
        }
    }

    // add template
    async function addTemplate(type) {
        try {
            setIsWorkingApi(true)
            const newTemplate = {
                ...templateObj,
                status: templateObj.status || false
            }
            const res = await axios.post(`${url}/api/email-template/${data._id}`, newTemplate, {
                headers: {
                    Authorization: data.token
                }
            })
            toast.success(res.data.message);
            handleChangeTemp(type);
            fetchTemplates();
        } catch (error) {
            console.log("error in add template", error);
            toast.error(error?.response?.data?.error);
        } finally {
            setIsWorkingApi(false)
        }
    }

    // update template
    async function updateTemplate() {
        try {
            setIsWorkingApi(true)
            const res = await axios.put(`${url}/api/email-template/${templateObj._id}`, templateObj, {
                headers: {
                    Authorization: data.token
                }
            })
            toast.success(res.data.message);
            handleChangeTemp("Edit");
            fetchTemplates();
        } catch (error) {
            console.log("error in update template", error);
            toast.error(error?.response?.data?.error)
        } finally {
            setIsWorkingApi(false)
        }
    }

    function fillTemplateObj(value, name) {
        setTemplateObj((pre) => ({
            ...pre,
            [name]: value
        }))
    }

    function changeShortTags(name, value) {

        if (templateObj?.shortTags) {
            const isExists = templateObj?.shortTags?.filter((item) => item === value);

            if (isExists?.length < 1) {
                setTemplateObj((pre) => ({
                    ...pre,
                    [name]: [...pre?.shortTags, value]
                }))
            }
        } else {
            setTemplateObj((pre) => ({
                ...pre,
                [name]: [...(pre?.shortTags || []), value] // Ensure state is an array before spreading
            }));
        }
    }
    function removeState(value) {
        const removedTag = templateObj?.shortTags.filter((item) => item !== value)
        setTemplateObj((pre) => ({
            ...pre,
            'shortTags': removedTag
        }))
    }

    async function fetchTemplates() {
        try {
            setIsLoading(true)
            const res = await axios(`${url}/api/email-template`, {
                headers: {
                    Authorization: data.token
                }
            })
            setTemplates(res.data);
            setfilterTemplates(res.data);
        } catch (error) {
            console.log("error in fetch templates", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(()=>{
        if(!title){
            setTemplates(filterTemplates)
        }else{
            setTemplates(filterTemplates.filter((temp)=> temp.title.toLowerCase().includes(title.toLowerCase())))
        }
    },[title])

    useEffect(() => {
        fetchTemplates();
        gettingEmps();
    }, [])

    return (
        isChangeTemp.isAdd ? <CommonModel isAddData={isChangeTemp.isAdd} isWorkingApi={isWorkingApi} changeData={fillTemplateObj} removeState={removeState} dataObj={templateObj} type={"Email Template"} changeState={changeShortTags} modifyData={handleChangeTemp} errorMsg={errorMsg} addData={addTemplate} /> :
            isChangeTemp.isEdit ? <CommonModel isAddData={isChangeTemp.isEdit} isWorkingApi={isWorkingApi} changeData={fillTemplateObj} removeState={removeState} dataObj={templateObj} type={"Email Template"} changeState={changeShortTags} modifyData={handleChangeTemp} errorMsg={errorMsg} editData={updateTemplate} /> :
                isLoading ? <Loading height='80vh' /> :
                    <div className='dashboard-parent py-4'>
                        <div className="d-flex justify-content-between px-2">
                            <p className="payslipTitle col-6">
                                Email Template
                            </p>
                            <div className="col-6 d-flex justify-content-end">
                                <button className="button mx-1" onClick={() => handleChangeTemp("Add")} >
                                    Add Template
                                </button>
                            </div>
                        </div>
                        <div className='leaveContainer d-block'>
                            <div className='px-3 my-3'>
                                <div className="row">
                                    <div className="col-lg-12 col-12 d-flex justify-content-end">
                                        <Input value={title} size="lg" style={{ width: "250px" }} placeholder="Search by Template Title" onChange={setTitle} />
                                    </div>
                                </div>
                            </div>
                            <div className='profiles mt-3'>
                                {
                                    isLoading ? <Skeleton
                                        sx={{ bgcolor: 'grey.500' }}
                                        variant="rectangular"
                                        width={"100%"}
                                        height={"50vh"}
                                    /> :
                                        templates.length > 0 ?
                                            <LeaveTable data={templates} handleChangeData={handleChangeTemp} /> :
                                            <NoDataFound message={"Templates data not found"} />
                                }
                            </div>
                        </div>
                    </div>
    )
}
