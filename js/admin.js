// ==================== АДМИН-ПАНЕЛЬ (admin.js) ====================
const user = checkAuth();
if (!user || user.role !== 'admin') {
    alert('Доступ запрещён!');
    window.location.href = 'index.html';
}

let currentType = null, currentId = null, currentPickerCallback = null;
let allItemsData = [];

// ==================== ЗАГРУЗКА ТАБЛИЦ ====================
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-panel-content').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab + 'Panel').classList.add('active');
        loadTable(tab.dataset.tab);
    });
});

async function loadTable(type) {
    if (type === 'items') {
        await loadItemsWithSearch();
        const searchInput = document.getElementById('searchItems');
        if (searchInput && !searchInput.hasListener) {
            searchInput.addEventListener('input', () => renderItemsWithSearch());
            searchInput.hasListener = true;
        }
    }
    if (type === 'demons') renderDemons(await getDemons());
    if (type === 'totems') renderTotems(await getTotems());
    if (type === 'master') renderMaster(await getMasterRunes());
    if (type === 'druids') renderDruids(await getDruidsRunes());
    if (type === 'nakolki') renderNakolki(await getNakolki());
    if (type === 'news') renderNews(await getNews());
    if (type === 'users') renderUsers(await getUsers());
}

// ==================== ПОИСК В АДМИНКЕ ====================
async function loadItemsWithSearch() {
    allItemsData = await getItems();
    renderItemsWithSearch();
}

function renderItemsWithSearch() {
    const tbody = document.getElementById('itemsList');
    if (!tbody) return;

    const searchTerm = document.getElementById('searchItems') ? document.getElementById('searchItems').value.toLowerCase().trim() : '';

    let filtered = [...allItemsData];
    if (searchTerm !== '') {
        filtered = filtered.filter(item => item.name.toLowerCase().includes(searchTerm));
    }

    let html = '';
    for (const d of filtered) {
        html += `<tr>
            <td>${d.id}</td>
            <td>${escapeHtml(d.name)}</td>
            <td>${escapeHtml(d.type)}</td>
            <td>${d.level}</td>
            <td>${getRussianStyleText(d.style)}</td>
            <td><button class="edit-btn" onclick="openModal('items',${d.id})">✏️</button><button class="delete-btn" onclick="deleteRow('items',${d.id})">🗑️</button></td>
        </tr>`;
    }
    tbody.innerHTML = html;
}

function clearSearch() {
    const searchInput = document.getElementById('searchItems');
    if (searchInput) {
        searchInput.value = '';
        renderItemsWithSearch();
    }
}

// ==================== РЕНДЕР ФУНКЦИИ ====================
function renderItems(data) {
    const tbody = document.getElementById('itemsList');
    if (!tbody) return;
    let html = '';
    for (const d of data) html += `<tr>
        <td>${d.id}</td>
        <td>${escapeHtml(d.name)}</td>
        <td>${escapeHtml(d.type)}</td>
        <td>${d.level}</td>
        <td>${getRussianStyleText(d.style)}</td>
        <td><button class="edit-btn" onclick="openModal('items',${d.id})">✏️</button><button class="delete-btn" onclick="deleteRow('items',${d.id})">🗑️</button></td>
    </tr>`;
    tbody.innerHTML = html;
}

function renderDemons(data) {
    const tbody = document.getElementById('demonsList');
    if (!tbody) return;
    let html = '';
    for (const d of data) html += `<tr>
        <td>${d.id}</td>
        <td>${escapeHtml(d.name)}</td>
        <td>${d.level}</td>
        <td><button class="edit-btn" onclick="openModal('demons',${d.id})">✏️</button><button class="delete-btn" onclick="deleteRow('demons',${d.id})">🗑️</button></td>
    </tr>`;
    tbody.innerHTML = html;
}

function renderTotems(data) {
    const tbody = document.getElementById('totemsList');
    if (!tbody) return;
    let html = '';
    for (const d of data) html += `<tr>
        <td>${d.id}</td>
        <td>${escapeHtml(d.name)}</td>
        <td>${d.level}</td>
        <td>${d.required_level}</td>
        <td><button class="edit-btn" onclick="openModal('totems',${d.id})">✏️</button><button class="delete-btn" onclick="deleteRow('totems',${d.id})">🗑️</button></td>
    </tr>`;
    tbody.innerHTML = html;
}

