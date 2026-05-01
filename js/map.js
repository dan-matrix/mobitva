// ==================== КАРТА (map.js) ====================
let mapLocations = [];
let mapConnections = [];
let isMapAdmin = false;
let editMode = false;
let currentLocationId = null;
let dragTarget = null;
let dragOffsetX = 0, dragOffsetY = 0;

let isDraggingMap = false;
let mapDragStartX = 0, mapDragStartY = 0;
let mapScrollLeft = 0, mapScrollTop = 0;

let currentZoom = 1;
const minZoom = 0.888;
const maxZoom = 1.5;
const zoomStep = 0.035;

const CANVAS_WIDTH = 1484;
const CANVAS_HEIGHT = 1060;

let currentBg = localStorage.getItem('map_bg') || 'bg-grid';

// ==================== ЗАГРУЗКА ====================
async function loadMapData() {
    [mapLocations, mapConnections] = await Promise.all([
        getMapLocations(),
        getMapConnections()
    ]);
    // Синхронизируем: если у локации есть neighbors — строим connections из них
    // Если нет — берём из map_connections
    renderMap();
    addAdminButton();
}

// ==================== HELPERS: NEIGHBORS ====================

// Получить массив ID соседей локации (из поля neighbors или map_connections)
function getNeighborIds(loc) {
    if (loc.neighbors && loc.neighbors.trim()) {
        return loc.neighbors.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n > 0);
    }
    // Fallback: из map_connections
    const ids = new Set();
    mapConnections.forEach(c => {
        if (c.from_id == loc.id) ids.add(c.to_id);
        if (c.to_id == loc.id) ids.add(c.from_id);
    });
    return [...ids];
}

// Построить список уникальных пар соседей для отрисовки линий
function buildConnectionPairs() {
    const pairs = new Map(); // ключ: "min_max", значение: {a, b, color}
    mapLocations.forEach(loc => {
        const neighborIds = getNeighborIds(loc);
        neighborIds.forEach(nid => {
            const a = Math.min(loc.id, nid);
            const b = Math.max(loc.id, nid);
            const key = `${a}_${b}`;
            if (!pairs.has(key)) {
                // Ищем цвет в map_connections если есть
                const conn = mapConnections.find(c =>
                    (c.from_id == a && c.to_id == b) ||
                    (c.from_id == b && c.to_id == a)
                );
                pairs.set(key, {
                    a: mapLocations.find(l => l.id == a),
                    b: mapLocations.find(l => l.id == b),
                    color: conn ? conn.color : '#8a7a40'
                });
            }
        });
    });
    return [...pairs.values()];
}

// ==================== РЕНДЕР ====================
function renderMap() {
    const canvas = document.getElementById('mapCanvas');
    if (!canvas) return;
    canvas.innerHTML = '';
    canvas.className = currentBg;
    canvas.style.width = (CANVAS_WIDTH * currentZoom) + 'px';
    canvas.style.height = (CANVAS_HEIGHT * currentZoom) + 'px';

    // SVG тропы
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.classList.add('map-svg');

    const pairs = buildConnectionPairs();
    pairs.forEach(({ a, b, color }) => {
        if (!a || !b) return;
        const x1 = a.x * currentZoom, y1 = a.y * currentZoom;
        const x2 = b.x * currentZoom, y2 = b.y * currentZoom;
        const mx = (x1 + x2) / 2 + (y2 - y1) * 0.04;
        const my = (y1 + y2) / 2 + (x1 - x2) * 0.04;

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", `M${x1},${y1} Q${mx},${my} ${x2},${y2}`);
        path.setAttribute("stroke", color);
        path.setAttribute("stroke-width", "2.5");
        path.setAttribute("stroke-dasharray", "7 4");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("opacity", currentBg === 'bg-parchment' ? "0.55" : "0.85");
        path.classList.add('conn-line');
        svg.appendChild(path);
    });
    canvas.appendChild(svg);

    // Точки локаций
    mapLocations.forEach(loc => {
        const node = document.createElement('div');
        node.className = 'location-node' + (editMode ? ' editable' : '');
        node.style.left = (loc.x * currentZoom) + 'px';
        node.style.top = (loc.y * currentZoom) + 'px';
        node.setAttribute('data-id', loc.id);

        const colorClass = loc.color === 'red' ? 'red' : loc.color === 'yellow' ? 'yellow' : 'green';

        node.innerHTML = `
            <div class="loc-pin ${colorClass}"></div>
            <div class="loc-label">${escapeHtml(loc.name)}</div>
        `;

        if (editMode) node.addEventListener('mousedown', startDrag);
        node.addEventListener('click', e => { e.stopPropagation(); openLocationModal(loc); });
        canvas.appendChild(node);
    });
}

