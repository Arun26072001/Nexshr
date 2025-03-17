import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
    width: "100%",
    height: "500px",
};

const GoogleMapComponent = () => {
    const [center, setCenter] = useState({ lat: "", lng: "" });

    useEffect(() => {
        // Example usage with user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                let lat = position.coords.latitude;
                let lng = position.coords.longitude;
                setCenter({
                    lat,
                    lng
                }) // Call function to get address
            });
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }, [])

    console.log(center);
    
    return (
        <LoadScript googleMapsApiKey="AIzaSyDvz9HHaZMTcAbDiVuzo0OIlhfoYH9Da2I">
            <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
                <Marker position={center} />
            </GoogleMap>
        </LoadScript>
    );
};

export default GoogleMapComponent;
