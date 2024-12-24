import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import { fetchPayslipInfo } from '../ReuseableAPI';

export default function PayslipInfo() {
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const [payslips, setPayslips] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [fieldName, setFieldName] = useState('');
    const [type, setType] = useState('');

    function addField() {
        const fieldName = prompt("Enter field name: ");
        const type = prompt("Enter Field type: ");
        const updatedArray = [...payslips, { fieldName, type }];
        setPayslips(updatedArray);
        setFieldName('');
        setType('');
        setModalVisible(false); // Close the modal
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
        <div className='payslip_header'>
            <div className="d-flex">
                <p className="payslipTitle">
                    PAYSLIP
                </p>
                {/* 
                <button className='button m-0' onClick={addField}>Add Field</button> */}

                <button
                    className="btn btn-dark btn-sm"
                    onClick={(addField) => setModalVisible(true)}
                >
                    Add Field
                </button>

                {/* Bootstrap Modal */}
                {modalVisible && (
                    <div className="modal show d-block" tabIndex="-1" role="dialog">
                        <div className="modal-dialog modal-content modal-lg" role="document">
                            <div className="">
                                <div className="modal-header">
                                    <h5 className="modal-title">Add Field</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setModalVisible(false)}
                                        aria-label="Close"
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="fieldName" className="form-label">
                                            Field Name
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="fieldName"
                                            value={fieldName}
                                            onChange={(e) => setFieldName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setModalVisible(false)}
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={addField}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                    <div className="col-lg-12 text-end">
                        <div className="btnParent mt-1 d-inline-flex gap-2" style={{ padding: "0px 30px" }}>
                            <button className="outline-btn" onClick={removeLastField} style={{ background: "#e0e0e0", border: "none" }}>Cancel</button>
                            <button className="button" onClick={submitPayslip}>Save</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}
