import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const useHandleTabClose = (isStartLogin, workTimeTracker, token) => {
    const navigate = useNavigate();
    useEffect(() => {
        // Mark the page as reloaded when refreshing
        sessionStorage.setItem("isReload", "false");

        const handleBeforeUnload = async (event) => {
            if (!isStartLogin) return; // Only stop if user is logged in

            // Check if sessionStorage was modified (detects refresh)
            if (sessionStorage.getItem("isReload") === "true") {
                return;
            }

            const currentTime = new Date().toTimeString().split(" ")[0];

            // Update the work time before closing
            const updatedState = {
                ...workTimeTracker,
                login: {
                    ...workTimeTracker?.login,
                    endingTime: [...(workTimeTracker?.login?.endingTime || []), currentTime],
                    timeHolder: workTimeTracker?.login?.timeHolder,
                },
            };
            if (updatedState.login.startingTime.length === updatedState.login.endingTime.length) {
                // Call API to update backend
                try {
                    await axios.put(`${process.env.REACT_APP_API_URL}/api/clock-ins/${workTimeTracker._id}`, updatedState, {
                        headers: { authorization: token || '' },
                    });
                } catch (error) {
                    if (error?.message === "Network Error") {
                        navigate("/network-issue")
                    }
                    console.error("Error updating before closing:", error);
                }

                // Clear local storage and stop timers
                localStorage.removeItem("timerState");
                localStorage.setItem("isStartLogin", false);
            }
        };

        // Set sessionStorage to detect refreshes
        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                sessionStorage.setItem("isReload", "true"); // Mark as refresh attempt
            }
        });

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("visibilitychange", () => { });
        };
    }, [isStartLogin, workTimeTracker, token]);
};

export default useHandleTabClose;
