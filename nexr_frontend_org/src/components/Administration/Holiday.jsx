import React, { useState } from 'react'
import HolidayPicker from '../HolidaysPicker'

export default function Holiday() {
  const [isAddHolidays, setIsAddHolidays] = useState(false);

  function changeHolidayUI(){
    setIsAddHolidays(!isAddHolidays)
  }
  return (
    // to add holiday for each year
    <HolidayPicker changeHolidayUI={changeHolidayUI} isAddHolidays={isAddHolidays} />
  )
}
