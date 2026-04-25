// ==================== ИНИЦИАЛИЗАЦИЯ SUPABASE ====================
let dbReady = false;
let dbInitPromise = null;
let db = null;

async function ensureDb() {
    if (db && dbReady) return db;
    if (dbInitPromise) return dbInitPromise;
    
    dbInitPromise = (async () => {
        while (typeof window.supabase === 'undefined') {
            await new Promise(r => setTimeout(r, 50));
        }
        while (typeof window.supabase.createClient === 'undefined') {
            await new Promise(r => setTimeout(r, 50));
        }
        const SUPABASE_URL = 'https://gmcqxgxwtczjlwyifwew.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtY3F4Z3h3dGN6amx3eWlmd2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjIxMTAsImV4cCI6MjA5MDk5ODExMH0.cM6xm9qCRbl-c1h-pWOWKSeAozYUy7KpJjua79JgFuk';
        db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: {
                headers: { 'x-user-login': '' }
            }
        });
        window.__dbClient = db;
        dbReady = true;
        console.log('✅ Supabase инициализирован');
        return db;
    })();
    return dbInitPromise;
}

ensureDb();

// ==================== УСТАНОВКА ПОЛЬЗОВАТЕЛЯ ДЛЯ RLS ====================
// Вызывать после логина и логаута
function setRLSUser(login) {
    if (db && db.rest) {
        db.rest.headers['x-user-login'] = login || '';
    }
}

// Получить текущего пользователя из localStorage
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Обновить заголовок при загрузке
function initRLS() {
    const user = getCurrentUser();
    setRLSUser(user ? user.login : '');
}

// ==================== КЕШИРОВАНИЕ ====================
const cache = {};
const CACHE_TTL = {
    items: 7 * 24 * 60 * 60 * 1000,           // 7 дней
    demons: 7 * 24 * 60 * 60 * 1000,           // 7 дней
    totems: 7 * 24 * 60 * 60 * 1000,           // 7 дней
    master_runes: 7 * 24 * 60 * 60 * 1000,     // 7 дней
    druids_runes: 7 * 24 * 60 * 60 * 1000,     // 7 дней
    nakolki: 7 * 24 * 60 * 60 * 1000,          // 7 дней
    secret_items: 7 * 24 * 60 * 60 * 1000,     // 7 дней
    secret_sets: 7 * 24 * 60 * 60 * 1000,      // 7 дней
    enhancements: 7 * 24 * 60 * 60 * 1000,     // 7 дней
    map_locations: 3 * 24 * 60 * 60 * 1000,    // 3 дня
    map_connections: 3 * 24 * 60 * 60 * 1000,  // 3 дня
    quests: 24 * 60 * 60 * 1000,               // 1 день
    news: 24 * 60 * 60 * 1000,                 // 1 день
    users: 0,                                   // без кеша
    user_characters: 0,                         // без кеша
    character_timers: 0                         // без кеша
};

async function getCachedOrFetch(key, fetchFunction, ttlKey = null) {
    const now = Date.now();
    const ttl = (ttlKey && CACHE_TTL[ttlKey] !== undefined) ? CACHE_TTL[ttlKey] : 5 * 60 * 1000;
    
    if (ttl === 0) return await fetchFunction();
    
    if (cache[key] && (now - cache[key].timestamp) < ttl) {
        console.log(`📦 Кеш: ${key}`);
        return cache[key].data;
    }
    console.log(`🔄 Запрос в БД: ${key}`);
    const data = await fetchFunction();
    cache[key] = { data: data, timestamp: now };
    return data;
}

