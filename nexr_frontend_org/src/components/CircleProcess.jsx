import React from "react";

const CircleBar = ({ empLength, leaveCount, annualLeave, takenLeave }) => {
  let offset;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let percentage;

  if (annualLeave && takenLeave) {
    percentage = takenLeave / annualLeave;
    offset = circumference - percentage * circumference;

  } else if (empLength && leaveCount) {
    percentage = leaveCount / empLength;
    offset = circumference - percentage * circumference;
  } else {
    offset = circumference;
  }

  return (
    <div className="progress-circle">
      <svg className="progress-ring" width="120" height="120">
        <circle
          className="progress-ring__circle"
          stroke="#021526"
          strokeWidth="10"
          fill="white"
          r={radius}
          cx="60"
          cy="60"
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.35s ease',
          }}
        />
      </svg>
      <input
        type="number"
        value={leaveCount ? leaveCount
          : takenLeave ? takenLeave
            : 0}
        min={0}
        max={empLength ? empLength
          : annualLeave ? annualLeave
            : 0}
        readOnly
        className="progress-input"
      />
    </div>
  );
};

export default CircleBar;
