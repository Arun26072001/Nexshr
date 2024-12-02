import React, { useContext, useEffect, useState } from 'react';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import CommonModel from './CommonModel';
import LeaveTable from '../LeaveTable';
import Cookies from 'universal-cookie';
import { EssentialValues } from '../../App';

export default function Position() {
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const cookies = new Cookies();
    const token = cookies.get('token');
    const [positionObj, setPositionObj] = useState({});
    const [positions, setPositions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPositionsDataUpdate, setIsPositionsDataUpdate] = useState(false);
    const [isAddPosition, setIsAddPosition] = useState(false);
    const navigate = useNavigate();
    const [error, setError] = useState("");

    function reloadPositionPage() {
        setIsPositionsDataUpdate(!isPositionsDataUpdate);
    }

    function modifyPositions() {
        setIsAddPosition(!isAddPosition);
    }

    function changePosition(e) {
        const { name, value } = e.target;
        setPositionObj((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function addPosition() {
        try {
            const msg = await axios.post(`${url}/api/position/${data.orgId}/${data.orgId}`, positionObj, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            toast.success(msg?.data?.message);
            modifyPositions();
            reloadPositionPage();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to add position");
        }
    }

    async function deletePosition(id) {
        try {
            const deletePos = await axios.delete(`${url}/api/position/${data.orgId}/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            toast.success(deletePos?.data?.message);
            reloadPositionPage();
        } catch (error) {
            console.error("Error deleting position:", error);
            toast.error(error?.response?.data?.message || "Failed to delete position");
        }
    }

    async function editPosition() {
        try {
            const response = await axios.put(`${url}/api/position/${data.orgId}/${positionObj._id}`, positionObj, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            toast.success(response?.data?.message);
            modifyPositions();
            reloadPositionPage();
        } catch (error) {
            console.error("Error editing position:", error);
            const errorMessage = error?.response?.data?.message || error.message || "Something went wrong";
            toast.error(errorMessage);
        }
    }

    async function getEditPositionId(id) {
        try {
            const position = await axios.get(`${url}/api/position/${data.orgId}/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setPositionObj(position.data);
            modifyPositions();
        } catch (error) {
            console.error("Error fetching position:", error);
            toast.error("Failed to load position data");
        }
    }

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await axios.get(`${url}/api/position/${data.orgId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setPositions(response.data);
            } catch (error) {
                setError(error.response.data.error)
            }
        };

        setIsLoading(true);
        fetchPositions();
        setIsLoading(false);
    }, [isPositionsDataUpdate]);

    return (
        isLoading ? <Loading /> :
            isAddPosition ? (
                <CommonModel
                    dataObj={positionObj}
                    editData={editPosition}
                    changeData={changePosition}
                    isAddData={isAddPosition}
                    addData={addPosition}
                    modifyData={modifyPositions}
                    type="Position"
                />
            ) : (
                <div className='dashboard-parent pt-4'>
                    <div className="row">
                        <div className='col-lg-6 col-6'>
                            <h5 className='text-daily'>Position</h5>
                        </div>
                        <div className='col-lg-6 col-6 d-flex gap-2 justify-content-end'>
                            <button className='button m-0' onClick={modifyPositions}>+ Add Position</button>
                        </div>
                    </div>
                    {
                        error ? <NoDataFound message={error} /> :
                            positions.length > 0 ?
                                <LeaveTable data={positions} deletePosition={deletePosition} getEditPositionId={getEditPositionId} />
                                : <NoDataFound message={"Position data not found"} />
                    }
                </div>
            )
    );
}