function invalidateCache(key) {
    if (cache[key]) {
        delete cache[key];
        console.log(`🗑️ Кеш очищен: ${key}`);
    }
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ (чтение) ====================
// Все функции чтения используют кеш

// Получение всех предметов
async function getItems() { 
    await ensureDb(); 
    return getCachedOrFetch('items', async () => {
        const { data, error } = await db.from('items').select('*').order('level'); 
        if (error) return []; 
        return data; 
    }, 'items');
}

// Получение всех демонов
async function getDemons() { 
    await ensureDb(); 
    return getCachedOrFetch('demons', async () => {
        const { data, error } = await db.from('demons').select('*').order('sort_order'); 
        if (error) return []; 
        return data; 
    }, 'demons');
}

// Получение всех тотемов
async function getTotems() { 
    await ensureDb(); 
    return getCachedOrFetch('totems', async () => {
        const { data, error } = await db.from('totems').select('*').order('sort_order'); 
        if (error) return []; 
        return data; 
    }, 'totems');
}

// Получение всех рун мастера
async function getMasterRunes() { 
    await ensureDb(); 
    return getCachedOrFetch('master_runes', async () => {
        const { data, error } = await db.from('runes_master').select('*').order('sort_order'); 
        if (error) return []; 
        return data; 
    }, 'master_runes');
}

// Получение всех рун друидов
async function getDruidsRunes() { 
    await ensureDb(); 
    return getCachedOrFetch('druids_runes', async () => {
        const { data, error } = await db.from('runes_druids').select('*').order('sort_order'); 
        if (error) return []; 
        return data; 
    }, 'druids_runes');
}

// Получение всех новостей
async function getNews() { 
    await ensureDb(); 
    return getCachedOrFetch('news', async () => {
        const { data, error } = await db.from('news').select('*').order('date', { ascending: false }); 
        if (error) return []; 
        return data; 
    }, 'news');
}

// Получение всех пользователей (только для админа через RLS)
async function getUsers() { 
    await ensureDb(); 
    return getCachedOrFetch('users', async () => {
        const { data, error } = await db.from('users').select('*'); 
        if (error) return []; 
        return data; 
    }, 'users');
}

// ==================== ФУНКЦИИ ЗАПИСИ (сохраняют с очисткой кеша) ====================
async function saveItem(item) { 
    await ensureDb(); 
    const { data, error } = await db.from('items').upsert(item).select(); 
    if (error) return null; 
    invalidateCache('items');
    return data; 
}

async function saveDemon(demon) { 
    await ensureDb(); 
    const { data, error } = await db.from('demons').upsert(demon).select(); 
    if (error) return null; 
    invalidateCache('demons');
    return data; 
}

async function saveTotem(totem) { 
    await ensureDb(); 
    const { data, error } = await db.from('totems').upsert(totem).select(); 
    if (error) return null; 
    invalidateCache('totems');
    return data; 
}

async function saveMasterRune(rune) { 
    await ensureDb(); 
    const { data, error } = await db.from('runes_master').upsert(rune).select(); 
    if (error) return null; 
    invalidateCache('master_runes');
    return data; 
}

async function saveDruidsRune(rune) { 
    await ensureDb(); 
    const { data, error } = await db.from('runes_druids').upsert(rune).select(); 
    if (error) return null; 
    invalidateCache('druids_runes');
    return data; 
}

async function saveNewsItem(news) { 
    await ensureDb(); 
    const { data, error } = await db.from('news').upsert(news).select(); 
    if (error) return null; 
    invalidateCache('news');
    return data; 
}

// ==================== ФУНКЦИИ УДАЛЕНИЯ ====================
async function deleteItemById(id) { 
    await ensureDb(); 
    const { error } = await db.from('items').delete().eq('id', id); 
    if (!error) invalidateCache('items');
    return !error; 
}

async function deleteDemonById(id) { 
    await ensureDb(); 
    const { error } = await db.from('demons').delete().eq('id', id); 
    if (!error) invalidateCache('demons');
    return !error; 
}

async function deleteTotemById(id) { 
    await ensureDb(); 
    const { error } = await db.from('totems').delete().eq('id', id); 
    if (!error) invalidateCache('totems');
    return !error; 
}

async function deleteMasterRuneById(id) { 
    await ensureDb(); 
    const { error } = await db.from('runes_master').delete().eq('id', id); 
    if (!error) invalidateCache('master_runes');
    return !error; 
}

async function deleteDruidsRuneById(id) { 
    await ensureDb(); 
    const { error } = await db.from('runes_druids').delete().eq('id', id); 
    if (!error) invalidateCache('druids_runes');
    return !error; 
}

async function deleteNewsById(id) { 
    await ensureDb(); 
    const { error } = await db.from('news').delete().eq('id', id); 
    if (!error) invalidateCache('news');
    return !error; 
}

// ==================== АВТОРИЗАЦИЯ ====================
// Авторизация пользователя
async function loginUser(login, password) { 
    await ensureDb(); 
    const { data, error } = await db.from('users').select('*').eq('login', login).eq('password', password); 
    if (error || !data || data.length === 0) return null;
    setRLSUser(login);
    return data[0]; 
}

// Регистрация нового пользователя
async function registerUser(login, password, email) { 
    await ensureDb(); 
    const { data: existing } = await db.from('users').select('*').eq('login', login); 
    if (existing && existing.length > 0) return { success: false, message: '❌ Пользователь уже существует' }; 
    const { count } = await db.from('users').select('*', { count: 'exact', head: true }); 
    const role = count === 0 ? 'admin' : 'user'; 
    const { error } = await db.from('users').insert([{ login, password, email, role, name: login }]); 
    if (error) return { success: false, message: '❌ Ошибка регистрации' }; 
    invalidateCache('users');
    return { success: true, message: role === 'admin' ? '✅ Вы стали АДМИНИСТРАТОРОМ!' : '✅ Регистрация успешна!' }; 
}

// Проверка, первый ли пользователь
async function isFirstUser() { 
    await ensureDb(); 
    const { count, error } = await db.from('users').select('*', { count: 'exact', head: true }); 
    if (error) return true; 
    return count === 0; 
}

// Инициализация авторизации (создание админа при первом запуске)
async function initAuth() { 
    await ensureDb(); 
    const first = await isFirstUser(); 
    if (first) { 
        await registerUser('admin', 'admin123', 'admin@mmobitva.ru'); 
        const users = await getUsers(); 
        if (users && users.length > 0) { 
            await db.from('users').update({ role: 'admin' }).eq('id', users[0].id); 
            invalidateCache('users');
        } 
    } 
}

// Выход из аккаунта
function logout() {
    localStorage.removeItem('user');
    setRLSUser('');
    window.location.href = 'auth.html';
}

// ========== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ АДМИНКИ (получение по ID) ==========
async function getItemById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('items').select('*').eq('id', id); 
    if(error) return null; 
    return data ? data[0] : null; 
}

