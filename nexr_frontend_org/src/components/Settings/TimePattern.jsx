import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../payslip/dashboard.css";
import LeaveTable from "../LeaveTable";
import NoDataFound from "../payslip/NoDataFound";
import CommonModel from "../Administration/CommonModel";
import { EssentialValues } from "../../App";
import { Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";

const TimePattern = () => {
    const navigate = useNavigate();
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const { token } = data;
    const [changePattern, setChangePattern] = useState({
        isAdd: false,
        isEdit: false,
        isView: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [timePatternObj, setTimePatternObj] = useState({});
    const [timePatterns, setTimePatterns] = useState([]);
    const [dom, reload] = useState(false);
    const [isWoringApi, setIsWorkingApi] = useState(false);

    function handleChangeTimePattern(type, pattern) {
        if (type === "Add") {
            setChangePattern((pre) => ({
                ...pre,
                isAdd: !pre.isAdd
            }))
        } else if (type === "Edit") {
            if (!changePattern.isEdit) {
                setTimePatternObj(pattern)
            }
            setChangePattern((pre) => ({
                ...pre,
                isEdit: !pre.isEdit
            }))
        } else {
            if (!changePattern.isView) {
                setTimePatternObj(pattern)
            }
            setChangePattern((pre) => ({
                ...pre,
                isView: !pre.isView
            }))
        }
    }

    function fillPatternData(value, name) {
        setTimePatternObj({
            ...timePatternObj,
            [name]: ["StartingTime", "FinishingTime"].includes(name) ? new Date(value).toISOString() : value
        })
    }
    
    async function updateTimePattern() {
        try {
            setIsWorkingApi(true);
            const res = await axios.put(`${url}/api/time-pattern/${timePatternObj._id}`, timePatternObj, {
                headers: {
                    authorization: token || ""
                }
            })
            toast.success(res.data.message);
            handleChangeTimePattern("Edit");
            setTimePatternObj({})
            reload(!dom);
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.log(error);
        } finally {
            setIsWorkingApi(false)
        }
    }

    async function addTimePattern() {
        try {
            setIsWorkingApi(true)
            const res = await axios.post(`${url}/api/time-pattern`, timePatternObj, {
                headers: {
                    Authorization: token
                }
            })
            setTimePatternObj({});
            toast.success(res.data.message);
            handleChangeTimePattern("Add");
            reload(!dom);
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error);
            console.log("error in add timepattern", error);
        } finally {
            setIsWorkingApi(false)
        }
    }

    async function deletePattern(pattern) {

        try {
            const res = await axios.delete(`${url}/api/time-pattern/${pattern}`, {
                headers: {
                    authorization: token || ""
                }
            })

            toast.success(res.data.message);
            reload(!dom);
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.error)
            console.log("error in delete timePatternObj:", error);
        }
    }

    useEffect(() => {
        async function fetchTimePatterns() {
            setIsLoading(true)
            try {
                const res = await axios.get(`${url}/api/time-pattern`, {
                    headers: {
                        authorization: token || ""
                    }
                })
                setTimePatterns(res.data);
           } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
                console.log(error);
                setTimePatterns([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTimePatterns();
    }, [dom]);

    return (
        changePattern.isAdd ? <CommonModel type={"TimePattern"} isWorkingApi={isWoringApi} isAddData={changePattern.isAdd} changeData={fillPatternData} dataObj={timePatternObj} modifyData={handleChangeTimePattern} addData={addTimePattern} /> :
            changePattern.isEdit ? <CommonModel type={"TimePattern"} isWorkingApi={isWoringApi} isAddData={changePattern.isEdit} dataObj={timePatternObj} changeData={fillPatternData} editData={updateTimePattern} modifyData={handleChangeTimePattern} /> :
                changePattern.isView ? <CommonModel type={"View TimePattern"} isAddData={changePattern.isView} dataObj={timePatternObj} modifyData={handleChangeTimePattern} /> :
                    <>
                        <div className="d-flex align-items-center justify-content-between m-3">
                            <div>
                                <h5>CURRENT WORKING TIME PATTERNS</h5>
                                <p className="styleText mt-3">
                                    New employees imported into the system will be defaulted to the pattern: <b>{timePatterns.length > 0 && timePatterns[timePatterns.length - 1].PatternName}</b>
                                </p>
                            </div>
                            <div>
                                <button className="button" onClick={() => handleChangeTimePattern("Add")}>
                                    Add new pattern
                                </button>
                            </div>
                        </div>
                        {
                            isLoading ? <Skeleton
                                sx={{ bgcolor: 'grey.500' }}
                                variant="rectangular"
                                width={"100%"}
                                height={"50vh"}
                            /> :
                                timePatterns.length ? <LeaveTable data={timePatterns} deleteData={deletePattern} handleChangeData={handleChangeTimePattern} /> :
                                    <NoDataFound message={"Time Pattern data not found"} />
                        }
                    </>
    )
}
export default TimePattern;