function renderMaster(data) {
    const tbody = document.getElementById('masterList');
    if (!tbody) return;
    let html = '';
    for (const d of data) html += `<tr>
        <td>${d.id}</td>
        <td>${escapeHtml(d.name)}</td>
        <td>${d.level}</td>
        <td><button class="edit-btn" onclick="openModal('master',${d.id})">✏️</button><button class="delete-btn" onclick="deleteRow('master',${d.id})">🗑️</button></td>
    </tr>`;
    tbody.innerHTML = html;
}

function renderDruids(data) {
    const tbody = document.getElementById('druidsList');
    if (!tbody) return;
    let html = '';
    for (const d of data) html += `<tr>
        <td>${d.id}</td>
        <td>${escapeHtml(d.name)}</td>
        <td>${d.level}</td>
        <td><button class="edit-btn" onclick="openModal('druids',${d.id})">✏️</button><button class="delete-btn" onclick="deleteRow('druids',${d.id})">🗑️</button></td>
    </tr>`;
    tbody.innerHTML = html;
}

function renderNakolki(data) {
    const tbody = document.getElementById('nakolkiList');
    if (!tbody) return;
    let html = '';
    for (const d of data) html += `<tr>
        <td>${d.id}</td>
        <td>${escapeHtml(d.name)}</td>
        <td>${d.level}</td>
        <td><button class="edit-btn" onclick="openModal('nakolki',${d.id})">✏️</button><button class="delete-btn" onclick="deleteRow('nakolki',${d.id})">🗑️</button></td>
    </tr>`;
    tbody.innerHTML = html;
}

function renderNews(data) {
    const tbody = document.getElementById('newsList');
    if (!tbody) return;
    let html = '';
    for (const d of data) html += `<tr>
        <td>${d.id}</td>
        <td>${escapeHtml(d.title)}</td>
        <td>${d.date}</td>
        <td><button class="edit-btn" onclick="openModal('news',${d.id})">✏️</button><button class="delete-btn" onclick="deleteRow('news',${d.id})">🗑️</button></td>
    </tr>`;
    tbody.innerHTML = html;
}

function renderUsers(data) {
    const tbody = document.getElementById('usersList');
    if (!tbody) return;
    let html = '';
    for (const d of data) html += `<tr>
        <td>${d.id}</td>
        <td>${escapeHtml(d.login)}</td>
        <td>${escapeHtml(d.email || '-')}</td>
        <td>${d.role}</td>
        <td><button class="delete-btn" onclick="deleteUser(${d.id})">🗑️</button></td>
    </tr>`;
    tbody.innerHTML = html;
}

// ==================== УДАЛЕНИЕ ====================
async function deleteRow(type, id) {
    if (confirm('Удалить?')) {
        if (type === 'items') await deleteItemById(id);
        if (type === 'demons') await deleteDemonById(id);
        if (type === 'totems') await deleteTotemById(id);
        if (type === 'master') await deleteMasterRuneById(id);
        if (type === 'druids') await deleteDruidsRuneById(id);
        if (type === 'nakolki') await deleteNakolkiById(id);
        if (type === 'news') await deleteNewsById(id);
        loadTable(type);
    }
}

async function deleteUser(id) {
    if (confirm('Удалить пользователя?')) {
        await db.from('users').delete().eq('id', id);
        loadTable('users');
    }
}

// ==================== ПРОВЕРКА ДУБЛИКАТОВ ====================
async function checkDuplicateItem(itemName, itemType, currentId = null) {
    const allItems = await getItems();
    const duplicate = allItems.find(item =>
        item.name.toLowerCase() === itemName.toLowerCase() &&
        item.type.toLowerCase() === itemType.toLowerCase() &&
        (currentId === null || item.id !== currentId)
    );
    return duplicate !== undefined;
}

