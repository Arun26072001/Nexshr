import React from "react"

const RadioButtons = ({RadioOption, handleRadioOption, names, title, name}) => {
  return (
    <div className='col-lg-4 text-center my-2 d-block align-content-center'>
                {title && <p>
                  <b>{title}</b>
                </p>}
                  <button name={name} className={`outline-btn ${RadioOption === 1 && "enable"}`} 
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
                  <button name={name} className={`outline-btn ml-1 ${RadioOption === 0 && "enable"}`} onClick={handleRadioOption}
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
