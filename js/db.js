// ==================== ИНИЦИАЛИЗАЦИЯ SUPABASE С ОЖИДАНИЕМ ====================
let dbReady = false;
let dbInitPromise = null;
let db = null;

async function ensureDb() {
    // Если db уже инициализирован и готов
    if (db && dbReady) {
        return db;
    }
    
    // Если уже идет инициализация, ждем ее
    if (dbInitPromise) {
        return dbInitPromise;
    }
    
    // Запускаем инициализацию
    dbInitPromise = (async () => {
        // Ждем загрузки Supabase
        while (typeof window.supabase === 'undefined') {
            await new Promise(r => setTimeout(r, 50));
        }
        while (typeof window.supabase.createClient === 'undefined') {
            await new Promise(r => setTimeout(r, 50));
        }
        
        const SUPABASE_URL = 'https://gmcqxgxwtczjlwyifwew.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtY3F4Z3h3dGN6amx3eWlmd2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjIxMTAsImV4cCI6MjA5MDk5ODExMH0.cM6xm9qCRbl-c1h-pWOWKSeAozYUy7KpJjua79JgFuk';
        
        db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.__dbClient = db;
        dbReady = true;
        console.log('✅ Supabase инициализирован');
        return db;
    })();
    
    return dbInitPromise;
}

// Запускаем инициализацию
ensureDb();

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
async function getItems() { await ensureDb(); const { data, error } = await db.from('items').select('*').order('level'); if (error) return []; return data; }
async function getDemons() { await ensureDb(); const { data, error } = await db.from('demons').select('*').order('sort_order'); if (error) return []; return data; }
async function getTotems() { await ensureDb(); const { data, error } = await db.from('totems').select('*').order('sort_order'); if (error) return []; return data; }
async function getMasterRunes() { await ensureDb(); const { data, error } = await db.from('runes_master').select('*').order('sort_order'); if (error) return []; return data; }
async function getDruidsRunes() { await ensureDb(); const { data, error } = await db.from('runes_druids').select('*').order('sort_order'); if (error) return []; return data; }
async function getNews() { await ensureDb(); const { data, error } = await db.from('news').select('*').order('date', { ascending: false }); if (error) return []; return data; }
async function getUsers() { await ensureDb(); const { data, error } = await db.from('users').select('*'); if (error) return []; return data; }

async function saveItem(item) { await ensureDb(); const { data, error } = await db.from('items').upsert(item).select(); if (error) return null; return data; }
async function saveDemon(demon) { await ensureDb(); const { data, error } = await db.from('demons').upsert(demon).select(); if (error) return null; return data; }
async function saveTotem(totem) { await ensureDb(); const { data, error } = await db.from('totems').upsert(totem).select(); if (error) return null; return data; }
async function saveMasterRune(rune) { await ensureDb(); const { data, error } = await db.from('runes_master').upsert(rune).select(); if (error) return null; return data; }
async function saveDruidsRune(rune) { await ensureDb(); const { data, error } = await db.from('runes_druids').upsert(rune).select(); if (error) return null; return data; }
async function saveNewsItem(news) { await ensureDb(); const { data, error } = await db.from('news').upsert(news).select(); if (error) return null; return data; }

async function deleteItemById(id) { await ensureDb(); const { error } = await db.from('items').delete().eq('id', id); return !error; }
async function deleteDemonById(id) { await ensureDb(); const { error } = await db.from('demons').delete().eq('id', id); return !error; }
async function deleteTotemById(id) { await ensureDb(); const { error } = await db.from('totems').delete().eq('id', id); return !error; }
async function deleteMasterRuneById(id) { await ensureDb(); const { error } = await db.from('runes_master').delete().eq('id', id); return !error; }
async function deleteDruidsRuneById(id) { await ensureDb(); const { error } = await db.from('runes_druids').delete().eq('id', id); return !error; }
async function deleteNewsById(id) { await ensureDb(); const { error } = await db.from('news').delete().eq('id', id); return !error; }

// ==================== АВТОРИЗАЦИЯ ====================
async function loginUser(login, password) { 
    await ensureDb(); 
    const { data, error } = await db.from('users').select('*').eq('login', login).eq('password', password); 
    if (error || !data || data.length === 0) return null; 
    return data[0]; 
}

async function registerUser(login, password, email) { 
    await ensureDb(); 
    const { data: existing } = await db.from('users').select('*').eq('login', login); 
    if (existing && existing.length > 0) return { success: false, message: '❌ Пользователь уже существует' }; 
    const { count } = await db.from('users').select('*', { count: 'exact', head: true }); 
    const role = count === 0 ? 'admin' : 'user'; 
    const { error } = await db.from('users').insert([{ login, password, email, role, name: login }]); 
    if (error) return { success: false, message: '❌ Ошибка регистрации' }; 
    return { success: true, message: role === 'admin' ? '✅ Вы стали АДМИНИСТРАТОРОМ!' : '✅ Регистрация успешна!' }; 
}

async function isFirstUser() { 
    await ensureDb(); 
    const { count, error } = await db.from('users').select('*', { count: 'exact', head: true }); 
    if (error) return true; 
    return count === 0; 
}

async function initAuth() { 
    await ensureDb(); 
    const first = await isFirstUser(); 
    if (first) { 
        await registerUser('admin', 'admin123', 'admin@mmobitva.ru'); 
        const users = await getUsers(); 
        if (users && users.length > 0) { 
            await db.from('users').update({ role: 'admin' }).eq('id', users[0].id); 
        } 
    } 
}

