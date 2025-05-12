import { Skeleton } from '@mui/material'
import React, { useContext, useEffect, useState } from 'react';
import axios from "axios";
import LeaveTable from '../LeaveTable';
import NoDataFound from './NoDataFound';
import { Input } from 'rsuite';
import { EssentialValues } from '../../App';
import Loading from '../Loader';
import CommonModel from '../Administration/CommonModel';

export default function EmailTemplates() {
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const [isLoading, setIsLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [title, setTitle] = useState("");
    const [isChangeTemp, setIsChangeTemp] = useState({
        isEdit: false,
        isAdd: false
    })

    function handleChangeTemp(type) {
        if (type === "edit") {
            setIsChangeTemp((pre) => ({
                ...pre,
                isEdit: !pre.isEdit
            }))
        } else {
            setIsChangeTemp((pre) => ({
                ...pre,
                isAdd: !pre.isAdd
            }))
        }
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
        } catch (error) {
            console.log("error in fetch templates", error);
        } finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        fetchTemplates()
    }, [])
    return (
        isChangeTemp.isAdd ? <CommonModel /> :
            isChangeTemp.isEdit ? <CommonModel /> :
                isLoading ? <Loading /> :
                    <div className='dashboard-parent py-4'>
                        <div className="d-flex justify-content-between px-2">
                            <p className="payslipTitle col-6">
                                Email Template
                            </p>
                            <div className="col-6 d-flex justify-content-end">
                                <button className="button mx-1" >
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
                                            <LeaveTable data={templates} /> :
                                            <NoDataFound message={"Templates data not found"} />
                                }
                            </div>
                        </div>
                    </div>
    )
}
