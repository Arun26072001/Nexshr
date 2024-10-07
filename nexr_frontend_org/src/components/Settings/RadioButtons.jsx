import React from "react"

const RadioButtons = ({ RadioOption, handleRadioOption, names, title, name }) => {
  return (
    <div className='col-lg-4 text-center my-2 d-flex align-content-center gap-1'>
      {title && <p>
        <b>{title}</b>
      </p>}
      <button name={name} className={`outline-btn ${RadioOption === 1 && "enable"} border-0`}
        onClick={handleRadioOption}
        value={RadioOption}
        style={names && names[0] === "Everyone" ? { fontSize: "13px" } : undefined}
      >
        <input
          className='form-check-input'
          type="radio"
          checked={RadioOption === 1 ? true : false}
          readOnly
        />{" "}
        {(names && names.length >= 1 ? names[0] : "Enable")}
      </button>
      <button name={name} className={`outline-btn ${RadioOption === 0 && "enable"} border-0`} onClick={handleRadioOption}
        value={RadioOption}

        style={names && names[1] === "Managers" ? { fontSize: "13px" } : undefined}

      >
        <input
          className='form-check-input'
          type="radio"
          checked={RadioOption === 0 ? true : false}
          readOnly
        />{" "}
        {(names && names.length >= 1 ? names[1] : 'Disable')}
      </button>
    </div>
  )
};

export default RadioButtons;
