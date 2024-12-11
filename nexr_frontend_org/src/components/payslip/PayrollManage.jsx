import React, { useContext, useEffect, useState } from 'react'
import DefinitionToggle from '../Settings/DefinitionToggle';
import { MultiCascader } from 'rsuite';
import { NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDepartments } from '../ReuseableAPI';
import { EssentialValues } from '../../App';

export default function PayrollManage() {
    const { whoIs } = useContext(EssentialValues);
    const [isShowInstructions, setShowInstruction] = useState(true);
    const [departments, setDepartments] = useState([]);
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

    useEffect(() => {
        async function fetchDepartments() {
            try {
                const departments = await getDepartments()
                setDepartments(departments);

            } catch (err) {
                toast.error(err);
                console.log(err.data);
            }
        }
        fetchDepartments()
    }, [])
    return (
        <div>
            <div className='payslipTitle'>MANAGE AUDIENCE</div>
            {
                isShowInstructions &&
                <DefinitionToggle title="Restriction Note" instructions={instructions} handleShowNotification={handleShowNotification} />
            }

            <div className="p-3">
                <div className='mt-2'>
                    <span>Department Preference</span>
                </div>
                <div className='mt-2'>
                <MultiCascader data={data} className="col-12" />
                </div>

                <div className='mt-2'>
                    <span>User Preference</span>
                </div>
                <div className='mt-2'>
                <MultiCascader data={data} className="col-12" />
                </div>

                <div className='mt-2'>
                    <span>Employee status Preference</span>
                </div>
                <div className='mt-2'>
                <MultiCascader data={data} className="col-12" />
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
