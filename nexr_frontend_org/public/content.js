// Request the current timer state when the tab loads
chrome.runtime.sendMessage({ command: "getTimer" }, (response) => {
  updateTimerDisplay(response.time, response.isRunning);
});

// Listen for timer updates from the background script
chrome.runtime.onMessage.addListener((message) => {
  updateTimerDisplay(message.time, message.isRunning);
});

function updateTimerDisplay(time, isRunning) {
  const timerElement = document.getElementById("timer");
  if (timerElement) {
    timerElement.textContent = new Date(time * 1000).toISOString().substr(11, 8);
  }
}

// Example buttons for user interaction
document.getElementById("startButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ command: "start" });
});

document.getElementById("stopButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ command: "stop" });
});

