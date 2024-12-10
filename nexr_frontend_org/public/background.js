
// window.onload(checkIsStartwork)

// async function checkIsStartwork() {
//   try {
//     const clockins = await fetch(`https://baseapp-admin.webnexs.org/api/clock-ins`)
//   } catch (error) {
    
//   }
// }

let timer = {
  time: 0,
  isRunning: false,
};

const startAndEndTime = {
  startingTime: [],
  endingTime: [],
  timeHolder: "00:00:00",
};

const workTimeTracker = {
  date: new Date(),
  login: { ...startAndEndTime },
  meeting: { ...startAndEndTime },
  morningBreak: { ...startAndEndTime },
  lunch: { ...startAndEndTime },
  eveningBreak: { ...startAndEndTime },
  event: { ...startAndEndTime }
}

function startTimer() {
  if (!timer.isRunning) {
    timer.isRunning = true;
    timer.interval = setInterval(() => {
      timer.time++;
      // Broadcast timer updates to all tabs
      chrome.runtime.sendMessage({ time: timer.time, isRunning: timer.isRunning });
    }, 1000);
  }
}

function stopTimer() {
  if (timer.isRunning) {
    timer.isRunning = false;
    clearInterval(timer.interval);
    chrome.runtime.sendMessage({ time: timer.time, isRunning: timer.isRunning });
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "start") startTimer();
  if (message.command === "stop") stopTimer();
  if (message.command === "getTimer") sendResponse(timer);
});
