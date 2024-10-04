import React, { useEffect, useState } from "react"

const EditTimePattern = ({pattern, patternName, changePatternName, handleSubmit, closeModel}) => {
    const [isRename, setIsRename] = useState(true);
    console.log(patternName);
    console.log(pattern.PatternName);
    useEffect(()=>{
      if(patternName === pattern.PatternName) {
        setIsRename(true)
    }else {
      setIsRename(false)
    }
    }, [pattern.PatternName])

  return (
    <div className="formModal">
    <div className="modal-dialog modal-dialog-centered" role="document">
      <div className="modal-content">
        <div className="modal-header " style={{backgroundColor: "#BBE9FF"}} >
          <h5 className="modal-title" id="exampleModalLongTitle">{pattern.PatternName}</h5>
          <button type="button" className="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true" onClick={closeModel}>&times;</span>
          </button>
        </div>
        <div className="modal-body">
          <p className="my-3">What would you like to rename the pattern to?</p>
            <input type="text" name="PatternName" className="form-control" onChange={(e)=> changePatternName(e)} value={pattern.PatternName} />
        </div>
        <div className="modal-footer">
          <button type="button" className="outline-btn" onClick={()=>closeModel()}>Close</button>
          <button type="submit" onClick={()=>handleSubmit(pattern._id)} className="button" disabled={isRename}>Rename</button>
        </div>
      </div>
    </div>
  </div>
  )
};

export default EditTimePattern;