async function checkDuplicateGeneric(itemName, currentId = null, getFunction) {
    const allItems = await getFunction();
    const duplicate = allItems.find(item =>
        item.name.toLowerCase() === itemName.toLowerCase() &&
        (currentId === null || item.id !== currentId)
    );
    return duplicate !== undefined;
}

// ==================== ПИКЕР ИКОНОК (shop.png) ====================
function showIconPicker(callback, buttonElement) {
    currentPickerCallback = callback;
    const grid = document.getElementById('iconPicker');
    const gridInner = document.getElementById('iconPickerGrid');
    gridInner.innerHTML = '';
    for (let r = 0; r < 34; r++) {
        for (let c = 0; c < 9; c++) {
            const div = document.createElement('div');
            div.className = 'icon-cell';
            div.style.backgroundPosition = `-${c * 80}px -${r * 80}px`;
            div.onclick = (function (row, col) { return function () { if (currentPickerCallback) currentPickerCallback(row, col); grid.style.display = 'none'; }; })(r, c);
            gridInner.appendChild(div);
        }
    }
    const btnRect = buttonElement.getBoundingClientRect();
    grid.style.position = 'fixed';
    grid.style.top = (btnRect.bottom + 5) + 'px';
    grid.style.left = (btnRect.left) + 'px';
    grid.style.display = 'block';
}

