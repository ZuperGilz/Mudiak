/**
 * Client API Mudiak — Terhubung ke Backend Express & Neon PostgreSQL
 * Mendukung akses dari localhost maupun Network IP (HP, Laptop lain di WiFi sama)
 */

export const getApiBase = () => {
  // 1. Prioritaskan Environment Variable Vite saat di-deploy di Vercel / Cloud
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  // 2. Lingkungan development lokal (akses via localhost atau IP WiFi seperti HP)
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return `http://${host}:5000/api`;
    }
    // Jika diakses dari domain publik Vercel tanpa custom backend URL, gunakan relative path /api
    return '/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE = getApiBase();

/**
 * Helper fetch dengan timeout & JSON parsing
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      data: { message: error.name === 'AbortError' ? 'Koneksi ke backend timeout' : error.message },
    };
  }
}

// 1. Auth API
export async function apiLogin(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiRegister(payload) {
  const isOp = payload.role === 'operator';
  const endpoint = isOp ? '/auth/register-operator' : '/auth/register';
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      nama: payload.name,
      email: payload.email,
      password: payload.password,
      noHp: payload.phone,
    }),
  });
}

// 2. Bus / Armada API (Neon)
export async function apiGetBuses(token) {
  return apiRequest('/bus', { method: 'GET', token });
}

export async function apiCreateBus(payload, token) {
  return apiRequest('/bus', {
    method: 'POST',
    token,
    body: JSON.stringify({
      nama: payload.name,
      platNomor: payload.plate,
      kapasitas: Number(payload.capacity),
      kursiDepan: Number(payload.frontSeats || 2),
      kelas: payload.className || 'Eksekutif Travel',
      supir: payload.driver || payload.supir || '',
    }),
  });
}

export async function apiUpdateBus(id, payload, token) {
  return apiRequest(`/bus/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({
      nama: payload.name,
      platNomor: payload.plate,
      kapasitas: Number(payload.capacity),
      kursiDepan: Number(payload.frontSeats || 2),
      kelas: payload.className || 'Eksekutif Travel',
      supir: payload.driver || payload.supir || '',
    }),
  });
}

export async function apiDeleteBus(id, token) {
  return apiRequest(`/bus/${id}`, { method: 'DELETE', token });
}

// 3. Master Kota & Jadwal
export async function apiGetKota() {
  return apiRequest('/kota', { method: 'GET' });
}

export async function apiSearchJadwal(asalId, tujuanId, tanggal) {
  return apiRequest(`/jadwal/search?asalId=${asalId}&tujuanId=${tujuanId}&tanggal=${tanggal}`, {
    method: 'GET',
  });
}

// 4. Pesanan & Tiket API (Neon)
export async function apiGetPesananSaya(token) {
  return apiRequest('/pesanan/saya', { method: 'GET', token });
}

export async function apiGetAllPesanan(token) {
  return apiRequest('/pesanan', { method: 'GET', token });
}

export async function apiCreatePesanan(payload, token) {
  return apiRequest('/pesanan', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function apiVerifikasiPesanan(id, token) {
  return apiRequest(`/pesanan/${id}/verifikasi`, { method: 'PATCH', token });
}

export async function apiTolakPesanan(id, token) {
  return apiRequest(`/pesanan/${id}/tolak`, { method: 'PATCH', token });
}

export async function apiBatalPesanan(id, token) {
  return apiRequest(`/pesanan/${id}/batal`, { method: 'PATCH', token });
}
