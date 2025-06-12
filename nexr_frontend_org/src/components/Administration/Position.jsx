import React, { useContext, useEffect, useState } from 'react';
import NoDataFound from '../payslip/NoDataFound';
import { toast } from 'react-toastify';
import axios from 'axios';
import CommonModel from './CommonModel';
import LeaveTable from '../LeaveTable';
import { EssentialValues } from '../../App';
import { Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TimerStates } from '../payslip/HRMDashboard';

export default function Position() {
    const { companies } = useContext(TimerStates);
    const navigate = useNavigate();
    const url = process.env.REACT_APP_API_URL;
    const { data } = useContext(EssentialValues);
    const [positionObj, setPositionObj] = useState({});
    const [positions, setPositions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPositionsDataUpdate, setIsPositionsDataUpdate] = useState(false);
    const [isAddPosition, setIsAddPosition] = useState(false);
    const [isChangingPosition, setIschangingPosition] = useState(false);

    function reloadPositionPage() {
        setIsPositionsDataUpdate(!isPositionsDataUpdate);
    }

    function modifyPositions() {
        if (isAddPosition) {
            setPositionObj({});
        }
        setIsAddPosition(!isAddPosition);
    }

    function changePosition(value, name) {
        setPositionObj((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function addPosition() {
        setIschangingPosition(true);
        try {
            const msg = await axios.post(url + "/api/position", positionObj, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            toast.success(msg?.data?.message);
            setPositionObj({});
            modifyPositions();
            reloadPositionPage();
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            toast.error(error?.response?.data?.message || "Failed to add position");
        }
        setIschangingPosition(false);
    }

    async function deletePosition(id) {
        try {
            const deletePos = await axios.delete(`${url}/api/position/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            toast.success(deletePos?.data?.message);
            reloadPositionPage();
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error("Error deleting position:", error);
            toast.error(error?.response?.data?.error || "Failed to delete position");
        }
    }

    async function editPosition() {
        setIschangingPosition(true);
        try {
            const response = await axios.put(`${url}/api/position/${positionObj._id}`, positionObj, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            toast.success(response?.data?.message);
            setPositionObj({});
            modifyPositions();
            reloadPositionPage();
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
            console.error("Error editing position:", error);
            const errorMessage = error?.response?.data?.message || error.message || "Something went wrong";
            toast.error(errorMessage);
        }
        setIschangingPosition(false);
    }

    async function getEditPositionId(id) {
        try {
            const position = await axios.get(`${url}/api/position/${id}`, {
                headers: {
                    Authorization: data.token || ""
                }
            });
            setPositionObj(position.data);
            modifyPositions();
       } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
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
                        Authorization: data.token || ""
                    }
                });
                setPositions(response.data);
           } catch (error) {
         if (error?.message === "Network Error") {
                navigate("/network-issue")
            }
                console.error("Error fetching positions:", error);
                toast.error("Failed to load positions data");
            }
            setIsLoading(false);
        };

        fetchPositions();
    }, [isPositionsDataUpdate]);

    return (
        isAddPosition ? (
            <CommonModel
                dataObj={positionObj}
                editData={editPosition}
                changeData={changePosition}
                isAddData={isAddPosition}
                addData={addPosition}
                comps={companies}
                modifyData={modifyPositions}
                type="Position"
                isWorkingApi={isChangingPosition}
            />
        ) : (
            <div className='dashboard-parent pt-4'>
                <div className="d-flex justify-content-between px-2">
                    <h5 className='text-daily'>Position</h5>
                    <button className='button m-0' onClick={modifyPositions}>+ Add Position</button>

                </div>
                {
                    isLoading ? <Skeleton
                        sx={{ bgcolor: 'grey.500' }}
                        variant="rectangular"
                        width={"100%"}
                        height={"50vh"}
                    /> :
                        positions.length > 0 ?
                            <LeaveTable data={positions} deleteData={deletePosition} fetchData={getEditPositionId} />
                            : <NoDataFound message={"Position data not found"} />
                }
            </div>
        )
    );
}
