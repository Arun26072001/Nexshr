import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchPayslipInfo } from "../ReuseableAPI";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { EssentialValues } from "../../App";

export default function PayslipInfo() {
    const url = process.env.REACT_APP_API_URL;
    const {data}  = useContext(EssentialValues);
    const [payslipInfos, setPayslipInfos] = useState({ payslipFields: [] });
    const [modalVisible, setModalVisible] = useState(false);
    const [field, setField] = useState({});
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const getPayslipData = async () => {
            try {
                const res = await fetchPayslipInfo();
                console.log(res);
                
                // setPayslipInfos(payslipInfo?.payslipFields ? payslipInfo : { payslipFields: [] });
            } catch (error) {
                console.error("Error fetching payslip data:", error);
                toast.error("Failed to load payslip data.");
            }
        };
        getPayslipData();
    }, []);

    const handleFieldValue = (e) => {
        const { name, value } = e.target;
        setField((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    async function addPayslipInfo() {
        try {
            const response = await axios.post(`${url}/api/payslip-info`, payslipInfos, {
                headers: { Authorization: data.token || "" },
            });
            toast.success(response.data.message);
        } catch (error) {
            console.error("Error updating payslip info:", error);
            toast.error(error.response?.data?.error || "Failed to update payslip info.");
        }
    }

    const addField = () => {
        if (!field.fieldName || !field.type) {
            toast.warning("Please complete all field details.");
            return;
        }

        if (payslipInfos.payslipFields.some((item) => item.fieldName === field.fieldName)) {
            toast.error("Field name already exists.");
            return;
        }

        setPayslipInfos((prev) => ({
            ...prev,
            payslipFields: [...prev.payslipFields, field],
        }));

        setField({});
        setModalVisible(false);
        toast.success("Field added successfully.");
    };

    const editField = () => {
        if (!field.fieldName || !field.type) {
            toast.warning("Please complete all field details.");
            return;
        }

        const updatedFields = payslipInfos.payslipFields.map((item) =>
            item.fieldName.includes(field.fieldName) ? { ...item, ...field } : item
        );

        setPayslipInfos((prev) => ({
            ...prev,
            payslipFields: updatedFields,
        }));

        setField({});
        setModalVisible(false);
        setIsEdit(false);
        toast.success("Field updated successfully.");
    };

    const deleteInfo = (fieldData) => {
        setPayslipInfos((prev) => ({
            ...prev,
            payslipFields: prev.payslipFields.filter(
                (item) => item.fieldName !== fieldData.fieldName
            ),
        }));
        toast.success("Field removed successfully.");
    };

    const editInfo = (data) => {
        setField(data);
        setModalVisible(true);
        setIsEdit(true);
    };

    const updatePayslipInfo = async () => {
        try {
            const response = await axios.put(`${url}/api/payslip-info/${payslipInfos._id}`, payslipInfos, {
                headers: { Authorization: data.token || "" },
            });
            toast.success(response.data.message);
        } catch (error) {
            console.error("Error updating payslip info:", error);
            toast.error(error.response?.data?.error || "Failed to update payslip info.");
        }
    };

    return (
        <div className="payslip_header">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="payslipTitle">Payslip Information</h2>
                <button className="btn btn-dark btn-sm" onClick={() => setModalVisible(true)}>
                    Add Field
                </button>
            </div>

            {modalVisible && (
                <div className="modal show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-content modal-lg" role="document">
                        <div className="modal-header">
                            <h5 className="modal-title">{isEdit ? "Edit Field" : "Add Field"}</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => {
                                    setModalVisible(false);
                                    setIsEdit(false);
                                    setField({});
                                }}
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
                                    name="fieldName"
                                    value={field.fieldName || ""}
                                    onChange={handleFieldValue}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="type" className="form-label">
                                    Field Type
                                </label>
                                <select
                                    className="form-control"
                                    name="type"
                                    value={field.type || ""}
                                    onChange={handleFieldValue}
                                >
                                    <option value="">Select Type</option>
                                    <option value="number">Number</option>
                                    <option value="text">Text</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setModalVisible(false);
                                    setIsEdit(false);
                                    setField({});
                                }}
                            >
                                Close
                            </button>
                            <button type="button" className="btn btn-primary" onClick={isEdit ? editField : addField}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-3">
                {payslipInfos.payslipFields.length > 0 ? (
                    payslipInfos.payslipFields.map((data, index) => (
                        <div
                            key={index}
                            className="payslipInfoCard row d-flex justify-content-between align-items-center border rounded py-3 my-2 shadow-sm bg-white"
                        >
                            <div className="fw-bold col-lg-8 col-md-7 col-12 text-truncate">
                                {data.fieldName[0].toUpperCase() + data.fieldName.slice(1)}
                            </div>
                            <div className="col-lg-4 col-md-5 col-12 d-flex justify-content-end">
                                <button
                                    className="btn btn-outline-success me-2"
                                    title="Edit"
                                    onClick={() => editInfo(data)}
                                    aria-label="Edit"
                                >
                                    <EditRoundedIcon />
                                </button>
                                <button
                                    className="btn btn-outline-danger"
                                    title="Delete"
                                    onClick={() => deleteInfo(data)}
                                    aria-label="Delete"
                                >
                                    <DeleteRoundedIcon />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-3">
                        <p className="text-muted">No fields available. Add a new field to get started.</p>
                    </div>
                )}
            </div>

            {payslipInfos.payslipFields.length > 0 && (
                <div className="text-end mt-4">
                    <button className="btn btn-primary me-2" onClick={payslipInfos._id ? updatePayslipInfo : addPayslipInfo}>
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
}
