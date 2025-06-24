const url = 'http://localhost:3336';
let token = "";
let empId = "";

// Fetch empId and token asynchronously from chrome storage
(async () => {
  try {
    const { empId: fetchedEmpId, token: fetchedToken } = await new Promise((resolve, reject) => {
      chrome.storage.local.get(["empId", "token"], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
    empId = fetchedEmpId;
    token = fetchedToken;
    console.log("Emp ID:", empId, "Token:", token);
 } catch (error) {
    console.error("Error retrieving data:", error);
  }
})();

// WorkTimeTracker Object
const startAndEndTime = {
  startingTime: [],
  endingTime: [],
  timeHolder: "00:00:00",
};

let workTimeTracker = {
  date: new Date(),
  login: { ...startAndEndTime },
  meeting: { ...startAndEndTime },
  morningBreak: { ...startAndEndTime },
  lunch: { ...startAndEndTime },
  eveningBreak: { ...startAndEndTime },
  event: { ...startAndEndTime },
};

// Current time formatted as HH:MM:SS
const currentDate = new Date();
const currentHours = currentDate.getHours().toString().padStart(2, '0');
const currentMinutes = currentDate.getMinutes().toString().padStart(2, '0');
const currentSeconds = currentDate.getSeconds().toString().padStart(2, '0');
const currentTime = `${currentHours}:${currentMinutes}:${currentSeconds}`;

// Function to fetch data from the API
async function getDataAPI() {
  try {
    const response = await fetch(`${url}/api/clock-ins/${empId}?date=${new Date().toISOString()}`, {
      method: "GET",
      headers: { authorization: token || '' },
    });

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.status}`);
    }

    const data = await response.json();
    workTimeTracker = data;
    console.log("Data fetched successfully:", workTimeTracker);
 } catch (error) {
    console.error("Error in getDataAPI:", error.message);
    return error.message;
  }
}

// Function to add new data to the API
async function addDataAPI(updatedTimer) {
  try {
    if (token && empId) {
      const response = await fetch(`${url}/api/clock-ins/${empId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || "",
        },
        body: JSON.stringify(updatedTimer),
      });

      if (!response.ok) {
        throw new Error(`Error adding data: ${response.status}`);
      }

      const data = await response.json();
      console.log("Data added successfully:", data);
    }
 } catch (error) {
    console.error("Error in addDataAPI:", error.message);
    // alert(error.message);
  }
}

// Function to update existing data in the API
async function updateDataAPI(body) {
  if (!body._id) {
    console.log("You didn't login properly!");
    return;
  }
  if (token && empId) {
    try {
      const response = await fetch(`${url}/api/clock-ins/${body._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: token || '',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Error updating data: ${response.status}`);
      }

      const data = await response.json();
      console.log("Updated successfully:", data);
   } catch (error) {
      console.error("Update error:", error.message);
      // alert(error.message);
    }
  }
}

// Function to start tracking time
const startIt = async () => {
  const updatedState = {
    ...workTimeTracker,
    login: {
      ...workTimeTracker?.login,
      startingTime: [...(workTimeTracker?.login?.startingTime || []), currentTime],
    },
  };

  if (!updatedState?._id) {
    // Add data if it doesn't exist
    try {
      await addDataAPI(updatedState);
   } catch (error) {
      console.error("Error in add Clockins timer:", error.message);
      // alert(error.message);
    }
  } else {
    // Update data if it exists
    try {
      await updateDataAPI(updatedState);
   } catch (error) {
      console.error("Error updating data:", error.message);
      // alert(error.message);
    }
  }
};

// Function to stop tracking time
const stopIt = async () => {
  const updatedState = {
    ...workTimeTracker,
    login: {
      ...workTimeTracker?.login,
      endingTime: [...(workTimeTracker?.login?.endingTime || []), currentTime],
      timeHolder: workTimeTracker?.login?.timeHolder || "00:00:00",
    },
  };

  try {
    await updateDataAPI(updatedState);
 } catch (error) {
    console.error("Error in stopIt:", error.message);
    // alert(error.message);
  }
};

// Initial data fetch if empId and token exist
if (token && empId) {
  getDataAPI();
}

// Timer Object
let timer = {
  time: 0,
  isRunning: false,
  interval: null,
};

// Function to Start Timer
function startTimer() {
  startIt();
  if (!timer.isRunning) {
    timer.isRunning = true;
    timer.interval = setInterval(() => {
      timer.time++;
      // Broadcast timer updates to all tabs
      chrome.runtime.sendMessage({ time: timer.time, isRunning: timer.isRunning });
    }, 1000);
  }
}

// Function to Stop Timer
function stopTimer() {
  stopIt();
  if (timer.isRunning) {
    timer.isRunning = false;
    clearInterval(timer.interval);
    timer.interval = null;
    chrome.runtime.sendMessage({ time: timer.time, isRunning: timer.isRunning });
  }
}

// Internal Message Listener (From Content Scripts)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.payload) {
    const empId = message.payload.empId;
    const token = message.payload.token;
    chrome.storage.local.set({ empId, token }, () => {
      console.log("Employee data stored:", empId);
    });
  }
  else if (message.command === "start") {
    startTimer();
    console.log("start timer");
    sendResponse({ status: "Timer started", timer });
  } else if (message.command === "stop") {
    stopTimer();
    sendResponse({ status: "Timer stopped", timer });
  } else if (message.command === "getTimer") {
    sendResponse({ status: "Timer status", timer });
  }
});