// ==================== ПЕРЕКЛЮЧАТЕЛЬ ФОНА ====================
function setBg(bgClass) {
    currentBg = bgClass;
    localStorage.setItem('map_bg', bgClass);
    renderMap();
}

function addBgSwitcher(panel) {
    if (document.getElementById('bgSwitcher')) return;
    const switcher = document.createElement('div');
    switcher.id = 'bgSwitcher';
    switcher.className = 'bg-switcher';
    switcher.innerHTML = `
        <label>🎨 Фон:</label>
        <select id="bgSelect">
            <option value="bg-grid">Тёмная сетка</option>
            <option value="bg-parchment">Пергамент</option>
            <option value="bg-image">Картинка (mapfon.png)</option>
        </select>
    `;
    panel.insertBefore(switcher, panel.firstChild);
    const sel = document.getElementById('bgSelect');
    sel.value = currentBg;
    sel.addEventListener('change', () => setBg(sel.value));
}

// ==================== КНОПКИ АДМИНА ====================
function addAdminButton() {
    const panel = document.getElementById('editorPanel');
    if (!panel) return;
    const user = checkAuth();
    isMapAdmin = user && user.role === 'admin';

    if (isMapAdmin) addBgSwitcher(panel);

    if (isMapAdmin && !document.getElementById('editModeBtn')) {
        const editModeBtn = document.createElement('button');
        editModeBtn.id = 'editModeBtn';
        editModeBtn.textContent = '✏️ Режим редактирования';
        editModeBtn.className = 'cat-btn';
        editModeBtn.onclick = toggleEditMode;
        panel.appendChild(editModeBtn);

        const addLocBtn = document.createElement('button');
        addLocBtn.id = 'addLocBtn';
        addLocBtn.textContent = '➕ Добавить локацию';
        addLocBtn.className = 'admin-only cat-btn';
        addLocBtn.style.display = 'none';
        addLocBtn.onclick = openAddLocationModal;
        panel.appendChild(addLocBtn);

        const saveMapBtn = document.createElement('button');
        saveMapBtn.id = 'saveMapBtn';
        saveMapBtn.textContent = '💾 Сохранить позиции';
        saveMapBtn.className = 'admin-only cat-btn';
        saveMapBtn.style.display = 'none';
        saveMapBtn.onclick = saveAllMap;
        panel.appendChild(saveMapBtn);

        const manageMobsBtn = document.createElement('button');
        manageMobsBtn.id = 'manageMobsBtn';
        manageMobsBtn.textContent = '🦇 Мобы';
        manageMobsBtn.className = 'admin-only cat-btn';
        manageMobsBtn.style.display = 'none';
        manageMobsBtn.onclick = () => { window.location.href = 'admin-map.html'; };
        panel.appendChild(manageMobsBtn);
    }
}