async function getDemonById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('demons').select('*').eq('id', id); 
    if(error) return null; 
    return data ? data[0] : null; 
}

async function getTotemById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('totems').select('*').eq('id', id); 
    if(error) return null; 
    return data ? data[0] : null; 
}

async function getMasterRuneById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('runes_master').select('*').eq('id', id); 
    if(error) return null; 
    return data ? data[0] : null; 
}

async function getDruidsRuneById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('runes_druids').select('*').eq('id', id); 
    if(error) return null; 
    return data ? data[0] : null; 
}

async function getNewsById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('news').select('*').eq('id', id); 
    if(error) return null; 
    return data ? data[0] : null; 
}

// ========== ФУНКЦИИ ДЛЯ КВЕСТОВЫХ РУН (nakolki) ==========
async function getNakolki() { 
    await ensureDb(); 
    return getCachedOrFetch('nakolki', async () => {
        const { data, error } = await db.from('nakolki').select('*').order('sort_order'); 
        if(error) return []; 
        return data; 
    }, 'nakolki');
}

async function saveNakolki(item) { 
    await ensureDb(); 
    const { data, error } = await db.from('nakolki').upsert(item).select(); 
    if(error) return null; 
    invalidateCache('nakolki');
    return data; 
}

async function deleteNakolkiById(id) { 
    await ensureDb(); 
    const { error } = await db.from('nakolki').delete().eq('id', id); 
    if (!error) invalidateCache('nakolki');
    return !error; 
}

async function getNakolkiById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('nakolki').select('*').eq('id', id); 
    if(error) return null; 
    return data ? data[0] : null; 
}

