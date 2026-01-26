const questList = document.getElementById('quest-list');
const questInput = document.getElementById('quest-input');
const addBtn = document.getElementById('add-quest-btn');

function loadQuests() {
    const savedQuests = JSON.parse(localStorage.getItem('liora_quests')) || [];
    savedQuests.forEach(quest => {
        createQuest(quest.text, quest.completed);
    });
    updateXP();
}

function saveQuests() {
    const quests = [];
    document.querySelectorAll('.quest-item').forEach(li => {
        quests.push({
            text: li.innerText.replace('[ ] ', '').replace('[✓] ', ''),
            completed: li.classList.contains('completed')
        });
    });
    localStorage.setItem('liora_quests', JSON.stringify(quests));
    updateXP();
}

function updateXP() {
    const allQuests = document.querySelectorAll('.quest-item');
    const completedQuests = document.querySelectorAll('.quest-item.completed');
    
    let percentage = 0;
    if (allQuests.length > 0) {
        percentage = Math.round((completedQuests.length / allQuests.length) * 100);
    }

    const bar = document.getElementById('xp-bar-inner');
    const label = document.getElementById('xp-percent');

    if(bar) bar.style.width = percentage + "%";
    if(label) label.textContent = percentage + "%";

    if (percentage === 100 && allQuests.length > 0) {
        const innerBar = document.querySelector('.xp-bar-inner');
        if(innerBar) {
            innerBar.style.background = "#fff";
            setTimeout(() => {
                innerBar.style.background = "linear-gradient(90deg, #00eeff, #0077ff)";
            }, 500);
        }
    }
}

function createQuest(text, isCompleted = false) {
    const li = document.createElement('li');
    li.className = 'quest-item';
    if (isCompleted) li.classList.add('completed');
    
    const updateDisplay = () => {
        li.innerHTML = li.classList.contains('completed') ? 
            `<span style="color: #555">[✓] ${text.toUpperCase()}</span>` : 
            `<span>[ ] ${text.toUpperCase()}</span>`;
    };
    
    updateDisplay();
    
    li.onclick = () => {
        li.classList.toggle('completed');
        updateDisplay();
        saveQuests();
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    };
    
    questList.appendChild(li);
    saveQuests();
}

if(addBtn) {
    addBtn.onclick = () => {
        if (questInput.value.trim() !== "") {
            createQuest(questInput.value);
            questInput.value = "";
        }
    };
}

if(questInput) {
    questInput.onkeypress = (e) => {
        if (e.key === 'Enter' && questInput.value.trim() !== "") {
            createQuest(questInput.value);
            questInput.value = "";
        }
    };
}

const resetBtn = document.getElementById('reset-btn');
if(resetBtn) {
    resetBtn.onclick = () => {
        if(confirm("PURGE ALL OBJECTIVES?")) {
            reInitializeSystem();
        }
    };
}

const clearAllBtn = document.getElementById('clear-all-btn');
if(clearAllBtn) {
    clearAllBtn.onclick = () => reInitializeSystem();
}


const DEADLINE_HOUR = 22; // 10 PM

function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = now.toLocaleTimeString();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const dateEl = document.getElementById('date-display');
    if(dateEl) dateEl.textContent = `${year}.${month}.${date}`;
    
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const dayEl = document.getElementById('day-display');
    if(dayEl) dayEl.textContent = dayNames[now.getDay()];
}