// ==================== DRAG КАРТЫ ====================
function initMapDrag() {
    const wrapper = document.getElementById('canvasWrapper');
    if (!wrapper) return;
    wrapper.addEventListener('mousedown', e => {
        if (editMode && e.target.closest('.location-node')) return;
        isDraggingMap = true;
        mapDragStartX = e.clientX; mapDragStartY = e.clientY;
        mapScrollLeft = wrapper.scrollLeft; mapScrollTop = wrapper.scrollTop;
        wrapper.classList.add('dragging');
        e.preventDefault();
    });
    window.addEventListener('mousemove', e => {
        if (!isDraggingMap) return;
        wrapper.scrollLeft = mapScrollLeft - (e.clientX - mapDragStartX);
        wrapper.scrollTop = mapScrollTop - (e.clientY - mapDragStartY);
    });
    window.addEventListener('mouseup', () => {
        isDraggingMap = false;
        document.getElementById('canvasWrapper')?.classList.remove('dragging');
    });
}

// ==================== ЗУМ ====================
function initZoom() {
    const wrapper = document.getElementById('canvasWrapper');
    const zoomLevelSpan = document.getElementById('zoomLevel');

    function updateLabel() { zoomLevelSpan.textContent = Math.round(currentZoom * 100) + '%'; }

    function zoom(delta) {
        const newZoom = Math.min(maxZoom, Math.max(minZoom, currentZoom + delta));
        if (newZoom === currentZoom) return;
        const cx = wrapper.scrollLeft + wrapper.clientWidth / 2;
        const cy = wrapper.scrollTop + wrapper.clientHeight / 2;
        const rx = cx / (CANVAS_WIDTH * currentZoom);
        const ry = cy / (CANVAS_HEIGHT * currentZoom);
        currentZoom = newZoom;
        renderMap();
        wrapper.scrollLeft = rx * CANVAS_WIDTH * currentZoom - wrapper.clientWidth / 2;
        wrapper.scrollTop = ry * CANVAS_HEIGHT * currentZoom - wrapper.clientHeight / 2;
        updateLabel();
    }

    document.getElementById('zoomInBtn')?.addEventListener('click', () => zoom(zoomStep));
    document.getElementById('zoomOutBtn')?.addEventListener('click', () => zoom(-zoomStep));
    wrapper.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? -zoomStep : zoomStep); }, { passive: false });
    updateLabel();
}

// ==================== DRAG ЛОКАЦИЙ ====================
function startDrag(e) {
    if (!editMode) return;
    const node = e.target.closest('.location-node');
    if (!node) return;
    e.stopPropagation();
    dragTarget = node;
    const rect = node.getBoundingClientRect();
    dragOffsetX = (e.clientX - rect.left) / currentZoom;
    dragOffsetY = (e.clientY - rect.top) / currentZoom;
    node.classList.add('dragging');
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault();
}

function onDrag(e) {
    if (!dragTarget) return;
    const wrapper = document.getElementById('canvasWrapper');
    const wr = wrapper.getBoundingClientRect();
    let nx = (e.clientX - wr.left + wrapper.scrollLeft) / currentZoom - dragOffsetX;
    let ny = (e.clientY - wr.top + wrapper.scrollTop) / currentZoom - dragOffsetY;
    nx = Math.max(0, Math.min(nx, CANVAS_WIDTH));
    ny = Math.max(0, Math.min(ny, CANVAS_HEIGHT));

    dragTarget.style.left = (nx * currentZoom) + 'px';
    dragTarget.style.top = (ny * currentZoom) + 'px';

    const id = parseInt(dragTarget.getAttribute('data-id'));
    const loc = mapLocations.find(l => l.id === id);
    if (loc) {
        loc.x = nx; loc.y = ny;
        // Перерисовываем только SVG тропы
        redrawSvgOnly();
    }
}

function redrawSvgOnly() {
    const canvas = document.getElementById('mapCanvas');
    const svgNS = "http://www.w3.org/2000/svg";
    const newSvg = document.createElementNS(svgNS, "svg");
    newSvg.classList.add('map-svg');
    const pairs = buildConnectionPairs();
    pairs.forEach(({ a, b, color }) => {
        if (!a || !b) return;
        const x1 = a.x * currentZoom, y1 = a.y * currentZoom;
        const x2 = b.x * currentZoom, y2 = b.y * currentZoom;
        const mx = (x1 + x2) / 2 + (y2 - y1) * 0.04;
        const my = (y1 + y2) / 2 + (x1 - x2) * 0.04;
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", `M${x1},${y1} Q${mx},${my} ${x2},${y2}`);
        path.setAttribute("stroke", color);
        path.setAttribute("stroke-width", "2.5");
        path.setAttribute("stroke-dasharray", "7 4");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("opacity", "0.85");
        path.classList.add('conn-line');
        newSvg.appendChild(path);
    });
    canvas.querySelector('svg.map-svg')?.replaceWith(newSvg);
}

