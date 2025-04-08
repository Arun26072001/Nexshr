import React, { useContext, useEffect, useRef, useState } from 'react';
import "./payslipui.css";
import logo from "../../imgs/webnexs_logo.webp";
import { fetchPayslip, fetchPayslipInfo } from '../ReuseableAPI';
import { toast } from 'react-toastify';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { useNavigate, useParams } from 'react-router-dom';
import { EssentialValues } from '../../App';
import Loading from '../Loader';

export default function PayslipUI() {
    const { id } = useParams();
    const { whoIs } = useContext(EssentialValues);
    const navigate = useNavigate();
    const payslipRef = useRef(null);
    const [payslips, setPayslips] = useState(null); // Updated to null for initial state
    const [payslipFields, setPayslipFields] = useState([]);
    const [earnings, setEarnings] = useState(0);
    const [deductions, setDeductions] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const handleDownloadPdf = () => {
        const content = payslipRef.current;
        html2canvas(content).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const width = pdf.internal.pageSize.getWidth();
            let height = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            pdf.save(`payslip/${payslips?.payslip?.status}.pdf`);
        });
    };

    function numberToWords(num) {
        const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const scales = ['', 'thousand', 'lakh', 'crore'];

        if (num === 0) return 'zero';

        function getBelowThousand(n) {
            if (n < 20) return a[n];
            if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
            return a[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + getBelowHundred(n % 100) : '');
        }

        function getBelowHundred(n) {
            if (n < 20) return a[n];
            return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        }

        let result = '';
        let scaleIndex = 0;

        while (num > 0) {
            let remainder = num % 1000; // Get last 3 digits
            if (remainder > 0) {
                const scale = scales[scaleIndex];
                result = getBelowThousand(remainder) + (scale ? ' ' + scale : '') + (result ? ' ' + result : '');
            }
            num = Math.floor(num / 1000);
            scaleIndex++;
        }

        return result.trim();
    }


    useEffect(() => {
        const gettingPayslip = async () => {
            try {
                const payslipInfo = await fetchPayslipInfo();
                if (payslipInfo?.payslipFields) {
                    setPayslipFields(payslipInfo?.payslipFields);
                }
            } catch (error) {
                console.log(error);
                toast.error(error);
            }
        };
        gettingPayslip();
    }, []);

    useEffect(() => {
        if (payslipFields && payslips?.payslip) {
            let totalEarnings = 0;
            let totalDeductions = 0;
            const value = 10;

            for (let i = 0; i < value; i++) {
                const fieldValue = payslips?.payslip?.[payslipFields[i]?.fieldName] || 0; // Default to 0 if field is missing

                if (i < 5) {
                    if (i === 0) {
                        totalEarnings += Number(payslips?.employee?.[payslipFields[i]?.fieldName])
                    } else {
                        totalEarnings += fieldValue;
                    }
                } else {

                    totalDeductions += fieldValue;
                }
            }

            // Set the final values once after the loop
            setEarnings(totalEarnings);
            setDeductions(totalDeductions.toFixed(2));
        }
    }, [payslipFields, payslips]);

    useEffect(() => {
        async function fetchPayslips() {
            setIsLoading(true);
            try {
                const slips = await fetchPayslip(id);
                setPayslips(slips);
            } catch (err) {
                toast.error(err?.response?.data?.error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPayslips();
    }, [id]);

    return (
        isLoading ? <Loading height='80vh' /> :
            <div className="modal-overlay">
                <div className="modal-content m-auto" style={{ width: "fit-content" }}>
                    <div className="container" ref={payslipRef} style={{ width: "600px", padding: "25px" }}>
                        {/* Header section */}
                        <div className='d-flex payslipHeader'>
                            <div>
                                <div className='d-flex gap-1'>
                                    <div className='brightLogo'>B</div>
                                    <div>
                                        <p className='m-0' style={{ borderBottom: "2px solid orange", fontSize: "38px", fontWeight: "700" }}>Bright</p>
                                        <p className='text-center m-0' style={{ letterSpacing: "2px" }}>LIVINGSTONE</p>
                                    </div>
                                </div>
                                <p style={{ fontSize: "10px", fontWeight: "900" }}>
                                    {payslips?.employee?.company?.CompanyName || "Company Name"} {payslips?.employee?.company?.Address || "Address"}
                                </p>
                            </div>
                            <div className='text-center' >
                                <p className='headingFont'>{payslips?.employee?.company?.CompanyName || "Company Name"} Private LTD</p>
                                <p className='m-0 payslipTxt'>{payslips?.employee?.company?.Address || "Address"}</p>
                                <p className='m-0 payslipTxt'>
                                    TamilNadu - {payslips?.employee?.company?.PostalCode || "Postal Code"} India
                                </p>
                            </div>
                            <div className='text-center'>
                                <img src={logo} alt="logo" className='avatar' />
                                <p className='payslipTxt'>Payslip For This period of Month</p>
                                <p className='payslipTxt m-0'>
                                    <b>{payslips?.payslip?.period || "N/A"}</b>
                                </p>
                            </div>
                        </div>

                        {/* Employee Summary */}
                        <div className='d-flex payslipHeader py-3'>
                            <div>
                                <p className='headingFont'>Employee Summary : </p>
                                <p className='payslipTxt'>Employee Name : {payslips?.employee?.FirstName} {payslips?.employee?.LastName}</p>
                                <p className='payslipTxt'>Employee ID : {payslips?.employee?.EmployeeCode}</p>
                                <p className='payslipTxt'>DOJ : {payslips?.employee?.dateOfJoining}</p>
                                <p className='payslipTxt'>DOB : {payslips?.employee?.DOB}</p>
                            </div>
                            <div>
                                <div className="boxBorder">
                                    <div style={{ background: "#D6EFD8" }}>
                                        <p className='rupeeFont'>₹{payslips?.employee?.basicSalary || 0}</p>
                                        <p className='payslipTxt'>Employee Net Pay</p>
                                    </div>
                                    <div className=''>
                                        <p className='payslipTxt'>Paid Days: {payslips?.payslip?.paidDays}</p>
                                        <p className='payslipTxt'>LOP Days: {payslips?.payslip?.LossOfPay || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Employee Bank and Division */}
                        <div className='d-flex payslipHeader py-3'>
                            <div>
                                <p className='payslipTxt'>Bank : {payslips?.employee?.bankName || "N/A"}</p>
                                <p className='payslipTxt'>Account Number : {payslips?.employee?.accountNo || "N/A"}</p>
                                <p className='payslipTxt'>Division : {payslips?.employee?.role?.[0]?.RoleName || "N/A"}</p>
                            </div>
                            <div>
                                <p className='payslipTxt'>Designation : {payslips?.employee?.position?.[0]?.PositionName || "N/A"}</p>
                                <p className='payslipTxt'>Pan Number : {payslips?.employee?.panNumber || "N/A"}</p>
                                <p className='payslipTxt'>Location : {payslips?.employee?.address?.city || "N/A"}</p>
                            </div>
                        </div>

                        {/* Earnings and Deductions Table */}
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
                                    <tr>
                                        <td>{payslipFields[0]?.fieldName[0].toUpperCase() + payslipFields[0]?.fieldName.slice(1) || "N/A"}</td>
                                        <td>{payslips?.employee?.[payslipFields[0]?.fieldName] || "N/A"}</td>
                                        <td>{payslipFields[5]?.fieldName[0].toUpperCase() + payslipFields[5]?.fieldName.slice(1) || "N/A"}</td>
                                        <td>{payslips?.payslip?.[payslipFields[5]?.fieldName] || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td>{payslipFields[1]?.fieldName[0].toUpperCase() + payslipFields[1]?.fieldName.slice(1) || "N/A"}</td>
                                        <td>{payslips?.payslip[payslipFields[1]?.fieldName] || "N/A"}</td>
                                        <td>{payslipFields[6]?.fieldName[0].toUpperCase() + payslipFields[6]?.fieldName.slice(1) || "N/A"}</td>
                                        <td>{payslips?.payslip[payslipFields[6]?.fieldName] || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td>{payslipFields[2]?.fieldName[0].toUpperCase() + payslipFields[2]?.fieldName.slice(1) || "N/A"}</td>
                                        <td>{payslips?.payslip[payslipFields[2]?.fieldName] || "N/A"}</td>
                                        <td>{payslipFields[7]?.fieldName[0].toUpperCase() + payslipFields[7]?.fieldName.slice(1) || "N/A"}</td>
                                        <td>{payslips?.payslip[payslipFields[7]?.fieldName]}</td>
                                    </tr>
                                    <tr>
                                        <td>{payslipFields[3]?.fieldName[0].toUpperCase() + payslipFields[3]?.fieldName.slice(1) || "N/A"}</td>
                                        <td>{payslips?.payslip[payslipFields[3]?.fieldName] || "N/A"}</td>
                                        <td>{payslipFields[8]?.fieldName[0].toUpperCase() + payslipFields[8]?.fieldName.slice(1) || "N/A"}</td>
                                        <td>{payslips?.payslip[payslipFields[8]?.fieldName] || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td>{payslipFields[4]?.fieldName[0].toUpperCase() + payslipFields[4]?.fieldName.slice(1) || "N/A"}</td>
                                        <td>{payslips?.payslip[payslipFields[4]?.fieldName] || "N/A"}</td>
                                        <td>{payslipFields[9]?.fieldName[0].toUpperCase() + payslipFields[9]?.fieldName.slice(1) || "N/A"}</td>
                                        <td>{payslips?.payslip[payslipFields[9]?.fieldName]}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th>Gross Earnings</th>
                                        <th>₹{earnings || "N/A"}</th>
                                        <th>Total Deductions</th>
                                        <th>₹{deductions || "N/A"}</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Total Net Payable Section */}
                        <div className='border border-dark d-flex justify-content-between'>
                            <div className='d-block align-content-center pl-2'>
                                <p className='headingFont text-dark'>TOTAL NET PAYABLE</p>
                                <p className='payslipTxt m-0'>Gross Earnings - Total Deductions</p>
                            </div>
                            <div className='totalBox'>
                                ₹{earnings && deductions !== 0 && (earnings - deductions).toFixed(2)}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className='payslipHeader'>
                            <p className='py-2 payslipTxt text-center'>
                                Amount in words: <b>Indian Rupee {numberToWords(earnings - deductions) || "N/A"} Only</b>
                            </p>
                            <p className='payslipTxt'>
                                Through this document, we also confirm that the company name "<b>{payslips?.employee?.company?.CompanyName}</b>" is a legal part of <b>Bright Livingstone Consultancy PVT. LTD.</b> and is located in Chennai.
                            </p>
                        </div>
                        <p className='py-2 payslipTxt text-center'>
                            -- This is a computer-generated payslip, hence no signature is required --
                        </p>
                    </div>
                    <div className='d-flex justify-content-center py-2 gap-2'>
                        <button className='button bg-secondary m-0' onClick={() => navigate(`/${whoIs}/job-desk/history`)}>Close</button>
                        <button className='button m-0' onClick={handleDownloadPdf}>Download</button>
                    </div>
                </div>
            </div>
    );
}
