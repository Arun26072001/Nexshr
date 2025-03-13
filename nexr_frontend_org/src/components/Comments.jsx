import React, { useContext, useEffect, useState } from 'react';
import "./Comments.css";
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { EssentialValues } from '../App';
import { toast } from 'react-toastify';
import Loading from './Loader';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { getTimeToHour } from './ReuseableAPI';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import profile from "../imgs/male_avatar.webp";
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import { Dropdown, Popover, Whisper } from 'rsuite';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CommonModel from './Administration/CommonModel';

export default function Comments() {
    const [isLoading, setIsLoading] = useState(false);
    const [taskObj, setTaskObj] = useState({});
    const [commentObj, setCommentObj] = useState({});
    const { id } = useParams();
    const { data } = useContext(EssentialValues);
    const url = process.env.REACT_APP_API_URL;
    const [previewList, setPreviewList] = useState([]);
    const [isEditCommit, setIsEditCommit] = useState(false);
    const [editCommentIndex, setEditCommentIndex] = useState(null);
    const [ischecked, setIschecked] = useState(false);

    function handleCommitToEdit(commitData) {
        setPreviewList(commitData.attachments);
        setCommentObj(commitData);
    }

    function handleEditCommit() {
        setIsEditCommit(!isEditCommit);
    }

    function changeCommit(value, name) {
        const files = value?.target?.files;
        if (name === "attachments") {
            const imgUrls = [];

            for (let index = 0; index < files.length; index++) {
                imgUrls.push(URL.createObjectURL(files[index]));
            }

            // Update state once with all images
            setPreviewList((prev = []) => [...prev, ...imgUrls]);
        }
        setCommentObj((pre) => ({
            ...pre,
            [name]: name === "attachments" ?
                [...(pre.attachments || []), files] : value
        }))
    }

    async function editTask() {
        console.log("called");
        
        try {
            const files = commentObj?.attachments?.filter((file) => file.type === "image/png") || [];
            if (files.length > 0) {
                const formData = new FormData(); // Ensure FormData is created

                // Append each file to the FormData
                for (let index = 0; index < files.length; index++) {
                    formData.append("documents", files[index]); // Ensure correct field name for your backend
                }
                const response = await axios.post(`${url}/api/upload`, formData, {
                    headers: {
                        Accept: 'application/json', // Accept JSON response
                    }
                });

                // Check if the response is successful
                if (!response.data) {
                    console.error('Upload failed with status:', response.status);
                    return;
                }
                const uploadedImgPath = commentObj.attachments.filter((file) => file.type !== "image/png")
                const updatedCommentObj = {
                    ...commentObj,
                    ["attachments"]: [...uploadedImgPath, ...response.data.files.map(((file) => file.originalFile))]
                }
                // updated comment object add in specify index of comment
                taskObj.comments[editCommentIndex] = updatedCommentObj;
            } else {
                // updated comment object add in specify index of comment
                taskObj.comments[editCommentIndex] = commentObj;
            }

            const res = await axios.put(
                `${url}/api/task/${data._id}/${taskObj._id}`, // Ensure correct projectId
                taskObj,
                {
                    headers: {
                        Authorization: data.token || "",
                    },
                }
            );
            console.log(res.data);
            setIsEditCommit(false);
            fetchTaskOfComments()
            toast.success("Commit has been updated")
        } catch (error) {
            console.log(error);
        }
    }

    async function deleteCommit(comment, index) {
        console.log(comment, index);

        if (!comment || !index) {
            toast.error("error in delete commit")
        } else {
            const updatedCommit = {
                ...comment,
                isDeleted: true
            }
            taskObj.comments[index] = updatedCommit;
            try {
                const res = await axios.put(
                    `${url}/api/task/${data._id}/${taskObj._id}`, // Ensure correct projectId
                    taskObj,
                    {
                        headers: {
                            Authorization: data.token || "",
                        },
                    }
                );
                console.log(res.data);
                fetchTaskOfComments()
                toast.success("Commit has been move trash")
            } catch (error) {
                console.log(error);
            }
        }
    }

    const renderMenu1 = ({ onClose, right, top, className }, ref) => {
        const handleSelect = eventKey => {
            if (eventKey === 1) {
                // setEditCommentIndex()
                // handleCommitToEdit(commit)
                handleEditCommit();
            } else if (eventKey === 2) {
                deleteCommit();
            }
            onClose();
        };
        return (
            <Popover ref={ref} className={className} style={{ right, top }} full>
                <Dropdown.Menu onSelect={handleSelect} title="Personal Settings">
                    <Dropdown.Item eventKey={1}>
                        <b>
                            <BorderColorRoundedIcon sx={{ color: "#FFD65A" }} /> Edit
                        </b>
                    </Dropdown.Item>
                    <Dropdown.Item eventKey={2}>
                        <b>
                            <DeleteRoundedIcon sx={{ color: "#F93827" }} /> Move to trash
                        </b>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Popover>
        );
    };

    const renderMenu2 = (commit, index) => ({ onClose, right, top, className }, ref) => {
        const handleSelect = eventKey => {
            if (eventKey === 1) {
                setEditCommentIndex(index)
                handleCommitToEdit(commit)
                handleEditCommit();
            } else if (eventKey === 2) {
                deleteCommit(commit, index);
            }
            onClose();
        };
        return (
            <Popover ref={ref} className={className} style={{ right, top }} full>
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

    function removeAttachment(value) {
        const updatedPrevireList = previewList.filter((imgFile) => imgFile !== value);
        setPreviewList(updatedPrevireList);
        const updatedAttachments = commentObj.attachments.filter((data) => data !== value);
        setCommentObj({ ...commentObj, attachments: updatedAttachments })
    }

    async function fetchTaskOfComments() {
        setIsLoading(true);
        try {
            const res = await axios.get(`${url}/api/task/${id}`, {
                params: {
                    withComments: true
                },
                headers: { Authorization: data.token || "" }
            })
            setTaskObj(res.data);
            return res.data;
        } catch (error) {
            toast.error(error.response.data.error)
        } finally {
            setIsLoading(false);
        }
    }

    async function getValue() {
        const taskData = await fetchTaskOfComments();
        const updatedTask = {
            ...taskData,
            "status": "Completed"
        }
        editTask(updatedTask)
    }

    useEffect(() => {
        getValue()
    }, [ischecked])

    useEffect(() => {
        if (id) {
            fetchTaskOfComments()
        }
    }, [])

    return (
        isLoading ? <Loading /> :
            isEditCommit ? <CommonModel
                type="Edit Comments"
                removeAttachment={removeAttachment}
                isAddData={isEditCommit}
                modifyData={handleEditCommit}
                changeData={changeCommit}
                editData={editTask}
                dataObj={commentObj}
                previewList={previewList}
            /> :

                <div className='commentsParent'>
                    <div className="comments">
                        <div className="d-flex justify-content-between row">
                            <div className="col-lg-1">
                                <span className='timeBox'>
                                    <TimerOutlinedIcon /> {getTimeToHour(taskObj?.spend?.timeHolder)}
                                </span>
                            </div>
                            {/* center content of left */}
                            <div className="col-lg-2 text-end my-3">
                                <input type='checkbox' onChange={(e) => setIschecked(e.target.checked)} checked={ischecked} className='mb-3' />
                                <div style={{ textAlign: "end", marginTop: "16px" }}>
                                    <p><b>Assigned to</b></p>
                                    <p style={{ marginTop: "13px" }}><b>Due On</b></p>
                                </div>
                            </div>
                            {/* center content of right */}
                            <div className="col-lg-8 my-3">
                                <div className="commentsHeader mb-3">
                                    {taskObj.title}
                                </div>
                                <p >{
                                    taskObj?.assignedTo?.map((emp) => {
                                        return (
                                            <>
                                                <img src={emp.profile || profile} className='userProfile' />
                                                {emp?.FirstName[0]?.toUpperCase() + emp?.FirstName?.slice(1) + " " + emp?.LastName + "   "}
                                            </>)
                                    })
                                }</p>
                                <p className='d-flex align-items-center'><CalendarMonthRoundedIcon />{new Date(taskObj.to).toDateString()}</p>
                            </div>
                            <div className="col-lg-1">
                                <span className='circleEditIcon' >
                                    <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu1}>
                                        <MoreHorizOutlinedIcon fontSize='large' />
                                    </Whisper>
                                </span>
                            </div>
                        </div>

                        {
                            taskObj?.comments?.map((comment, index) => {
                                const commentCreator = comment?.createdBy?.FirstName[0]?.toUpperCase() + comment?.createdBy?.FirstName?.slice(1) + " " + comment?.createdBy?.LastName || "Arun Kumar";
                                return (
                                    <div className="row d-flex justify-content-center">
                                        <div className="col-lg-10">
                                            <div className='text-align-center'>
                                                <hr width="100%" size="2" color='gray' style={{ borderTop: "1px solid gray" }}></hr>
                                                <div className='d-flex row'>
                                                    <div className="col-lg-2">
                                                        {new Date(comment.date).toDateString().split(" ").slice(1).join(" ")}
                                                    </div>
                                                    <div className="col-lg-1">
                                                        <img src={comment?.createdBy?.profile || profile} alt='profile' className='userProfile' style={{ height: "45px", width: "45px" }} />
                                                    </div>
                                                    <div className="col-lg-8">
                                                        <p className='my-1' style={{ fontSize: "17px" }}><b>{commentCreator}</b></p>
                                                        <p>
                                                            {
                                                                <div dangerouslySetInnerHTML={{ __html: comment.comment }}></div> || "hdiwqdiwq diqwd iwqudiqwdoiuwq d"
                                                            }
                                                        </p>
                                                        <div className='imgsContainer'>
                                                            {comment.attachments.map((file) => {
                                                                if (comment.attachments.length === 1) {
                                                                    return <img src={file} style={{ width: "100%", height: "80%", margin: "10px 0px", border: "1px solid gray" }} alt='taskCommentAttackFile' />
                                                                } else {
                                                                    return <img src={file} style={{ flex: 1, width: "45%", height: "45%", margin: "10px 0px", border: "1px solid gray" }} alt='taskCommentAttackFile' />
                                                                }
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-1" >
                                                        <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu2(comment, index)}>
                                                            <MoreHorizOutlinedIcon sx={{ cursor: "pointer" }} />
                                                        </Whisper>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        }

                    </div>
                </div >

    );
}
