import React from 'react';
// import '../Attendence/Attendence.css';
import Announcementalert from './announcementalert';
import Announcementable from './announcementable';

const Announce = () => {
    return (
        <div className='dashboard-parent py-4'>
            <div className="d-flex  justify-content-between align-items-center">
                <div>
                    <h5 className='text-daily'>Announcement</h5>
                </div>
                <div className='d-flex'>

                    <Announcementalert />

                </div>
            </div>




            <div className='tabline mt-3 p-4'>

                {/* <div class="row"><div class="col-lg-6 searchInputIcon">
                    <input type="text" class="payrunInput" placeholder="Search" />
                    </div> */}
                    {/* </div> */}

                <div className='profiles mt-3'>

                    <Announcementable />
                </div>
            </div>
        </div>

    );
};

export default Announce;