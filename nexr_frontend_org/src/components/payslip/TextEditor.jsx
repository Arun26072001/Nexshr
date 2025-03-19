import React, { useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import RedoRoundedIcon from '@mui/icons-material/RedoRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

const TextEditor = ({ handleChange, content, isDisabled, isAllowFile, changeCommit, files, dataObj, removeAttachment }) => {
    const quillRef = useRef(null); // Create a ref for Quill instance

    // Undo Function
    const handleUndo = () => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            editor.history.undo();
        }
    };

    // Redo Function
    const handleRedo = () => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            editor.history.redo();
        }
    };

    const handleFileUpload = () => {
        const fileInput = document.getElementById("fileUploader");

        fileInput.onchange = (e) => {
            changeCommit(e, "attachments"); // Correctly pass the event
        };

        fileInput.click(); // Open file picker
    };


    const formats = [
        ["bold", "italic", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        [{ color: [] }, { background: [] }],
        ["blockquote", "code-block"],
        ["clean"],
    ];


    return (
        <div className="position-relative">
            {/* Undo & Redo Buttons */}
            <div className="undoRedoBtns" style={{ position: "absolute", top: "10px", right: "10px" }}>
                {
                    isAllowFile &&
                    <button onClick={handleFileUpload} style={{ background: "none" }}><DescriptionOutlinedIcon /></button>
                }
                <button onClick={handleUndo} disabled={isDisabled} style={{ background: "none" }}><UndoRoundedIcon /></button>
                <button onClick={handleRedo} disabled={isDisabled} style={{ background: "none" }}><RedoRoundedIcon /></button>
            </div>
            <input type="file" id="fileUploader" className="d-none" multiple accept="video/*, image/*" />

            {/* Text Editor */}
            <ReactQuill
                ref={quillRef}
                modules={{ toolbar: formats }}
                style={{ flexGrow: 1, height: "fit-content", marginBottom: "10px" }}
                placeholder="Write away..."
                value={content}
                readOnly={isDisabled}
                onChange={(e) => handleChange(e)}
            />
            <div className="d-flex align-items-center w-100 flex-wrap" >
                {files?.map((imgFile, index) => (
                    <div key={index} className="col-lg-4 p-2" >
                        <div className="position-relative">
                            {
                                (dataObj.attachments.length === files.length && dataObj?.attachments[index].type === "video/mp4") ?
                                    <video
                                        className="w-100 h-auto"
                                        controls>
                                        <source src={imgFile} type={dataObj?.attachments[index].type} />
                                    </video> :
                                    <img
                                        className="w-100 h-auto"
                                        src={imgFile}
                                        alt="uploaded file"
                                        style={{ borderRadius: "4px" }}
                                    />
                            }
                            {/* Close button */}
                            <button onClick={() => removeAttachment(imgFile, index)} className="remBtn">
                                &times;
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TextEditor;
