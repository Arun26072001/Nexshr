import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AttendanceCalendar from './components/AttendanceCalendar';
import GoogleMapComponent from './components/MapComponent';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    {/* <LeaveMail /> */}
    {/* <LandingPage /> */}
    {/* <GoogleMapComponent /> */}
    <App />
  </BrowserRouter>
);


   // const getAddressFromCoordinates = async (latitude, longitude) => {
    //     const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`;

    //     try {
    //         const response = await fetch(url);
    //         const data = await response.json();
    //         console.log(data.display_name);
    //     } catch (error) {
    //         console.error("Error fetching address:", error);
    //         return "Address not found";
    //     }
    // };
    // useEffect(() => {
    //     navigator.geolocation.getCurrentPosition((position) => {
    //         if (position.coords.accuracy > 50) {
    //             console.log("accuracy too low!");
    //         }
    //         console.log(position.coords.longitude, position.coords.latitude, position.coords.accuracy);

    //         setLat(position.coords.latitude);
    //         setLong(position.coords.longitude);
    //     }, (error) => console.error("Error getting location:", error),
    //         { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
    // }, [])

    // if (lat && long) {
    //     getAddressFromCoordinates(lat, long)
    // }

    // Restore timer when the page loads
   