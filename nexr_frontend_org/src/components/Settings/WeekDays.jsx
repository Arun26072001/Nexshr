import React,{ useState } from 'react';
import './SettingsStyle.css';

const WeekDay = ({day, calDay, setCalDay}) => {
    const [active, setActive] = useState(false);
    
    function handleDay(){
        setCalDay({
            ...calDay,
            ['WeeklyDays']: calDay.WeeklyDays + 1
        })
        if(active){
            setCalDay({
                ...calDay,
                ['WeeklyDays']: calDay.WeeklyDays - 1
            })
            setActive(false)
        }else if(!active){
            setActive(true)
        }
    }

  return (
    <div className={`dayBox ${active && "enable"}`} onClick={handleDay}>
        {day}
    </div>
  )
};

export default WeekDay;