// ========== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ АДМИНКИ ==========
async function getItemById(id) { await ensureDb(); const { data, error } = await db.from('items').select('*').eq('id', id); if(error) return null; return data ? data[0] : null; }
async function getDemonById(id) { await ensureDb(); const { data, error } = await db.from('demons').select('*').eq('id', id); if(error) return null; return data ? data[0] : null; }
async function getTotemById(id) { await ensureDb(); const { data, error } = await db.from('totems').select('*').eq('id', id); if(error) return null; return data ? data[0] : null; }
async function getMasterRuneById(id) { await ensureDb(); const { data, error } = await db.from('runes_master').select('*').eq('id', id); if(error) return null; return data ? data[0] : null; }
async function getDruidsRuneById(id) { await ensureDb(); const { data, error } = await db.from('runes_druids').select('*').eq('id', id); if(error) return null; return data ? data[0] : null; }
async function getNewsById(id) { await ensureDb(); const { data, error } = await db.from('news').select('*').eq('id', id); if(error) return null; return data ? data[0] : null; }

// ========== ФУНКЦИИ ДЛЯ КВЕСТОВЫХ РУН (nakolki) ==========
async function getNakolki() { await ensureDb(); const { data, error } = await db.from('nakolki').select('*').order('sort_order'); if(error) return []; return data; }
async function saveNakolki(item) { await ensureDb(); const { data, error } = await db.from('nakolki').upsert(item).select(); if(error) return null; return data; }
async function deleteNakolkiById(id) { await ensureDb(); const { error } = await db.from('nakolki').delete().eq('id', id); return !error; }
async function getNakolkiById(id) { await ensureDb(); const { data, error } = await db.from('nakolki').select('*').eq('id', id); if(error) return null; return data ? data[0] : null; }

// ========== ЛИЧНЫЙ КАБИНЕТ (ПЕРСОНАЖИ И ТАЙМЕРЫ) ==========
async function getUserCharacters(userId) { await ensureDb(); const { data, error } = await db.from('user_characters').select('*').eq('user_id', userId); if(error) return []; return data; }
async function addCharacter(userId, name) { await ensureDb(); const { data, error } = await db.from('user_characters').insert([{ user_id: userId, name }]).select(); if(error) return null; return data[0]; }
async function deleteCharacter(id) { await ensureDb(); const { error } = await db.from('user_characters').delete().eq('id', id); return !error; }

async function getCharacterTimers(characterId) { await ensureDb(); const { data, error } = await db.from('user_timers').select('*').eq('character_id', characterId); if(error) return []; return data; }
async function addTimer(characterId, questName, endTime, duration) { await ensureDb(); const { data, error } = await db.from('user_timers').insert([{ character_id: characterId, quest_name: questName, end_time: endTime, duration: duration }]).select(); if(error) return null; return data[0]; }
async function updateTimer(id, questName, endTime, duration) { await ensureDb(); const { error } = await db.from('user_timers').update({ quest_name: questName, end_time: endTime, duration: duration }).eq('id', id); return !error; }
async function deleteTimer(id) { await ensureDb(); const { error } = await db.from('user_timers').delete().eq('id', id); return !error; }
async function toggleTimerActive(id, isActive) { await ensureDb(); const { error } = await db.from('user_timers').update({ is_active: isActive }).eq('id', id); return !error; }

// ========== КАРТА ==========
async function getMapLocations() { 
    await ensureDb(); 
    const { data, error } = await db.from('map_locations').select('*').order('id'); 
    if (error) {
        console.error('getMapLocations error:', error);
        return []; 
    }
    return data; 
}

async function saveMapLocation(location) { 
    await ensureDb(); 
    const { data, error } = await db.from('map_locations').upsert(location).select(); 
    if (error) {
        console.error('saveMapLocation error:', error);
        return null; 
    }
    return data; 
}

async function deleteMapLocation(id) { 
    await ensureDb(); 
    const { error } = await db.from('map_locations').delete().eq('id', id); 
    return !error; 
}

async function getMapConnections() { 
    await ensureDb(); 
    const { data, error } = await db.from('map_connections').select('*'); 
    if (error) {
        console.error('getMapConnections error:', error);
        return []; 
    }
    return data; 
}

async function saveMapConnection(connection) { 
    await ensureDb(); 
    const { data, error } = await db.from('map_connections').upsert(connection).select(); 
    if (error) return null; 
    return data; 
}

async function deleteMapConnection(id) { 
    await ensureDb(); 
    const { error } = await db.from('map_connections').delete().eq('id', id); 
    return !error; 
}

async function deleteMapConnectionsByLocationId(locationId) { 
    await ensureDb(); 
    const { error } = await db.from('map_connections').delete().or(`from_id.eq.${locationId},to_id.eq.${locationId}`); 
    return !error; 
}

// ========== МОБЫ ДЛЯ ЛОКАЦИЙ ==========
async function getLocationMobs(locationId) { 
    await ensureDb(); 
    const { data, error } = await db.from('location_mobs').select('*').eq('location_id', locationId).order('level'); 
    if (error) return []; 
    return data; 
}

async function getLocationMobById(id) { 
    await ensureDb(); 
    const { data, error } = await db.from('location_mobs').select('*').eq('id', id); 
    if (error) return null; 
    return data ? data[0] : null; 
}

async function saveLocationMob(mob) { 
    await ensureDb(); 
    const { data, error } = await db.from('location_mobs').upsert(mob).select(); 
    if (error) return null; 
    return data; 
}

async function deleteLocationMob(id) { 
    await ensureDb(); 
    const { error } = await db.from('location_mobs').delete().eq('id', id); 
    return !error; 
}

async function deleteLocationMobsByLocationId(locationId) { 
    await ensureDb(); 
    const { error } = await db.from('location_mobs').delete().eq('location_id', locationId); 
    return !error; 
}