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
const minZoom = 0.5;
const maxZoom = 2;
const zoomStep = 0.1;

async function loadMapData() {
    mapLocations = await getMapLocations();
    mapConnections = await getMapConnections();
    renderMap();
    updateConnectionSelects();
    addAdminButton();
}

function renderMap() {
    const canvas = document.getElementById('mapCanvas');
    if(!canvas) return;
    canvas.innerHTML = '';
    
    // Размер канваса НЕ меняется при зуме
    canvas.style.width = '2000px';
    canvas.style.height = '1500px';
    
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '5';
    
    for (let conn of mapConnections) {
        const fromLoc = mapLocations.find(l => l.id == conn.from_id);
        const toLoc = mapLocations.find(l => l.id == conn.to_id);
        if (!fromLoc || !toLoc) continue;
        
        const x1 = (fromLoc.x + 50) * currentZoom;
        const y1 = (fromLoc.y + 50) * currentZoom;
        const x2 = (toLoc.x + 50) * currentZoom;
        const y2 = (toLoc.y + 50) * currentZoom;
        
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", conn.color || "#8a7a40");
        line.setAttribute("stroke-width", 3);
        line.setAttribute("stroke-dasharray", "6 4");
        line.style.pointerEvents = "stroke";
        line.style.cursor = "pointer";
        
        if(editMode) {
            line.addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm('Удалить эту тропу?')) {
                    deleteMapConnection(conn.id).then(() => loadMapData());
                }
            });
        }
        svg.appendChild(line);
    }
    canvas.appendChild(svg);
    
    for (let loc of mapLocations) {
        const node = document.createElement('div');
        node.className = 'location-node';
        if(editMode) node.classList.add('editable');
        node.style.left = (loc.x * currentZoom) + 'px';
        node.style.top = (loc.y * currentZoom) + 'px';
        node.style.width = (100 * currentZoom) + 'px';
        node.style.height = (100 * currentZoom) + 'px';
        node.setAttribute('data-id', loc.id);
        
        let borderColor = '#44ff88';
        let typeClass = 'safe';
        if (loc.color === 'yellow') {
            borderColor = '#c7ba00';
            typeClass = 'market';
        } else if (loc.color === 'red') {
            borderColor = '#ff4444';
            typeClass = 'danger';
        }
        node.style.borderColor = borderColor;
        node.classList.add(typeClass);
        
        const iconSize = 28 * currentZoom;
        const iconMargin = 4 * currentZoom;
        const nameSize = 11 * currentZoom;
        
        node.innerHTML = `
            <div class="icon-from-icons" style="--row:${loc.icon_row || 3}; --col:${loc.icon_col || 10}; width:${iconSize}px; height:${iconSize}px; margin-bottom:${iconMargin}px;"></div>
            <div class="location-name" style="font-size:${nameSize}px;">${escapeHtml(loc.name)}</div>
        `;
        
        if(editMode) {
            node.addEventListener('mousedown', startDrag);
        }
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            openLocationModal(loc);
        });
        canvas.appendChild(node);
    }
}

function updateConnectionSelects() {
    const fromSelect = document.getElementById('newConnFrom');
    const toSelect = document.getElementById('newConnTo');
    const connectionsListDiv = document.getElementById('connectionsList');
    
    if(fromSelect) {
        fromSelect.innerHTML = '<option value="">-- Выберите --</option>';
        for(let loc of mapLocations) {
            fromSelect.innerHTML += `<option value="${loc.id}">${escapeHtml(loc.name)} (ID:${loc.id})</option>`;
        }
    }
    if(toSelect) {
        toSelect.innerHTML = '<option value="">-- Выберите --</option>';
        for(let loc of mapLocations) {
            toSelect.innerHTML += `<option value="${loc.id}">${escapeHtml(loc.name)} (ID:${loc.id})</option>`;
        }
    }
    if(connectionsListDiv) {
        let html = '';
        for(let loc of mapLocations) {
            html += `
                <label class="connection-checkbox">
                    <input type="checkbox" value="${loc.id}">
                    <span>${escapeHtml(loc.name)}</span>
                </label>
            `;
        }
        connectionsListDiv.innerHTML = html || '<div style="padding:10px;text-align:center;">Нет других локаций</div>';
    }
}

