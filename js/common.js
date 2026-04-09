// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
function escapeHtml(text) { 
    const div = document.createElement('div'); 
    div.textContent = text; 
    return div.innerHTML; 
}

function getRussianStyleText(styleValue) { 
    switch (styleValue) { 
        case "rare": return "Урон"; 
        case "uncommon": return "Уворот"; 
        case "armor": return "Броня"; 
        case "epic": return "Элита"; 
        default: return styleValue || "—"; 
    } 
}

function getStatIconClass(statName) { 
    const name = String(statName).toLowerCase(); 
    const map = { 
        'урон': 'stat-icon-урон', 
        'точность': 'stat-icon-точность', 
        'уворот': 'stat-icon-уворот', 
        'броня': 'stat-icon-броня', 
        'блок': 'stat-icon-блок', 
        'оглушение': 'stat-icon-оглушение', 
        'здоровье': 'stat-icon-здоровье',
        'износ': 'stat-icon-износ'
    }; 
    return 'stat-icon ' + (map[name] || 'stat-icon-износ'); 
}

function checkAuth() { 
    const user = localStorage.getItem('user'); 
    return user ? JSON.parse(user) : null; 
}

function displayAdminPanel() { 
    const user = checkAuth(); 
    const ap = document.getElementById('adminPanel'); 
    const up = document.getElementById('userPanel'); 
    const ab = document.getElementById('addItemBtn'); 
    if (!user) { 
        if (ap) ap.style.display = 'none'; 
        if (up) up.style.display = 'none'; 
        if (ab) ab.style.display = 'none'; 
        return; 
    } 
    if (user.role === 'admin') { 
        if (ap) ap.style.display = 'block'; 
        if (up) up.style.display = 'none'; 
        if (ab) ab.style.display = 'block'; 
        const n = document.getElementById('adminName'); 
        if (n) n.textContent = user.name; 
    } else { 
        if (ap) ap.style.display = 'none'; 
        if (up) up.style.display = 'block'; 
        if (ab) ab.style.display = 'none'; 
        const n = document.getElementById('userName'); 
        if (n) n.textContent = user.name; 
    }
    
    addBellToHeader();
    addGlobalSearch();
    addSoundToggleButton();
    initNotificationBell();
    initHotkeys();
    initSound();
}

function logout() { 
    localStorage.removeItem('user'); 
    window.location.href = 'auth.html'; 
}

function openAdminPanel() { 
    window.location.href = 'admin.html'; 
}

function closeModal(id) { 
    const m = document.getElementById(id); 
    if (m) { 
        m.style.display = 'none'; 
        document.body.style.overflow = ''; 
    } 
}

window.onclick = function (e) { 
    const ids = ['runesModal', 'demonModal', 'runeModal', 'totemModal', 'editModal', 'editNewsModal', 'item-modal', 'editItemModal']; 
    for (let id of ids) { 
        const m = document.getElementById(id); 
        if (m && e.target === m) { 
            closeModal(id); 
            break; 
        } 
    } 
};

function openRunesModal() { 
    const m = document.getElementById('runesModal'); 
    if (m) { 
        m.style.display = 'flex'; 
        document.body.style.overflow = 'hidden'; 
    } 
}

function closeRunesModal() { 
    closeModal('runesModal'); 
}

// ==================== ЗВУКОВЫЕ УВЕДОМЛЕНИЯ ====================
let soundEnabled = localStorage.getItem('soundEnabled') === 'true';
let audioCtx = null;
let audioUnlocked = false;

function initSound() {
    if(soundEnabled === null) {
        soundEnabled = true;
        localStorage.setItem('soundEnabled', 'true');
    }
    
    // Создаем AudioContext в приостановленном состоянии
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        audioCtx.suspend();
    } catch(e) {
        console.log('Web Audio API не поддерживается');
    }
    
    updateSoundButton();
    
    // Разблокируем при первом клике на страницу
    const unlockAudio = () => {
        if(audioCtx && !audioUnlocked) {
            audioCtx.resume().then(() => {
                audioUnlocked = true;
                console.log('Аудио разблокировано');
            }).catch(e => console.log('Ошибка разблокировки:', e));
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };
    
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
}

function playNotificationSound() {
    if(!soundEnabled) return;
    if(!audioCtx) return;
    if(!audioUnlocked) {
        // Пытаемся разблокировать
        if(audioCtx) {
            audioCtx.resume().then(() => {
                audioUnlocked = true;
                playNotificationSound();
            }).catch(e => {});
        }
        return;
    }
    
    try {
        const now = audioCtx.currentTime;
        
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc1.frequency.value = 880;
        osc1.type = 'sine';
        osc2.frequency.value = 660;
        osc2.type = 'sine';
        
        gainNode.gain.value = 0;
        
        osc1.start();
        osc2.start();
        
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.35);
        
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
        
        if(audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    } catch(e) {
        console.log('Ошибка звука:', e);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);
    updateSoundButton();
    if(soundEnabled && audioUnlocked) {
        playNotificationSound();
    }
}

