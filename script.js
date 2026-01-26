const questList = document.getElementById('quest-list');
const questInput = document.getElementById('quest-input');
const addBtn = document.getElementById('add-quest-btn');

// --- 1. DATA PERSISTENCE (The "Save" System) ---

// Load quests from memory when the page starts
function loadQuests() {
    const savedQuests = JSON.parse(localStorage.getItem('liora_quests')) || [];
    savedQuests.forEach(quest => {
        createQuest(quest.text, quest.completed);
    });
}

// Save current list to memory
function saveQuests() {
    const quests = [];
    document.querySelectorAll('.quest-item').forEach(li => {
        quests.push({
            text: li.innerText.replace('[ ] ', '').replace('[✓] ', ''),
            completed: li.classList.contains('completed')
        });
    });
    localStorage.setItem('liora_quests', JSON.stringify(quests));
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

    bar.style.width = percentage + "%";
    label.textContent = percentage + "%";

    // Play a "Level Up" sound or flash if 100%
    if (percentage === 100 && allQuests.length > 0) {
        document.querySelector('.xp-bar-inner').style.background = "#fff";
        setTimeout(() => {
            document.querySelector('.xp-bar-inner').style.background = "linear-gradient(90deg, #00eeff, #0077ff)";
        }, 500);
    }
}

// CRITICAL: Inside your existing saveQuests() function, 
// add a call to updateXP() at the very end:
function saveQuests() {
    // ... your existing save logic ...
    updateXP(); 
}

// Also call it at the end of loadQuests() so it shows progress on boot
function loadQuests() {
    // ... your existing load logic ...
    updateXP();
}

// --- 2. QUEST CORE LOGIC ---

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
        saveQuests(); // Save state when clicked
        
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    };
    
    questList.appendChild(li);
    saveQuests();
}

// Add Quest via Button or Enter
addBtn.onclick = () => {
    if (questInput.value.trim() !== "") {
        createQuest(questInput.value);
        questInput.value = "";
    }
};

questInput.onkeypress = (e) => {
    if (e.key === 'Enter' && questInput.value.trim() !== "") {
        createQuest(questInput.value);
        questInput.value = "";
    }
};

// Clear All
document.getElementById('reset-btn').onclick = () => {
    if(confirm("PURGE ALL OBJECTIVES?")) {
        questList.innerHTML = "";
        localStorage.removeItem('liora_quests');
    }
};

// --- 3. SYSTEM HUD (Clock & Date) ---

function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    document.getElementById('date-display').textContent = `${year}.${month}.${date}`;
    
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    document.getElementById('day-display').textContent = dayNames[now.getDay()];
}

const DEADLINE_HOUR = 22; // Set this to the hour you want (22 = 10 PM)

function updatePenaltyTimer() {
    const now = new Date();
    const deadline = new Date();
    deadline.setHours(DEADLINE_HOUR, 0, 0, 0);

    // If it's already past the deadline, set for tomorrow
    if (now > deadline) {
        deadline.setDate(deadline.getDate() + 1);
    }

    const diff = deadline - now;
    
    // Convert to HH:MM:SS
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    const countdownDisplay = document.getElementById('countdown');
    countdownDisplay.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    // CHECK FOR FAIL STATE
    const allQuests = document.querySelectorAll('.quest-item');
    const completedQuests = document.querySelectorAll('.quest-item.completed');
    const overlay = document.querySelector('.system-overlay');

    // If less than 1 hour remains and quests aren't done -> DANGER MODE
    if (h < 1 && allQuests.length !== completedQuests.length) {
        overlay.classList.add('danger-mode');
        countdownDisplay.classList.add('danger-text');
    } else {
        overlay.classList.remove('danger-mode');
        countdownDisplay.classList.remove('danger-text');
    }
}

// --- INITIALIZE SYSTEM ---
setInterval(updateClock, 1000);
updateClock();
loadQuests(); // Boot up saved data
setInterval(() => {
    updateClock();
    updatePenaltyTimer(); // Sync the countdown
}, 1000);