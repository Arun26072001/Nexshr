import React from 'react'
import Loading from '../Loader'

const AdmiMain = ({ organizations, users, isLoading }) => {

    return (
        <div>
            <main className="p-4 w-100 main-container" style={{ height: "89vh" }}>
                <p className="titleText text-start">Dashboard</p>
                <div className="row">
                    <div className="col-md-6">
                        <div className={`box-content messageCount cardContent text-dark d-block`} style={{ background: "white", textAlign: "center", boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px" }}>
                            <p className='titleText text-dark'>Total Organizations</p>
                            <p className="fs-1">{isLoading ? <Loading /> : organizations.length}</p> {/* Replace with dynamic data */}
                        </div>
                    </div>
                    <div className="col-md-6" >
                        <div className={`box-content messageCount cardContent text-dark d-block`} style={{ background: "white", textAlign: "center", boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px" }}>
                            <p className='titleText text-dark'>Total Users</p>
                            <p className="fs-1">{isLoading ? <Loading /> : (users.length || 0)}</p> {/* Replace with dynamic data */}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default AdmiMain