// ========== УСИЛЕНИЯ (ENHANCEMENTS) ==========
async function getEnhancements() { 
    await ensureDb(); 
    return getCachedOrFetch('enhancements', async () => {
        const { data, error } = await db.from('enhancements').select('*').order('sort_order'); 
        if (error) return []; 
        return data; 
    }, 'enhancements');
}

async function getEnhancementById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('enhancements').select('*').eq('id', id); 
    if (error) return null; 
    return data ? data[0] : null; 
}

async function saveEnhancement(item) { 
    await ensureDb(); 
    const { data, error } = await db.from('enhancements').upsert(item).select(); 
    if (error) return null; 
    invalidateCache('enhancements');
    return data; 
}

async function deleteEnhancementById(id) { 
    await ensureDb(); 
    const { error } = await db.from('enhancements').delete().eq('id', id); 
    if (!error) invalidateCache('enhancements');
    return !error; 
}

// ========== ЛИЧНЫЙ КАБИНЕТ (ПЕРСОНАЖИ И ТАЙМЕРЫ) ==========
// ВНИМАНИЕ: эти функции НЕ используют кеш — всегда свежие данные

// Получение всех персонажей пользователя
async function getUserCharacters(userId) { 
    await ensureDb(); 
    const { data, error } = await db.from('user_characters').select('*').eq('user_id', userId); 
    if(error) return []; 
    return data; 
}

// Добавление нового персонажа
async function addCharacter(userId, name) { 
    await ensureDb(); 
    const { data, error } = await db.from('user_characters').insert([{ user_id: userId, name }]).select(); 
    if(error) return null; 
    return data[0]; 
}

// Удаление персонажа
async function deleteCharacter(id) { 
    await ensureDb(); 
    const { error } = await db.from('user_characters').delete().eq('id', id); 
    return !error; 
}

// Получение всех таймеров персонажа
async function getCharacterTimers(characterId) { 
    await ensureDb(); 
    const { data, error } = await db.from('user_timers').select('*').eq('character_id', characterId); 
    if(error) return []; 
    return data; 
}

// Добавление таймера
async function addTimer(characterId, questName, endTime, duration) { 
    await ensureDb(); 
    const { data, error } = await db.from('user_timers').insert([{ character_id: characterId, quest_name: questName, end_time: endTime, duration: duration }]).select(); 
    if(error) return null; 
    return data[0]; 
}

// Обновление таймера
async function updateTimer(id, questName, endTime, duration) { 
    await ensureDb(); 
    const { error } = await db.from('user_timers').update({ quest_name: questName, end_time: endTime, duration: duration }).eq('id', id); 
    return !error; 
}

// Удаление таймера
async function deleteTimer(id) { 
    await ensureDb(); 
    const { error } = await db.from('user_timers').delete().eq('id', id); 
    return !error; 
}

// Включение/выключение таймера
async function toggleTimerActive(id, isActive) { 
    await ensureDb(); 
    const { error } = await db.from('user_timers').update({ is_active: isActive }).eq('id', id); 
    return !error; 
}

// ========== КАРТА ==========
// Получение всех локаций карты
async function getMapLocations() { 
    await ensureDb(); 
    return getCachedOrFetch('map_locations', async () => {
        const { data, error } = await db.from('map_locations').select('*').order('id'); 
        if (error) {
            console.error('getMapLocations error:', error);
            return []; 
        }
        return data; 
    }, 'map_locations');
}

// Сохранение локации
async function saveMapLocation(location) { 
    await ensureDb(); 
    const { data, error } = await db.from('map_locations').upsert(location).select(); 
    if (error) {
        console.error('saveMapLocation error:', error);
        return null; 
    }
    invalidateCache('map_locations');
    return data; 
}

// Удаление локации
async function deleteMapLocation(id) { 
    await ensureDb(); 
    const { error } = await db.from('map_locations').delete().eq('id', id); 
    if (!error) invalidateCache('map_locations');
    return !error; 
}

// Получение всех связей между локациями
async function getMapConnections() { 
    await ensureDb(); 
    return getCachedOrFetch('map_connections', async () => {
        const { data, error } = await db.from('map_connections').select('*'); 
        if (error) {
            console.error('getMapConnections error:', error);
            return []; 
        }
        return data; 
    }, 'map_connections');
}

