import React, { useContext, useEffect, useState } from 'react';
import "./Comments.css";
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { EssentialValues } from '../App';
import { toast } from 'react-toastify';
import Loading from './Loader';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { fileUploadInServer, getTimeFromHour } from './ReuseableAPI';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import profile from "../imgs/male_avatar.webp";
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import { Dropdown, Popover, Whisper } from 'rsuite';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CommonModel from './Administration/CommonModel';
import TextEditor from './payslip/TextEditor';

export default function Comments({ employees }) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [taskObj, setTaskObj] = useState({});
    const [commentObj, setCommentObj] = useState({});
    const { id } = useParams();
    const { data, whoIs, socket } = useContext(EssentialValues);
    const url = process.env.REACT_APP_API_URL;
    const [previewList, setPreviewList] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isEditCommit, setIsEditCommit] = useState(false);
    const [editCommentIndex, setEditCommentIndex] = useState(null);
    const [ischecked, setIschecked] = useState(false);
    const [isEditTask, setIsEditTask] = useState(false);
    const [isDeleteTask, setDeleteTask] = useState(false);
    const [ischangingComment, setIsChangingComment] = useState(false);
    const [isAddComment, setIsAddComment] = useState(false);

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
                [...(pre.attachments || []), ...files] : value
        }))
    }

    function handleEdiTask() {
        if (!isEditTask) {
            setTaskObj((pre) => ({
                ...pre,
                assignedTo: pre.assignedTo.map((emp) => emp._id)
            }))
            setPreviewList(taskObj.attachments);
        } else if (isEditTask) {
            fetchTaskOfComments();
        }
        setIsEditTask(!isEditTask)
    }

    function handleDeleteTask() {
        setDeleteTask(!isDeleteTask)
    }


    async function editTask(taskData) {
        setIsChangingComment(true)
        try {
            let updatedTaskData;
            const files = taskData?.attachments?.filter((file) => file.type === "image/png") || [];
            if (files.length) {
                const responseData = await fileUploadInServer(files);
                console.log(responseData);

                // Get previously uploaded attachments (excluding PNGs)
                const uploadedImgPath = taskData.attachments.filter((file) => file.type !== "image/png")
                updatedTaskData = {
                    ...taskData,
                    ["attachments"]: [...uploadedImgPath, ...responseData.files.map(((file) => file.originalFile))]
                }
            } else {
                updatedTaskData = {
                    ...taskObj
                }
            }

            // Send PUT request to update task
            const res = await axios.put(
                `${url}/api/task/${data._id}/${taskObj._id}`,
                updatedTaskData,
                {
                    headers: {
                        Authorization: data.token || "",
                    },
                }
            );

            // Show success message
            toast.success(res.data.message);

            // Reset states
            setIsEditCommit(false);
            fetchTaskOfComments();
            setIsEditTask(false);
            setEditCommentIndex(null);
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Failed to update task.");
        }
        setIsChangingComment(false);
    }

    async function addComment() {
        try {
            let updatedCommentObj = { ...commentObj, createdBy: data._id };

            // Filter out PNG files for upload
            const files = commentObj?.attachments;

            if (files?.length > 0) {
                const responseData = await fileUploadInServer(files);

                // Merge old attachments with new uploaded files
                updatedCommentObj = {
                    ...commentObj,
                    createdBy: data._id,
                    attachments: [...responseData.files.map((file) => file.originalFile)],
                };
            }

            // Update the comment in the task object if taskData is not provided
            taskObj.comments[taskObj.comments.length] = updatedCommentObj;

            socket.emit("updatedTask_In_AddComment", taskObj, data._id, data.token);
            setIsAddComment(false);
            setPreviewList([]);
            setCommentObj({});
        } catch (error) {
            console.log(error);
        }
    }

    socket.on("send_updated_task", (updatedData) => {
        setIschecked(updatedData.status === "Completed")
        setTaskObj({
            ...updatedData,
            spend: {
                ...updatedData?.spend,
                timeHolder: getTimeFromHour(updatedData?.spend?.timeHolder || 0)
            }
        });
    })

    async function editCommitTask() {
        setIsChangingComment(true);
        try {
            let updatedCommentObj = { ...commentObj };

            // Filter out PNG files for upload
            const files = commentObj?.attachments?.filter((file) => ["image/png", "video/mp4"].includes(file.type)) || [];

            if (files.length > 0) {
                const responseData = await fileUploadInServer(files);

                // Get previously uploaded attachments (excluding PNGs)
                const nonPngAttachments = commentObj.attachments.filter((file) => file.type !== "image/png" && file.type !== "video/mp4");

                // Merge old attachments with new uploaded files
                updatedCommentObj = {
                    ...commentObj,
                    attachments: [...nonPngAttachments, ...responseData.files.map((file) => file.originalFile)],
                };

            }

            // Update the comment in the task object if taskData is not provided
            taskObj.comments[editCommentIndex] = updatedCommentObj;

            socket.emit("updatedTask_In_AddComment", taskObj, data._id, data.token);
            // socket.on("send_updated_task", (updatedData) => {
            //     setIschecked(updatedData.status === "Completed")
            //     setTaskObj({
            //         ...updatedData,
            //         spend: {
            //             ...updatedData?.spend,
            //             timeHolder: getTimeFromHour(updatedData?.spend?.timeHolder || 0)
            //         }
            //     });
            // })
            setIsEditCommit(false);
            setPreviewList([]);
            setCommentObj({});
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Failed to update task.");
        }
        setIsChangingComment(false);
    }

    async function deleteCommit(comment, index) {

        if (!comment) {
            toast.error("error in delete commit")
        } else {
            const updatedCommit = {
                ...comment,
                isDeleted: true
            }
            taskObj.comments[index] = updatedCommit;
            try {
                socket.emit("updatedTask_In_AddComment", taskObj, data._id, data.token);
                socket.on("send_updated_task", (updatedData) => {
                    setIschecked(updatedData.status === "Completed")
                    setTaskObj({
                        ...updatedData,
                        spend: {
                            ...updatedData?.spend,
                            timeHolder: getTimeFromHour(updatedData?.spend?.timeHolder || 0)
                        }
                    });
                })
                toast.success("Commit has been move trash")
            } catch (error) {
                console.log(error);
            }
        }
    }

    const renderMenu1 = ({ onClose, right, top, className }, ref) => {
        const handleSelect = eventKey => {
            if (eventKey === 1) {
                handleEdiTask()
            } else if (eventKey === 2) {
                handleDeleteTask()
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

    function removeAttachment(value, fileIndex) {
        const updatedPrevireList = previewList.filter((imgFile) => imgFile !== value);
        setPreviewList(updatedPrevireList);
        if (commentObj) {
            const updatedAttachments = commentObj.attachments.filter((data, index) => index !== fileIndex);
            setCommentObj({ ...commentObj, attachments: updatedAttachments })
        } else {
            const updatedAttachments = taskObj.attachments.filter((data) => data !== value);
            setCommentObj({ ...taskObj, attachments: updatedAttachments })
        }
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
            setIschecked(res.data.status === "Completed")
            setTaskObj({
                ...res.data,
                spend: {
                    ...res?.data?.spend,
                    timeHolder: getTimeFromHour(res?.data?.spend?.timeHolder || 0)
                }
            });
        } catch (error) {
            console.log(error)
            toast.error(error.response.data.error)
        }
        finally {
            setIsLoading(false);
        }
    }

    async function deleteTask() {
        try {
            const res = await axios.delete(`${url}/api/task/${taskObj._id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            })
            toast.success(res.data.message);
            navigate(`/${whoIs}/tasks`);
        } catch (error) {
            toast.error(error.response.data.error)
        }
    }

    function changeTask(event, name) {
        const files = event?.target?.files; // Extract files correctly
        const value = event; // Extract value properly

        if (name === "attachments" || name.includes("attachments")) {
            const imgUrls = [];

            for (let index = 0; index < files.length; index++) {
                imgUrls.push(URL.createObjectURL(files[index]));
            }

            // Update state once with all images
            setPreviewList((prev = []) => [...prev, ...imgUrls]);
        }

        setTaskObj((prev) => {
            if (name.startsWith("spend.")) {
                const spendChild = name.split(".")[1];

                return {
                    ...prev,
                    spend: {
                        ...prev.spend,
                        [spendChild]: files || value, // Store correctly
                    },
                };
            } else if (name.startsWith("comments.")) {
                const commentChild = name.split(".")[1];
                return {
                    ...prev,
                    comments: prev.comments.length > 0
                        ? [
                            ...prev.comments.slice(0, -1), // Keep all except the last one
                            {
                                ...prev.comments[prev.comments.length - 1], // Modify last comment
                                [commentChild]: name.includes("attachments")
                                    ? [...(prev?.comments?.[prev.comments.length - 1]?.[commentChild] || []), ...files]
                                    : value,
                            },
                        ]
                        : [{ [commentChild]: name.includes("attachments") ? [...files] : value }],
                };
            } else {
                return {
                    ...prev,
                    [name]: name === "attachments"
                        ? [...(prev[name] || []), ...files] // Spread FileList properly
                        : value, // Update other fields directly
                };
            }
        });
    }

    async function getValue(value) {
        const updatedTask = {
            ...taskObj,
            "status": value ? "Completed" : "Pending"
        }
        editTask(updatedTask)
    }
    async function fetchProjects() {
        setIsLoading(true)
        try {
            const res = await axios.get(`${url}/api/project`, {
                headers: {
                    Authorization: data.token || ""
                }
            })

            setProjects(res.data.map((project) => ({ label: project.name, value: project._id })));
            // setFilterProjects(res.data.map((project) => ({ label: project.name, value: project._id })))
        } catch (error) {
            toast.error(error.response.data.error)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        if (id) {
            fetchTaskOfComments()
        }
        fetchProjects()
    }, [])

    return (
        isLoading ? <Loading height="80vh" /> :
            isEditCommit ? <CommonModel
                type="Edit Comments"
                removeAttachment={removeAttachment}
                isAddData={isEditCommit}
                isWorkingApi={ischangingComment}
                modifyData={handleEditCommit}
                changeData={changeCommit}
                editData={editCommitTask}
                dataObj={commentObj}
                previewList={previewList}
            /> : isEditTask ? <CommonModel
                dataObj={taskObj}
                previewList={previewList}
                isAddData={isEditTask}
                isWorkingApi={ischangingComment}
                editData={editTask}
                changeData={changeTask}
                projects={projects}
                removeAttachment={removeAttachment}
                employees={employees}
                type="Task"
                modifyData={handleEdiTask} /> : isDeleteTask
                ? <CommonModel type="Task Confirmation" modifyData={handleDeleteTask} deleteData={deleteTask} isAddData={isDeleteTask} />
                : <div className='commentsParent'>
                    <div className="comments">
                        <div className="d-flex justify-content-between row">
                            <div className="col-lg-1">
                                <span className='timeBox'>
                                    <TimerOutlinedIcon /> {taskObj?.spend?.timeHolder}
                                </span>
                            </div>
                            {/* center content of left */}
                            <div className="col-lg-2 col-4 text-end my-3">
                                <input type='checkbox' onChange={(e) => getValue(e.target.checked)} checked={ischecked} className='mb-3' />
                                <div style={{ textAlign: "end", marginTop: "16px" }}>
                                    <p><b>Assigned to</b></p>
                                    <p style={{ marginTop: "13px" }}><b>Due On</b></p>
                                </div>
                            </div>
                            {/* center content of right */}
                            <div className="col-lg-8 col-6 my-3">
                                <div className="commentsHeader mb-3">
                                    {taskObj.title}
                                </div>
                                <p >{
                                    taskObj?.assignedTo?.map((emp) => {
                                        return (
                                            <>
                                                <img src={emp.profile || profile} className='userProfile' key={emp._id} />
                                                {emp?.FirstName?.[0]?.toUpperCase() + emp?.FirstName?.slice(1) + " " + emp?.LastName + "   "}
                                            </>)
                                    })
                                }</p>
                                <p className='d-flex align-items-center'><CalendarMonthRoundedIcon />{new Date(taskObj.to).toDateString()}</p>
                            </div>
                            <div className="col-lg-1 col-2">
                                <span className='circleEditIcon' >
                                    <Whisper placement="bottomEnd" trigger="click" speaker={renderMenu1}>
                                        <MoreHorizOutlinedIcon fontSize='large' />
                                    </Whisper>
                                </span>
                            </div>
                        </div>

                        {
                            taskObj?.comments?.map((comment, index) => {
                                console.log(comment);
                                const commentCreator = comment?.createdBy?.FirstName?.[0]?.toUpperCase() + comment?.createdBy?.FirstName?.slice(1) + " " + comment?.createdBy?.LastName || "Arun Kumar";
                                return (
                                    <div className="d-flex justify-content-center">
                                        <div className="col-lg-10 col-md-10 col-12">
                                            <div className='text-align-center'>
                                                <hr width="100%" size="2" color='gray' style={{ borderTop: "1px solid gray" }}></hr>
                                                <div className='row'>
                                                    <div className="col-lg-2 col-md-2 col-12">
                                                        {new Date(comment.date).toDateString().split(" ").slice(1).join(" ")}
                                                    </div>
                                                    <div className="col-lg-1 col-md-1 col-3">
                                                        <img src={comment?.createdBy?.profile || profile} alt='profile' className='userProfile' style={{ height: "45px", width: "45px" }} />
                                                    </div>
                                                    <div className="col-lg-8 col-md-8 col-7">
                                                        <p className='my-1' style={{ fontSize: "17px" }}><b>{commentCreator}</b></p>
                                                        <p>
                                                            {
                                                                <div dangerouslySetInnerHTML={{ __html: comment.comment }}></div>
                                                            }
                                                        </p>
                                                        <div className="imgsContainer">
                                                            {
                                                                comment?.attachments?.length ?
                                                                    comment?.attachments?.map((file, index) => (
                                                                        <div key={index} className={`col-lg-${[2, 4].includes(comment.attachments.length) ? "5" : comment.attachments.length === 1 ? "12" : comment.attachments.length === 3 ? "5" : "3"}`}>
                                                                            {file.includes(".mp4") ? (
                                                                                <video controls style={{ width: "100%", height: "auto", margin: "10px 0px", border: "1px solid gray" }}>
                                                                                    <source src={file} type="video/mp4" />
                                                                                    Your browser does not support the video tag.
                                                                                </video>
                                                                            ) : (
                                                                                <img
                                                                                    src={file}
                                                                                    style={{
                                                                                        width: "100%",
                                                                                        height: "auto",
                                                                                        margin: "10px 0px",
                                                                                        border: "1px solid gray",
                                                                                    }}
                                                                                    alt="taskCommentAttachment"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    )) : null
                                                            }
                                                        </div>

                                                    </div>
                                                    <div className="col-lg-1 col-md-1 col-2" >
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
                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-10 col-md-10 col-12">
                                <div className='text-align-center'>
                                    <hr width="100%" size="2" color='gray' style={{ borderTop: "1px solid gray" }}></hr>
                                    <div className='row'>
                                        <div className="col-lg-2 col-md-2 col-2">
                                        </div>
                                        <div className="col-lg-1 colmd-1 col-2">
                                            <img src={data.profile || profile} alt='profile' className='userProfile' style={{ height: "45px", width: "45px" }} />
                                        </div>
                                        <div className="col-lg-8 col-md-8 col-8">
                                            {isAddComment
                                                ? <>
                                                    <TextEditor
                                                        handleChange={(e) => changeCommit(e, "comment")}
                                                        content={commentObj?.comment}
                                                        isAllowFile={true}
                                                        files={previewList}
                                                        changeCommit={changeCommit}
                                                        dataObj={commentObj}
                                                        removeAttachment={removeAttachment}
                                                    />
                                                    <button className='button' onClick={addComment}>Add Comment</button>
                                                </>
                                                : <p style={{ fontSize: "20px", color: "gray", marginBottom: "30px" }} onClick={() => setIsAddComment(true)}>
                                                    Add a comment here....
                                                </p>}
                                        </div>
                                    </div>
                                    <hr width="100%" size="2" color='gray' style={{ borderTop: "1px solid gray" }}></hr>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >

    );
}