function updateSoundButton() {
    const soundBtn = document.getElementById('soundToggleBtn');
    if(soundBtn) {
        soundBtn.innerHTML = soundEnabled ? '🔊' : '🔇';
        soundBtn.title = soundEnabled ? 'Выключить звук' : 'Включить звук';
    }
}

function addSoundToggleButton() {
    const notificationHeader = document.querySelector('.notification-header');
    if(!notificationHeader || document.getElementById('soundToggleBtn')) return;
    
    const headerButtons = notificationHeader.querySelector('.notification-header-buttons');
    if(headerButtons) {
        const soundHtml = `
            <button class="sound-toggle-btn" id="soundToggleBtn" onclick="event.stopPropagation(); toggleSound()" title="${soundEnabled ? 'Выключить звук' : 'Включить звук'}">
                ${soundEnabled ? '🔊' : '🔇'}
            </button>
        `;
        headerButtons.insertAdjacentHTML('afterbegin', soundHtml);
    }
}
// ==================== ГОРЯЧИЕ КЛАВИШИ ====================
function initHotkeys() {
    document.addEventListener('keydown', function(e) {
        if(e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal, .item-compare-modal, .select-item-modal, .demon-modal, .rune-modal, .totem-modal, .runes-modal, .global-search-dropdown, .notification-dropdown');
            modals.forEach(modal => {
                if(modal.style.display === 'flex' || modal.classList.contains('show')) {
                    if(modal.classList) modal.classList.remove('show');
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
        }
        
        if((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchIcon = document.querySelector('.global-search-icon');
            if(searchIcon) {
                searchIcon.click();
            }
        }
        
        if(e.key === 'Enter') {
            const activeModal = document.querySelector('.modal[style*="flex"], .item-compare-modal[style*="flex"]');
            if(activeModal) {
                const saveBtn = activeModal.querySelector('.modal-save-btn, .cat-btn[onclick*="save"], .save-btn');
                if(saveBtn && document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                    saveBtn.click();
                }
            }
        }
    });
}

// ==================== ГЛОБАЛЬНЫЙ ПОИСК ====================
let globalSearchTimeout = null;
let globalSearchResults = [];

async function performGlobalSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    if(!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const resultsContainer = document.getElementById('globalSearchResults');
    
    if(!resultsContainer) return;
    
    if(searchTerm.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    const items = await getItems();
    const demons = await getDemons();
    const totems = await getTotems();
    const masterRunes = await getMasterRunes();
    const druidsRunes = await getDruidsRunes();
    const nakolki = await getNakolki();
    const news = await getNews();
    
    const results = [];
    
    items.forEach(item => {
        if(item.name.toLowerCase().includes(searchTerm) || (item.description && item.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '📦 Предмет', name: item.name, id: item.id, url: `main.html?item=${item.id}`, section: 'items' });
        }
    });
    
    demons.forEach(d => {
        if(d.name.toLowerCase().includes(searchTerm) || (d.description && d.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '👹 Круг демона', name: d.name, id: d.id, url: `demon.html?demon=${d.id}`, section: 'demons' });
        }
    });
    
    totems.forEach(t => {
        if(t.name.toLowerCase().includes(searchTerm) || (t.description && t.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '🧪 Тотем', name: t.name, id: t.id, url: `totem.html?totem=${t.id}`, section: 'totems' });
        }
    });
    
    masterRunes.forEach(r => {
        if(r.name.toLowerCase().includes(searchTerm) || (r.description && r.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '🏰 Руна мастера', name: r.name, id: r.id, url: `master.html?rune=${r.id}`, section: 'master' });
        }
    });
    
    druidsRunes.forEach(r => {
        if(r.name.toLowerCase().includes(searchTerm) || (r.description && r.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '🌿 Руна друидов', name: r.name, id: r.id, url: `druids.html?rune=${r.id}`, section: 'druids' });
        }
    });
    
    nakolki.forEach(r => {
        if(r.name.toLowerCase().includes(searchTerm) || (r.description && r.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '🏚️ Квестовая руна', name: r.name, id: r.id, url: `nakolki.html?rune=${r.id}`, section: 'nakolki' });
        }
    });
    
    news.forEach(n => {
        if(n.title.toLowerCase().includes(searchTerm) || n.content.toLowerCase().includes(searchTerm)) {
            results.push({ type: '📰 Новость', name: n.title, id: n.id, url: `news.html?id=${n.id}`, section: 'news' });
        }
    });
    
    globalSearchResults = results.slice(0, 15);
    
    if(globalSearchResults.length === 0) {
        resultsContainer.innerHTML = '<div class="global-search-empty">🔍 Ничего не найдено</div>';
        return;
    }
    
    let html = '';
    for(const res of globalSearchResults) {
        html += `
            <div class="global-search-item" onclick="window.location.href='${res.url}'">
                <span class="global-search-type">${res.type}</span>
                <span class="global-search-name">${escapeHtml(res.name)}</span>
            </div>
        `;
    }
    resultsContainer.innerHTML = html;
}