// ==================== КНОПКА ДЛЯ АДМИНА ====================
function addAdminButton() {
    const panel = document.getElementById('editorPanel');
    if(!panel) return;
    
    const user = checkAuth();
    isMapAdmin = user && user.role === 'admin';
    
    if(isMapAdmin && !document.getElementById('editModeBtn')) {
        const editModeBtn = document.createElement('button');
        editModeBtn.id = 'editModeBtn';
        editModeBtn.textContent = '✏️ Режим редактирования';
        editModeBtn.className = 'cat-btn';
        editModeBtn.style.marginRight = 'auto';
        editModeBtn.onclick = toggleEditMode;
        panel.insertBefore(editModeBtn, panel.firstChild);
        
        const addElementBtn = document.createElement('button');
        addElementBtn.id = 'addElementBtn';
        addElementBtn.textContent = '➕ Добавить элемент';
        addElementBtn.className = 'admin-only cat-btn';
        addElementBtn.style.display = 'none';
        addElementBtn.onclick = openChoiceModal;
        panel.appendChild(addElementBtn);
        
        const saveMapBtn = document.createElement('button');
        saveMapBtn.id = 'saveMapBtn';
        saveMapBtn.textContent = '💾 Сохранить карту';
        saveMapBtn.className = 'admin-only cat-btn';
        saveMapBtn.style.display = 'none';
        saveMapBtn.onclick = saveAllMap;
        panel.appendChild(saveMapBtn);
        
        const manageMobsBtn = document.createElement('button');
        manageMobsBtn.id = 'manageMobsBtn';
        manageMobsBtn.textContent = '🦇 Управление мобами';
        manageMobsBtn.className = 'admin-only cat-btn';
        manageMobsBtn.style.display = 'none';
        manageMobsBtn.onclick = () => {
            window.location.href = 'admin-map.html';
        };
        panel.appendChild(manageMobsBtn);
        
        window.addElementBtn = addElementBtn;
        window.saveMapBtn = saveMapBtn;
        window.manageMobsBtn = manageMobsBtn;
    }
}

// ==================== ПЕРЕТАСКИВАНИЕ КАРТЫ ====================
function initMapDrag() {
    const wrapper = document.getElementById('canvasWrapper');
    if(!wrapper) return;
    
    wrapper.addEventListener('mousedown', (e) => {
        if(editMode && e.target.closest('.location-node')) return;
        isDraggingMap = true;
        mapDragStartX = e.clientX;
        mapDragStartY = e.clientY;
        mapScrollLeft = wrapper.scrollLeft;
        mapScrollTop = wrapper.scrollTop;
        wrapper.classList.add('dragging');
        e.preventDefault();
    });
    
    window.addEventListener('mousemove', (e) => {
        if(!isDraggingMap) return;
        const dx = e.clientX - mapDragStartX;
        const dy = e.clientY - mapDragStartY;
        wrapper.scrollLeft = mapScrollLeft - dx;
        wrapper.scrollTop = mapScrollTop - dy;
    });
    
    window.addEventListener('mouseup', () => {
        isDraggingMap = false;
        const wrapper = document.getElementById('canvasWrapper');
        if(wrapper) wrapper.classList.remove('dragging');
    });
}

// ==================== ЗУМ ====================
function initZoom() {
    const wrapper = document.getElementById('canvasWrapper');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomLevelSpan = document.getElementById('zoomLevel');
    
    function updateZoomLevel() {
        zoomLevelSpan.textContent = Math.round(currentZoom * 100) + '%';
    }
    
    function zoom(delta) {
        let newZoom = currentZoom + delta;
        if(newZoom < minZoom) newZoom = minZoom;
        if(newZoom > maxZoom) newZoom = maxZoom;
        if(newZoom === currentZoom) return;
        
        currentZoom = newZoom;
        renderMap();
        updateZoomLevel();
    }
    
    if(zoomInBtn) zoomInBtn.onclick = () => zoom(zoomStep);
    if(zoomOutBtn) zoomOutBtn.onclick = () => zoom(-zoomStep);
    
    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
        zoom(delta);
    }, { passive: false });
    
    updateZoomLevel();
}

// ==================== DRAG & DROP ЛОКАЦИЙ ====================
function startDrag(e) {
    if(!editMode) return;
    if (e.target.closest('.location-node') === null) return;
    e.stopPropagation();
    dragTarget = e.target.closest('.location-node');
    const rect = dragTarget.getBoundingClientRect();
    const wrapperRect = document.getElementById('canvasWrapper').getBoundingClientRect();
    dragOffsetX = (e.clientX - rect.left) / currentZoom;
    dragOffsetY = (e.clientY - rect.top) / currentZoom;
    dragTarget.classList.add('dragging');
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault();
}

