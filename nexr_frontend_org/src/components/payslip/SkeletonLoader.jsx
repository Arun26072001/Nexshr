import React from 'react';
import "./SkeletonStyle.css";

function SkeletonLoader() {
    return (
        <div class="skeletonBox">
            <div className="row">
                <div className="col-lg-3 skeletonContent">
                    <div className="wave"></div>
                    <div className="wave"></div>
                    <div className="wave"></div>
                </div>
                <div className="col-lg-3 skeletonContent"></div>
                <div className="col-lg-3 skeletonContent"></div>
                <div className="col-lg-3 skeletonContent"></div>
            </div>
        </div>
    )
}

export default SkeletonLoader