function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function getRussianStyleText(styleValue) { switch (styleValue) { case "rare": return "Урон"; case "uncommon": return "Уворот"; case "armor": return "Броня"; case "epic": return "Элита"; default: return styleValue || "—"; } }
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
        'износ' : 'stat-icon-износ'
    }; 
    return 'stat-icon ' + (map[name] || 'stat-icon-износ');
}
function checkAuth() { const user = localStorage.getItem('user'); return user ? JSON.parse(user) : null; }
function displayAdminPanel() { const user = checkAuth(); const ap = document.getElementById('adminPanel'); const up = document.getElementById('userPanel'); const ab = document.getElementById('addItemBtn'); if (!user) { if (ap) ap.style.display = 'none'; if (up) up.style.display = 'none'; if (ab) ab.style.display = 'none'; return; } if (user.role === 'admin') { if (ap) ap.style.display = 'block'; if (up) up.style.display = 'none'; if (ab) ab.style.display = 'block'; const n = document.getElementById('adminName'); if (n) n.textContent = user.name; } else { if (ap) ap.style.display = 'none'; if (up) up.style.display = 'block'; if (ab) ab.style.display = 'none'; const n = document.getElementById('userName'); if (n) n.textContent = user.name; } }
function logout() { localStorage.removeItem('user'); window.location.href = 'auth.html'; }
function openAdminPanel() { window.location.href = 'admin.html'; }
function closeModal(id) { const m = document.getElementById(id); if (m) { m.style.display = 'none'; document.body.style.overflow = ''; } }
window.onclick = function (e) { const ids = ['runesModal', 'demonModal', 'runeModal', 'totemModal', 'editModal', 'editNewsModal', 'item-modal', 'editItemModal']; for (let id of ids) { const m = document.getElementById(id); if (m && e.target === m) { closeModal(id); break; } } };
function openRunesModal() { const m = document.getElementById('runesModal'); if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; } }
function closeRunesModal() { closeModal('runesModal'); }