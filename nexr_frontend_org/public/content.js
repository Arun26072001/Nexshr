// Request the current timer state when the tab loads
chrome.runtime.sendMessage({ command: "getTimer" }, (response) => {
  if (response && response.time !== undefined && response.isRunning !== undefined) {
    updateTimerDisplay(response.time, response.isRunning);
  }
});

// Listen for timer updates from the background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.time !== undefined && message.isRunning !== undefined) {
    updateTimerDisplay(message.time, message.isRunning);
  }
});

function updateTimerDisplay(time, isRunning) {
  const timerElement = document.getElementById("timer");
  if (timerElement) {
    // Format time as HH:MM:SS
    const hours = String(Math.floor(time / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    timerElement.textContent = `${hours}:${minutes}:${seconds}`;
  }
}

// Example buttons for user interaction
document.getElementById("startButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ command: "start" });
});

document.getElementById("stopButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ command: "stop" });
});

// Listen for messages from React application (if it's using window.postMessage)
window.addEventListener("message", (event) => {
  if (event.source !== window || event.data.type !== "FROM_REACT") return;

  // Forward the data to the extension (background script)
  chrome.runtime.sendMessage({ type: "FROM_REACT", payload: event.data.payload });
});
