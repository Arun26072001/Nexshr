import React from "react";
import "./SettingsStyle.css";

const InputComponent = ({name, inputValue,inputName, additional, placeHolder, onChange}) => {
  return (
    <div className="row mb-3">
        <div className="col-lg-4 d-flex align-items-center">
            <label htmlFor="" className="form-label inputFont">
            {name}
            </label>
        </div>
        <div className="col-lg-8">
            <input type="text" name={inputName} value={inputValue} className='form-control' placeholder={placeHolder} onChange={(e)=> onChange(e)} />
            {additional && <p style={{fontSize: "10px"}} className="text-secondary">{additional}</p>}
        </div>
    </div>
  )
};

export default InputComponent;
