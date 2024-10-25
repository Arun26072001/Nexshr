import React from "react"
import "./SettingsStyle.css"; 

const SelectEmp = ({emp, EmpID, active,action, removeEmp}) => {
  const {CompanyName, Town} = emp.company[0];

  const changeSelectEmp = async (emp)=> {
    if(EmpID.length > 0){
      let isEmp = await EmpID.map(id =>(
         id == emp._id
      ));
      console.log(isEmp);
      isEmp.map(has =>{
        if(!has) {
          action(emp)
        }else {
          removeEmp(emp)
        }
      })
    }else {
      action(emp)
    }
  }
  return (
    <div
    className={`dayBox my-2 ${active && "enable"}`}
    onClick={()=>changeSelectEmp(emp)}>
    <b className="lead">{`${emp.FirstName} ${emp.LastName}`}</b>
    <p className="text-danger py-2">Employee Works at {`${CompanyName} ${Town}`}</p>
  </div>
  )
};

export default SelectEmp;
