// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

// Экранирование HTML спецсимволов для безопасности
function escapeHtml(text) { 
    const div = document.createElement('div'); 
    div.textContent = text; 
    return div.innerHTML; 
}

// Преобразование английского названия стиля в русское
function getRussianStyleText(styleValue) { 
    switch (styleValue) { 
        case "rare": return "Урон"; 
        case "uncommon": return "Уворот"; 
        case "armor": return "Броня"; 
        case "epic": return "Элита"; 
        default: return styleValue || "—"; 
    } 
}

// Возвращает CSS класс для иконки характеристики
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

// Проверка авторизации пользователя в localStorage
function checkAuth() { 
    const user = localStorage.getItem('user'); 
    return user ? JSON.parse(user) : null; 
}

// Отображение админ-панели или пользовательской панели в зависимости от роли
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
        
        // Добавляем кнопку профиля в панель пользователя
        const actionsDiv = document.querySelector('#userPanel .admin-actions');
        if (actionsDiv && !actionsDiv.querySelector('.profile-btn')) {
            const profileBtn = document.createElement('button');
            profileBtn.className = 'admin-btn profile-btn';
            profileBtn.innerHTML = '👤 Профиль';
            profileBtn.onclick = () => location.href = 'profile.html';
            const logoutBtn = actionsDiv.querySelector('.logout-btn');
            if (logoutBtn) {
                actionsDiv.insertBefore(profileBtn, logoutBtn);
            } else {
                actionsDiv.appendChild(profileBtn);
            }
        }
    }
    
    addBellToHeader();
    addGlobalSearch();
    addSoundToggleButton();
    initNotificationBell();
    initHotkeys();
    initSound();
}

// Выход из аккаунта
function logout() { 
    localStorage.removeItem('user'); 
    window.location.href = 'auth.html'; 
}

// Открытие админ-панели
function openAdminPanel() { 
    window.location.href = 'admin.html'; 
}

// Закрытие модального окна по ID
function closeModal(id) { 
    const m = document.getElementById(id); 
    if (m) { 
        m.style.display = 'none'; 
        document.body.style.overflow = ''; 
    } 
}

// Открытие модалки выбора рун
function openRunesModal() { 
    const m = document.getElementById('runesModal'); 
    if (m) { 
        m.style.display = 'flex'; 
        document.body.style.overflow = 'hidden'; 
    } 
}

// Закрытие модалки рун
function closeRunesModal() { 
    const m = document.getElementById('runesModal'); 
    if (m) { 
        m.style.display = 'none'; 
        document.body.style.overflow = ''; 
    } 
}


// Закрытие модалки при клике вне её области
window.onclick = function (e) { 
    // Модалки, которые закрываются по клику на фон (админские модалки добавления/редактирования - НЕ закрываем)
    const ids = ['runesModal', 'demonModal', 'runeModal', 'totemModal', 'editNewsModal', 'item-modal', 'editItemModal']; 
    for (let id of ids) { 
        const m = document.getElementById(id); 
        if (m && e.target === m) { 
            closeModal(id); 
            break; 
        } 
    } 
    
    // Модалка editModal (добавление/редактирование предметов в админке) - НЕ закрывается по клику на фон
    const editModal = document.getElementById('editModal');
    if (editModal && e.target === editModal) {
        return; // ничего не делаем
    }
};

// Закрытие модалки рун
function closeRunesModal() { 
    closeModal('runesModal'); 
}

// ==================== ЗВУКОВЫЕ УВЕДОМЛЕНИЯ ====================

let soundEnabled = localStorage.getItem('soundEnabled') === 'true';
let audioCtx = null;
let audioUnlocked = false;

// Инициализация звуковой системы
function initSound() {
    if(soundEnabled === null) {
        soundEnabled = true;
        localStorage.setItem('soundEnabled', 'true');
    }
    
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        audioCtx.suspend();
    } catch(e) {
        console.log('Web Audio API не поддерживается');
    }
    
    updateSoundButton();
    
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

// Воспроизведение звука уведомления
function playNotificationSound() {
    if(!soundEnabled) return;
    if(!audioCtx) return;
    if(!audioUnlocked) {
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

// Включение/выключение звука
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);
    updateSoundButton();
    if(soundEnabled && audioUnlocked) {
        playNotificationSound();
    }
}

