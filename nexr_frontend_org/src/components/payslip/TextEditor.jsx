import React from "react"
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TextEditor = ({ handleChange, content, isDisabled }) => {

    const formats = [
        ['bold', 'italic', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        [{ 'color': [] }, { 'background': [] }],
        ['blockquote', 'code-block'],
        ['clean'],
    ];
    return (

        <ReactQuill
            modules={{ toolbar: formats }}
            style={{ flexGrow: 1, height: 'fit-content', marginBottom: "10px" }}
            placeholder='Write away...'
            value={content}
            readOnly={isDisabled}
            onChange={(e) => handleChange(e)}
        />

    )
};

export default TextEditor;