// ==================== ОТКРЫТИЕ МОДАЛКИ ====================
async function openModal(type, id = null) {
    currentType = type;
    currentId = id;
    document.getElementById('modalTitle').innerText = id ? '✏️ Редактировать' : '➕ Добавить';
    const container = document.getElementById('modalFields');
    let data = null;
    if (id) {
        if (type === 'items') data = await getItemById(id);
        if (type === 'demons') data = await getDemonById(id);
        if (type === 'totems') data = await getTotemById(id);
        if (type === 'master') data = await getMasterRuneById(id);
        if (type === 'druids') data = await getDruidsRuneById(id);
        if (type === 'nakolki') data = await getNakolkiById(id);
        if (type === 'news') data = await getNewsById(id);
    }
    let html = '';

    if (type === 'items') {
        const typeOptions = ['Оружие', 'Броня', 'Зелье', 'Свиток', 'Амулет', 'Кольцо', 'Разное'];
        let typeSelect = '<select id="itemType" class="form-control">';
        for (let opt of typeOptions) { const selected = (data && data.type === opt) ? 'selected' : ''; typeSelect += `<option value="${opt}" ${selected}>${opt}</option>`; }
        typeSelect += '</select>';
        const styleOptions = ['', 'rare', 'uncommon', 'armor', 'epic'];
        const styleNames = ['— Нет —', 'Урон', 'Уворот', 'Броня', 'Элита'];
        let styleSelect = '<select id="itemStyle" class="form-control">';
        for (let i = 0; i < styleOptions.length; i++) { const selected = (data && data.style === styleOptions[i]) ? 'selected' : ''; styleSelect += `<option value="${styleOptions[i]}" ${selected}>${styleNames[i]}</option>`; }
        styleSelect += '</select>';
        html = `<div class="form-row"><div class="form-group"><label>📝 Название</label><input type="text" id="itemName" value="${data ? escapeHtml(data.name) : ''}"></div></div>
        <div class="form-row"><div class="form-group"><label>📌 Тип</label>${typeSelect}</div><div class="form-group"><label>⭐ Уровень</label><input type="number" id="itemLevel" value="${data ? data.level : ''}"></div></div>
        <div class="form-row"><div class="form-group"><label>✨ Стиль</label>${styleSelect}</div></div>
        <div class="form-group"><button type="button" class="cat-btn" onclick="showIconPicker((r,c)=>{document.getElementById('iconRow').value=r; document.getElementById('iconCol').value=c; document.getElementById('iconPreview').innerHTML='✅ Выбрано: ряд '+(r+1)+', колонка '+(c+1);}, this)">🎨 Выбрать иконку</button><div id="iconPreview" class="icon-preview">${data ? `Текущая: ряд ${data.icon_row + 1}, колонка ${data.icon_col + 1}` : '❌ Не выбрано'}</div><input type="hidden" id="iconRow" value="${data ? data.icon_row : 19}"><input type="hidden" id="iconCol" value="${data ? data.icon_col : 4}"></div>
        <div class="stats-grid" id="statsGrid"></div>
        <div class="form-group"><label>📝 Описание</label><textarea id="description" rows="3" placeholder="Описание предмета...">${data ? escapeHtml(data.description || '') : ''}</textarea></div>
        <div class="unique-container" id="uniqueContainer"></div>
        <button type="button" class="add-stat-btn" onclick="addUniqueField()">➕ Добавить уникальную характеристику</button>`;
        container.innerHTML = html;

        // Проверка дубликатов
        const nameInput = document.getElementById('itemName');
        const typeSelectEl = document.getElementById('itemType');
        const saveBtn = document.querySelector('.modal-buttons .cat-btn:first-child');

        async function checkItemDuplicate() {
            const currentName = nameInput ? nameInput.value.trim() : '';
            const currentType = typeSelectEl ? typeSelectEl.value : '';
            if (!currentName) {
                let existingWarning = document.getElementById('duplicateWarning');
                if (existingWarning) existingWarning.remove();
                if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; saveBtn.style.cursor = 'pointer'; }
                return;
            }
            const allItems = await getItems();
            const isDuplicate = allItems.find(item =>
                item.name.toLowerCase() === currentName.toLowerCase() &&
                item.type.toLowerCase() === currentType.toLowerCase() &&
                (currentId === null || item.id !== currentId)
            );
            let warning = document.getElementById('duplicateWarning');
            if (isDuplicate) {
                if (!warning) {
                    const formRow = document.querySelector('#modalFields .form-row');
                    const div = document.createElement('div');
                    div.id = 'duplicateWarning';
                    div.style.cssText = 'background:rgba(255,68,68,0.2);border:1px solid #ff4444;border-radius:8px;padding:8px;margin-top:10px;text-align:center;color:#ff8888;font-size:12px;';
                    div.innerHTML = `⚠️ ПРЕДУПРЕЖДЕНИЕ! Предмет "${currentName}" (${currentType}) уже существует!`;
                    if (formRow) formRow.after(div);
                    else document.getElementById('modalFields').appendChild(div);
                } else {
                    warning.innerHTML = `⚠️ ПРЕДУПРЕЖДЕНИЕ! Предмет "${currentName}" (${currentType}) уже существует!`;
                    warning.style.display = 'block';
                }
                if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '0.5'; saveBtn.style.cursor = 'not-allowed'; }
            } else {
                if (warning) warning.remove();
                if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; saveBtn.style.cursor = 'pointer'; }
            }
        }
        if (nameInput) nameInput.addEventListener('input', checkItemDuplicate);
        if (typeSelectEl) typeSelectEl.addEventListener('change', checkItemDuplicate);
    }
    else if (type === 'demons' || type === 'totems' || type === 'master' || type === 'druids' || type === 'nakolki') {
        let extraField = '';
        if (type === 'totems') extraField = `<div class="form-group"><label>⭐ Требуемый уровень</label><input type="number" id="requiredLevel" value="${data ? data.required_level : ''}"></div>`;
        html = `<div class="form-row"><div class="form-group"><label>📝 Название</label><input type="text" id="itemName" value="${data ? escapeHtml(data.name) : ''}"></div></div>
        <div class="form-row"><div class="form-group"><label>⭐ Уровень</label><input type="number" id="itemLevel" value="${data ? data.level : ''}"></div>${extraField ? `<div class="form-group">${extraField}</div>` : ''}</div>
        <div class="form-group"><button type="button" class="cat-btn" onclick="showIconPicker((r,c)=>{document.getElementById('iconRow').value=r; document.getElementById('iconCol').value=c; document.getElementById('iconPreview').innerHTML='✅ Выбрано: ряд '+(r+1)+', колонка '+(c+1);}, this)">🎨 Выбрать иконку</button><div id="iconPreview" class="icon-preview">${data ? `Текущая: ряд ${data.icon_row + 1}, колонка ${data.icon_col + 1}` : '❌ Не выбрано'}</div><input type="hidden" id="iconRow" value="${data ? data.icon_row : 19}"><input type="hidden" id="iconCol" value="${data ? data.icon_col : 4}"></div>
        <div class="stats-grid" id="statsGrid"></div>
        <div class="form-group"><label>📝 Описание</label><textarea id="description" rows="3" placeholder="Описание...">${data ? escapeHtml(data.description || '') : ''}</textarea></div>`;
        container.innerHTML = html;

        const nameInput = document.getElementById('itemName');
        const saveBtn = document.querySelector('.modal-buttons .cat-btn:first-child');
        let getFunction = null;
        if (type === 'demons') getFunction = getDemons;
        else if (type === 'totems') getFunction = getTotems;
        else if (type === 'master') getFunction = getMasterRunes;
        else if (type === 'druids') getFunction = getDruidsRunes;
        else if (type === 'nakolki') getFunction = getNakolki;

        async function checkGenericDuplicate() {
            const currentName = nameInput ? nameInput.value.trim() : '';
            if (!currentName) {
                let existingWarning = document.getElementById('duplicateWarning');
                if (existingWarning) existingWarning.remove();
                if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; saveBtn.style.cursor = 'pointer'; }
                return;
            }
            const allItems = await getFunction();
            const isDuplicate = allItems.find(item =>
                item.name.toLowerCase() === currentName.toLowerCase() &&
                (currentId === null || item.id !== currentId)
            );
            let warning = document.getElementById('duplicateWarning');
            if (isDuplicate) {
                if (!warning) {
                    const formRow = document.querySelector('#modalFields .form-row');
                    const div = document.createElement('div');
                    div.id = 'duplicateWarning';
                    div.style.cssText = 'background:rgba(255,68,68,0.2);border:1px solid #ff4444;border-radius:8px;padding:8px;margin-top:10px;text-align:center;color:#ff8888;font-size:12px;';
                    div.innerHTML = `⚠️ ПРЕДУПРЕЖДЕНИЕ! "${currentName}" уже существует!`;
                    if (formRow) formRow.after(div);
                    else document.getElementById('modalFields').appendChild(div);
                } else {
                    warning.innerHTML = `⚠️ ПРЕДУПРЕЖДЕНИЕ! "${currentName}" уже существует!`;
                    warning.style.display = 'block';
                }
                if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '0.5'; saveBtn.style.cursor = 'not-allowed'; }
            } else {
                if (warning) warning.remove();
                if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; saveBtn.style.cursor = 'pointer'; }
            }
        }
        if (nameInput) nameInput.addEventListener('input', checkGenericDuplicate);
    }
    else if (type === 'news') {
        const categoryOptions = ['default', 'update', 'event', 'patch'];
        const categoryNames = ['📰 Обычная', '⚙️ Обновление', '🎉 Событие', '🔧 Патч'];
        let categorySelect = '<select id="newsCategory" class="form-control">';
        for (let i = 0; i < categoryOptions.length; i++) {
            const selected = (data && data.category === categoryOptions[i]) ? 'selected' : '';
            categorySelect += `<option value="${categoryOptions[i]}" ${selected}>${categoryNames[i]}</option>`;
        }
        categorySelect += '</select>';

        html = `<div class="form-row"><div class="form-group"><label>📰 Заголовок</label><input type="text" id="newsTitle" value="${data ? escapeHtml(data.title) : ''}"></div></div>
        <div class="form-row"><div class="form-group"><label>🏷️ Категория</label>${categorySelect}</div></div>
        <div class="form-group"><label>📄 Текст</label><textarea id="newsContent" rows="5">${data ? escapeHtml(data.content) : ''}</textarea></div>
        <div class="form-group"><label>✍️ Подпись</label><input type="text" id="newsFooter" value="${data ? escapeHtml(data.footer || 'С уважением, команда MMOBitva!') : 'С уважением, команда MMOBitva!'}" placeholder="Подпись в конце новости"></div>
        <div class="form-group"><label>📅 Дата</label><input type="date" id="newsDate" value="${data ? data.date : ''}"></div>`;
        container.innerHTML = html;

        const titleInput = document.getElementById('newsTitle');
        const saveBtn = document.querySelector('.modal-buttons .cat-btn:first-child');

        async function checkNewsDuplicate() {
            const currentTitle = titleInput ? titleInput.value.trim() : '';
            if (!currentTitle) {
                let existingWarning = document.getElementById('duplicateWarning');
                if (existingWarning) existingWarning.remove();
                if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; saveBtn.style.cursor = 'pointer'; }
                return;
            }
            const allNews = await getNews();
            const isDuplicate = allNews.find(item =>
                item.title.toLowerCase() === currentTitle.toLowerCase() &&
                (currentId === null || item.id !== currentId)
            );
            let warning = document.getElementById('duplicateWarning');
            if (isDuplicate) {
                if (!warning) {
                    const formRow = document.querySelector('#modalFields .form-row');
                    const div = document.createElement('div');
                    div.id = 'duplicateWarning';
                    div.style.cssText = 'background:rgba(255,68,68,0.2);border:1px solid #ff4444;border-radius:8px;padding:8px;margin-top:10px;text-align:center;color:#ff8888;font-size:12px;';
                    div.innerHTML = `⚠️ ПРЕДУПРЕЖДЕНИЕ! Новость с заголовком "${currentTitle}" уже существует!`;
                    if (formRow) formRow.after(div);
                    else document.getElementById('modalFields').appendChild(div);
                } else {
                    warning.innerHTML = `⚠️ ПРЕДУПРЕЖДЕНИЕ! Новость с заголовком "${currentTitle}" уже существует!`;
                    warning.style.display = 'block';
                }
                if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '0.5'; saveBtn.style.cursor = 'not-allowed'; }
            } else {
                if (warning) warning.remove();
                if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; saveBtn.style.cursor = 'pointer'; }
            }
        }
        if (titleInput) titleInput.addEventListener('input', checkNewsDuplicate);
    }

    // Общая часть для статов
    if (type !== 'news') {
        const stats = data ? data.stats : {};
        const statsList = (type === 'items') ? ['уровень', 'износ', 'количество', 'годность', 'точность', 'урон', 'блок', 'уворот', 'оглушение', 'броня', 'здоровье'] : ['точность', 'урон', 'блок', 'уворот', 'оглушение', 'броня', 'здоровье'];
        const icons = { 'уровень': 'stat-icon-уровень', 'износ': 'stat-icon-износ', 'количество': 'stat-icon-количество', 'годность': 'stat-icon-годность', 'точность': 'stat-icon-точность', 'урон': 'stat-icon-урон', 'блок': 'stat-icon-блок', 'уворот': 'stat-icon-уворот', 'оглушение': 'stat-icon-оглушение', 'броня': 'stat-icon-броня', 'здоровье': 'stat-icon-здоровье' };
        const names = { 'уровень': 'Уровень', 'износ': 'Износ', 'количество': 'Количество', 'годность': 'Годность', 'точность': 'Точность', 'урон': 'Урон', 'блок': 'Блок', 'уворот': 'Уворот', 'оглушение': 'Оглушение', 'броня': 'Броня', 'здоровье': 'Здоровье' };
        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = '';
            statsList.forEach(stat => {
                const div = document.createElement('div');
                div.className = 'stat-field';
                div.innerHTML = `<label><span class="stat-icon ${icons[stat]}"></span> ${names[stat]}:</label><input type="text" class="stat-${stat}" value="${stats[stat] || ''}" placeholder="Значение">`;
                statsGrid.appendChild(div);
            });
        }
        if (type === 'items') {
            const uniqueStats = data ? (data.unique_stats || []) : [];
            const uniqueContainer = document.getElementById('uniqueContainer');
            if (uniqueContainer) {
                uniqueContainer.innerHTML = '';
                uniqueStats.forEach(u => addUniqueField(u));
            }
        }
    }

    document.getElementById('editModal').style.display = 'flex';
}

