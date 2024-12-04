import React, { useState } from 'react'
import DefinitionToggle from '../Settings/DefinitionToggle';
import { MultiCascader } from 'rsuite';

export default function PayrollValue() {
    const [isShowInstructions, setShowInstruction] = useState(true);
    const [multiSelector, setMultiSelector] = useState("");
    function handleShowNotification() {
        setShowInstruction(!isShowInstructions);
    }
    const instructions = [
        'Create badge for allowance or deduction from Beneficiary badge module.',
        'Select badge and assign a value that will applicable for all employees (Except those are updated individually) while execute payrun.',
        'You can set beneficiary individually over the default from the Employees details.',
        'You can also update beneficiaries in Payslip generated for every employee.'
    ]
    const data = [
        {
            label: 'Frontend',
            value: 'frontend',
            children: [
                {
                    label: 'React',
                    value: 'react'
                },
                {
                    label: 'Angular',
                    value: 'angular'
                }
            ]
        },
        {
            label: 'Backend',
            value: 'backend',
            children: [
                {
                    label: 'Node.js',
                    value: 'nodejs'
                },
                {
                    label: 'Python',
                    value: 'python'
                }
            ]
        }
    ];
    
    console.log(multiSelector);

    return (
        <div>
            <div className='payslipTitle'>How Badge value work?</div>
            {
                isShowInstructions &&
                <DefinitionToggle title={"How payrun works?"} instructions={instructions} handleShowNotification={handleShowNotification} />
            }
            <div className="p-3">
                <div>
                    <span>Allowance</span>
                </div>
                <div className='mt-2'>
                <MultiCascader
                    data={data}
                    value={multiSelector}
                    onChange={setMultiSelector}
                    className="col-12"
                />
                </div>
                <div className='mt-2'>
                    <span>Deduction</span>
                </div>
                <div className='mt-2'>
                <MultiCascader
                    data={data}
                    className="col-12"
                />
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
    )
}