function stopDrag() {
    dragTarget?.classList.remove('dragging');
    dragTarget = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// ==================== МОДАЛКА ЛОКАЦИИ (просмотр) ====================
async function openLocationModal(loc) {
    if (!loc) return;
    currentLocationId = loc.id;

    const mobs = await getLocationMobs(loc.id);
    let mobsHtml = '';
    if (mobs?.length > 0) {
        mobsHtml = '<div class="location-mobs-section"><div class="location-mobs-title">🦇 Мобы:</div><div class="location-mobs-grid">';
        mobs.forEach(mob => {
            mobsHtml += `<div class="location-mob-card" onclick="event.stopPropagation();viewMobInfo(${mob.id})">
                <div class="icon-from-icons" style="--row:${mob.icon_row||0};--col:${mob.icon_col||0};width:28px;height:28px;margin:0 auto 4px;"></div>
                <div class="location-mob-name">${escapeHtml(mob.name)}</div>
                <div class="location-mob-level">⭐ ${mob.level}</div>
            </div>`;
        });
        mobsHtml += '</div></div>';
    } else {
        mobsHtml = '<div class="location-mobs-empty">📭 Нет мобов</div>';
    }

    // Соседи
    const neighborIds = getNeighborIds(loc);
    let neighborsHtml = '';
    if (neighborIds.length > 0) {
        const names = neighborIds.map(id => {
            const n = mapLocations.find(l => l.id == id);
            return n ? `<span onclick="event.stopPropagation();jumpToLocation(${n.id})" style="cursor:pointer;color:#ffaa44;text-decoration:underline;">${escapeHtml(n.name)}</span>` : `#${id}`;
        }).join(', ');
        neighborsHtml = `<div style="margin-bottom:12px;font-size:12px;color:#a0a0a0;">🔗 Соседи: ${names}</div>`;
    }

    const typeMap = { green: '🟢 Безопасная', yellow: '🟡 Магазин', red: '🔴 Опасная' };

    const modal = document.getElementById('locationModal');
    modal.innerHTML = `
        <div class="location-modal-content">
            <div class="location-modal-header">
                <div class="location-modal-close" onclick="closeLocationModal()">✕</div>
                <div class="icon-from-icons" style="--row:${loc.icon_row||3};--col:${loc.icon_col||10};width:28px;height:28px;margin:0 auto;"></div>
                <div class="location-modal-title">${escapeHtml(loc.name)}</div>
                <div class="location-modal-type">${typeMap[loc.color] || ''}</div>
                ${editMode ? `<button class="location-modal-btn edit-location-btn" onclick="openEditLocationModal(${loc.id})" style="margin-top:8px;">✏️ Редактировать</button>` : ''}
            </div>
            <div class="location-modal-body">
                ${neighborsHtml}
                <div class="location-modal-description">${escapeHtml(loc.description || 'Описание отсутствует')}</div>
                ${mobsHtml}
            </div>
            <div class="location-modal-footer">
                <button class="location-modal-btn" onclick="closeLocationModal()">Закрыть</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLocationModal() {
    document.getElementById('locationModal').style.display = 'none';
    document.body.style.overflow = '';
    currentLocationId = null;
}

function jumpToLocation(locId) {
    closeLocationModal();
    setTimeout(() => centerMapOnLocation(locId), 100);
}

async function viewMobInfo(mobId) {
    const mob = await getLocationMobById(mobId);
    if (!mob) return;
    alert(`🦇 ${mob.name}\n⭐ Уровень: ${mob.level}${mob.description ? '\n' + mob.description : ''}`);
}

// ==================== МОДАЛКА РЕДАКТИРОВАНИЯ ЛОКАЦИИ ====================
async function openEditLocationModal(locId) {
    const loc = mapLocations.find(l => l.id === locId);
    if (!loc) return;

    document.getElementById('editLocId').value = loc.id;
    document.getElementById('editLocName').value = loc.name;
    document.getElementById('editLocColor').value = loc.color || 'green';
    document.getElementById('editLocIconRow').value = loc.icon_row || 3;
    document.getElementById('editLocIconCol').value = loc.icon_col || 10;
    document.getElementById('editLocDescription').value = loc.description || '';
    document.getElementById('editLocIconPreview').innerHTML = `✅ Ряд ${(loc.icon_row||3)+1}, колонка ${(loc.icon_col||10)+1}`;

    // Строим чекбоксы соседей
    renderNeighborCheckboxes(locId, getNeighborIds(loc));

    document.getElementById('editLocationModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function renderNeighborCheckboxes(currentLocId, selectedIds) {
    const container = document.getElementById('editNeighborsList');
    if (!container) return;

    const selectedSet = new Set(selectedIds.map(Number));
    container.innerHTML = mapLocations
        .filter(l => l.id !== currentLocId)
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        .map(l => `
            <label class="connection-checkbox">
                <input type="checkbox" value="${l.id}" ${selectedSet.has(l.id) ? 'checked' : ''}>
                <span>${escapeHtml(l.name)} <small style="color:#888;">(ID: ${l.id})</small></span>
            </label>
        `).join('');
}

function closeEditLocationModal() {
    document.getElementById('editLocationModal').style.display = 'none';
    document.body.style.overflow = '';
}

async function saveEditLocation() {
    const locId = parseInt(document.getElementById('editLocId').value);
    const name = document.getElementById('editLocName').value.trim();
    if (!name) { alert('Введите название!'); return; }

    // Собираем соседей из чекбоксов
    const checked = document.querySelectorAll('#editNeighborsList input:checked');
    const neighborIds = [...checked].map(cb => parseInt(cb.value));
    const neighborsStr = neighborIds.join(',');

    const existing = mapLocations.find(l => l.id === locId);
    const updatedLoc = {
        id: locId, name,
        color: document.getElementById('editLocColor').value,
        icon_row: parseInt(document.getElementById('editLocIconRow').value),
        icon_col: parseInt(document.getElementById('editLocIconCol').value),
        description: document.getElementById('editLocDescription').value,
        x: existing.x, y: existing.y,
        level: existing.level || 1,
        neighbors: neighborsStr
    };

    const result = await saveMapLocation(updatedLoc);
    if (!result) { alert('❌ Ошибка при сохранении!'); return; }

    // Синхронизируем map_connections
    await syncConnectionsFromNeighbors(locId, neighborIds);

    await loadMapData();
    closeEditLocationModal();
    closeLocationModal();
    alert('✅ Локация обновлена!');
}

// Синхронизация map_connections из neighbors
async function syncConnectionsFromNeighbors(locId, newNeighborIds) {
    // Удаляем старые connections этой локации
    await deleteMapConnectionsByLocationId(locId);

    // Создаём новые
    for (const nid of newNeighborIds) {
        // Проверяем нет ли уже обратной связи
        const existing = mapConnections.find(c =>
            (c.from_id == locId && c.to_id == nid) ||
            (c.from_id == nid && c.to_id == locId)
        );
        if (!existing) {
            await saveMapConnection({ from_id: locId, to_id: nid, color: '#8a7a40' });
        }
    }

    // Обновляем neighbors у соседей тоже (двусторонняя связь)
    for (const nid of newNeighborIds) {
        const neighbor = mapLocations.find(l => l.id == nid);
        if (!neighbor) continue;
        const neighborNeighbors = getNeighborIds(neighbor);
        if (!neighborNeighbors.includes(locId)) {
            neighborNeighbors.push(locId);
            const updatedNeighbor = { ...neighbor, neighbors: neighborNeighbors.join(',') };
            await saveMapLocation(updatedNeighbor);
        }
    }
}

async function deleteCurrentLocation() {
    const locId = parseInt(document.getElementById('editLocId').value);
    if (!confirm('Удалить локацию и все её тропы и мобов?')) return;

    // Убираем эту локацию из neighbors соседей
    const loc = mapLocations.find(l => l.id === locId);
    if (loc) {
        const neighborIds = getNeighborIds(loc);
        for (const nid of neighborIds) {
            const neighbor = mapLocations.find(l => l.id == nid);
            if (!neighbor) continue;
            const filtered = getNeighborIds(neighbor).filter(id => id !== locId);
            await saveMapLocation({ ...neighbor, neighbors: filtered.join(',') });
        }
    }

    await deleteMapConnectionsByLocationId(locId);
    await deleteLocationMobsByLocationId(locId);
    await deleteMapLocation(locId);
    await loadMapData();
    closeEditLocationModal();
    closeLocationModal();
    alert('🗑️ Локация удалена');
}

// ==================== МОДАЛКА ДОБАВЛЕНИЯ ЛОКАЦИИ ====================
function openAddLocationModal() {
    if (!editMode) return;
    renderNeighborCheckboxesForNew();
    document.getElementById('addLocationModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function renderNeighborCheckboxesForNew() {
    const container = document.getElementById('connectionsList');
    if (!container) return;
    container.innerHTML = mapLocations
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        .map(l => `
            <label class="connection-checkbox">
                <input type="checkbox" value="${l.id}">
                <span>${escapeHtml(l.name)} <small style="color:#888;">(ID: ${l.id})</small></span>
            </label>
        `).join('');
}

function closeAddLocationModal() {
    document.getElementById('addLocationModal').style.display = 'none';
    document.body.style.overflow = '';
    document.getElementById('newLocName').value = '';
    document.getElementById('newLocColor').value = 'green';
    document.getElementById('newLocDescription').value = '';
}

async function saveNewLocation() {
    if (!editMode) return;
    const name = document.getElementById('newLocName').value.trim();
    if (!name) { alert('Введите название!'); return; }

    const checkboxes = document.querySelectorAll('#connectionsList input:checked');
    const neighborIds = [...checkboxes].map(cb => parseInt(cb.value));

    // Позиционируем рядом с первым соседом
    let targetX = 1000, targetY = 500;
    if (neighborIds.length > 0) {
        const near = mapLocations.find(l => l.id === neighborIds[0]);
        if (near) { targetX = near.x + 200; targetY = near.y + 100; }
    }

    const newLoc = {
        name,
        color: document.getElementById('newLocColor').value,
        icon_row: parseInt(document.getElementById('newLocIconRow').value) || 3,
        icon_col: parseInt(document.getElementById('newLocIconCol').value) || 10,
        description: document.getElementById('newLocDescription').value,
        x: targetX, y: targetY, level: 1,
        neighbors: neighborIds.join(',')
    };

    const result = await saveMapLocation(newLoc);
    if (!result) { alert('❌ Ошибка!'); return; }

    const newId = result[0]?.id || result.id;

    // Создаём connections и обновляем neighbors соседей
    for (const nid of neighborIds) {
        await saveMapConnection({ from_id: newId, to_id: nid, color: '#8a7a40' });
        const neighbor = mapLocations.find(l => l.id == nid);
        if (neighbor) {
            const nn = getNeighborIds(neighbor);
            if (!nn.includes(newId)) {
                await saveMapLocation({ ...neighbor, neighbors: [...nn, newId].join(',') });
            }
        }
    }

    await loadMapData();
    closeAddLocationModal();
    setTimeout(() => centerMapOnLocation(newId), 200);
    alert('✅ Локация добавлена!');
}

// ==================== РЕЖИМ РЕДАКТИРОВАНИЯ ====================
function toggleEditMode() {
    editMode = !editMode;
    const editModeBtn = document.getElementById('editModeBtn');
    const adminBtns = document.querySelectorAll('.admin-only');

    if (editMode) {
        editModeBtn.textContent = '🔒 Выйти из редактирования';
        adminBtns.forEach(b => b.style.display = 'inline-block');
        updateStatus('✏️ Перемещай точки, нажми на локацию чтобы редактировать тропы');
    } else {
        editModeBtn.textContent = '✏️ Режим редактирования';
        adminBtns.forEach(b => b.style.display = 'none');
        updateStatus('⚡ Нажми на локацию для просмотра');
    }
    renderMap();
}

// ==================== ЦЕНТРИРОВАНИЕ ====================
function centerMapOnLocation(locIdOrName) {
    let loc = typeof locIdOrName === 'number'
        ? mapLocations.find(l => l.id === locIdOrName)
        : mapLocations.find(l => l.name.toLowerCase() === locIdOrName.toLowerCase());
    if (!loc) return false;
    const wrapper = document.getElementById('canvasWrapper');
    wrapper.scrollLeft = loc.x * currentZoom - wrapper.clientWidth / 2;
    wrapper.scrollTop = loc.y * currentZoom - wrapper.clientHeight / 2;
    return true;
}

function centerMapFromUrl() {
    const p = new URLSearchParams(window.location.search);
    const idParam = p.get('location') || p.get('id');
    const nameParam = p.get('name');

    let loc = null;
    if (idParam) loc = mapLocations.find(l => l.id == parseInt(idParam));
    if (!loc && nameParam) loc = mapLocations.find(l => l.name.toLowerCase() === nameParam.toLowerCase());
    if (!loc && mapLocations.length > 0) {
        loc = mapLocations.find(l => l.name.toLowerCase().includes('ярмарка')) || mapLocations[0];
    }
    if (loc) setTimeout(() => centerMapOnLocation(loc.id), 150);
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ====================
async function saveAllMap() {
    if (!editMode) return;
    let saved = 0;
    for (const loc of mapLocations) {
        const result = await saveMapLocation(loc);
        if (result) saved++;
    }
    updateStatus(`💾 Сохранено ${saved} локаций`);
    alert(`✅ Сохранено ${saved} локаций!`);
}

function updateStatus(msg) {
    const s = document.getElementById('statusMsg');
    if (s) s.textContent = msg;
    setTimeout(() => {
        if (s) s.textContent = editMode ? '✏️ Режим редактирования' : '⚡ Нажми на локацию для просмотра';
    }, 3000);
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
async function initMap() {
    await loadMapData();
    initMapDrag();
    initZoom();

    document.getElementById('saveNewLocationBtn')?.addEventListener('click', saveNewLocation);
    document.getElementById('saveEditLocationBtn')?.addEventListener('click', saveEditLocation);
    document.getElementById('deleteLocationBtn')?.addEventListener('click', deleteCurrentLocation);

    document.getElementById('selectLocIconBtn')?.addEventListener('click', () => {
        if (typeof showIconPickerIcons !== 'undefined') {
            showIconPickerIcons((row, col) => {
                document.getElementById('newLocIconRow').value = row;
                document.getElementById('newLocIconCol').value = col;
                document.getElementById('locIconPreview').innerHTML = `✅ Ряд ${row+1}, колонка ${col+1}`;
            }, document.getElementById('selectLocIconBtn'), { title: 'Иконка локации' });
        }
    });

    document.getElementById('editSelectLocIconBtn')?.addEventListener('click', () => {
        if (typeof showIconPickerIcons !== 'undefined') {
            showIconPickerIcons((row, col) => {
                document.getElementById('editLocIconRow').value = row;
                document.getElementById('editLocIconCol').value = col;
                document.getElementById('editLocIconPreview').innerHTML = `✅ Ряд ${row+1}, колонка ${col+1}`;
            }, document.getElementById('editSelectLocIconBtn'), { title: 'Иконка локации' });
        }
    });

    centerMapFromUrl();
}

initMap();
document.addEventListener('DOMContentLoaded', displayAdminPanel);