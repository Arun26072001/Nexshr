import React, { useState } from 'react'
import HolidayPicker from '../MultipleDatePicker'

export default function Holiday() {
  const [isAddHolidays, setIsAddHolidays] = useState(false);

  function changeHolidayUI(){
    setIsAddHolidays(!isAddHolidays)
  }
  return (
    <HolidayPicker changeHolidayUI={changeHolidayUI} isAddHolidays={isAddHolidays} />
  )
}
