import React, { useEffect, useState } from 'react';
import "./payslipui.css";
import logo from "../../imgs/webnexs_logo.png";
import { fetchPayslip } from '../ReuseableAPI';
import { toast } from 'react-toastify';

export default function PayslipUI() {
    const payslipId = "670cc96bda78cf4438479170";
    const [payslips, setPayslips] = useState([]);

    const payslipData = {
        earnings: [
            { label: "Basic", amount: "₹8500" },
            { label: "House Rend Allowance", amount: "₹1800" },
            { label: "Conveyance Allowance", amount: "₹420" },
            { label: "Other Allowance", amount: "₹380" },
            { label: "Bonus Advance", amount: "₹1000" }
        ],
        deductions: [
            { label: "Income Tax", amount: "₹0.00" },
            { label: "PF", amount: "₹1800" },
            { label: "Professional Tax", amount: "₹200" },
            { label: "ESI", amount: "₹150" },
            { label: "Loss of Pay", amount: "₹0.00" }
        ]
    };

    useEffect(() => {
        async function fetchPayslips() {
            try {
                const slips = await fetchPayslip(payslipId);
                console.log(slips);

                setPayslips(slips);
            } catch (err) {
                toast.error(err?.response?.data?.error)
            }
        }

        fetchPayslips();
    }, [payslipId])
    console.log(payslips);
    
    return (
        <div className="container">
            <div className='d-flex payslipHeader'>
                <div>
                    <div className='d-flex gap-1'>
                        <div className='brightLogo'>B</div>
                        <div>
                            <h1 style={{ borderBottom: "2px solid orange" }}>Bright</h1>
                            <p className='text-center' style={{ letterSpacing: "2px" }}>LIVINGSTONE</p>
                        </div>
                    </div>
                    <p style={{ fontSize: "10px", fontWeight: "900" }}>Bright Livingstone Consultancy Private LTD</p>
                </div>
                <div className='text-center'>
                    <p className='headingFont'>Bright Livingstone Consultancy Private LTD</p>
                    <p className='m-0 payslipTxt'>SIDCO, TS-2, Thirumudivakkam, Chennai,</p>
                    <p className='m-0 payslipTxt'>TamilNadu - 600044 India</p>
                </div>
                <div className='text-center'>
                    <img src={logo} alt="logo" className='avatar' />
                    <p className='payslipTxt'>Payslip For This Month</p>
                    <p className='payslipTxt m-0'><b>September 2024</b></p>
                </div>
            </div>

            <div className='d-flex payslipHeader py-3'>
                <div>
                    <p className='headingFont'>Employee Summary</p>
                    <p className='payslipTxt'>Employee Name : {payslipData}</p>
                    <p className='payslipTxt'>Employee ID : W03920</p>
                    <p className='payslipTxt'>DOJ : 10/01/2024</p>
                    <p className='payslipTxt'>DOB : 30/10/2001</p>
                </div>
                <div>
                    <div className="boxBorder">
                        <div style={{ background: "#D6EFD8" }}>
                            <p className='rupeeFont'>₹10000</p>
                            <p className='payslipTxt'>Employee Net Pay</p>
                        </div>
                        <div className=''>
                            <p className='payslipTxt'>Paid Days: 22.00</p>
                            <p className='payslipTxt'>LOP Days: 0</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='d-flex payslipHeader py-3'>
                <div>
                    <p className='payslipTxt'>Bank : Bank name</p>
                    <p className='payslipTxt'>Account Number : 09243932432</p>
                    <p className='payslipTxt'>Division : Software Development</p>
                </div>
                <div>
                    <p className='payslipTxt'>Designation : Internship</p>
                    <p className='payslipTxt'>Pan Number : AAAA</p>
                    <p className='payslipTxt'>Location : Madurai</p>
                </div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>EARNINGS</th>
                            <th>AMOUNT</th>
                            <th>DEDUCTIONS</th>
                            <th>AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Render earnings and deductions side by side */}
                        {payslipData.earnings.map((earning, index) => (
                            <tr key={index}>
                                <td>{earning.label}</td>
                                <td>{earning.amount}</td>
                                {/* Check if there is a corresponding deduction */}
                                {payslipData.deductions[index] ? (
                                    <>
                                        <td>{payslipData.deductions[index].label}</td>
                                        <td>{payslipData.deductions[index].amount}</td>
                                    </>
                                ) : (
                                    <>
                                        <td></td>
                                        <td></td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Gross Earnings</th>
                            <th>₹12100</th>
                            <th>Total Deductions</th>
                            <th>₹2150</th>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className='border border-dark d-flex justify-content-between'>
                <div className='d-block align-content-center pl-2'>
                    <p className='headingFont text-dark'>TOTAL NET PAYABLE</p>
                    <p className='payslipTxt m-0'>Gross Earnings - Total Deductions</p>
                </div>
                <div className='totalBox'>
                    ₹9,950.0
                </div>
            </div>

            <div className='payslipHeader'>
                <p className='py-2 payslipTxt text-center'>Amount in works : <b>Indian Rupee Nine Thousand Eight Hundred Fifty Only</b></p>
                <p className='payslipTxt'>Through this documant we also confirm that the company name "<b>Webnexs</b>" is a legal part of <b>Bright Livingstone Consultancy PVT.LTD</b> and It is located in Chennai</p>
            </div>
            <p className='py-2 payslipTxt text-center'>--This is computer generated payslip hence no signature is required--</p>
        </div>
    )
}
