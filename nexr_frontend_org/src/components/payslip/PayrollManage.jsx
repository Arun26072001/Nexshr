import React, { useState } from 'react'
import DefinitionToggle from '../Settings/DefinitionToggle';
import { MultiCascader } from 'rsuite';
import { NavLink } from 'react-router-dom';

export default function PayrollManage({ whoIs }) {
    const [isShowInstructions, setShowInstruction] = useState(true);
    function handleShowNotification() {
        setShowInstruction(!isShowInstructions);
    }

    const instructions = (
        <>
          <p>
            By default, all users are eligible for Payrun and{' '}
            <NavLink to={`${whoIs}/add-benifits`}>Beneficiary badges</NavLink>.
          </p>
          <p>
            If you want to restrict some users for the default payrun settings, then
            please add users for Payrun and Beneficiary badges.
          </p>
        </>
      );
      
    const data = [
        {
            label: 'Balaji',
            value: 'balaji',
            children: [
                {
                    label: '1000',
                    value: '1000'
                },
                {
                    label: '1500',
                    value: '1500'
                }
            ]
        },
        {
            label: 'Siva',
            value: 'siva',
            children: [
                {
                    label: '2000',
                    value: '2000'
                },
                {
                    label: '2200',
                    value: '2200'
                }
            ]
        }
    ];
    return (
        <div>
            <div className='payslipTitle'>Manage audience</div>
            {
                isShowInstructions &&
                <DefinitionToggle title="Restriction Note" instructions={instructions} handleShowNotification={handleShowNotification} />
            }

            <div className="row px-3">
                <div className="py-2">
                    <span>Department Preference</span>
                </div>
                <MultiCascader data={data} className="col-12" />

                <div className="py-2">
                    <span>User Preference</span>
                </div>
                <MultiCascader data={data} className="col-12" />

                <div className="py-2">
                    <span>Employee status Preference</span>
                </div>
                <MultiCascader data={data} className="col-12" />
            </div>

            <div className="row">
                <div className="col-lg-3 col-12">
                    <div className="btnParent mx-auto">
                        <button className="button">Save</button>
                        <button className="outline-btn" style={{ background: "#e0e0e0", border: "none" }}>Cancel</button>
                    </div>
                </div>
            </div>

        </div>
    )
}
