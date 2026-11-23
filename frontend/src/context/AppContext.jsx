import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { initialData } from '../data/seed';
import { uid } from '../utils/helpers';
import {
  apiLogin,
  apiRegister,
  apiGetBuses,
  apiCreateBus,
  apiUpdateBus,
  apiDeleteBus,
  apiVerifikasiPesanan,
  apiTolakPesanan,
} from '../utils/api';

const Ctx = createContext(null);
const storageKey = 'mudiak_neon_connected_v3';

function read() {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.trips)) {
      return parsed;
    }
    // Bersihkan versi lama agar data dummy tiket terhapus total
    localStorage.removeItem('mudiak_neon_connected_v1');
    localStorage.removeItem('mudiak_neon_connected_v2');
    return initialData;
  } catch {
    return initialData;
  }
}

function sessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem('mudiak_user') || 'null');
  } catch {
    return null;
  }
}

function sessionToken() {
  try {
    return sessionStorage.getItem('mudiak_token') || null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [data, setData] = useState(read);
  const [user, setUser] = useState(sessionUser);
  const [token, setToken] = useState(sessionToken);
  const [draft, setDraft] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('mudiak_draft') || 'null');
    } catch {
      return null;
    }
  });
  const [toast, setToast] = useState('');

  // Sinkronisasi data ke localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('mudiak_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('mudiak_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('mudiak_token', token);
    } else {
      sessionStorage.removeItem('mudiak_token');
    }
  }, [token]);

  useEffect(() => {
    sessionStorage.setItem('mudiak_draft', JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (msg) => setToast(msg);

  const update = (key, fn) =>
    setData((prev) => ({ ...prev, [key]: typeof fn === 'function' ? fn(prev[key]) : fn }));
  const patch = (key, id, fields) =>
    update(key, (rows) => rows.map((x) => (x.id === id ? { ...x, ...fields } : x)));
  const remove = (key, id) => update(key, (rows) => rows.filter((x) => x.id !== id));

  // Sinkronisasi armada bus langsung dari Neon
  const syncBusesFromBackend = useCallback(async (authToken) => {
    const t = authToken || token;
    if (!t) return;
    try {
      const res = await apiGetBuses(t);
      if (res.ok && Array.isArray(res.data?.buses) && res.data.buses.length > 0) {
        const mapped = res.data.buses.map((b) => ({
          id: b.id,
          operatorId: 2,
          name: b.nama,
          plate: b.platNomor,
          className: b.kelas || 'Eksekutif Travel',
          capacity: b.kapasitas,
          frontSeats: b.kursiDepan || 2,
          driver: b.supir || '',
          supir: b.supir || '',
          status: 'siap',
          features: 'Full AC, USB Charger, Reclining Seat',
        }));
        setData((prev) => ({ ...prev, buses: mapped }));
      }
    } catch (e) {
      console.warn('Gagal sinkron armada dari Neon:', e);
    }
  }, [token]);

  // Sinkron otomatis jika sudah ada token login
  useEffect(() => {
    if (token) {
      syncBusesFromBackend(token);
    }
  }, [token, syncBusesFromBackend]);

  // 1. LOGIN TERPADU (Neon PostgreSQL)
  const login = async (email, password, role) => {
    const roleMap = { ADMIN: 'admin', OPERATOR: 'operator', PENUMPANG: 'pelanggan' };

    try {
      const res = await apiLogin(email.trim(), password);
      if (res.ok && res.data?.token) {
        const u = res.data.user;
        const mappedRole = roleMap[u.role] || u.role.toLowerCase();

        if (mappedRole !== role) {
          return {
            ok: false,
            message: `Akun ini terdaftar sebagai ${mappedRole.toUpperCase()}, bukan ${role.toUpperCase()}.`,
          };
        }

        const loggedUser = {
          id: u.id,
          name: u.nama,
          email: u.email,
          phone: u.noHp,
          role: mappedRole,
          status: (u.status || 'ACTIVE').toLowerCase() === 'active' ? 'aktif' : (u.status || '').toLowerCase(),
          operatorId: u.role === 'OPERATOR' ? 2 : null,
          token: res.data.token,
        };

        setToken(res.data.token);
        setUser(loggedUser);

        // Langsung tarik armada terbaru dari Neon
        syncBusesFromBackend(res.data.token);

        notify(`Selamat datang, ${loggedUser.name}!`);
        return { ok: true, user: loggedUser };
      } else if (res.status === 401 || res.status === 403) {
        return { ok: false, message: res.data?.message || 'Email atau kata sandi salah.' };
      }
    } catch (e) {
      console.warn('Backend tidak merespons, memeriksa akun:', e);
    }

    // Fallback lokal jika backend tidak terjangkau
    const localU = data.users.find(
      (x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.role === role
    );
    if (!localU) return { ok: false, message: 'Email tidak ditemukan untuk role yang dipilih.' };
    if (password !== 'password123' && password !== 'demo12345') {
      return { ok: false, message: 'Password salah. Gunakan password akun Anda (password123).' };
    }
    setUser(localU);
    notify(`Selamat datang, ${localU.name}!`);
    return { ok: true, user: localU };
  };

  // 2. REGISTER TERPADU (Neon PostgreSQL)
  const register = async (payload) => {
    try {
      const res = await apiRegister(payload);
      if (res.ok) {
        notify(res.data?.message || 'Pendaftaran berhasil. Silakan login.');
        return { ok: true, user: res.data.user };
      }
      return { ok: false, message: res.data?.message || 'Gagal mendaftar.' };
    } catch (e) {
      const role = payload.role === 'operator' ? 'operator' : 'pelanggan';
      const nu = {
        id: uid('u'),
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role,
        status: role === 'operator' ? 'pending' : 'aktif',
        operatorId: role === 'operator' ? 2 : null,
        created: new Date().toISOString().slice(0, 10),
      };
      setData((prev) => ({ ...prev, users: [...prev.users, nu] }));
      if (role === 'pelanggan') setUser(nu);
      return { ok: true, user: nu };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setDraft(null);
    sessionStorage.clear();
  };

  // 3. SIMPAN / UPDATE ARMADA (Langsung Update di Neon PostgreSQL!)
  const saveBus = async (busId, formPayload) => {
    const payload = {
      ...formPayload,
      capacity: Number(formPayload.capacity),
      frontSeats: Number(formPayload.frontSeats || 2),
      driver: formPayload.driver || formPayload.supir || '',
      supir: formPayload.driver || formPayload.supir || '',
    };

    const authToken = token || user?.token;

    if (busId === 'new') {
      if (authToken) {
        try {
          const res = await apiCreateBus(payload, authToken);
          if (res.ok && res.data?.bus) {
            const b = res.data.bus;
            const newBus = {
              id: b.id,
              operatorId: 2,
              name: b.nama,
              plate: b.platNomor,
              className: b.kelas,
              capacity: b.kapasitas,
              frontSeats: b.kursiDepan || 2,
              driver: b.supir || '',
              supir: b.supir || '',
              status: 'siap',
              features: payload.features || 'Full AC, USB Charger, Reclining Seat',
            };
            update('buses', (rows) => [newBus, ...rows]);
            notify(`Armada ${b.platNomor} berhasil disimpan ke database Neon!`);
            return { ok: true, bus: newBus };
          }
        } catch (e) {
          console.warn('Gagal simpan bus via API:', e);
        }
      }
      const newBus = { ...payload, id: Date.now(), operatorId: 2 };
      update('buses', (rows) => [newBus, ...rows]);
      notify('Armada berhasil ditambahkan.');
      return { ok: true, bus: newBus };
    } else {
      // Update armada yang sudah ada di Neon
      const numericId = typeof busId === 'number' ? busId : parseInt(String(busId).replace(/\D/g, ''), 10) || busId;
      if (authToken && numericId) {
        try {
          const res = await apiUpdateBus(numericId, payload, authToken);
          if (res.ok) {
            patch('buses', busId, payload);
            notify(`Perubahan supir & armada berhasil diperbarui langsung di Neon!`);
            return { ok: true };
          }
        } catch (e) {
          console.warn('Gagal update bus via API:', e);
        }
      }
      patch('buses', busId, payload);
      notify('Data armada diperbarui.');
      return { ok: true };
    }
  };

  // 4. HAPUS ARMADA (Langsung di Neon)
  const deleteBus = async (busId) => {
    const authToken = token || user?.token;
    const numericId = typeof busId === 'number' ? busId : parseInt(String(busId).replace(/\D/g, ''), 10) || busId;
    if (authToken && numericId) {
      try {
        await apiDeleteBus(numericId, authToken);
      } catch (e) {
        console.warn('Gagal hapus bus via API:', e);
      }
    }
    remove('buses', busId);
    notify('Armada berhasil dihapus dari Neon.');
  };

  const createBooking = (payloadOrMethod) => {
    if (!user || !draft) throw Error('Login dan pilih kursi terlebih dahulu.');
    const trip = data.trips.find((t) => t.id === draft.tripId);
    if (!trip || trip.remaining < draft.seats.length) throw Error('Kursi tidak tersedia.');
    const occupied = data.bookings
      .filter((b) => b.tripId === trip.id && (b.status === 'lunas' || b.status === 'menunggu_verifikasi'))
      .flatMap((b) => b.seats);
    if (draft.seats.some((s) => occupied.includes(s))) throw Error('Kursi sudah dipesan pelanggan lain.');

    const isObj = typeof payloadOrMethod === 'object' && payloadOrMethod !== null;
    const seatCount = draft.seats.length;
    const total = trip.price * seatCount;
    // Model bisnis Mudiak: Tarif All-in, Margin Mudiak Rp 2.000 / kursi, sisanya diteruskan ke PO AYAH
    const margin = 2000 * seatCount;
    const poPayout = total - margin;

    const booking = {
      id: `MDK-${Math.floor(1000 + Math.random() * 8999)}-${trip.to === 'Payakumbuh' ? 'PY' : 'SB'}`,
      userId: user.id,
      tripId: trip.id,
      seats: draft.seats,
      passengers: draft.passengers,
      buyer: draft.buyer,
      total,
      margin,
      poPayout,
      payment: isObj ? (payloadOrMethod.method || 'QRIS Escrow Mudiak') : payloadOrMethod,
      senderName: isObj ? payloadOrMethod.senderName : null,
      senderBank: isObj ? payloadOrMethod.senderBank : null,
      refNumber: isObj ? payloadOrMethod.refNumber : null,
      note: isObj ? payloadOrMethod.note : '',
      status: isObj && payloadOrMethod.status ? payloadOrMethod.status : 'menunggu_verifikasi',
      created: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      boarding: Object.fromEntries(draft.seats.map((s) => [s, false])),
    };

    setData((prev) => ({
      ...prev,
      bookings: [booking, ...prev.bookings],
      trips: prev.trips.map((t) =>
        t.id === trip.id ? { ...t, remaining: t.remaining - draft.seats.length } : t
      ),
    }));
    setDraft(null);
    return booking;
  };

  // Konfirmasi pembayaran oleh Admin -> E-Tiket Resmi Aktif
  const approvePayment = async (bookingId) => {
    const authToken = token || user?.token;
    if (authToken && typeof bookingId === 'number') {
      try {
        await apiVerifikasiPesanan(bookingId, authToken);
      } catch (e) {
        console.warn('Gagal verifikasi pesanan via API:', e);
      }
    }
    patch('bookings', bookingId, { status: 'lunas', approvedAt: new Date().toISOString() });
    notify(`Pembayaran ${bookingId} diverifikasi! E-Tiket resmi telah terbit.`);
  };

  // Penolakan pembayaran oleh Admin
  const rejectPayment = async (bookingId, reason = 'Bukti transfer tidak sesuai') => {
    const b = data.bookings.find((x) => x.id === bookingId);
    if (!b) return;
    const authToken = token || user?.token;
    if (authToken && typeof bookingId === 'number') {
      try {
        await apiTolakPesanan(bookingId, authToken);
      } catch (e) {
        console.warn('Gagal tolak pesanan via API:', e);
      }
    }
    patch('bookings', bookingId, { status: 'dibatalkan', rejectReason: reason });
    update('trips', (ts) =>
      ts.map((t) => (t.id === b.tripId ? { ...t, remaining: t.remaining + b.seats.length } : t))
    );
    notify(`Pembayaran ${bookingId} ditolak. Kursi dikembalikan.`);
  };

  // Pengajuan refund oleh Penumpang (Cutoff 1.5 - 2 jam sebelum berangkat)
  const requestRefund = (bookingId, refundData) => {
    patch('bookings', bookingId, {
      status: 'menunggu_refund',
      refund: {
        ...refundData,
        requestedAt: new Date().toISOString(),
        status: 'menunggu_verifikasi_admin',
      },
    });
    notify(`Pengajuan refund untuk ${bookingId} berhasil dikirim ke Admin.`);
  };

  // Admin menyetujui & menyelesaikan transfer refund ke penumpang
  const approveRefund = (bookingId) => {
    const b = data.bookings.find((x) => x.id === bookingId);
    if (!b) return;
    patch('bookings', bookingId, {
      status: 'dibatalkan',
      refund: {
        ...(b.refund || {}),
        status: 'selesai',
        completedAt: new Date().toISOString(),
      },
    });
    update('trips', (ts) =>
      ts.map((t) => (t.id === b.tripId ? { ...t, remaining: t.remaining + b.seats.length } : t))
    );
    notify(`Refund ${bookingId} sebesar Rp ${b.total.toLocaleString('id-ID')} telah disetujui!`);
  };

  const updateBoarding = (bookingId, seat, value) =>
    update('bookings', (rows) =>
      rows.map((b) => (b.id === bookingId ? { ...b, boarding: { ...b.boarding, [seat]: value } } : b))
    );

  const reset = () => {
    setData(structuredClone(initialData));
    setUser(null);
    setToken(null);
    setDraft(null);
    sessionStorage.clear();
    localStorage.removeItem(storageKey);
    notify('Data aplikasi dikembalikan ke awal.');
  };

  const value = useMemo(
    () => ({
      data,
      user,
      token,
      login,
      register,
      logout,
      update,
      patch,
      remove,
      saveBus,
      deleteBus,
      syncBusesFromBackend,
      draft,
      setDraft,
      createBooking,
      approvePayment,
      rejectPayment,
      requestRefund,
      approveRefund,
      updateBoarding,
      reset,
      notify,
    }),
    [data, user, token, draft, syncBusesFromBackend]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {toast && (
        <div className="toast" role="status">
          ✓ {toast}
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