// Сохранение связи
async function saveMapConnection(connection) { 
    await ensureDb(); 
    const { data, error } = await db.from('map_connections').upsert(connection).select(); 
    if (error) return null; 
    invalidateCache('map_connections');
    return data; 
}

// Удаление связи
async function deleteMapConnection(id) { 
    await ensureDb(); 
    const { error } = await db.from('map_connections').delete().eq('id', id); 
    if (!error) invalidateCache('map_connections');
    return !error; 
}

// Удаление всех связей локации
async function deleteMapConnectionsByLocationId(locationId) { 
    await ensureDb(); 
    const { error } = await db.from('map_connections').delete().or(`from_id.eq.${locationId},to_id.eq.${locationId}`); 
    if (!error) invalidateCache('map_connections');
    return !error; 
}

// ========== МОБЫ ДЛЯ ЛОКАЦИЙ ==========
// Получение мобов локации
async function getLocationMobs(locationId) { 
    await ensureDb(); 
    return getCachedOrFetch(`location_mobs_${locationId}`, async () => {
        const { data, error } = await db.from('location_mobs').select('*').eq('location_id', locationId).order('level'); 
        if (error) return []; 
        return data; 
    });
}

// Получение моба по ID
async function getLocationMobById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('location_mobs').select('*').eq('id', id); 
    if (error) return null; 
    return data ? data[0] : null; 
}

// Сохранение моба
async function saveLocationMob(mob) { 
    await ensureDb(); 
    const { data, error } = await db.from('location_mobs').upsert(mob).select(); 
    if (error) return null; 
    invalidateCache(`location_mobs_${mob.location_id}`);
    return data; 
}

// Удаление моба
async function deleteLocationMob(id) { 
    await ensureDb(); 
    const { error } = await db.from('location_mobs').delete().eq('id', id); 
    return !error; 
}

// Удаление всех мобов локации
async function deleteLocationMobsByLocationId(locationId) { 
    await ensureDb(); 
    const { error } = await db.from('location_mobs').delete().eq('location_id', locationId); 
    if (!error) invalidateCache(`location_mobs_${locationId}`);
    return !error; 
}

// ========== ИСТОРИЯ ТАЙМЕРОВ ==========
// Добавление записи в историю
async function addTimerHistory(historyItem) {
    await ensureDb();
    const user = getCurrentUser();
    const itemWithUser = {
        ...historyItem,
        user_id: user ? user.login : null
    };
    const { data, error } = await db.from('timer_history').insert(itemWithUser).select();
    if (error) {
        console.error('addTimerHistory error:', error);
        return null;
    }
    return data;
}

// Получение истории таймеров
async function getTimerHistory(characterId = null, limit = 100) {
    await ensureDb();
    const user = getCurrentUser();
    if (!user) return [];
    
    let query = db.from('timer_history').select('*').eq('user_id', user.login).order('end_time', { ascending: false }).limit(limit);
    if (characterId) {
        query = query.eq('character_id', characterId);
    }
    const { data, error } = await query;
    if (error) {
        console.error('getTimerHistory error:', error);
        return [];
    }
    return data;
}

// Обновление заметки в истории
async function updateTimerHistoryNote(id, notes) {
    await ensureDb();
    const { error } = await db.from('timer_history').update({ notes: notes }).eq('id', id);
    return !error;
}

// Удаление записи из истории
async function deleteTimerHistory(id) {
    await ensureDb();
    const { error } = await db.from('timer_history').delete().eq('id', id);
    return !error;
}

// Очистка всей истории
async function clearTimerHistory(characterId = null) {
    await ensureDb();
    const user = getCurrentUser();
    if (!user) return false;
    
    let query = db.from('timer_history').delete().eq('user_id', user.login);
    if (characterId) {
        query = query.eq('character_id', characterId);
    }
    const { error } = await query;
    return !error;
}

