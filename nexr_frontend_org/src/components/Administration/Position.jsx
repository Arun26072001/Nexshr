import React, { useEffect, useState } from 'react';
import LeaveTable from '../LeaveTable';
import NoDataFound from '../payslip/NoDataFound';
import Loading from '../Loader';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getPositions } from '../ReuseableAPI';

export default function Position() {
    const url = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    const [position, setPosition] = useState({});
    const [positions, setPositions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPositionsDataUpdate, setIsPositionsDataUpdate] = useState(false);
    const navigate = useNavigate();

    function reloadPositionPage() {
        setIsPositionsDataUpdate(!isPositionsDataUpdate);
    }

    async function addPosition() {
        try {
            const msg = await axios.post(`${url}/api/position`, position, {
                headers: {
                    authorization: token || ""
                }
            });
            toast.success(msg?.data?.message);
        } catch (error) {
            toast.error(error?.response?.data?.message);
        }
    }

    async function deletePosition(id) {
        try {
            const deleteResponse = await axios.delete(`${url}/api/position/${id}`, {
                headers: {
                    Authorization: token || ""
                }
            });
            toast.success(deleteResponse?.data?.message);
            reloadPositionPage();
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message);
        }
    }

    useEffect(() => {
        async function fetchPositions() {
            setIsLoading(true);
            try {
              const positions = await axios.get(url + "/api/position", {
                headers: {
                  authorization: token || ""
                }
              });
              setPositions(positions.data);
        
            } catch (err) {
              console.log(err.data);
            }
            setIsLoading(false);
          }

        fetchPositions();
    }, [isPositionsDataUpdate]);

    return (
        isLoading ? <Loading /> :
            <div className='dashboard-parent pt-4'>
                <div className="row">
                    <div className='col-lg-6 col-6'>
                        <h5 className='text-daily'>Position</h5>
                    </div>
                    <div className='col-lg-6 col-6 d-flex gap-2 justify-content-end'>
                        <button className='button m-0' onClick={() => navigate(`add`)}>+ Add Position</button>
                    </div>
                </div>
                {
                    positions.length > 0 ?
                        <LeaveTable data={positions} deleteDepartment={deletePosition} />
                        : <NoDataFound message={"Positions data not found"} />
                }
            </div>
    );
}