function addUniqueField(value = '') {
    const container = document.getElementById('uniqueContainer');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'unique-row';
    div.innerHTML = `<input type="text" class="unique-value" value="${escapeHtml(value)}" placeholder="Уникальная характеристика"><button onclick="this.parentElement.remove()">🗑️</button>`;
    container.appendChild(div);
}

function collectStats(type) {
    const stats = {};
    const statsList = (type === 'items') ? ['уровень', 'износ', 'количество', 'годность', 'точность', 'урон', 'блок', 'уворот', 'оглушение', 'броня', 'здоровье'] : ['точность', 'урон', 'блок', 'уворот', 'оглушение', 'броня', 'здоровье'];
    statsList.forEach(stat => { const input = document.querySelector(`.stat-${stat}`); if (input && input.value.trim()) stats[stat] = input.value.trim(); });
    return stats;
}

function collectUniqueStats() {
    const unique = [];
    document.querySelectorAll('.unique-value').forEach(input => { if (input.value.trim()) unique.push(input.value.trim()); });
    return unique;
}

// ==================== СОХРАНЕНИЕ ====================
async function saveData() {
    let item = {};

    if (currentType === 'items') {
        const itemName = document.getElementById('itemName').value.trim();
        const itemType = document.getElementById('itemType').value;
        const itemDescription = document.getElementById('description') ? document.getElementById('description').value.trim() : '';
        if (!itemName) { alert('❌ Введите название предмета!'); return; }
        const isDuplicate = await checkDuplicateItem(itemName, itemType, currentId);
        if (isDuplicate) { alert(`❌ Ошибка! Предмет "${itemName}" с типом "${itemType}" уже существует!`); return; }
        item = {
            name: itemName, type: itemType, level: parseInt(document.getElementById('itemLevel').value),
            style: document.getElementById('itemStyle').value, icon: 'shop-icon',
            icon_row: parseInt(document.getElementById('iconRow').value), icon_col: parseInt(document.getElementById('iconCol').value),
            stats: collectStats('items'), unique_stats: collectUniqueStats(), description: itemDescription
        };
        if (currentId) item.id = currentId;
        await saveItem(item);
    }
    else if (currentType === 'demons') {
        const itemName = document.getElementById('itemName').value.trim();
        const itemDescription = document.getElementById('description') ? document.getElementById('description').value.trim() : '';
        if (!itemName) { alert('❌ Введите название!'); return; }
        const isDuplicate = await checkDuplicateGeneric(itemName, currentId, getDemons);
        if (isDuplicate) { alert(`❌ Ошибка! Демон "${itemName}" уже существует!`); return; }
        item = {
            name: itemName, level: parseInt(document.getElementById('itemLevel').value), icon: 'shop-icon',
            icon_row: parseInt(document.getElementById('iconRow').value), icon_col: parseInt(document.getElementById('iconCol').value),
            stats: collectStats('default'), description: itemDescription
        };
        if (currentId) item.id = currentId; await saveDemon(item);
    }
    else if (currentType === 'totems') {
        const itemName = document.getElementById('itemName').value.trim();
        const itemDescription = document.getElementById('description') ? document.getElementById('description').value.trim() : '';
        if (!itemName) { alert('❌ Введите название!'); return; }
        const isDuplicate = await checkDuplicateGeneric(itemName, currentId, getTotems);
        if (isDuplicate) { alert(`❌ Ошибка! Тотем "${itemName}" уже существует!`); return; }
        item = {
            name: itemName, level: parseInt(document.getElementById('itemLevel').value),
            required_level: parseInt(document.getElementById('requiredLevel').value), icon: 'shop-icon',
            icon_row: parseInt(document.getElementById('iconRow').value), icon_col: parseInt(document.getElementById('iconCol').value),
            stats: collectStats('default'), description: itemDescription
        };
        if (currentId) item.id = currentId; await saveTotem(item);
    }
    else if (currentType === 'master') {
        const itemName = document.getElementById('itemName').value.trim();
        const itemDescription = document.getElementById('description') ? document.getElementById('description').value.trim() : '';
        if (!itemName) { alert('❌ Введите название!'); return; }
        const isDuplicate = await checkDuplicateGeneric(itemName, currentId, getMasterRunes);
        if (isDuplicate) { alert(`❌ Ошибка! Руна мастера "${itemName}" уже существует!`); return; }
        item = {
            name: itemName, level: parseInt(document.getElementById('itemLevel').value), icon: 'shop-icon',
            icon_row: parseInt(document.getElementById('iconRow').value), icon_col: parseInt(document.getElementById('iconCol').value),
            stats: collectStats('default'), description: itemDescription
        };
        if (currentId) item.id = currentId; await saveMasterRune(item);
    }
    else if (currentType === 'druids') {
        const itemName = document.getElementById('itemName').value.trim();
        const itemDescription = document.getElementById('description') ? document.getElementById('description').value.trim() : '';
        if (!itemName) { alert('❌ Введите название!'); return; }
        const isDuplicate = await checkDuplicateGeneric(itemName, currentId, getDruidsRunes);
        if (isDuplicate) { alert(`❌ Ошибка! Руна друидов "${itemName}" уже существует!`); return; }
        item = {
            name: itemName, level: parseInt(document.getElementById('itemLevel').value), icon: 'shop-icon',
            icon_row: parseInt(document.getElementById('iconRow').value), icon_col: parseInt(document.getElementById('iconCol').value),
            stats: collectStats('default'), description: itemDescription
        };
        if (currentId) item.id = currentId; await saveDruidsRune(item);
    }
    else if (currentType === 'nakolki') {
        const itemName = document.getElementById('itemName').value.trim();
        const itemDescription = document.getElementById('description') ? document.getElementById('description').value.trim() : '';
        if (!itemName) { alert('❌ Введите название!'); return; }
        const isDuplicate = await checkDuplicateGeneric(itemName, currentId, getNakolki);
        if (isDuplicate) { alert(`❌ Ошибка! Квестовая руна "${itemName}" уже существует!`); return; }
        item = {
            name: itemName, level: parseInt(document.getElementById('itemLevel').value), icon: 'shop-icon',
            icon_row: parseInt(document.getElementById('iconRow').value), icon_col: parseInt(document.getElementById('iconCol').value),
            stats: collectStats('default'), description: itemDescription
        };
        if (currentId) item.id = currentId; await saveNakolki(item);
    }
    else if (currentType === 'news') {
        const newsTitle = document.getElementById('newsTitle').value.trim();
        if (!newsTitle) { alert('❌ Введите заголовок новости!'); return; }
        const allNews = await getNews();
        const isDuplicate = allNews.find(n => n.title.toLowerCase() === newsTitle.toLowerCase() && (currentId === null || n.id !== currentId));
        if (isDuplicate) { alert(`❌ Ошибка! Новость с заголовком "${newsTitle}" уже существует!`); return; }
        item = {
            title: newsTitle, content: document.getElementById('newsContent').value,
            footer: document.getElementById('newsFooter').value, date: document.getElementById('newsDate').value,
            category: document.getElementById('newsCategory').value
        };
        if (currentId) item.id = currentId; await saveNewsItem(item);
    }

    closeModal();
    loadTable(currentType);
    alert('✅ Сохранено!');
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    currentId = null;
}

// Запуск
loadTable('items');
document.addEventListener('DOMContentLoaded', displayAdminPanel);

// ==================== ПРЕДОТВРАЩАЕМ ОТПРАВКУ ПО ENTER В TEXTAREA ====================
document.addEventListener('DOMContentLoaded', function() {
    // Находим все textarea внутри модалки и добавляем обработчик
    const modalFields = document.getElementById('modalFields');
    if (modalFields) {
        modalFields.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.tagName === 'TEXTAREA') {
                // Если нажат Enter в textarea - ничего не делаем, просто новая строка
                e.stopPropagation();
                return true;
            }
        });
    }
    
    // Также отлавливаем Enter на всей модалке, но только если не textarea
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                // Если Enter нажат не в textarea - сохраняем
                const saveBtn = document.querySelector('#editModal .modal-buttons .cat-btn:first-child');
                if (saveBtn && saveBtn.onclick) {
                    e.preventDefault();
                    saveBtn.click();
                }
            }
        });
    }
});

// Блокируем отправку по Enter из textarea (глобальный перехват)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName === 'TEXTAREA') {
        e.stopPropagation();
    }
}, true);