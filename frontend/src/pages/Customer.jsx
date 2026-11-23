import React,{useMemo,useState,useEffect} from 'react';
import {Link,useNavigate,useParams,useLocation} from 'react-router-dom';
import {BusFront,ArrowRight,ArrowLeft,MapPin,CalendarDays,Clock3,Search,ShieldCheck,Ticket,CheckCircle2,Armchair,Wifi,Coffee,Usb,Star,Route as RouteIcon,Phone,Mail,UserRound,Wallet,Download,Printer,Copy,AlertCircle,RefreshCcw,ChevronDown,ChevronRight,Users,LogIn,Eye,EyeOff,LockKeyhole,House,MessageCircle,HelpCircle,RotateCcw,BriefcaseBusiness,ThumbsUp,CreditCard,Building2,Upload,Check,QrCode,XCircle} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {Brand,Badge,Status,Field,PageTitle,Modal,NoResults} from '../components/UI';
import {cities,heroPhoto} from '../data/seed';
import {rupiah,prettyDate} from '../utils/helpers';
const DEFAULT_DATE='2026-11-16';
function SearchPanel({from,setFrom,to,setTo,date,setDate,onSearch}){return <div className="search-panel"><div className="search-grid"><Field label="Kota Asal"><select value={from} onChange={e=>setFrom(e.target.value)}>{cities.map(x=><option key={x}>{x}</option>)}</select></Field><button aria-label="Tukar kota" className="swap-btn" onClick={()=>{setFrom(to);setTo(from)}}><RefreshCcw size={18}/></button><Field label="Kota Tujuan"><select value={to} onChange={e=>setTo(e.target.value)}>{cities.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Tanggal Berangkat"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field><button className="btn btn-primary search-submit" onClick={onSearch}><Search size={17}/> Cari Jadwal</button></div><div className="search-hints"><span>Pintasan tanggal:</span>{[['Hari Ini','2026-11-08'],['Besok','2026-11-09'],['Senin Terpilih',DEFAULT_DATE],['20 Nov','2026-11-20']].map(([label,v])=><button key={label} onClick={()=>setDate(v)} className={date===v?'hint-active':''}>{label}</button>)}<span className="search-safe"><ShieldCheck size={13}/> Tarif All-in Bebas Biaya Admin</span></div></div>}
export function Home(){const {data,notify}=useApp();const navigate=useNavigate();const location=useLocation();const parseQuery=()=>{const p=new URLSearchParams(window.location.search);return {from:p.get('from')||'Padang',to:p.get('to')||'Bukittinggi',date:p.get('date')||DEFAULT_DATE}};const [query,setQuery]=useState(parseQuery);const [from,setFrom]=useState(query.from);const [to,setTo]=useState(query.to);const [date,setDate]=useState(query.date);const [filter,setFilter]=useState('Semua PO');const [sort,setSort]=useState('awal');useEffect(()=>{const p=new URLSearchParams(location.search);if(p.has('from')||p.has('to')||p.has('date')){const n={from:p.get('from')||'Padang',to:p.get('to')||'Bukittinggi',date:p.get('date')||DEFAULT_DATE};setQuery(n);setFrom(n.from);setTo(n.to);setDate(n.date)}},[location.search]);
const matches=data.trips.filter(t=>t.from===query.from&&t.to===query.to&&t.date===query.date&&t.status==='aktif').filter(t=>filter==='Semua PO'||data.operators.find(o=>o.id===t.operatorId)?.name===filter).sort((a,b)=>sort==='harga'?a.price-b.price:sort==='akhir'?b.time.localeCompare(a.time):a.time.localeCompare(b.time));
const operators=[...new Set(data.trips.filter(t=>t.from===query.from&&t.to===query.to).map(t=>data.operators.find(o=>o.id===t.operatorId)?.name).filter(Boolean))];
return <><section className="landing-hero"><div className="container"><div className="hero-top"><div><span className="overline"><MapPin size={13} style={{color:'#b45309'}}/> LAYANAN TIKET TRAVEL RESMI SUMATERA BARAT</span><h1>Pulang Basamo Lebih Tenang Bersama <em>Mudiak</em></h1><p>Pesan tiket travel antarkota di Ranah Minang dengan kepastian nomor kursi, jadwal akurat, dan armada Toyota HiAce & Microbus PO AYAH. Padang, Bukittinggi, Payakumbuh, hingga Solok dalam satu genggaman.</p></div><div className="hero-trust"><div className="bus-total"><BusFront/><div><strong>16</strong><Badge tone="green">Armada Aktif</Badge><small>HiAce & Microbus PO AYAH</small></div></div><span><ShieldCheck size={14}/> Mitra Resmi Berizin Trayek BA</span></div></div><div className="scenic" style={{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.55)), url('${heroPhoto}')`}}><span className="scenic-tag"><MapPin size={17}/> RUTE LINTAS RANAH MINANG <strong>Padang • Bukittinggi • Payakumbuh • Solok</strong></span><span className="scenic-weather">☀️ Koridor Lembah Anai</span></div><SearchPanel {...{from,setFrom,to,setTo,date,setDate}} onSearch={()=>{if(from===to){notify('Kota asal dan tujuan tidak boleh sama.');return}setQuery({from,to,date});setFilter('Semua PO');navigate(`/jadwal?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`)}}/></div></section><section className="schedule-section container"><div className="section-header"><div><h2>Jadwal Travel: {query.from} → {query.to} <Badge tone="red">{matches.length} Jadwal Siap Jalan</Badge></h2><p><CalendarDays size={13}/> {prettyDate(query.date)} · Keberangkatan Terverifikasi Pool</p></div><label className="inline-select">Urutkan: <select value={sort} onChange={e=>setSort(e.target.value)}><option value="awal">Keberangkatan Paling Awal</option><option value="akhir">Keberangkatan Paling Akhir</option><option value="harga">Harga Terendah</option></select></label></div><div className="filter-chips">{['Semua PO',...operators].map(op=><button key={op} onClick={()=>setFilter(op)} className={filter===op?'selected':''}>{op}</button>)}</div>{matches.length?matches.map(t=>{const operator=data.operators.find(o=>o.id===t.operatorId);const bus=data.buses.find(b=>b.id===t.busId);return <div className="trip-card card" key={t.id}><div className="trip-operator"><div className="po-logo">{operator?.code||'PO'}</div><div><b>{operator?.name}</b><small>{t.className}</small><span className="plate">▣ {bus?.plate}</span></div></div><div className="trip-time"><strong>{t.time}<small> WIB</small></strong><p>{t.originPool}<small>{t.from}</small></p></div><div className="trip-path"><span><Clock3 size={13}/> 2j 30m • {t.way}</span><div className="path-line"/><small>Jadwal Tepat Waktu</small></div><div className="trip-time"><strong>{t.arrival}<small> WIB</small></strong><p>{t.destinationPool}<small>{t.to}</small></p></div><div className="trip-price"><Badge tone={t.remaining<=5?'amber':'green'}>{t.remaining<=5?'HAMPIR PENUH':'TERSEDIA'}</Badge><small>Sisa {t.remaining} kursi</small><strong>{rupiah(t.price)}<small> / kursi</small></strong><button className="btn btn-primary" onClick={()=>navigate(`/pesan/${t.id}`)}>Pilih Kursi <ArrowRight size={15}/></button></div><div className="trip-features"><span><Wifi size={12}/> AC</span><span><Armchair size={12}/> Reclining Seat</span><span><Usb size={12}/> USB Charger</span><span><Coffee size={12}/> Air Mineral</span><span><ShieldCheck size={12}/> Kursi Terkonfirmasi</span></div></div>}) : <div className="empty-schedule card"><AlertCircle size={28}/><h3>Tidak ada jadwal keberangkatan untuk rute dan tanggal ini</h3><p>Ubah kota, tanggal, atau filter PO untuk melihat pilihan lainnya.</p><button className="btn btn-primary" onClick={()=>{setFrom('Padang');setTo('Bukittinggi');setDate(DEFAULT_DATE);setQuery({from:'Padang',to:'Bukittinggi',date:DEFAULT_DATE});setFilter('Semua PO')}}>Lihat Jadwal Terpopuler</button></div>}</section><section className="trust-section container"><div className="section-center"><span className="eyebrow">STANDAR KEBERANGKATAN RANAH MINANG</span><h2>Jaminan Perjalanan Mudiak Aman</h2><p>Layanan terstandarisasi demi kenyamanan dunsanak dan kepastian kursi tanpa calo.</p></div><div className="trust-grid">{[[ShieldCheck,'100% Kepastian Kursi Tanpa Calo','Nomor kursi langsung terkunci saat pemesanan, bebas antre dan rebutan kursi di pool keberangkatan.'],[CheckCircle2,'Armada Resmi Berplat BA','Didukung 16 armada Toyota HiAce & Microbus PO AYAH ber-AC dengan supir berpengalaman.'],[RefreshCcw,'Garansi Escrow & Batas Refund 2 Jam','Pembayaran aman di rekening penampung. Refund mandiri dapat diajukan hingga 2 jam sebelum keberangkatan.']].map(([Icon,title,desc])=><div className="card trust-card" key={title}><span className="trust-icon"><Icon size={21}/></span><h3>{title}</h3><p>{desc}</p><span className="trust-more">Pelajari SOP <ArrowRight size={13}/></span></div>)}</div></section></>}
export function Auth({initialMode='login'}){const {login,register,user,notify}=useApp();const navigate=useNavigate();const location=useLocation();const [mode,setMode]=useState(initialMode);const [role,setRole]=useState(location.state?.role||'pelanggan');const [form,setForm]=useState({name:'',email:'',password:'',phone:'',company:'',pool:''});const [error,setError]=useState('');const [visible,setVisible]=useState(false);const [forgot,setForgot]=useState(false);const redirect=(u)=>navigate(location.state?.from|| (u.role==='pelanggan'?'/':`/${u.role}`),{replace:true});useEffect(()=>{if(user)redirect(user)},[]);
const set=(k,v)=>setForm(f=>({...f,[k]:v}));const submit=async (e)=>{e.preventDefault();setError('');if(forgot){notify('Silakan hubungi administrator Mudiak untuk bantuan reset kata sandi.');setForgot(false);return}if(mode==='login'){const r=await login(form.email,form.password,role);if(!r.ok)setError(r.message);else redirect(r.user)}else{if(form.password.length<8)return setError('Password minimal 8 karakter.');const r=await register({...form,role});if(!r.ok)setError(r.message);else if(role==='operator'){notify('Pendaftaran Operator masuk status pending. Silakan tunggu persetujuan Admin.');setMode('login')}else{notify('Akun berhasil dibuat. Silakan login dengan email dan password Anda.');redirect(r.user)}}};
return <div className="auth-page"><div className="container auth-top"><Brand/><Link to="/" className="link-dark"><ArrowLeft size={16}/> Kembali ke Beranda</Link></div><div className="auth-wrapper"><div className="auth-brand-panel"><div className="auth-panel-top"><Brand/><Badge tone="amber">LAYANAN TERPADU</Badge></div><span className="auth-crest">TIKET RESMI RANAH MINANG</span><h1>Perjalanan Kampuang Halaman dalam Satu Genggaman</h1><p>Platform pemesanan tiket travel antarkota Sumatera Barat bersama PO AYAH. Pesan kursi favorit, bayar via QRIS Escrow, dan berangkat dengan tenang.</p><div className="auth-illustration"><div className="auth-ticket-art"><span>🚌 PO AYAH Travel<br/><small>Padang • Bukittinggi • Payakumbuh • Solok</small></span><Badge tone="green">Armada Beroperasi</Badge></div><small>“Adat Basandi Syarak, Mudiak Basamo Basidunsanak”</small></div><div className="auth-panel-bottom"><div><b>16 Unit</b><small>Armada PO AYAH</small></div><div><b>All-in</b><small>Bebas Biaya Tambahan</small></div><div><b>Resmi</b><small>E-Tiket & Boarding</small></div></div></div><div className="auth-form-panel"><div className="auth-return"><Link to="/"><ArrowLeft size={17}/> Kembali ke Beranda</Link><Badge tone="neutral">Sumatera Barat (ID)</Badge></div><div className="auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('')}}><LogIn size={17}/> Masuk (Login)</button><button className={mode==='register'?'active':''} onClick={()=>{setMode('register');setError('')}}><Users size={17}/> Daftar Akun (Register)</button></div><h2>{forgot?'Lupa Kata Sandi?':mode==='login'?'Selamat Datang di Mudiak':'Buat Akun Baru Mudiak'}</h2><p className="muted">{forgot?'Masukkan email Anda untuk menerima panduan pemulihan akun.':mode==='login'?'Masukkan email dan kata sandi yang terdaftar di akun Mudiak Anda.':'Daftarkan akun penumpang atau ajukan kemitraan operator PO.'}</p><form className="auth-form" onSubmit={submit}>{!forgot&&<><span className="field-label">Pilih Peran Akun</span><div className="role-switch">{[['pelanggan','Pelanggan',UserRound],['operator','Operator PO',BusFront],['admin','Super Admin',ShieldCheck]].filter(([r])=>mode==='login'||r!=='admin').map(([r,label,Icon])=><button type="button" key={r} onClick={()=>{setRole(r);setError('')}} className={role===r?'active':''}><Icon size={15}/> {label}</button>)}</div></>}{mode==='register'&&!forgot&&<><Field label="Nama Lengkap"><input required value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Nama lengkap Anda"/></Field><Field label="Nomor WhatsApp"><input required value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="08xxxxxxxxxx"/></Field>{role==='operator'&&<><Field label="Nama Perusahaan Otobus (PO)"><input required value={form.company} onChange={e=>set('company',e.target.value)} placeholder="Contoh: PO AYAH Padang"/></Field><Field label="Alamat Pool"><input value={form.pool} onChange={e=>set('pool',e.target.value)} placeholder="Padang, Sumatera Barat"/></Field></>}</>}<Field label="Alamat Email"><input required type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="contoh: email@domain.com"/></Field>{!forgot&&<Field label="Kata Sandi"><div className="password-field"><input required minLength={8} type={visible?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Minimal 8 karakter"/><button type="button" onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></Field>}{mode==='login'&&!forgot&&<div className="auth-help"><label><input type="checkbox" defaultChecked/> Ingat saya di perangkat ini</label><button type="button" onClick={()=>setForgot(true)}>Lupa kata sandi?</button></div>}{error&&<div className="form-error">{error}</div>}<button type="submit" className="btn btn-primary btn-block">{forgot?'Kirim Permintaan':mode==='login'?'Masuk Sekarang':'Daftar Sekarang'} <ArrowRight size={16}/></button>{forgot&&<button type="button" className="btn btn-soft btn-block" onClick={()=>setForgot(false)}>Kembali ke Login</button>}</form></div></div></div>}
function SeatMap({capacity=16,frontSeats=2,driverName='',available=[],selected=[],onToggle}){
  const fSeats=Number(frontSeats)===3?3:2;
  const cap=Number(capacity)||16;
  const frontRowSeatNums=Array.from({length:fSeats},(_,i)=>i+1);
  const remainingSeats=[];
  for(let s=fSeats+1;s<=cap;s++){remainingSeats.push(s)}
  const rows=[];
  for(let i=0;i<remainingSeats.length;i+=4){rows.push(remainingSeats.slice(i,i+4))}
  const renderSeatBtn=(n)=>{
    const isAvail=available.includes(n);
    const isChosen=selected.includes(n);
    return <button type="button" key={n} disabled={!isAvail} className={'seat '+(!isAvail?'occupied':isChosen?'chosen':'available')} onClick={()=>onToggle(n)} title={`Kursi ${String(n).padStart(2,'0')}`}>
      {String(n).padStart(2,'0')}<small>{isChosen?'✓':isAvail?'♧':'♟'}</small>
    </button>;
  };
  return <div className="travel-seat-map">
    <div className="seat-map-top"><span style={{display:'inline-flex',alignItems:'center',gap:6}}><BusFront size={17}/> PINTU DEPAN</span><span className="driver-badge">◉ KABIN SUPIR</span></div>
    <div className="front-row-wrapper">
      <div className="front-passengers-side">
        <small className="front-row-label">Samping Supir ({fSeats} Bangku)</small>
        <div className="front-seats-cluster">{frontRowSeatNums.map(renderSeatBtn)}</div>
      </div>
      <div className="seat-aisle-divider"><span>Pintu</span></div>
      <div className="driver-cabin-box">
        <div className="driver-wheel-icon">🛞</div>
        <div className="driver-cabin-text"><strong>SUPIR</strong><small>{driverName||'Awak PO'}</small></div>
      </div>
    </div>
    <div className="travel-rows-container">
      {rows.map((rowSeats,rowIndex)=>{
        const leftSeats=rowSeats.slice(0,2);
        const rightSeats=rowSeats.slice(2,4);
        return <div className="travel-seat-row" key={rowIndex}>
          <div className="seat-pair left">{leftSeats.map(renderSeatBtn)}{leftSeats.length===1&&<div className="seat-placeholder"/>}</div>
          <div className="seat-aisle">R–{rowIndex+2}</div>
          <div className="seat-pair right">{rightSeats.map(renderSeatBtn)}{rightSeats.length===1&&<div className="seat-placeholder"/>}</div>
        </div>;
      })}
    </div>
    <div className="seat-map-bottom"><span>🚪 Akses Pintu Depan/Tengah</span><span>🎒 Bagasi Penumpang</span><span>❄️ Full AC Travel</span></div>
  </div>;
}
export function Checkout(){const {id}=useParams();const {data,user,setDraft,notify}=useApp();const navigate=useNavigate();const trip=data.trips.find(x=>x.id===id);const [selected,setSelected]=useState([]);const [buyer,setBuyer]=useState({name:user?.name||'',email:user?.email||'',phone:user?.phone||''});const [passengers,setPassengers]=useState({});if(!trip)return <div className="container page-space"><NoResults title="Jadwal tidak ditemukan"/></div>;
const bus=data.buses.find(x=>x.id===trip.busId)||{capacity:16,frontSeats:2,driver:''};const po=data.operators.find(x=>x.id===trip.operatorId);const used=data.bookings.filter(b=>b.tripId===trip.id&&(b.status==='lunas'||b.status==='menunggu_verifikasi')).flatMap(b=>b.seats);
const allSeatNums=Array.from({length:bus.capacity||16},(_,i)=>i+1);
const available=allSeatNums.filter(s=>!used.includes(s));
const toggle=n=>setSelected(prev=>prev.includes(n)?prev.filter(x=>x!==n):prev.length>=5?prev:[...prev,n].sort((a,b)=>a-b));const submit=e=>{e.preventDefault();if(!selected.length)return notify('Pilih minimal satu kursi sebelum melanjutkan.');setDraft({tripId:trip.id,seats:selected,passengers:selected.map(s=>({name:passengers[s]||buyer.name,seat:s})),buyer});if(!user){navigate('/login',{state:{from:'/pembayaran',role:'pelanggan'}})}else if(user.role!=='pelanggan'){notify('Pemesanan tiket perlu login sebagai pelanggan.')}else navigate('/pembayaran')};
return <div className="container checkout-page"><div className="breadcrumbs"><Link to="/">Beranda</Link><ChevronRight size={13}/><Link to="/jadwal">Hasil Pencarian</Link><ChevronRight size={13}/><b>Pilih Kursi & Checkout</b></div><div className="card trip-banner"><span className="accent-line"/><div className="trip-banner-info"><div className="large-bus"><BusFront size={24}/></div><div><div className="chip-row"><Badge tone="amber">{po?.name}</Badge><Badge>{trip.className}</Badge><Badge>{bus.plate}</Badge>{bus.driver&&<Badge tone="green">Sopir: {bus.driver}</Badge>}</div><h2>{trip.from} <span>→</span> {trip.to}</h2><p><CalendarDays size={14}/> {prettyDate(trip.date)} • {trip.time} WIB　 <MapPin size={13}/> {trip.originPool} → {trip.destinationPool}</p><small><Clock3 size={12}/> Est. 2 jam 30 menit • {trip.way}</small></div></div><div className="banner-price"><small>TARIF PER KURSI (ALL-IN)</small><b>{rupiah(trip.price)}</b><Link to="/jadwal" className="btn btn-soft btn-sm"><ArrowLeft size={14}/> Ganti Jadwal</Link></div></div><div className="checkout-grid"><div className="card seat-panel"><div className="panel-heading"><div><h3><Armchair size={20}/> Pilih Tempat Duduk Travel ({bus.capacity} Kursi)</h3><p>Baris 1: Supir & {bus.frontSeats||2} Kursi Samping • Baris 2+: Konfigurasi 2–2</p></div><Badge tone="green">Sisa {trip.remaining} Kursi</Badge></div><div className="seat-legend"><span><i className="square free"/> Tersedia ({available.length})</span><span><i className="square full"/> Terisi ({bus.capacity-available.length})</span><span><i className="square picked"/> Dipilih ({selected.length})</span></div><SeatMap capacity={bus.capacity} frontSeats={bus.frontSeats||2} driverName={bus.driver||bus.supir||''} available={available} selected={selected} onToggle={toggle}/><div className="attention-note"><AlertCircle size={17}/> Denah bangku mencerminkan armada travel PO AYAH (HiAce/Microbus 16-18 kursi). Kursi depan berada tepat di samping supir.</div><div className="seat-photo" style={{backgroundImage:`linear-gradient(0deg,rgba(0,0,0,.8),transparent),url('${heroPhoto}')`}}><span>RUTE IKONIK SUMATERA BARAT<br/><b>Panorama Lembah Anai & Singgalang</b><br/>Kursi sisi kanan menyajikan lanskap pegunungan yang indah.</span></div></div><form className="card checkout-side" onSubmit={submit}><div className="checkout-header"><span>LANGKAH 2 DARI 3</span><h3>Data Pemesan & Checkout</h3></div><div className="chosen-row"><small>KURSI AKTIF DIPILIH</small><div>{selected.length?selected.map(s=><Badge key={s} tone="red">♧ Kursi {String(s).padStart(2,'0')}</Badge>):<span className="muted">Belum ada kursi dipilih</span>}</div></div><div className="notice-peach"><ShieldCheck size={15}/> Tarif yang tertera adalah tarif flat final. Pembayaran menggunakan QRIS Escrow resmi Mudiak.</div><Field label="Nama Lengkap Pemesan"><input required value={buyer.name} onChange={e=>setBuyer({...buyer,name:e.target.value})} placeholder="Sesuai KTP"/></Field><Field label="Nomor WhatsApp / HP Aktif"><input required value={buyer.phone} onChange={e=>setBuyer({...buyer,phone:e.target.value})} placeholder="08xxxxxxxxxx"/></Field><Field label="Alamat Surel (Email)"><input required type="email" value={buyer.email} onChange={e=>setBuyer({...buyer,email:e.target.value})} placeholder="nama@email.com"/></Field><Field label="Titik Naik (Pickup Point)"><select><option>{trip.originPool} ({trip.from})</option></select></Field><Field label="Titik Turun (Drop Point)"><select><option>{trip.destinationPool} ({trip.to})</option></select></Field><label className="inline-check"><input required type="checkbox" defaultChecked/> Gunakan identitas pemesan dan setujui ketentuan perjalanan.</label><div className="manifest-input"><span>DAFTAR MANIFEST PENUMPANG</span>{selected.length?selected.map((s,i)=><Field key={s} label={`Kursi ${String(s).padStart(2,'0')} · Penumpang ${i+1}`}><input required placeholder="Nama penumpang sesuai identitas" value={passengers[s]??(i===0?buyer.name:'')} onChange={e=>setPassengers(p=>({...p,[s]:e.target.value}))}/></Field>):<p>Silakan pilih kursi pada denah armada terlebih dahulu.</p>}</div><div className="price-receipt"><h4>Rincian Biaya Tiket</h4><div>Tarif Armada ({rupiah(trip.price)} × {selected.length} kursi)<b>{rupiah(trip.price*selected.length)}</b></div><div>Asuransi Jasa Raharja <b>Termasuk (All-in)</b></div><div>Biaya Layanan Tambahan <b>Rp 0 (Bebas Biaya)</b></div><hr/><small>TOTAL PEMBAYARAN TEPAT</small><strong>{rupiah(trip.price*selected.length)}</strong></div><button disabled={!selected.length} className="btn btn-primary btn-block" type="submit">Lanjut ke Pembayaran QRIS <ArrowRight size={16}/></button><p className="checkout-secure"><LockKeyhole size={13}/> Pembayaran aman via QRIS Escrow Mudiak</p></form></div></div>}

function QrisDisplay({ amount, merchant = 'PO AYAH / MUDIAK ESCROW', nmid = 'ID102026MUDIAK01' }) {
  const [copied, setCopied] = useState(false);
  const copyAmt = () => {
    navigator.clipboard?.writeText(String(amount));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrDots = useMemo(() => {
    const matrix = [];
    const size = 25;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inTL = r < 7 && c < 7;
        const inTR = r < 7 && c >= size - 7;
        const inBL = r >= size - 7 && c < 7;
        const inCenter = r >= 10 && r <= 14 && c >= 10 && c <= 14;
        if (inTL || inTR || inBL || inCenter) continue;
        const hash = (r * 37 + c * 17 + (amount % 997)) % 10;
        if (hash > 4) matrix.push({ r, c });
      }
    }
    return matrix;
  }, [amount]);

  return (
    <div className="qris-card-wrapper">
      <div className="qris-card-header">
        <div className="qris-header-logo">
          <span className="qris-title-bold">QRIS</span>
          <span className="qris-gpn-badge">GPN</span>
        </div>
        <span className="qris-sub-header">ASOSIASI SISTEM PEMBAYARAN INDONESIA</span>
      </div>
      <div className="qris-merchant-info">
        <h4>{merchant}</h4>
        <p>Rekening Penampung Resmi Mudiak Ranah Minang</p>
        <span className="qris-nmid-pill">NMID: {nmid} • A01</span>
      </div>
      <div className="qris-qr-container">
        <div className="qris-qr-box">
          <svg width="220" height="220" viewBox="0 0 250 250" className="qris-svg">
            <rect width="250" height="250" fill="#ffffff" />
            <rect x="10" y="10" width="70" height="70" fill="#1e181b" rx="6" />
            <rect x="20" y="20" width="50" height="50" fill="#ffffff" rx="4" />
            <rect x="30" y="30" width="30" height="30" fill="#1e181b" rx="2" />
            <rect x="170" y="10" width="70" height="70" fill="#1e181b" rx="6" />
            <rect x="180" y="20" width="50" height="50" fill="#ffffff" rx="4" />
            <rect x="190" y="30" width="30" height="30" fill="#1e181b" rx="2" />
            <rect x="10" y="170" width="70" height="70" fill="#1e181b" rx="6" />
            <rect x="20" y="180" width="50" height="50" fill="#ffffff" rx="4" />
            <rect x="30" y="190" width="30" height="30" fill="#1e181b" rx="2" />
            {Array.from({ length: 11 }, (_, i) => (
              <rect key={`th-${i}`} x={85 + i * 8} y="41" width="5" height="5" fill="#1e181b" />
            ))}
            {Array.from({ length: 11 }, (_, i) => (
              <rect key={`tv-${i}`} x="41" y={85 + i * 8} width="5" height="5" fill="#1e181b" />
            ))}
            {qrDots.map((d, i) => (
              <rect key={i} x={10 + d.c * 9.2} y={10 + d.r * 9.2} width="7.5" height="7.5" fill="#1e181b" rx="1.5" />
            ))}
            <rect x="95" y="98" width="60" height="54" fill="#ffffff" rx="8" stroke="#ebdfe5" strokeWidth="2" />
          </svg>
          <div className="qris-qr-center-logo">QRIS</div>
        </div>
      </div>
      <div className="qris-nominal-box">
        <div>
          <small>NOMINAL TEPAT ALL-IN</small>
          <strong>{rupiah(amount)}</strong>
        </div>
        <button type="button" onClick={copyAmt} className="qris-copy-btn">
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Tersalin' : 'Salin Nominal'}
        </button>
      </div>
    </div>
  );
}

function getRemainingHours(trip) {
  if (!trip) return 5;
  try {
    const [h, m] = (trip.time || '08:00').split(':').map(Number);
    const d = new Date(`${trip.date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60);
    return isNaN(diff) ? 5 : diff;
  } catch {
    return 5;
  }
}

export function Payment(){
  const {draft,data,createBooking,notify}=useApp();
  const navigate=useNavigate();
  const [senderName,setSenderName]=useState(draft?.buyer?.name||'');
  const [senderBank,setSenderBank]=useState('BCA');
  const [refNumber,setRefNumber]=useState('');
  const [processing,setProcessing]=useState(false);
  const [timeLeft,setTimeLeft]=useState(900);

  useEffect(()=>{
    const t=setInterval(()=>setTimeLeft(prev=>prev>0?prev-1:0),1000);
    return ()=>clearInterval(t);
  },[]);

  if(!draft)return <div className="container page-space"><NoResults title="Belum ada pesanan yang diproses" text="Pilih jadwal dan kursi terlebih dahulu."/><Link to="/jadwal" className="btn btn-primary">Cari Jadwal</Link></div>;
  const trip=data.trips.find(x=>x.id===draft.tripId);
  if(!trip)return <div className="container page-space">Jadwal tidak ditemukan.</div>;

  const totalPayable=trip.price*draft.seats.length;
  const minutes=String(Math.floor(timeLeft/60)).padStart(2,'0');
  const seconds=String(timeLeft%60).padStart(2,'0');

  const submitPayment=(e)=>{
    e.preventDefault();
    if(!senderName.trim()){
      notify('Harap masukkan nama pemilik rekening pengirim.');
      return;
    }
    setProcessing(true);
    try{
      const b=createBooking({
        method:'QRIS Escrow Mudiak',
        senderName:senderName.trim(),
        senderBank,
        refNumber:refNumber.trim()||`REF-${Date.now().toString().slice(-6)}`,
        status:'menunggu_verifikasi'
      });
      notify(`Konfirmasi pembayaran ${b.id} dikirim! Menunggu verifikasi Admin.`);
      navigate('/tiket-saya',{state:{ticketId:b.id}});
    }catch(err){
      notify(err.message);
    }finally{
      setProcessing(false);
    }
  };

  return <div className="container payment-page">
    <PageTitle eyebrow="PEMBAYARAN QRIS ESCROW (REKENING PENAMPUNG)" heading="Transfer QRIS & Konfirmasi Pembayaran" description="Bayar sesuai nominal pas ke QRIS Rekening Penampung Mudiak. Tidak perlu upload foto struk, cukup masukkan nama rekening & nomor referensi transfer."/>
    
    <div className="payment-grid">
      <div className="payment-main-col">
        <div className="qris-countdown-bar">
          <Clock3 size={16}/> Selesaikan pembayaran dalam waktu: <strong>{minutes}:{seconds} WIB</strong>
        </div>

        <QrisDisplay amount={totalPayable} merchant="PO AYAH / MUDIAK ESCROW"/>

        <div className="card proof-upload-section">
          <h4><CheckCircle2 size={18} style={{color:'#16a34a'}}/> Konfirmasi Transfer (Tanpa Unggah Foto)</h4>
          <p className="muted">Setelah Anda mentransfer via m-Banking atau E-Wallet, masukkan identitas transfer di bawah agar Admin dapat langsung mencocokkan mutasi rekening.</p>
          
          <form onSubmit={submitPayment}>
            <div className="two-fields">
              <Field label="Nama Pemilik Rekening / Pengirim">
                <input required value={senderName} onChange={e=>setSenderName(e.target.value)} placeholder="Contoh: Budi Minang"/>
              </Field>
              <Field label="Bank / E-Wallet yang Digunakan">
                <select value={senderBank} onChange={e=>setSenderBank(e.target.value)}>
                  <option value="BCA">BCA Mobile / myBCA</option>
                  <option value="Bank Nagari">Bank Nagari Mobile</option>
                  <option value="Mandiri">Livin' Mandiri</option>
                  <option value="BRI">BRImo</option>
                  <option value="BNI">BNI Mobile Banking</option>
                  <option value="GoPay">GoPay</option>
                  <option value="Dana">Dana</option>
                  <option value="OVO">OVO</option>
                  <option value="ShopeePay">ShopeePay</option>
                  <option value="Lainnya">Bank Lainnya</option>
                </select>
              </Field>
            </div>

            <Field label="Nomor Referensi Transaksi / RRN (Opsional)">
              <input value={refNumber} onChange={e=>setRefNumber(e.target.value)} placeholder="Contoh: 10928374 atau 4 digit terakhir no. transaksi"/>
              <small className="muted" style={{display:'block',marginTop:4}}>Bisa dilihat pada resi mutasi m-banking Anda untuk mempercepat verifikasi.</small>
            </Field>

            <div className="notice-peach" style={{marginTop:12}}>
              <ShieldCheck size={16}/> <b>Bebas Repot:</b> Anda tidak perlu mengunggah screenshot/foto struk. Sistem Mudiak mengandalkan nama rekening dan nomor referensi untuk pencocokan mutasi bank.
            </div>

            <div style={{marginTop:18}}>
              <button disabled={processing||!senderName.trim()} type="submit" className="btn btn-primary btn-block">
                <ShieldCheck size={17}/> {processing?'Memproses...':'Konfirmasi Pembayaran Saya'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card payment-summary">
        <h3>Ringkasan Tiket & Escrow</h3>
        <div className="pay-trip">
          <BusFront/>
          <div>
            <b>{trip.from} → {trip.to}</b>
            <small>{prettyDate(trip.date)} • {trip.time} WIB</small>
          </div>
        </div>
        <div className="summary-item">Armada <b>PO AYAH (Travel)</b></div>
        <div className="summary-item">Nomor Kursi <b>{draft.seats.map(s=>String(s).padStart(2,'0')).join(', ')}</b></div>
        <div className="summary-item">Jumlah Penumpang <b>{draft.seats.length} Orang</b></div>
        <div className="summary-item">Tarif per Kursi <b>{rupiah(trip.price)}</b></div>
        <div className="summary-item">Biaya Layanan Tambahan <b>Rp 0 (All-in)</b></div>
        <hr/>
        <div className="summary-total">Total Bayar Pas <strong>{rupiah(totalPayable)}</strong></div>

        <div className="notice-peach" style={{marginTop:14}}>
          <AlertCircle size={15}/> <b>Rekening Penampung (Escrow):</b> Pembayaran Anda ditampung sementara oleh Mudiak dan baru diserahkan ke PO AYAH menjelang jadwal berangkat.
        </div>

        <div className="complaint-card" style={{marginTop:14,padding:12}}>
          <div className="complaint-card-header" style={{fontSize:12}}>
            <Mail size={15}/> Butuh Bantuan Pembayaran?
          </div>
          <p style={{fontSize:11,margin:'0 0 8px'}}>Jika butuh panduan transfer, hubungi email resmi kami di:</p>
          <a href="mailto:layanan@mudiak.id?subject=Tanya%20Pembayaran%20Mudiak" className="btn-complaint-email" style={{fontSize:10,padding:'6px 10px'}}>
            <Mail size={13}/> layanan@mudiak.id
          </a>
        </div>

        <Link to={`/pesan/${trip.id}`} className="btn btn-soft btn-block" style={{marginTop:10}}>
          <ArrowLeft size={15}/> Kembali ke Pilihan Kursi
        </Link>
      </div>
    </div>
  </div>;
}

export function Tickets(){
  const {data,user,patch,update,notify,requestRefund}=useApp();
  const location=useLocation();
  const [filter,setFilter]=useState('aktif');
  const [active,setActive]=useState(location.state?.ticketId||'');
  const [refundModal,setRefundModal]=useState(null);
  const [refundForm,setRefundForm]=useState({bank:'BCA',accountNumber:'',accountName:'',reason:'Perubahan rencana perjalanan'});

  if(!user)return <div className="container page-space"><div className="empty-schedule card"><Ticket size={28}/><h2>Masuk untuk melihat tiket perjalanan</h2><p>Riwayat pemesanan tersimpan untuk akun pelanggan Anda.</p><Link to="/login" state={{from:'/tiket-saya',role:'pelanggan'}} className="btn btn-primary">Masuk Sebagai Pelanggan</Link></div></div>;

  const mine=data.bookings.filter(b=>b.userId===user.id);
  const filtered=mine.filter(b=>{
    if(filter==='semua')return true;
    if(filter==='aktif')return b.status==='lunas';
    if(filter==='menunggu_verifikasi')return b.status==='menunggu_verifikasi';
    if(filter==='menunggu_refund')return b.status==='menunggu_refund';
    if(filter==='dibatalkan')return b.status==='dibatalkan';
    return b.status===filter;
  });

  const shown=filtered.find(b=>b.id===active)||filtered[0];
  const trip=shown&&data.trips.find(t=>t.id===shown.tripId);
  const bus=trip&&data.buses.find(b=>b.id===trip.busId);
  const po=trip&&data.operators.find(o=>o.id===trip.operatorId);

  const remHours=trip?getRemainingHours(trip):5;
  const canRefund=remHours>=2;

  const handleOpenRefund=(b)=>{
    setRefundModal(b);
    setRefundForm({
      bank:'BCA',
      accountNumber:'',
      accountName:b.buyer?.name||user?.name||'',
      reason:'Perubahan jadwal mendadak'
    });
  };

  const submitRefund=(e)=>{
    e.preventDefault();
    if(!refundModal)return;
    requestRefund(refundModal.id,refundForm);
    setRefundModal(null);
  };

  // Link Komplain via Email & WhatsApp
  const emailComplaintHref=shown?`mailto:layanan@mudiak.id?subject=${encodeURIComponent(`[KOMPLAIN VERIFIKASI] Booking ${shown.id} - a.n ${shown.senderName||shown.buyer.name}`)}&body=${encodeURIComponent(`Halo Tim Layanan Mudiak,\n\nSaya telah melakukan pembayaran tiket via QRIS Escrow namun belum diverifikasi oleh Admin.\n\nBerikut data pembayaran saya:\n- Kode Booking: ${shown.id}\n- Nama Pemilik Rekening: ${shown.senderName || shown.buyer.name}\n- Bank / E-Wallet: ${shown.senderBank || 'BCA'}\n- No. Referensi Transaksi: ${shown.refNumber || '-'}\n- Total Pembayaran: ${rupiah(shown.total)}\n\nMohon bantuannya untuk verifikasi e-tiket saya segera. Terima kasih.\n\nNama Pemesan: ${shown.buyer.name}\nNo. WhatsApp: ${shown.buyer.phone}`)}`:'#';
  
  const waComplaintHref=shown?`https://wa.me/6281289210000?text=${encodeURIComponent(`Halo Admin Mudiak, saya sudah transfer untuk Booking ${shown.id} sebesar ${rupiah(shown.total)} via ${shown.senderBank||'Bank'} a.n ${shown.senderName||shown.buyer.name} (Ref: ${shown.refNumber||'-'}). Mohon bantuannya untuk verifikasi e-tiket saya. Terima kasih.`)}`:'#';

  return <div className="container tickets-page">
    <div className="breadcrumbs"><Link to="/">Beranda</Link><ChevronRight size={14}/> Tiket Saya</div>
    <PageTitle eyebrow="PORTAL PENUMPANG RANAH MINANG" heading="Tiket Perjalanan Saya" description="Kelola e-tiket QRIS, pantau verifikasi admin, dan hubungi pengaduan jika konfirmasi tertunda." actions={
      <div className="tab-pills">
        {[
          ['aktif','Tiket Aktif'],
          ['menunggu_verifikasi','Menunggu Verifikasi'],
          ['menunggu_refund','Pengajuan Refund'],
          ['dibatalkan','Dibatalkan'],
          ['semua','Semua Tiket']
        ].map(([v,label])=><button className={filter===v?'active':''} onClick={()=>{setFilter(v);setActive('')}} key={v}>{label} ({mine.filter(b=>v==='semua'?true:v==='aktif'?b.status==='lunas':b.status===v).length})</button>)}
      </div>
    }/>

    <div className="tickets-layout">
      <div className="ticket-list">
        <div className="notice-muted"><Clock3 size={16}/> Menampilkan Tiket: {filter.replace('_',' ').toUpperCase()}</div>
        {filtered.map(b=>{
          const t=data.trips.find(x=>x.id===b.tripId);
          const o=data.operators.find(x=>x.id===t?.operatorId);
          return <button key={b.id} className={'ticket-small card '+(shown?.id===b.id?'selected':'')} onClick={()=>setActive(b.id)}>
            <small>KODE BOOKING <Status value={b.status}/></small>
            <h3>{b.id}</h3>
            <p>{o?.name} • {t?.className}</p>
            <div className="route-preview"><b>{t?.from}</b><ArrowRight size={16}/><b>{t?.to}</b></div>
            <div className="ticket-small-bottom">
              <span><CalendarDays size={13}/> {prettyDate(t?.date)} • {t?.time} WIB</span>
              <span><Armchair size={13}/> Kursi {b.seats.join(', ')}</span>
            </div>
          </button>;
        })}
        {!filtered.length&&<NoResults title="Tidak ada tiket pada kategori ini" text="Coba pilih filter lain atau pesan jadwal baru."/>}
        <div className="notice-peach">
          <AlertCircle size={16}/> <b>Ketentuan Refund:</b> Pengajuan refund dapat diajukan mandiri maksimal 2 jam sebelum keberangkatan bus.
        </div>
      </div>

      <div className="ticket-detail">
        {shown&&trip?(
          <div className="card eticket" id="printable-ticket">
            {/* Header Tiket */}
            <div className="eticket-top">
              <div className="eticket-brand">
                <span className="large-bus"><BusFront/></span>
                <div>
                  <h3>MUDIAK <Badge tone="amber">ESCROW TICKET</Badge></h3>
                  <b>LEMBAR TIKET ELEKTRONIK RESMI</b>
                  <p>Transportasi Darat Sumatera Barat • PO AYAH Mitra Resmi</p>
                </div>
              </div>
              <Badge tone={shown.status==='lunas'?'green':shown.status.startsWith('menunggu')?'amber':'red'}>
                {shown.status==='lunas'?'LUNAS & AKTIF':shown.status.replace('_',' ').toUpperCase()}
              </Badge>
            </div>

            {/* Banner Khusus Status Menunggu Verifikasi & Kotak Komplain */}
            {shown.status==='menunggu_verifikasi'&&(
              <>
                <div className="refund-alert-box" style={{marginBottom:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,marginBottom:4}}>
                    <Clock3 size={18}/> PEMBAYARAN ANDA SEDANG DIVERIFIKASI SUPER ADMIN
                  </div>
                  <p style={{margin:0}}>
                    Admin Mudiak sedang memeriksa mutasi rekening penampung. E-tiket dan barcode boarding akan aktif begitu transaksi dicocokkan.
                  </p>
                  <div className="transfer-info-pill" style={{marginTop:10}}>
                    <span>Data Transfer yang Anda Kirim:</span>
                    <strong>{shown.senderName || shown.buyer.name}</strong> • {shown.senderBank || 'BCA'} • Ref: <code>{shown.refNumber || '-'}</code> • Total: <strong className="text-red">{rupiah(shown.total)}</strong>
                  </div>
                </div>

                {/* Kotak Pengaduan Penumpang jika Admin belum verifikasi */}
                <div className="complaint-card">
                  <div className="complaint-card-header">
                    <Mail size={17}/> Sudah Transfer tapi Belum Dikonfirmasi Admin?
                  </div>
                  <p>
                    Jika Anda telah melakukan pembayaran ke QRIS namun e-tiket belum terbit dalam 10–15 menit, silakan ajukan pengaduan langsung ke tim layanan pelanggan Mudiak untuk verifikasi prioritas:
                  </p>
                  <div className="complaint-actions">
                    <a href={emailComplaintHref} className="btn-complaint-email">
                      <Mail size={15}/> Ajukan Komplain via Email (layanan@mudiak.id)
                    </a>
                    <a href={waComplaintHref} target="_blank" rel="noopener noreferrer" className="btn-complaint-wa">
                      <MessageCircle size={15}/> Chat WhatsApp Admin (Respon Cepat)
                    </a>
                  </div>
                </div>
              </>
            )}

            {shown.status==='menunggu_refund'&&(
              <div className="refund-alert-box" style={{marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,marginBottom:4}}>
                  <Clock3 size={18}/> PENGAJUAN REFUND SEDANG DIPROSES ADMIN
                </div>
                <p style={{margin:0}}>
                  Pengembalian dana sebesar <strong>{rupiah(shown.total)}</strong> diajukan ke rekening <strong>{shown.refund?.bank} {shown.refund?.accountNumber}</strong> a.n <strong>{shown.refund?.accountName}</strong>. Admin akan menyelesaikan transfer refund Anda.
                </p>
              </div>
            )}

            {shown.status==='dibatalkan'&&(
              <div className="refund-locked-box" style={{marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:800,marginBottom:4}}>
                  <XCircle size={18}/> TIKET INI TELAH DIBATALKAN
                </div>
                <p style={{margin:0}}>
                  {shown.refund?.status==='selesai'
                    ?'Dana telah selesai ditransfer kembali oleh Super Admin ke rekening Anda.'
                    :'Pesanan ini dibatalkan dan kursi telah dikembalikan ke kuota armada.'}
                </p>
              </div>
            )}

            {/* Kode Booking */}
            <div className="booking-code">
              <span>KODE BOOKING UTAMA</span>
              <strong>{shown.id}</strong>
              <button onClick={()=>{navigator.clipboard?.writeText(shown.id);notify('Kode booking disalin.')}}>
                <Copy size={14}/> Salin Kode
              </button>
              <p>Tunjukkan kode booking ini kepada petugas di pool keberangkatan.</p>
            </div>

            {/* Rincian Tiket */}
            <div className="ticket-info-grid">
              <div>
                <h4>INFORMASI PERJALANAN</h4>
                <small>RUTE</small>
                <strong>{trip.from} → {trip.to}</strong>
                <small>JADWAL KEBERANGKATAN</small>
                <b>{prettyDate(trip.date)} • {trip.time} WIB</b>
                <small>TITIK NAIK (POOL)</small>
                <p>{trip.originPool}</p>
                <small>TITIK TURUN</small>
                <p>{trip.destinationPool}</p>
              </div>
              <div>
                <h4>ARMADA & SUPIR</h4>
                <small>OPERATOR RESMI</small>
                <strong>{po?.name}</strong>
                <small>KELAS LAYANAN</small>
                <b>{trip.className}</b>
                <small>PLAT NOMOR & SUPIR</small>
                <b>{bus?.plate} {bus?.driver?`(${bus.driver})`:''}</b>
                <small>JALUR LINTASAN</small>
                <p>{trip.way}</p>
              </div>
              <div>
                <h4>MANIFEST PENUMPANG</h4>
                <small>NAMA PEMESAN</small>
                <strong>{shown.buyer.name}</strong>
                <small>NOMOR KURSI</small>
                <div className="chip-row">
                  {shown.seats.map(s=><Badge key={s} tone="red">Kursi {String(s).padStart(2,'0')}</Badge>)}
                </div>
                <small>DAFTAR PENUMPANG</small>
                {shown.passengers.map((p,i)=><p key={i}>{p.name}</p>)}
                <small>TOTAL TARIF ALL-IN</small>
                <strong className="text-red">{rupiah(shown.total)}</strong>
              </div>
            </div>

            <div className="facilities">
              <b>FASILITAS TRAVEL</b>
              <span><Wifi size={16}/> Full AC</span>
              <span><Armchair size={16}/> Reclining Seat</span>
              <span><Usb size={16}/> USB Charger</span>
              <span><Coffee size={16}/> Air Mineral</span>
            </div>

            {/* Aksi & Kebijakan Refund */}
            <div className="ticket-actions" style={{marginTop:16}}>
              <button className="btn btn-primary" onClick={()=>window.print()}><Download size={16}/> Cetak Tiket</button>
              
              {shown.status==='lunas'&&(
                canRefund?(
                  <button className="btn btn-danger-soft" onClick={()=>handleOpenRefund(shown)}>
                    Ajukan Refund Tiket (Batas &ge; 2 Jam)
                  </button>
                ):(
                  <button className="btn btn-soft" disabled title="Refund ditutup karena keberangkatan kurang dari 2 jam">
                    Refund Ditutup (&lt; 2 Jam)
                  </button>
                )
              )}
            </div>

            {shown.status==='lunas'&&!canRefund&&(
              <div className="refund-locked-box">
                <b>⛔ Kebijakan Batas Refund (&lt; 2 Jam):</b> Keberangkatan tersisa kurang dari 2 jam ({remHours>0?`${remHours.toFixed(1)} jam lagi`:'jadwal lewat'}). Sesuai SOP armada PO AYAH, mobil sedang dipersiapkan di pool dan biaya operasional telah diteruskan ke awak PO, sehingga refund tidak dapat diajukan.
              </div>
            )}
          </div>
        ):(
          <NoResults title="Belum ada e-tiket" text="Pilih tiket pada daftar di sebelah kiri untuk melihat rincian."/>
        )}
      </div>
    </div>

    {/* Modal Pengajuan Refund */}
    {refundModal&&(
      <Modal title={`Pengajuan Refund Tiket (${refundModal.id})`} onClose={()=>setRefundModal(null)}>
        <form className="modal-form" onSubmit={submitRefund}>
          <div className="notice-peach">
            <AlertCircle size={16}/> Pengajuan refund akan diproses 100% senilai <strong>{rupiah(refundModal.total)}</strong> ke rekening yang Anda masukkan di bawah.
          </div>
          <div className="two-fields">
            <Field label="Bank / E-Wallet Penerima Refund">
              <select value={refundForm.bank} onChange={e=>setRefundForm({...refundForm,bank:e.target.value})}>
                <option value="BCA">BCA</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BRI">BRI</option>
                <option value="BNI">BNI</option>
                <option value="Bank Nagari">Bank Nagari</option>
                <option value="GoPay">GoPay</option>
                <option value="Dana">Dana</option>
                <option value="OVO">OVO</option>
              </select>
            </Field>
            <Field label="Nomor Rekening / Akun E-Wallet">
              <input required value={refundForm.accountNumber} onChange={e=>setRefundForm({...refundForm,accountNumber:e.target.value})} placeholder="Contoh: 1234567890"/>
            </Field>
          </div>
          <Field label="Nama Pemilik Rekening (Sesuai Buku Tabungan)">
            <input required value={refundForm.accountName} onChange={e=>setRefundForm({...refundForm,accountName:e.target.value})} placeholder="Nama pemilik rekening"/>
          </Field>
          <Field label="Alasan Pembatalan">
            <select value={refundForm.reason} onChange={e=>setRefundForm({...refundForm,reason:e.target.value})}>
              <option>Perubahan rencana perjalanan</option>
              <option>Keperluan mendadak / keluarga</option>
              <option>Sakit / kondisi tidak memungkinkan</option>
              <option>Salah pilih tanggal atau jam</option>
              <option>Lainnya</option>
            </select>
          </Field>
          <div className="modal-actions" style={{marginTop:16}}>
            <button type="button" className="btn btn-soft" onClick={()=>setRefundModal(null)}>Batal</button>
            <button type="submit" className="btn btn-primary">Kirim Pengajuan Refund</button>
          </div>
        </form>
      </Modal>
    )}
  </div>;
}
export function RoutesPage(){const {data}=useApp();const [from,setFrom]=useState('Semua');const list=data.routes.filter(r=>from==='Semua'||r.from===from);return <div className="container page-space"><PageTitle eyebrow="KORIDOR LINTAS SUMATERA BARAT" heading="Rute & Armada Travel" description="Jelajahi lintasan rute antarkota Sumatera Barat, estimasi durasi, dan jadwal operasional PO AYAH."/><div className="card padded"><Field label="Filter Kota Keberangkatan"><select value={from} onChange={e=>setFrom(e.target.value)}><option>Semua</option>{cities.map(x=><option key={x}>{x}</option>)}</select></Field></div><div className="route-cards">{list.map(r=><div className="card route-card" key={r.id}><span className="route-card-icon"><RouteIcon/></span><h3>{r.from} <ArrowRight size={17}/> {r.to}</h3><p><MapPin size={14}/> {r.distance}　<Clock3 size={14}/> {r.duration}</p><Badge tone="green">Rute Aktif</Badge><button onClick={()=>window.location.assign('/jadwal')} className="btn btn-soft btn-block">Lihat Jadwal <ArrowRight size={16}/></button></div>)}</div><div className="section-center top-gap"><h2>Mitra Operator Terpercaya</h2><p>PO AYAH Travel beroperasi resmi dengan 16 unit armada Toyota HiAce & Microbus ber-AC.</p></div><div className="route-cards">{data.operators.map(o=><div key={o.id} className="card po-card"><span className="po-logo">{o.code}</span><h3>{o.name}</h3><p>{o.pool}</p><Status value={o.status}/></div>)}</div></div>}
export function Help(){const {notify}=useApp();const [open,setOpen]=useState(0);const faqs=[['Bagaimana cara memesan tiket travel di Mudiak?','Pilih kota asal, kota tujuan, dan tanggal keberangkatan. Pilih kursi favorit Anda pada denah bangku armada, lengkapi data kontak pemesan, lalu bayar sesuai nominal pas all-in ke QRIS Escrow Mudiak.'],['Bagaimana cara kerja pembayaran QRIS Escrow?','Pembayaran Anda ditampung di rekening escrow resmi Mudiak. Dana baru diteruskan ke PO AYAH menjelang jam keberangkatan, sehingga transaksi Anda 100% aman dan terlindungi.'],['Apakah saya harus upload foto struk bukti transfer?','Tidak perlu repot. Cukup masukkan Nama Pemilik Rekening dan Nomor Referensi Bank / RRN (dari m-banking Anda) pada form konfirmasi pembayaran. Admin akan langsung mencocokkan mutasi rekening secara instan.'],['Bagaimana jika e-tiket saya belum terbit setelah transfer?','Pada halaman Tiket Saya, tersedia kotak Pengaduan Penumpang dengan tombol langsung ke Email (layanan@mudiak.id) dan Chat WhatsApp Admin yang sudah terisi otomatis dengan kode booking Anda untuk verifikasi prioritas.'],['Kapan batas waktu pengajuan refund pembatalan tiket?','Pengajuan refund mandiri dapat dilakukan maksimal 2 jam sebelum jadwal keberangkatan bus dengan pengembalian 100%. Kurang dari 2 jam pengajuan ditutup karena mobil sedang dipersiapkan di pool.'],['Bagaimana cara naik (boarding) di pool PO AYAH?','Cukup tunjukkan e-tiket atau sebutkan Kode Booking resmi (contoh: MDK-8842-PY) kepada petugas dispatcher di pool keberangkatan. Petugas akan memvalidasi kehadiran Anda.']];return <div className="container page-space"><PageTitle eyebrow="LAYANAN PELANGGAN MUDIAK" heading="Pusat Bantuan & Pengaduan" description="Informasi seputar pemesanan tiket, pembayaran QRIS Escrow, SOP keberangkatan, dan kebijakan refund."/><div className="help-grid"><div className="card padded"><h3>Pertanyaan yang Sering Diajukan</h3><div className="faq-list">{faqs.map(([q,a],i)=><div key={q}><button onClick={()=>setOpen(open===i?-1:i)}><span>{q}</span><ChevronDown className={open===i?'flip':''} size={18}/></button>{open===i&&<p>{a}</p>}</div>)}</div></div><form className="card padded" onSubmit={e=>{e.preventDefault();e.target.reset();notify('Pesan bantuan berhasil dikirim ke tim layanan Mudiak.')}}><h3>Hubungi Layanan Penumpang</h3><p className="muted">Silakan sampaikan pertanyaan atau kendala perjalanan Anda kepada tim operasional kami.</p><Field label="Nama Lengkap"><input required placeholder="Nama Anda"/></Field><Field label="Alamat Email"><input type="email" required placeholder="email@domain.com"/></Field><Field label="Kategori Pertanyaan"><select><option>Konfirmasi Pembayaran QRIS</option><option>Perubahan Jadwal & Refund</option><option>Jadwal & Info Pool PO AYAH</option><option>Kemitraan Operator</option></select></Field><Field label="Isi Pesan"><textarea required rows={5} placeholder="Jelaskan pertanyaan atau kendala Anda secara rinci..."/></Field><button className="btn btn-primary btn-block">Kirim Pesan Bantuan <ArrowRight size={16}/></button><div className="support-contact"><p><Phone size={16}/> Hotline WhatsApp: 0812-7041-0000</p><p><Mail size={16}/> Email Resmi: layanan@mudiak.id</p></div></form></div></div>}
export function Profile(){const {user,patch,notify,logout}=useApp();const navigate=useNavigate();const [form,setForm]=useState({name:user?.name||'',phone:user?.phone||'',email:user?.email||''});return <div className="container page-space"><PageTitle eyebrow="AKUN PENUMPANG" heading="Profil Saya" description="Kelola identitas akun pemesan dan nomor WhatsApp untuk kelancaran penerbitan e-tiket."/><div className="card profile-card"><div className="profile-hero"><div className="profile-avatar"><UserRound size={30}/></div><div><h3>{user?.name}</h3><Badge tone="green">Akun Aktif</Badge></div></div><form onSubmit={e=>{e.preventDefault();patch('users',user.id,form);notify('Profil akun berhasil diperbarui.')}}><Field label="Nama Lengkap"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Alamat Email"><input required disabled type="email" value={form.email}/></Field><Field label="Nomor WhatsApp"><input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field><button className="btn btn-primary">Simpan Perubahan</button> <button type="button" className="btn btn-soft" onClick={()=>{logout();navigate('/')}}>Keluar Akun</button></form></div></div>}
