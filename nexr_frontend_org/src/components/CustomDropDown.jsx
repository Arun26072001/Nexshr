import React, { useContext, useState } from 'react';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import FreeBreakfastRoundedIcon from '@mui/icons-material/FreeBreakfastRounded';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FestivalRoundedIcon from '@mui/icons-material/FestivalRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'; // Import the icon
import "./ClockInsStyle.css";
import { TimerStates } from './payslip/HRMDashboard';

const CustomDropdown = () => {
  const {timeOption, updateWorkTracker, isStartActivity} = useContext(TimerStates);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(timeOption);
  
  const options = [
    { value: 'meeting', label: 'Meeting', icon: <GroupsRoundedIcon /> },
    { value: 'morningBreak', label: 'Morning Break', icon: <FreeBreakfastRoundedIcon /> },
    { value: 'lunch', label: 'Lunch', icon: <RestaurantIcon /> },
    { value: 'eveningBreak', label: 'Evening Break', icon: <FreeBreakfastRoundedIcon /> },
    { value: 'event', label: 'Event', icon: <FestivalRoundedIcon /> },
  ];

  const handleOptionClick = (option) => {
    setSelectedOption(option.value);
    updateWorkTracker(option.value);
    setIsOpen(false);
  };

  return (
    <div className={`ms-auto col-lg-6 custom-dropdown ${isStartActivity ? 'disabled' : ''}`}>
      <div className="dropdown-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="dropdown-header-content">
          {options?.find(opt => opt?.value === selectedOption).icon}
          <span>{options?.find(opt => opt?.value === selectedOption).label || 'Select an option'}</span>
        </div>
        <KeyboardArrowDownRoundedIcon className="dropdown-arrow" fontSize='large' /> 
      </div>
      {isOpen && (
        <ul className="dropdown-list">
          {options.map(option => (
            <li key={option.value} onClick={() => handleOptionClick(option)}>
              <div className='optionList'>
                {option.icon}
                {option.label}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