function updatePenaltyTimer() {
    const now = new Date();
    
    let deadline = new Date();
    deadline.setHours(DEADLINE_HOUR, 0, 0, 0);

    if (now > deadline) {
        deadline.setDate(deadline.getDate() + 1);
    }

    const diff = deadline - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    const countdownDisplay = document.getElementById('countdown');
    if(countdownDisplay) {
        countdownDisplay.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    const isPenaltyWindow = now.getHours() >= DEADLINE_HOUR && now.getHours() < 24;

    if (isPenaltyWindow) {
        const overlay = document.getElementById('evaluation-overlay');
        if (overlay && overlay.style.display !== 'flex') {
            triggerEvaluation();
        }
    } else {
        closeEval();
    }

    const allQuests = document.querySelectorAll('.quest-item');
    const completedQuests = document.querySelectorAll('.quest-item.completed');
    const systemOverlay = document.querySelector('.system-overlay');

    if (!isPenaltyWindow && h < 1 && allQuests.length !== completedQuests.length) {
        if(systemOverlay) systemOverlay.classList.add('danger-mode');
        if(countdownDisplay) countdownDisplay.classList.add('danger-text');
    } else {
        if(systemOverlay) systemOverlay.classList.remove('danger-mode');
        if(countdownDisplay) countdownDisplay.classList.remove('danger-text');
    }
}

function triggerEvaluation() {
    const all = document.querySelectorAll('.quest-item').length;
    const completed = document.querySelectorAll('.quest-item.completed').length;
    const ratio = all > 0 ? (completed / all) : 0;
    
    const overlay = document.getElementById('evaluation-overlay');
    const rankDisp = document.getElementById('final-rank');
    const msgDisp = document.getElementById('eval-msg');

    if(overlay) {
        overlay.classList.remove('eval-hidden');
        overlay.style.display = 'flex';
    }

    if (ratio === 1 && all > 0) {
        if(rankDisp) rankDisp.textContent = "S";
        if(msgDisp) msgDisp.textContent = "PERFECT ASCENSION. THE SYSTEM IS SATISFIED.";
    } else if (ratio >= 0.8) {
        if(rankDisp) rankDisp.textContent = "A";
        if(msgDisp) msgDisp.textContent = "EXCELLENT WORK. YOU ARE EVOLVING.";
    } else {
        if(rankDisp) {
            rankDisp.textContent = "E";
            rankDisp.style.color = "#ff0000";
        }
        if(msgDisp) msgDisp.textContent = "INSUFFICIENT GROWTH. PENALTY IMMINENT.";
    }
}

function closeEval() {
    const overlay = document.getElementById('evaluation-overlay');
    if(overlay) overlay.style.display = 'none';
}

function reInitializeSystem() {
    questList.innerHTML = "";
    localStorage.removeItem('liora_quests');
    updateXP();
    closeEval();
}


let syncInterval;
let syncProgress = 0;
const syncTrigger = document.getElementById('sync-trigger');
const progressRing = document.getElementById('sync-progress');
const syncValue = document.getElementById('sync-value');
const bootScreen = document.getElementById('boot-screen');

function startSync() {
    syncInterval = setInterval(() => {
        if (syncProgress < 100) {
            syncProgress += 2; 
            updateSyncUI();
        } else {
            completeSync();
        }
    }, 50);
}

function stopSync() {
    clearInterval(syncInterval);
    if (syncProgress < 100) {
        syncProgress = 0; 
        updateSyncUI();
    }
}

function updateSyncUI() {
    if(progressRing) {
        const offset = 283 - (syncProgress / 100) * 283;
        progressRing.style.strokeDashoffset = offset;
    }
    if(syncValue) syncValue.textContent = syncProgress;
    
    if (syncProgress % 10 === 0 && window.navigator.vibrate) {
        window.navigator.vibrate(5);
    }
}

function completeSync() {
    clearInterval(syncInterval);
    if (window.navigator.vibrate) window.navigator.vibrate([50, 30, 50]);
    if(bootScreen) bootScreen.classList.add('boot-complete');
}

if(syncTrigger) {
    syncTrigger.addEventListener('mousedown', startSync);
    
    syncTrigger.addEventListener('touchstart', (e) => { 
        if (e.cancelable) e.preventDefault(); 
        startSync(); 
    }, { passive: false });
}

window.addEventListener('mouseup', stopSync);
window.addEventListener('touchend', stopSync);

setInterval(() => {
    updateClock();
    updatePenaltyTimer();
}, 1000);

updateClock();
loadQuests();