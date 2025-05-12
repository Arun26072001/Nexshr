import React, { useState } from 'react';
import DefinitionToggle from './DefinitionToggle';

export default function Payroll() {
  const [isShowPayrun, setIsShowPayrun] = useState(true);
  function handleShowNotification() {
    setIsShowPayrun(!isShowPayrun);
  }
  const instructions = [
    'Default pay run is applicable to generate pays lip for all employees (Except those are updated individually) whenever it execute from Payrun module.',
    'You can set pay run individually over the default from the Employees details'
  ]

  return (
    <>
      <div>
        <p className="payslipTitle">PAYROLL</p>
        {isShowPayrun && (<DefinitionToggle title="Payroll" handleShowNotification={handleShowNotification} instructions={instructions} />)}

        <div className='p-3'>
          <div>
            <span>Payrun period</span>
          </div>
          <div className='mt-2'>
            <select className="payrunInput mb-3">
              <option value="">Select Payrun</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <span>Payrun Generating Type</span>
            </div>
            <div className='mt-2'>
           <select className="payrunInput mb-3">
            <option value="">Select Payrun</option>
            <option value="hour">Hour</option>
            <option value="day">Day</option>
          </select>
          </div>
          <div>
            <span>Bonus</span> <span style={{ color: "gray" }}>(Allowance)</span>
          </div>
          <div className="position-relative col-12 mb-3">
            <input type="number" min={0} max={100} className="payrunInput" />
          </div>

          <div>
            <span>Tax</span> <span style={{ color: "gray" }}>(Deduction)</span>
          </div>
          <div className="position-relative col-12 mb-3">
            <input type="number" min={0} max={100} step={".5"} className="payrunInput" />
          </div>
          </div>

        <div className="row">
          <div className="col-lg-12 text-end">
            <div className="btnParent mt-1 d-inline-flex gap-2" style={{ padding: "0px 30px" }}>
              <button className="outline-btn" style={{ background: "#e0e0e0", border: "none" }}>
                Cancel
              </button>
              <button className="button">Save</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

}
