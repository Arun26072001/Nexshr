import React, { useRef } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "quill-mention";
import "quill-mention/dist/quill.mention.css";
import RedoRoundedIcon from '@mui/icons-material/RedoRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';


const TextEditor = ({
  handleChange,
  content,
  isDisabled,
  isAllowFile,
  changeCommit,
  files,
  dataObj,
  removeAttachment,
  members = [] // For mention
}) => {
  const quillRef = useRef(null);
  console.log("members", members);

  // Undo Function
  const handleUndo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation();
    const editor = quillRef.current?.getEditor?.();
    if (editor) editor.history.undo();
  };

  // Redo Function
  const handleRedo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation();
    const editor = quillRef.current?.getEditor?.();
    if (editor) editor.history.redo();
  };

  // File Upload Trigger
  const handleFileUpload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation();
    const fileInput = document.getElementById("fileUploader");
    fileInput.onchange = (e) => {
      changeCommit(e, "attachments");
    };
    fileInput.click();
  };

  // Mention Config
  const mentionConfig = {
    allowedChars: /^[A-Za-z\s]*$/,
    mentionDenotationChars: ["@"],
    source: function (searchTerm, renderList) {
      console.log("calling..", searchTerm);

      const filtered = !searchTerm
        ? members
        : members.filter((m) =>
          m.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
      renderList(
        filtered.map((m) => ({
          id: m.value,
          value: m.label,
          // profilePhoto: m.profilePhoto,
        }))
      );
    },
    renderItem: (item) => {
      console.log("item", item);

      // const avatar = item.profilePhoto
      //   ? `<img src="${item.profilePhoto}" alt="${item.value}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;" />`
      //   : `<span style="width: 24px; height: 24px; border-radius: 50%; background: "black"; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 8px;">
      //         ${item.label}
      //      </span>`;

      return `<div style="display: flex; align-items: center;"><span>${item.value}</span></div>`;
    },
  };

  // Toolbar Config
  const modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
    ],
    mention: {
      allowedChars: /^[A-Za-z\s]*$/, // ✅ space allowed
      mentionDenotationChars: ["@"],
      source: function (searchTerm, renderList, mentionChar) {
        const values = [
          { id: 1, value: "Arun Kumar" },
          { id: 2, value: "Priya Sharma" },
          { id: 3, value: "John Doe" },
        ];
        const matches = values.filter((entry) =>
          entry.value.toLowerCase().includes(searchTerm.toLowerCase())
        );
        renderList(matches, searchTerm);
      },
    },
  };

  const formats = [
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
    "mention"
  ];

  return (
    <div className="position-relative" onClick={(e) => e.stopPropagation()}>
      <div className="undoRedoBtns" style={{ position: "absolute", top: "10px", right: "10px" }}>
        {isAllowFile && (
          <button type="button" onClick={handleFileUpload} style={{ background: "none" }}>
            <DescriptionOutlinedIcon />
          </button>
        )}
        <button type="button" onClick={handleUndo} disabled={isDisabled} style={{ background: "none" }}>
          <UndoRoundedIcon />
        </button>
        <button type="button" onClick={handleRedo} disabled={isDisabled} style={{ background: "none" }}>
          <RedoRoundedIcon />
        </button>
      </div>

      <input
        type="file"
        id="fileUploader"
        className="d-none"
        multiple
        accept="video/*, image/*, application/pdf"
      />

      <ReactQuill
        ref={quillRef}
        modules={modules}
        formats={formats}
        preserveWhitespace={true}
        style={{ flexGrow: 1, height: "fit-content", marginBottom: "10px" }}
        placeholder="Write away..."
        value={content}
        readOnly={isDisabled}
        onChange={handleChange}
      />

      <div className="d-flex align-items-center w-100 flex-wrap">
        {files?.map((imgFile, index) => (
          <div key={index} className="col-lg-4 p-2">
            <div className="position-relative">
              {(dataObj.attachments.length === files.length &&
                dataObj?.attachments[index].type === "video/mp4") ? (
                <video className="w-100 h-auto" controls>
                  <source src={imgFile} type={dataObj?.attachments[index].type} />
                </video>
              ) : (
                <img
                  className="w-100 h-auto"
                  src={imgFile}
                  alt="uploaded file"
                  style={{ borderRadius: "4px" }}
                />
              )}
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
