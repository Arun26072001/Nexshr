import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import { fetchPayslipInfo } from '../ReuseableAPI';
import PayslipUI from './PayslipUI';

export default function PayslipInfo() {
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const [payslips, setPayslips] = useState([]);

    function addField() {
        const fieldName = prompt("Enter field name: ");
        const type = prompt("Enter Field type: ");
        const updatedArray = [...payslips, { fieldName, type }];
        setPayslips(updatedArray);
    }

    function removeLastField() {
        if (payslips.length > 0) {
            const updatedArray = [...payslips];
            updatedArray.pop();
            setPayslips(updatedArray);
        }
    }

    async function submitPayslip() {
        console.log(payslips);

        try {
            const payslip = await axios.post(`${url}/api/payslip-info`, payslips, {
                headers: {
                    Authorization: token || ""
                }
            })
            toast.success(payslip?.data?.message);
        } catch (err) {
            console.log(err);
            toast.error(err?.response?.data?.message)
        }
    }

    function handleFieldValue(e) {
        const { name, value } = e.target;
        setPayslips((prePayslip) => prePayslip.map((data) => data.fieldName === name ? { ...data, value } : data))
    }

    useEffect(() => {
        const gettingPayslip = async () => {
            const payslipInfo = await fetchPayslipInfo();
            if (payslipInfo?.payslipFields) {
                setPayslips(payslipInfo?.payslipFields);
            } else {
                setPayslips([]);
            }
        }
        gettingPayslip();
    }, []);

    return (
        <div>
            <div className="d-flex">
                <div className="payslipTitle">
                    Payslip
                </div>

                <button className='button m-0' onClick={addField}>Add Field</button>
            </div>

            <div className="px-3">
                {
                    payslips?.length > 0 &&
                    payslips.map((data) => {
                        return <div className="my-3">
                            <div className="my-2">
                                {data.fieldName[0].toUpperCase() + data.fieldName.slice(1, data.fieldName.length)}
                            </div>
                            <input type={data.type} className="payrunInput" value={data?.value} name={data.fieldName} onChange={(e) => handleFieldValue(e)} placeholder={`Enter ${data.fieldName}`} />
                        </div>
                    })
                }
            </div>

            {
                payslips?.length > 0 &&
                <div className="row">
                    <div className="col-lg-3 col-12">
                        <div className="btnParent mx-auto">
                            <button className="button" onClick={submitPayslip}>Save</button>
                            <button className="outline-btn" onClick={removeLastField} style={{ background: "#e0e0e0", border: "none" }}>Cancel</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}
