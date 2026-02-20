const API = {
  token: localStorage.getItem('token'),

  async request(url, options = {}) {
    const headers = { ...options.headers };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, { ...options, headers, credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return;
      }
      throw new Error(data.error || 'Erro desconhecido');
    }
    return data;
  },

  get(url) { return this.request(url); },

  post(url, body) {
    if (body instanceof FormData) {
      return this.request(url, { method: 'POST', body });
    }
    return this.request(url, { method: 'POST', body: JSON.stringify(body) });
  },

  setAuth(token, user) {
    this.token = token;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  logout() {
    this.request('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },

  requireAuth() {
    if (!this.token) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  requireRole(role) {
    const user = this.getUser();
    if (!user || user.role !== role) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }
};

function formatCurrency(val) {
  return 'R$ ' + (val || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatPercent(val) {
  return ((val || 0) * 100).toFixed(2).replace('.', ',') + '%';
}

function formatDate(str) {
  if (!str) return '-';
  const d = new Date(str);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function scenarioBadge(s) {
  const map = {
    1: '<span class="badge badge-s1">Escalável</span>',
    2: '<span class="badge badge-s2">Otimizar</span>',
    3: '<span class="badge badge-s3">Atenção</span>',
  };
  return map[s] || '<span class="badge badge-info">N/A</span>';
}

function showAlert(id, message, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = message;
  el.style.display = 'block';
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function initSidebar() {
  const user = API.getUser();
  if (!user) return;

  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  const adminGroup = document.getElementById('sidebar-admin-group');

  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role === 'LIDERANCA' ? 'Liderança' : 'Mentorado';
  if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();

  if (adminGroup) {
    adminGroup.style.display = user.role === 'LIDERANCA' ? 'block' : 'none';
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', function (e) {
    e.preventDefault();
    API.logout();
  });

  const currentPage = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}
