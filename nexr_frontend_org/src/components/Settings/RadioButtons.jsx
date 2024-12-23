import React from "react"

const RadioButtons = ({ RadioOption, handleRadioOption, names, title, name }) => {

  return (
    <div className={`${names?.includes("Everyone") ? "d-block" : "d-flex align-content-center"}  col-lg-4 text-center my-2 gap-4`}>
      {title && <p>
        <b>{title}</b>
      </p>}
      <button name={name} className={`outline-btn ${RadioOption === 1 && "enable"} border-0`}
        onClick={() => handleRadioOption(name, 1)}
        value={RadioOption}
        style={names && names[0] === "Everyone" ? { fontSize: "13px" } : undefined}
      >
        <div className="d-flex">
          <input
            className='form-check-input'
            type="radio"
            checked={RadioOption === 1 ? true : false}
            readOnly
          />
          <div className="ms-1">

            {(names && names.length >= 1 ? names[0] : "Enable")}
          </div>
        </div>
        {/* <input
          className='form-check-input'
          type="radio"
          checked={RadioOption === 1 ? true : false}
          readOnly
        />{" "}
        {(names && names.length >= 1 ? names[0] : "Enable")} */}
      </button>
      <button name={name} className={`ms-1 outline-btn ${RadioOption === 0 && "enable"} border-0 ${names?.includes("Everyone") && "mt-2"}`}
        onClick={() => handleRadioOption(name, 0)}
        value={RadioOption}
        style={names && names[1] === "Managers" ? { fontSize: "13px" } : undefined}
      >
        <div className="d-flex">
          <input
            className='form-check-input'
            type="radio"
            checked={RadioOption === 0 ? true : false}
            readOnly
          />
          <div className="ms-1">   {(names && names.length >= 1 ? names[1] : 'Disable')}</div>
        </div>
      </button>
    </div>
  )
};

export default RadioButtons;
