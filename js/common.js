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
    
    // Добавляем колокольчик после отображения панели
    addBellToHeader();
    initNotificationBell();
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

// ==================== УВЕДОМЛЕНИЯ И КОЛОКОЛЬЧИК ====================
let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
let notificationInterval = null;
let permissionAsked = false;

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
    
    if(Notification.permission === 'granted') {
        new Notification(title, { body: message });
    }
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
                    <div>
                        <button onclick="event.stopPropagation(); markAllNotificationsRead()">📖 Прочитать все</button>
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

// Для модалок с рунами
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