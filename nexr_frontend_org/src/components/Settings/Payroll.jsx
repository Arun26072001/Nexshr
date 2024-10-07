import React, { useState } from 'react';
import NavModelRouter from '../payslip/NavModelRouter';
import DefinitionToggle from './DefinitionToggle';
import { MultiCascader } from 'rsuite';

export default function Payroll({ whoIs }) {
  const files = ['default', 'value', 'manage', 'payslip'];
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
      <div className="payslipTitle">Payrun</div>
      <NavModelRouter whoIs={whoIs} files={files} />

      {
        isShowPayrun &&
        <DefinitionToggle handleShowNotification={handleShowNotification} instructions={instructions} />
      }
      <div className="row gap-2 d-flex justify-content-center">
        <div className="col-lg-5">
          <div className="py-2">
            <span>Pay run period</span>
          </div>
          <select className="payrunInput">
            <option value="">Select Payrun</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="col-lg-5">
          <div className="d-flex justify-content-between py-2">
            <span>Payrun Generating type</span>
          </div>
          <select className="payrunInput">
            <option value="">Select Payrun</option>
            <option value="hour">Hour</option>
            <option value="day">Day</option>
          </select>
        </div>

        <div className="col-lg-5">
          <div className="d-flex justify-content-between py-2">
            <span>Bonus</span> <span style={{ color: "gray" }}>(Allowance)</span>
          </div>
          <div className="position-relative">
            <input type="number" min={0} max={100} className="payrunInput" />
          </div>
        </div>

        <div className="col-lg-5">
          <div className="d-flex justify-content-between py-2">
            <span>Tax</span> <span style={{ color: "gray" }}>(Deduction)</span>
          </div>
          <div className="position-relative">
            <input type="number" min={0} max={100} step={".5"} className="payrunInput" />
          </div>
        </div>

      </div>
    </>
  )
}