// Обновление иконки кнопки звука
function updateSoundButton() {
    const soundBtn = document.getElementById('soundToggleBtn');
    if(soundBtn) {
        soundBtn.innerHTML = soundEnabled ? '🔊' : '🔇';
        soundBtn.title = soundEnabled ? 'Выключить звук' : 'Включить звук';
    }
}

// Добавление кнопки звука в шапку уведомлений
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

// Инициализация горячих клавиш
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

// Получение секретных вещей из БД
async function getSecretItems() { 
    await ensureDb(); 
    const { data, error } = await db.from('secret_items_new').select('*'); 
    if (error) return []; 
    return data; 
}

// Получение секретных сетов из БД
async function getSecretSets() { 
    await ensureDb(); 
    const { data, error } = await db.from('secret_sets_new').select('*'); 
    if (error) return []; 
    return data; 
}

// Выполнение глобального поиска по всем сущностям
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
    
    // Показываем индикатор загрузки
    resultsContainer.innerHTML = '<div class="global-search-loading"><div class="loading-dots"></div><span>Поиск...</span></div>';
    
    // Даём время на отрисовку индикатора
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const items = await getItems();
    const demons = await getDemons();
    const totems = await getTotems();
    const masterRunes = await getMasterRunes();
    const druidsRunes = await getDruidsRunes();
    const nakolki = await getNakolki();
    const news = await getNews();
    const secretItems = await getSecretItems();
    const secretSets = await getSecretSets();
    const mapLocations = await getMapLocations();
    
    const results = [];
    
    items.forEach(item => {
        if(item.name.toLowerCase().includes(searchTerm) || (item.description && item.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '📦 Предмет', name: item.name, id: item.id, url: `main.html?id=${item.id}&open=modal` });
        }
    });
    
    demons.forEach(d => {
        if(d.name.toLowerCase().includes(searchTerm) || (d.description && d.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '👹 Круг демона', name: d.name, id: d.id, url: `demon.html?id=${d.id}&open=modal` });
        }
    });
    
    totems.forEach(t => {
        if(t.name.toLowerCase().includes(searchTerm) || (t.description && t.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '🧪 Тотем', name: t.name, id: t.id, url: `totem.html?id=${t.id}&open=modal` });
        }
    });
    
    masterRunes.forEach(r => {
        if(r.name.toLowerCase().includes(searchTerm) || (r.description && r.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '🏰 Руна мастера', name: r.name, id: r.id, url: `master.html?id=${r.id}&open=modal` });
        }
    });
    
    druidsRunes.forEach(r => {
        if(r.name.toLowerCase().includes(searchTerm) || (r.description && r.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '🌿 Руна друидов', name: r.name, id: r.id, url: `druids.html?id=${r.id}&open=modal` });
        }
    });
    
    nakolki.forEach(r => {
        if(r.name.toLowerCase().includes(searchTerm) || (r.description && r.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '🏚️ Квестовая руна', name: r.name, id: r.id, url: `nakolki.html?id=${r.id}&open=modal` });
        }
    });
    
    news.forEach(n => {
        if(n.title.toLowerCase().includes(searchTerm) || n.content.toLowerCase().includes(searchTerm)) {
            results.push({ type: '📰 Новость', name: n.title, id: n.id, url: `news.html?id=${n.id}&open=modal` });
        }
    });
    
    secretItems.forEach(item => {
        if(item.name.toLowerCase().includes(searchTerm) || (item.description && item.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '🔮 Секретная вещь', name: item.name, id: item.id, url: `secret_items.html?id=${item.id}&open=modal` });
        }
    });
    
    secretSets.forEach(set => {
        if(set.name.toLowerCase().includes(searchTerm)) {
            results.push({ type: '👘 Секретный сет', name: set.name, id: set.id, url: `secret_sets.html?set=${set.id}&open=modal` });
        }
    });
    
    mapLocations.forEach(loc => {
        if(loc.name.toLowerCase().includes(searchTerm) || (loc.description && loc.description.toLowerCase().includes(searchTerm))) {
            results.push({ type: '🗺️ Локация', name: loc.name, id: loc.id, url: `map.html?id=${loc.id}&open=modal` });
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
// Открытие/закрытие выпадающего окна глобального поиска
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

// Добавление глобального поиска в шапку сайта
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

// Сохранение уведомлений в localStorage
function saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// Добавление нового уведомления
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
        const options = {
            body: message,
            icon: '/favicon.ico',
            silent: false,
            vibrate: [200, 100, 200]
        };
        const browserNotification = new Notification(title, options);
        setTimeout(() => browserNotification.close(), 5000);
        browserNotification.onclick = function() {
            window.focus();
            window.location.href = 'profile.html';
        };
    }
    
    playNotificationSound();
}

// Обновление счетчика непрочитанных уведомлений
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

// Отрисовка списка уведомлений
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

// Отметка одного уведомления как прочитанного
function markNotificationRead(id) {
    const notification = notifications.find(n => n.id === id);
    if(notification) {
        notification.read = true;
        saveNotifications();
        updateBellBadge();
        renderNotificationDropdown();
    }
}

// Отметка всех уведомлений как прочитанных
function markAllNotificationsRead() {
    notifications.forEach(n => n.read = true);
    saveNotifications();
    updateBellBadge();
    renderNotificationDropdown();
}

// Очистка всех уведомлений
function clearAllNotifications() {
    notifications = [];
    saveNotifications();
    updateBellBadge();
    renderNotificationDropdown();
}

// Открытие/закрытие выпадающего окна уведомлений
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

// Проверка завершенных таймеров для создания уведомлений
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

// Запуск периодической проверки таймеров
function startNotificationChecker() {
    if(notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(() => {
        if(checkAuth()) {
            checkTimersForNotifications();
        }
    }, 10000);
}

// Инициализация системы уведомлений
function initNotificationBell() {
    updateBellBadge();
    startNotificationChecker();
}

// Добавление иконки колокольчика в шапку сайта
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

// ==================== УНИВЕРСАЛЬНОЕ ОТКРЫТИЕ МОДАЛКИ ИЗ URL ====================

// Автоматическое открытие модалки при переходе по ссылке с параметром ?id=...&open=modal
async function openModalFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const setId = urlParams.get('set');
    const openModal = urlParams.get('open');
    
    if (!openModal || openModal !== 'modal') return;
    
    const path = window.location.pathname;
    
    // Для секретных сетов - не удаляем параметры, пусть страница сама обработает
    const isSecretSets = path.includes('secret_sets.html');
    
    setTimeout(async () => {
        try {
            // Демоны
            if (path.includes('demon.html') && typeof openDemonModal === 'function' && id) {
                openDemonModal(parseInt(id));
            }
            // Тотемы
            else if (path.includes('totem.html') && typeof openTotemModal === 'function' && id) {
                openTotemModal(parseInt(id));
            }
            // Руны (master, druids, nakolki)
            else if ((path.includes('master.html') || path.includes('druids.html') || path.includes('nakolki.html')) && typeof openRuneModal === 'function' && id) {
                openRuneModal(parseInt(id));
            }
            // Секретные вещи
            else if (path.includes('secret_items.html') && typeof openSecretItemModal === 'function' && id) {
                openSecretItemModal(parseInt(id));
            }
            // Секретные сеты - пропускаем, страница сама обработает
            else if (path.includes('secret_sets.html')) {
                return;
            }
            // Карта (локации)
            else if (path.includes('map.html') && id) {
                if (typeof centerMapOnLocation === 'function' && typeof openLocationModal === 'function') {
                    centerMapOnLocation(parseInt(id));
                    setTimeout(() => {
                        const loc = window.mapLocations?.find(l => l.id == id);
                        if (loc && typeof openLocationModal === 'function') openLocationModal(loc);
                    }, 300);
                }
            }
            // Обычные предметы (main.html)
            else if (path.includes('main.html') && typeof openItemModal === 'function' && id) {
                openItemModal(parseInt(id));
            }
            // Новости (скролл к новости)
            else if (path.includes('news.html') && id) {
                const newsElement = document.querySelector(`.news-card[data-id="${id}"]`);
                if (newsElement) {
                    newsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    newsElement.style.border = '2px solid #c7ba00';
                    setTimeout(() => {
                        newsElement.style.border = '';
                    }, 2000);
                }
            }
        } catch(e) {
            console.log('Ошибка открытия модалки из URL:', e);
        }
        
        // Убираем параметры из URL ТОЛЬКО если это не secret_sets.html
        if (!isSecretSets) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, 500);
}
// ==================== УНИВЕРСАЛЬНОЕ ОТКРЫТИЕ ПРЕДМЕТА ДЛЯ КВЕСТОВ ====================
window.openItemModalById = async function(itemId, category) {
    let item = null;
    
    try {
        switch(category) {
            case 'secret':
                item = await getSecretItemById(itemId);
                break;
            case 'demon':
                item = await getDemonById(itemId);
                break;
            case 'rune':
                item = await getMasterRuneById(itemId);
                if (!item) item = await getDruidsRuneById(itemId);
                if (!item) item = await getNakolkiById(itemId);
                break;
            case 'item':
                item = await getItemById(itemId);
                break;
            default:
                item = await getSecretItemById(itemId);
        }
    } catch(e) {
        console.error('Ошибка:', e);
        alert('Ошибка при получении предмета');
        return;
    }
    
    if (!item) {
        alert('Предмет не найден');
        return;
    }
    
    let info = item.name + '\n';
    info += 'Уровень: ' + (item.level || 0) + '\n';
    if (item.type) info += 'Тип: ' + item.type + '\n';
    if (item.description) info += '\nОписание: ' + item.description;
    if (item.stats) {
        const stats = Object.entries(item.stats).filter(([k,v]) => v).map(([k,v]) => k + ': ' + v).join(', ');
        if (stats) info += '\nХарактеристики: ' + stats;
    }
    
    alert(info);
};
// ==================== ОТКРЫТИЕ МОДАЛКИ СЕКРЕТНОГО ПРЕДМЕТА ====================
async function openSecretItemModalById(itemId) {
    try {
        const item = await getSecretItemById(itemId);
        if (!item) {
            console.error('Предмет не найден:', itemId);
            alert('❌ Предмет не найден');
            return;
        }
        
        // Создаём временную модалку, если её нет на странице
        let modal = document.getElementById('secretItemModal');
        if (!modal) {
            // Создаём модалку динамически
            modal = document.createElement('div');
            modal.id = 'secretItemModal';
            modal.className = 'rune-modal';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="rune-modal-content">
                    <div class="rune-modal-header">
                        <div class="rune-modal-close" onclick="closeSecretItemModalDynamic()">✕</div>
                        <div class="rune-modal-icon">
                            <div class="item-icon shop-icon" id="dynamicModalIcon" style="width:80px;height:80px;background-image:url('img/shop.png');background-repeat:no-repeat;"></div>
                        </div>
                        <div class="rune-modal-title" id="dynamicModalTitle"></div>
                        <div class="rune-modal-subtitle" id="dynamicModalSubtitle"></div>
                    </div>
                    <div class="rune-modal-body">
                        <div class="rune-modal-stats">
                            <div class="rune-modal-stats-title">📊 ХАРАКТЕРИСТИКИ</div>
                            <div id="dynamicModalStats"></div>
                        </div>
                        <div id="dynamicModalUniqueContainer" class="item-card-unique" style="display:none;">
                            <div class="item-card-unique-title">✨ УНИКАЛЬНЫЕ ХАРАКТЕРИСТИКИ</div>
                            <ul id="dynamicModalUniqueList"></ul>
                        </div>
                        <div class="rune-modal-description" id="dynamicModalDescription"></div>
                    </div>
                    <div class="rune-modal-footer">
                        <button class="rune-modal-btn" onclick="closeSecretItemModalDynamic()">Закрыть</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Заполняем модалку данными
        const iconEl = document.getElementById('dynamicModalIcon') || modal.querySelector('#dynamicModalIcon');
        const titleEl = document.getElementById('dynamicModalTitle') || modal.querySelector('#dynamicModalTitle');
        const subtitleEl = document.getElementById('dynamicModalSubtitle') || modal.querySelector('#dynamicModalSubtitle');
        const statsContainer = document.getElementById('dynamicModalStats') || modal.querySelector('#dynamicModalStats');
        const uniqueContainer = document.getElementById('dynamicModalUniqueContainer') || modal.querySelector('#dynamicModalUniqueContainer');
        const uniqueList = document.getElementById('dynamicModalUniqueList') || modal.querySelector('#dynamicModalUniqueList');
        const descEl = document.getElementById('dynamicModalDescription') || modal.querySelector('#dynamicModalDescription');
        
        if (iconEl) iconEl.style.backgroundPosition = `-${item.icon_col * 80}px -${item.icon_row * 80}px`;
        if (titleEl) titleEl.innerText = item.name;
        
        const typeText = item.type === 'temporary' ? '⏳ Временное' : '♾️ Постоянное';
        let expiryLine = '';
        if (item.expiry_text) {
            expiryLine = `<div style="font-size:12px; color:#ffaa44; margin-top:5px;">📅 Годность: ${escapeHtml(item.expiry_text)}</div>`;
        }
        if (subtitleEl) subtitleEl.innerHTML = `⭐ Уровень ${item.level} | ${typeText}${expiryLine}`;
        
        let descriptionHtml = '';
        if (item.description) {
            descriptionHtml += `<div style="margin-bottom:12px;">${escapeHtml(item.description)}</div>`;
        }
        if (item.how_to_get) {
            descriptionHtml += `<div style="background:rgba(199,186,0,0.15); border-left:3px solid #c7ba00; padding:10px 12px; border-radius:8px; margin-top:8px;">
                <div style="font-size:11px; color:#c7ba00; margin-bottom:5px;">🎯 СПОСОБ ПОЛУЧЕНИЯ:</div>
                <div style="font-size:12px; color:#ffdd88;">${escapeHtml(item.how_to_get)}</div>
            </div>`;
        }
        if (descEl) descEl.innerHTML = descriptionHtml || 'Описание отсутствует';
        
        // Рендер статистики
        if (statsContainer && typeof renderStats === 'function') {
            renderStats(item.stats || {}, statsContainer);
        }
        
        // Уникальные характеристики
        if (item.unique_stats && item.unique_stats.length > 0) {
            if (uniqueContainer) uniqueContainer.style.display = 'block';
            if (uniqueList) uniqueList.innerHTML = item.unique_stats.map(u => `<li>✨ ${escapeHtml(u)}</li>`).join('');
        } else {
            if (uniqueContainer) uniqueContainer.style.display = 'none';
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
    } catch (e) {
        console.error('Ошибка открытия предмета:', e);
        alert('❌ Ошибка при открытии предмета');
    }
}

function closeSecretItemModalDynamic() {
    const modal = document.getElementById('secretItemModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

// Делаем функцию глобальной
window.openSecretItemModalById = openSecretItemModalById;
window.closeSecretItemModalDynamic = closeSecretItemModalDynamic;
// ==================== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ====================

// Запуск всех систем после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    displayAdminPanel();
    openModalFromUrl();
});

// Экспорт функций в глобальную область
window.toggleGlobalSearch = toggleGlobalSearch;
window.toggleNotificationDropdown = toggleNotificationDropdown;
window.markNotificationRead = markNotificationRead;
window.markAllNotificationsRead = markAllNotificationsRead;
window.clearAllNotifications = clearAllNotifications;
window.toggleSound = toggleSound;
window.openModalFromUrl = openModalFromUrl;
window.getSecretItems = getSecretItems;
window.getSecretSets = getSecretSets;


// ==================== УНИВЕРСАЛЬНАЯ МОДАЛКА ДЛЯ ЛЮБОГО ПРЕДМЕТА ====================
window.showItemModal = function(item, category) {
    // Закрываем модалку квеста, если она открыта
    const questModal = document.getElementById('questModal');
    if (questModal && questModal.style.display === 'flex') {
        questModal.style.display = 'none';
    }
    
    let modal = document.getElementById('universalItemModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'universalItemModal';
        modal.className = 'rune-modal';
        modal.style.display = 'none';
        modal.style.zIndex = '10001';
        modal.innerHTML = `
            <div class="rune-modal-content">
                <div class="rune-modal-header">
                    <div class="rune-modal-close" onclick="window.closeUniversalItemModal()">✕</div>
                    <div class="rune-modal-icon">
                        <div class="item-icon shop-icon" id="universalModalIcon" style="width:80px;height:80px;background-image:url('img/shop.png');background-repeat:no-repeat;"></div>
                    </div>
                    <div class="rune-modal-title" id="universalModalTitle"></div>
                    <div class="rune-modal-subtitle" id="universalModalSubtitle"></div>
                </div>
                <div class="rune-modal-body">
                    <div class="rune-modal-stats">
                        <div class="rune-modal-stats-title">ХАРАКТЕРИСТИКИ</div>
                        <div id="universalModalStats"></div>
                    </div>
                    <div id="universalModalUniqueContainer" class="item-card-unique" style="display:none;">
                        <div class="item-card-unique-title">УНИКАЛЬНЫЕ ХАРАКТЕРИСТИКИ</div>
                        <ul id="universalModalUniqueList"></ul>
                    </div>
                    <div class="rune-modal-description" id="universalModalDescription"></div>
                </div>
                <div class="rune-modal-footer">
                    <button class="rune-modal-btn" onclick="window.closeUniversalItemModal()">Закрыть</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Заполняем модалку
    const iconEl = document.getElementById('universalModalIcon');
    const titleEl = document.getElementById('universalModalTitle');
    const subtitleEl = document.getElementById('universalModalSubtitle');
    const statsContainer = document.getElementById('universalModalStats');
    const uniqueContainer = document.getElementById('universalModalUniqueContainer');
    const uniqueList = document.getElementById('universalModalUniqueList');
    const descEl = document.getElementById('universalModalDescription');
    
    // Иконка
    if (iconEl && item.icon_row !== undefined && item.icon_col !== undefined) {
        iconEl.style.backgroundPosition = `-${item.icon_col * 80}px -${item.icon_row * 80}px`;
    } else {
        iconEl.style.backgroundPosition = '0px 0px';
    }
    
    // Название
    if (titleEl) titleEl.innerText = item.name || 'Без названия';
    
    // Уровень и тип
    let levelText = item.level ? `Уровень ${item.level}` : '';
    let typeText = '';
    if (category === 'demon') typeText = 'Демон';
    else if (category === 'rune') typeText = 'Руна';
    else if (category === 'item') typeText = item.type || 'Предмет';
    else if (category === 'secret') typeText = item.type === 'temporary' ? 'Временное' : 'Постоянное';
    else if (category === 'enhancement') typeText = item.type === 'temporary' ? 'Временное усиление' : 'Постоянное усиление';
    
    if (subtitleEl) subtitleEl.innerHTML = [levelText, typeText].filter(Boolean).join(' | ');
    
    // Описание
    if (descEl) descEl.innerHTML = item.description || 'Описание отсутствует';
    
    // Характеристики
    if (statsContainer && typeof renderStats === 'function') {
        renderStats(item.stats || {}, statsContainer);
    } else if (statsContainer) {
        statsContainer.innerHTML = '<div>Нет характеристик</div>';
    }
    
    // Уникальные характеристики
    if (item.unique_stats && item.unique_stats.length > 0) {
        if (uniqueContainer) uniqueContainer.style.display = 'block';
        if (uniqueList) uniqueList.innerHTML = item.unique_stats.map(u => `<li>${escapeHtml(u)}</li>`).join('');
    } else {
        if (uniqueContainer) uniqueContainer.style.display = 'none';
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeUniversalItemModal = function() {
    const modal = document.getElementById('universalItemModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
};

// ==================== ПОЛУЧЕНИЕ ПРЕДМЕТА И ОТКРЫТИЕ МОДАЛКИ ====================
window.openItemModalById = async function(itemId, category) {
    let item = null;
    
    try {
        switch(category) {
            case 'secret':
                item = await getSecretItemById(itemId);
                break;
            case 'demon':
                item = await getDemonById(itemId);
                break;
            case 'rune':
                item = await getMasterRuneById(itemId);
                if (!item) item = await getDruidsRuneById(itemId);
                if (!item) item = await getNakolkiById(itemId);
                break;
            case 'item':
                item = await getItemById(itemId);
                break;
            case 'enhancement':
                item = await getEnhancementById(itemId);
                break;
            default:
                item = await getSecretItemById(itemId);
        }
    } catch(e) {
        console.error('Ошибка:', e);
        alert('Ошибка при получении предмета');
        return;
    }
    
    if (!item) {
        alert('Предмет не найден');
        return;
    }
    
    window.showItemModal(item, category);
};