function onDrag(e) {
    if (!dragTarget) return;
    const wrapperRect = document.getElementById('canvasWrapper').getBoundingClientRect();
    let newX = (e.clientX - wrapperRect.left + document.getElementById('canvasWrapper').scrollLeft) / currentZoom - dragOffsetX;
    let newY = (e.clientY - wrapperRect.top + document.getElementById('canvasWrapper').scrollTop) / currentZoom - dragOffsetY;
    
    const canvas = document.getElementById('mapCanvas');
    const maxX = 2000 - 100;
    const maxY = 1500 - 100;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    dragTarget.style.left = (newX * currentZoom) + 'px';
    dragTarget.style.top = (newY * currentZoom) + 'px';
    
    const id = parseInt(dragTarget.getAttribute('data-id'));
    const loc = mapLocations.find(l => l.id === id);
    if (loc) {
        loc.x = newX;
        loc.y = newY;
        renderMap();
        const newTarget = document.querySelector(`.location-node[data-id="${id}"]`);
        if (newTarget) {
            dragTarget = newTarget;
            dragTarget.classList.add('dragging');
        }
    }
}

function stopDrag() {
    if (dragTarget) {
        dragTarget.classList.remove('dragging');
        dragTarget = null;
    }
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// ==================== МОДАЛКА ЛОКАЦИИ ====================
async function openLocationModal(loc) {
    if(!loc) return;
    currentLocationId = loc.id;
    
    const mobs = await getLocationMobs(loc.id);
    
    let mobsHtml = '';
    if(mobs && mobs.length > 0) {
        mobsHtml = '<div class="location-mobs-section"><div class="location-mobs-title">🦇 Мобы:</div><div class="location-mobs-grid">';
        for(const mob of mobs) {
            mobsHtml += `
                <div class="location-mob-card" onclick="event.stopPropagation(); viewMobInfo(${mob.id})">
                    <div class="icon-from-icons" style="--row:${mob.icon_row || 0}; --col:${mob.icon_col || 0}; width:28px; height:28px; margin:0 auto 4px auto;"></div>
                    <div class="location-mob-name">${escapeHtml(mob.name)}</div>
                    <div class="location-mob-level">⭐ ${mob.level}</div>
                </div>
            `;
        }
        mobsHtml += '</div></div>';
    } else {
        mobsHtml = '<div class="location-mobs-empty">📭 Нет мобов</div>';
    }
    
    let typeText = '';
    let typeClass = '';
    if(loc.color === 'green') {
        typeText = '🟢 Безопасная - грабить запрещено';
        typeClass = 'safe';
    } else if(loc.color === 'yellow') {
        typeText = '🟡 Безопасная - грабить запрещено (магазин)';
        typeClass = 'market';
    } else if(loc.color === 'red') {
        typeText = '🔴 Опасная - могут ограбить';
        typeClass = 'danger';
    }
    
    const modalHtml = `
        <div class="location-modal-content ${typeClass}">
            <div class="location-modal-header">
                <div class="location-modal-close" onclick="closeLocationModal()">✕</div>
                <div class="icon-from-icons" style="--row:${loc.icon_row || 3}; --col:${loc.icon_col || 10}; width:28px; height:28px; margin:0 auto;"></div>
                <div class="location-modal-title">${escapeHtml(loc.name)}</div>
                <div class="location-modal-type">${typeText}</div>
                ${editMode ? `<button class="location-modal-btn edit-location-btn" onclick="openEditLocationModal(${loc.id})" style="margin-left:10px; background:#44aaff;">✏️ Редактировать</button>` : ''}
            </div>
            <div class="location-modal-body">
                <div class="location-modal-description">${escapeHtml(loc.description || 'Описание отсутствует')}</div>
                ${mobsHtml}
            </div>
            <div class="location-modal-footer">
                <button class="location-modal-btn" onclick="closeLocationModal()">Закрыть</button>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('locationModal');
    modal.innerHTML = modalHtml;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLocationModal() {
    const modal = document.getElementById('locationModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentLocationId = null;
}

async function viewMobInfo(mobId) {
    const mob = await getLocationMobById(mobId);
    if(!mob) return;
    alert(`🦇 ${mob.name}\n⭐ Уровень: ${mob.level}`);
}

// ==================== РЕДАКТИРОВАНИЕ ЛОКАЦИИ ====================
async function openEditLocationModal(locId) {
    const loc = mapLocations.find(l => l.id === locId);
    if(!loc) return;
    
    document.getElementById('editLocId').value = loc.id;
    document.getElementById('editLocName').value = loc.name;
    document.getElementById('editLocColor').value = loc.color || 'green';
    document.getElementById('editLocIconRow').value = loc.icon_row || 3;
    document.getElementById('editLocIconCol').value = loc.icon_col || 10;
    document.getElementById('editLocDescription').value = loc.description || '';
    document.getElementById('editLocIconPreview').innerHTML = `✅ Текущая: ряд ${(loc.icon_row || 3) + 1}, колонка ${(loc.icon_col || 10) + 1}`;
    
    document.getElementById('editLocationModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEditLocationModal() {
    document.getElementById('editLocationModal').style.display = 'none';
    document.body.style.overflow = '';
}

async function saveEditLocation() {
    const locId = parseInt(document.getElementById('editLocId').value);
    const name = document.getElementById('editLocName').value.trim();
    if(!name) {
        alert('Введите название локации!');
        return;
    }
    
    const updatedLoc = {
        id: locId,
        name: name,
        color: document.getElementById('editLocColor').value,
        icon_row: parseInt(document.getElementById('editLocIconRow').value),
        icon_col: parseInt(document.getElementById('editLocIconCol').value),
        description: document.getElementById('editLocDescription').value,
        x: mapLocations.find(l => l.id === locId).x,
        y: mapLocations.find(l => l.id === locId).y,
        level: mapLocations.find(l => l.id === locId).level || 1
    };
    
    const result = await saveMapLocation(updatedLoc);
    if(result) {
        await loadMapData();
        closeEditLocationModal();
        closeLocationModal();
        alert('✅ Локация обновлена!');
    } else {
        alert('❌ Ошибка при сохранении!');
    }
}

async function deleteCurrentLocation() {
    const locId = parseInt(document.getElementById('editLocId').value);
    if(!confirm('Удалить локацию и все связанные с ней тропы и мобов?')) return;
    
    await deleteMapConnectionsByLocationId(locId);
    await deleteLocationMobsByLocationId(locId);
    await deleteMapLocation(locId);
    
    await loadMapData();
    closeEditLocationModal();
    closeLocationModal();
    alert('🗑️ Локация удалена');
}

// ==================== РЕЖИМ РЕДАКТИРОВАНИЯ ====================
function toggleEditMode() {
    editMode = !editMode;
    const editModeBtn = document.getElementById('editModeBtn');
    const addElementBtn = document.getElementById('addElementBtn');
    const saveMapBtn = document.getElementById('saveMapBtn');
    const manageMobsBtn = document.getElementById('manageMobsBtn');
    
    if(editMode) {
        if(editModeBtn) editModeBtn.textContent = '🔒 Выйти из режима редактирования';
        if(addElementBtn) addElementBtn.style.display = 'inline-block';
        if(saveMapBtn) saveMapBtn.style.display = 'inline-block';
        if(manageMobsBtn) manageMobsBtn.style.display = 'inline-block';
        document.getElementById('statusMsg').textContent = '✏️ Режим редактирования: можно перемещать локации, добавлять/удалять тропы';
    } else {
        if(editModeBtn) editModeBtn.textContent = '✏️ Режим редактирования';
        if(addElementBtn) addElementBtn.style.display = 'none';
        if(saveMapBtn) saveMapBtn.style.display = 'none';
        if(manageMobsBtn) manageMobsBtn.style.display = 'none';
        document.getElementById('statusMsg').textContent = '⚡ Нажми на локацию для просмотра';
    }
    renderMap();
}

// ==================== АДМИНСКИЕ ФУНКЦИИ ====================
function openChoiceModal() {
    if(!editMode) return;
    document.getElementById('choiceModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeChoiceModal() {
    document.getElementById('choiceModal').style.display = 'none';
    document.body.style.overflow = '';
}

function openAddLocationModal() {
    if(!editMode) return;
    closeChoiceModal();
    updateConnectionSelects();
    document.getElementById('addLocationModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAddLocationModal() {
    document.getElementById('addLocationModal').style.display = 'none';
    document.body.style.overflow = '';
    document.getElementById('newLocName').value = '';
    document.getElementById('newLocColor').value = 'green';
    document.getElementById('newLocIconRow').value = 3;
    document.getElementById('newLocIconCol').value = 10;
    document.getElementById('newLocDescription').value = '';
    document.getElementById('locIconPreview').innerHTML = '❌ Не выбрано';
}

async function saveNewLocation() {
    if(!editMode) return;
    const name = document.getElementById('newLocName').value.trim();
    if(!name) {
        alert('Введите название локации!');
        return;
    }
    
    const color = document.getElementById('newLocColor').value;
    const iconRow = parseInt(document.getElementById('newLocIconRow').value);
    const iconCol = parseInt(document.getElementById('newLocIconCol').value);
    const description = document.getElementById('newLocDescription').value;
    
    const checkboxes = document.querySelectorAll('#connectionsList input:checked');
    let targetX = 500, targetY = 300;
    
    if(checkboxes.length > 0) {
        const firstCheckedId = parseInt(checkboxes[0].value);
        const nearestLoc = mapLocations.find(l => l.id === firstCheckedId);
        if(nearestLoc) {
            targetX = nearestLoc.x + 150;
            targetY = nearestLoc.y + 50;
        }
    }
    
    const newLocation = {
        name: name,
        color: color,
        icon_row: iconRow,
        icon_col: iconCol,
        description: description,
        x: targetX,
        y: targetY,
        level: 1
    };
    
    const result = await saveMapLocation(newLocation);
    if(result) {
        const newId = result[0]?.id || result.id;
        
        for(let cb of checkboxes) {
            const toId = parseInt(cb.value);
            if(toId && newId) {
                await saveMapConnection({ from_id: newId, to_id: toId, color: '#8a7a40' });
            }
        }
        
        await loadMapData();
        closeAddLocationModal();
        alert('✅ Локация добавлена!');
    } else {
        alert('❌ Ошибка при сохранении!');
    }
}

function openAddConnectionModal() {
    if(!editMode) return;
    closeChoiceModal();
    updateConnectionSelects();
    document.getElementById('addConnectionModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAddConnectionModal() {
    document.getElementById('addConnectionModal').style.display = 'none';
    document.body.style.overflow = '';
}

async function saveNewConnection() {
    if(!editMode) return;
    const fromId = parseInt(document.getElementById('newConnFrom').value);
    const toId = parseInt(document.getElementById('newConnTo').value);
    const color = document.getElementById('newConnColor').value;
    
    if(!fromId || !toId) {
        alert('Выберите обе локации!');
        return;
    }
    if(fromId === toId) {
        alert('Нельзя создать тропу к самой себе!');
        return;
    }
    
    const result = await saveMapConnection({ from_id: fromId, to_id: toId, color: color });
    if(result) {
        await loadMapData();
        closeAddConnectionModal();
        alert('✅ Тропа добавлена!');
    } else {
        alert('❌ Ошибка при сохранении!');
    }
}

async function saveAllMap() {
    if(!editMode) return;
    for(let loc of mapLocations) {
        await saveMapLocation(loc);
    }
    updateStatus('💾 Все изменения сохранены в БД');
    alert('✅ Карта сохранена!');
}

function updateStatus(msg) {
    const statusSpan = document.getElementById('statusMsg');
    if(statusSpan) statusSpan.textContent = msg;
    setTimeout(() => {
        if(statusSpan) statusSpan.textContent = editMode ? '✏️ Режим редактирования' : '⚡ Нажми на локацию для просмотра';
    }, 3000);
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
async function initMap() {
    await loadMapData();
    initMapDrag();
    initZoom();
    
    document.getElementById('saveNewLocationBtn')?.addEventListener('click', saveNewLocation);
    document.getElementById('saveNewConnectionBtn')?.addEventListener('click', saveNewConnection);
    document.getElementById('saveEditLocationBtn')?.addEventListener('click', saveEditLocation);
    document.getElementById('deleteLocationBtn')?.addEventListener('click', deleteCurrentLocation);
    
    document.getElementById('selectLocIconBtn')?.addEventListener('click', () => {
        if(typeof showIconPickerIcons !== 'undefined') {
            showIconPickerIcons((row, col) => {
                document.getElementById('newLocIconRow').value = row;
                document.getElementById('newLocIconCol').value = col;
                document.getElementById('locIconPreview').innerHTML = `✅ Выбрано: ряд ${row + 1}, колонка ${col + 1}`;
            }, document.getElementById('selectLocIconBtn'), { title: 'Выберите иконку для локации' });
        } else {
            alert('Пикер иконок не загружен');
        }
    });
    
    document.getElementById('editSelectLocIconBtn')?.addEventListener('click', () => {
        if(typeof showIconPickerIcons !== 'undefined') {
            showIconPickerIcons((row, col) => {
                document.getElementById('editLocIconRow').value = row;
                document.getElementById('editLocIconCol').value = col;
                document.getElementById('editLocIconPreview').innerHTML = `✅ Выбрано: ряд ${row + 1}, колонка ${col + 1}`;
            }, document.getElementById('editSelectLocIconBtn'), { title: 'Выберите иконку для локации' });
        } else {
            alert('Пикер иконок не загружен');
        }
    });
}

initMap();
document.addEventListener('DOMContentLoaded', displayAdminPanel);