// ==================== СЕКРЕТНЫЕ ВЕЩИ ====================
async function getSecretItems() { 
    await ensureDb(); 
    return getCachedOrFetch('secret_items', async () => {
        const { data, error } = await db.from('secret_items_new').select('*').order('id'); 
        if (error) return []; 
        return data; 
    }, 'secret_items');
}

async function getSecretItemById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('secret_items_new').select('*').eq('id', id); 
    if (error) return null; 
    return data ? data[0] : null; 
}

async function saveSecretItem(item) { 
    await ensureDb(); 
    if (!item.id) delete item.id;
    const { data, error } = await db.from('secret_items_new').upsert(item).select(); 
    if (error) return null; 
    invalidateCache('secret_items');
    return data; 
}

async function deleteSecretItem(id) { 
    await ensureDb(); 
    const { error } = await db.from('secret_items_new').delete().eq('id', id); 
    if (!error) invalidateCache('secret_items');
    return !error; 
}

// ==================== СЕКРЕТНЫЕ СЕТЫ ====================
async function getSecretSets() { 
    await ensureDb(); 
    return getCachedOrFetch('secret_sets', async () => {
        const { data, error } = await db.from('secret_sets_new').select('*').order('id'); 
        if (error) return []; 
        return data; 
    }, 'secret_sets');
}

async function getSecretSetById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('secret_sets_new').select('*').eq('id', id); 
    if (error) return null; 
    return data ? data[0] : null; 
}

async function saveSecretSet(set) { 
    await ensureDb(); 
    if (!set.id) delete set.id;
    const { data, error } = await db.from('secret_sets_new').upsert(set).select(); 
    if (error) return null; 
    invalidateCache('secret_sets');
    return data; 
}

async function deleteSecretSet(id) { 
    await ensureDb(); 
    const { error } = await db.from('secret_sets_new').delete().eq('id', id); 
    if (!error) invalidateCache('secret_sets');
    return !error; 
}

// ==================== ПРЕДМЕТЫ В СЕТАХ ====================
async function getSecretSetItems(setId) { 
    await ensureDb(); 
    return getCachedOrFetch(`secret_set_items_${setId}`, async () => {
        const { data, error } = await db.from('secret_set_items_new').select('*').eq('set_id', setId).order('id'); 
        if (error) return []; 
        return data; 
    });
}

async function getSecretSetItemById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('secret_set_items_new').select('*').eq('id', id); 
    if (error) return null; 
    return data ? data[0] : null; 
}

async function saveSecretSetItem(item) { 
    await ensureDb(); 
    if (!item.id) delete item.id;
    const { data, error } = await db.from('secret_set_items_new').upsert(item).select(); 
    if (error) return null; 
    invalidateCache(`secret_set_items_${item.set_id}`);
    return data; 
}

async function deleteSecretSetItem(id) { 
    await ensureDb(); 
    const { error } = await db.from('secret_set_items_new').delete().eq('id', id); 
    return !error; 
}

async function getSecretSetItemsBySetId(setId) {
    await ensureDb();
    const { data, error } = await db.from('secret_set_items_new').select('*').eq('set_id', setId);
    if (error) return [];
    return data;
}

// ==================== КВЕСТЫ ====================
async function getQuests() { 
    await ensureDb(); 
    return getCachedOrFetch('quests', async () => {
        const { data, error } = await db.from('quests').select('*').order('sort_order'); 
        if (error) return []; 
        return data; 
    }, 'quests');
}

async function getQuestById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('quests').select('*').eq('id', id); 
    if (error) return null; 
    return data ? data[0] : null; 
}

async function saveQuest(quest) { 
    await ensureDb(); 
    if (!quest.id) delete quest.id;
    const { data, error } = await db.from('quests').upsert(quest).select(); 
    if (error) return null; 
    invalidateCache('quests');
    return data; 
}

async function deleteQuest(id) { 
    await ensureDb(); 
    const { error } = await db.from('quests').delete().eq('id', id); 
    if (!error) invalidateCache('quests');
    return !error; 
}

// ==================== ИНИЦИАЛИЗАЦИЯ RLS ПРИ ЗАГРУЗКЕ ====================
initRLS();