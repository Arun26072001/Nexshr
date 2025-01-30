import React, { useEffect, useState } from 'react';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { toast } from 'react-toastify';
import axios from 'axios';
import CommonModel from './CommonModel';
import LeaveTable from '../LeaveTable';

export default function Position() {
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const [positionObj, setPositionObj] = useState({});
    const [positions, setPositions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPositionsDataUpdate, setIsPositionsDataUpdate] = useState(false);
    const [isAddPosition, setIsAddPosition] = useState(false);

    function reloadPositionPage() {
        setIsPositionsDataUpdate(!isPositionsDataUpdate);
    }

    function modifyPositions() {
        setIsAddPosition(!isAddPosition);
    }

    function changePosition(value, name) {
        setPositionObj((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function addPosition() {
        try {
            const msg = await axios.post(url + "/api/position", positionObj, {
                headers: {
                    Authorization: token || ""
                }
            });
            toast.success(msg?.data?.message);
            setPositionObj({});
            modifyPositions();
            reloadPositionPage();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to add position");
        }
    }

    async function deletePosition(id) {
        try {
            const deletePos = await axios.delete(`${url}/api/position/${id}`, {
                headers: {
                    Authorization: token || ""
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
            const response = await axios.put(`${url}/api/position/${positionObj._id}`, positionObj, {
                headers: {
                    Authorization: token || ""
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
            const position = await axios.get(`${url}/api/position/${id}`, {
                headers: {
                    Authorization: token || ""
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
            setIsLoading(true);
            try {
                const response = await axios.get(url + "/api/position", {
                    headers: {
                        Authorization: token || ""
                    }
                });
                setPositions(response.data);
            } catch (error) {
                console.error("Error fetching positions:", error);
                toast.error("Failed to load positions data");
            }
            setIsLoading(false);
        };

        fetchPositions();
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
                        positions.length > 0 ?
                            <LeaveTable data={positions} deletePosition={deletePosition} getEditPositionId={getEditPositionId} />
                            : <NoDataFound message={"Position data not found"} />
                    }
                </div>
            )
    );
}