function toggleGlobalSearch() {
    const dropdown = document.getElementById('globalSearchDropdown');
    if(!dropdown) return;
    dropdown.classList.toggle('show');
    if(dropdown.classList.contains('show')) {
        setTimeout(() => {
            const input = document.getElementById('globalSearchInput');
            if(input) input.focus();
        }, 100);
    }
}

function addGlobalSearch() {
    const headerWrapper = document.querySelector('.header-wrapper');
    if(!headerWrapper || document.querySelector('.global-search')) return;
    
    const leftLink = headerWrapper.querySelector('a:first-child');
    
    if(leftLink) {
        leftLink.style.marginRight = '15px';
    }
    
    const searchHtml = `
        <div class="global-search">
            <div class="global-search-icon" onclick="event.stopPropagation(); toggleGlobalSearch()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </div>
            <div class="global-search-dropdown" id="globalSearchDropdown">
                <div class="global-search-input-container">
                    <input type="text" id="globalSearchInput" placeholder="🔍 Поиск предметов, рун, новостей..." autocomplete="off">
                </div>
                <div class="global-search-results" id="globalSearchResults"></div>
            </div>
        </div>
    `;
    
    if(leftLink) {
        leftLink.insertAdjacentHTML('afterend', searchHtml);
    } else {
        headerWrapper.insertAdjacentHTML('afterbegin', searchHtml);
    }
    
    const searchInput = document.getElementById('globalSearchInput');
    if(searchInput) {
        searchInput.addEventListener('input', function() {
            if(globalSearchTimeout) clearTimeout(globalSearchTimeout);
            globalSearchTimeout = setTimeout(performGlobalSearch, 300);
        });
        
        document.addEventListener('click', function(e) {
            if(!e.target.closest('.global-search')) {
                const dropdown = document.getElementById('globalSearchDropdown');
                if(dropdown) dropdown.classList.remove('show');
            }
        });
        
        searchInput.addEventListener('keydown', function(e) {
            if(e.key === 'Escape') {
                const dropdown = document.getElementById('globalSearchDropdown');
                if(dropdown) dropdown.classList.remove('show');
                searchInput.blur();
            }
        });
    }
}

// ==================== УВЕДОМЛЕНИЯ И КОЛОКОЛЬЧИК ====================
let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
let notificationInterval = null;

function saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

function addNotification(title, message, timerId, characterName) {
    const newNotification = {
        id: Date.now(),
        title: title,
        message: message,
        timerId: timerId,
        characterName: characterName,
        time: new Date().toISOString(),
        read: false
    };
    notifications.unshift(newNotification);
    if(notifications.length > 50) notifications.pop();
    saveNotifications();
    updateBellBadge();
    renderNotificationDropdown();
    
    // Браузерное уведомление с опцией звука
    if(Notification.permission === 'granted') {
        const options = {
            body: message,
            icon: '/favicon.ico', // можно указать иконку
            silent: false, // false = звук будет, если разрешено
            vibrate: [200, 100, 200] // вибрация на мобилках (если есть)
        };
        const browserNotification = new Notification(title, options);
        
        // Закрыть уведомление через 5 секунд
        setTimeout(() => browserNotification.close(), 5000);
        
        // При клике на уведомление переходим в профиль
        browserNotification.onclick = function() {
            window.focus();
            window.location.href = 'profile.html';
        };
    }
    
    playNotificationSound();
}

function updateBellBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.querySelector('.bell-badge');
    if(badge) {
        if(unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderNotificationDropdown() {
    const container = document.getElementById('notificationList');
    if(!container) return;
    
    const unreadCount = notifications.filter(n => !n.read).length;
    const unreadSpan = document.getElementById('unreadCount');
    if(unreadSpan) unreadSpan.textContent = unreadCount;
    
    if(notifications.length === 0) {
        container.innerHTML = '<div class="notification-empty">🔔 Нет уведомлений</div>';
        return;
    }
    
    let html = '';
    for(const n of notifications) {
        const date = new Date(n.time);
        const timeStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString().slice(0,5)}`;
        html += `
            <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}" onclick="markNotificationRead(${n.id})">
                <div class="notification-title">${escapeHtml(n.title)}</div>
                <div class="notification-text">${escapeHtml(n.message)}</div>
                <div class="notification-time">${timeStr}</div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function markNotificationRead(id) {
    const notification = notifications.find(n => n.id === id);
    if(notification) {
        notification.read = true;
        saveNotifications();
        updateBellBadge();
        renderNotificationDropdown();
    }
}

function markAllNotificationsRead() {
    notifications.forEach(n => n.read = true);
    saveNotifications();
    updateBellBadge();
    renderNotificationDropdown();
}

function clearAllNotifications() {
    notifications = [];
    saveNotifications();
    updateBellBadge();
    renderNotificationDropdown();
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if(!dropdown) return;
    
    dropdown.classList.toggle('show');
    
    if(dropdown.classList.contains('show')) {
        renderNotificationDropdown();
        
        const permissionAskedFlag = localStorage.getItem('notification_permission_asked');
        if(!permissionAskedFlag && Notification.permission === 'default') {
            localStorage.setItem('notification_permission_asked', 'true');
            Notification.requestPermission();
        }
    }
}

async function checkTimersForNotifications() {
    const user = checkAuth();
    if(!user) return;
    
    if(typeof getUserCharacters === 'undefined') return;
    if(typeof getCharacterTimers === 'undefined') return;
    
    const characters = await getUserCharacters(user.login);
    const now = Date.now();
    const checkedTimers = JSON.parse(localStorage.getItem('checkedTimers') || '{}');
    
    for(const char of characters) {
        const timers = await getCharacterTimers(char.id);
        for(const timer of timers) {
            const remaining = timer.end_time - now;
            if(remaining <= 0 && timer.is_active && !checkedTimers[timer.id]) {
                checkedTimers[timer.id] = true;
                localStorage.setItem('checkedTimers', JSON.stringify(checkedTimers));
                
                addNotification(
                    '⏰ Таймер завершен!',
                    `Персонаж "${char.name}": "${timer.quest_name}" можно выполнить заново!`,
                    timer.id,
                    char.name
                );
                
                if(window.db) {
                    await window.db.from('user_timers').update({ is_active: false }).eq('id', timer.id);
                }
            }
            if(remaining > 0 && checkedTimers[timer.id]) {
                delete checkedTimers[timer.id];
                localStorage.setItem('checkedTimers', JSON.stringify(checkedTimers));
            }
        }
    }
}

function startNotificationChecker() {
    if(notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(() => {
        if(checkAuth()) {
            checkTimersForNotifications();
        }
    }, 10000);
}

function initNotificationBell() {
    updateBellBadge();
    startNotificationChecker();
}

function addBellToHeader() {
    const headerWrapper = document.querySelector('.header-wrapper');
    if(!headerWrapper || document.querySelector('.notification-bell')) return;
    
    const rightLink = headerWrapper.querySelector('a:last-child');
    
    const bellHtml = `
        <div class="notification-bell" onclick="event.stopPropagation(); toggleNotificationDropdown()">
            <div class="bell-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
            </div>
            <div class="bell-badge" style="display:none;">0</div>
            <div class="notification-dropdown" id="notificationDropdown">
                <div class="notification-header">
                    <span>🔔 Уведомления (<span id="unreadCount">0</span>)</span>
                    <div class="notification-header-buttons">
                        <button onclick="event.stopPropagation(); markAllNotificationsRead()">📖 Все</button>
                        <button onclick="event.stopPropagation(); clearAllNotifications()">🗑️ Очистить</button>
                    </div>
                </div>
                <div class="notification-list" id="notificationList"></div>
            </div>
        </div>
    `;
    
    if(rightLink) {
        rightLink.insertAdjacentHTML('beforebegin', bellHtml);
    } else {
        headerWrapper.insertAdjacentHTML('beforeend', bellHtml);
    }
    
    document.addEventListener('click', function(e) {
        if(!e.target.closest('.notification-bell')) {
            const dropdown = document.getElementById('notificationDropdown');
            if(dropdown) dropdown.classList.remove('show');
        }
    });
}

// Экспорт в глобальную область
window.toggleGlobalSearch = toggleGlobalSearch;
window.toggleNotificationDropdown = toggleNotificationDropdown;
window.markNotificationRead = markNotificationRead;
window.markAllNotificationsRead = markAllNotificationsRead;
window.clearAllNotifications = clearAllNotifications;
window.toggleSound = toggleSound;