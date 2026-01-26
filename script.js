const questList = document.getElementById('quest-list');
const questInput = document.getElementById('quest-input');
const addBtn = document.getElementById('add-quest-btn');

// --- 1. DATA PERSISTENCE & XP ENGINE ---

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
        document.querySelector('.xp-bar-inner').style.background = "#fff";
        setTimeout(() => {
            document.querySelector('.xp-bar-inner').style.background = "linear-gradient(90deg, #00eeff, #0077ff)";
        }, 500);
    }
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
        saveQuests();
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    };
    
    questList.appendChild(li);
    saveQuests();
}

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

document.getElementById('reset-btn').onclick = () => {
    if(confirm("PURGE ALL OBJECTIVES?")) {
        questList.innerHTML = "";
        localStorage.removeItem('liora_quests');
        updateXP();
    }
};

// --- 3. HUD & JUDGMENT ENGINE ---

const DEADLINE_HOUR = 22; // 10 PM

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

function updatePenaltyTimer() {
    const now = new Date();
    const deadline = new Date();
    deadline.setHours(DEADLINE_HOUR, 0, 0, 0);

    if (now > deadline) {
        deadline.setDate(deadline.getDate() + 1);
    }

    const diff = deadline - now;
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    const countdownDisplay = document.getElementById('countdown');
    countdownDisplay.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    // TRIGGER EVALUATION IF TIME EXPIRES (Within a 1 second window)
    if (h === 0 && m === 0 && s === 0) {
        triggerEvaluation();
    }

    const allQuests = document.querySelectorAll('.quest-item');
    const completedQuests = document.querySelectorAll('.quest-item.completed');
    const overlay = document.querySelector('.system-overlay');

    if (h < 1 && allQuests.length !== completedQuests.length) {
        overlay.classList.add('danger-mode');
        countdownDisplay.classList.add('danger-text');
    } else {
        overlay.classList.remove('danger-mode');
        countdownDisplay.classList.remove('danger-text');
    }
}

function triggerEvaluation() {
    const all = document.querySelectorAll('.quest-item').length;
    const completed = document.querySelectorAll('.quest-item.completed').length;
    const ratio = all > 0 ? (completed / all) : 0;
    
    const overlay = document.getElementById('evaluation-overlay');
    const rankDisp = document.getElementById('final-rank');
    const msgDisp = document.getElementById('eval-msg');

    overlay.classList.remove('eval-hidden');
    overlay.style.display = 'flex';

    if (ratio === 1) {
        rankDisp.textContent = "S";
        msgDisp.textContent = "PERFECT ASCENSION. THE SYSTEM IS SATISFIED.";
    } else if (ratio >= 0.8) {
        rankDisp.textContent = "A";
        msgDisp.textContent = "EXCELLENT WORK. YOU ARE EVOLVING.";
    } else {
        rankDisp.textContent = "E";
        rankDisp.style.color = "#ff0000";
        msgDisp.textContent = "INSUFFICIENT GROWTH. PENALTY IMMINENT.";
    }
}

function closeEval() {
    document.getElementById('evaluation-overlay').style.display = 'none';
}

// --- INITIALIZE SYSTEM ---
setInterval(() => {
    updateClock();
    updatePenaltyTimer();
}, 1000);

updateClock();
loadQuests();