import React,{useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {Users,BusFront,CalendarDays,Ticket,Wallet,Building2,Route,ShieldCheck,Clock3,ArrowUpRight,Plus,Download,CheckCircle2,XCircle,Eye,Edit3,Trash2,Search,Save,Settings,AlertTriangle,RefreshCcw,ChartNoAxesCombined,CreditCard,MapPin,KeyRound,UserRound,TrendingUp} from 'lucide-react';
import {AreaChart,Area,BarChart,Bar,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer} from 'recharts';
import {useApp} from '../context/AppContext';
import {Badge,Status,PageTitle,Metric,Table,Field,Modal,NoResults} from '../components/UI';
import {cities} from '../data/seed';
import {rupiah,prettyDate,uid,downloadCSV} from '../utils/helpers';
const cols=['#991b1b','#d97706','#059669','#b99da6','#edc0b9'];
function SummaryKpis(){const {data}=useApp();const paid=data.bookings.filter(x=>x.status==='lunas');const totalPaid=paid.reduce((s,b)=>s+b.total,0);const totalPO=paid.reduce((s,b)=>s+(b.total-(b.seats.length*2000)),0);const totalMargin=paid.reduce((s,b)=>s+(b.seats.length*2000),0);return <div className="metrics-grid"><Metric icon={Users} title="Total Pengguna" value={data.users.length.toLocaleString('id-ID')} sub="Pelanggan, operator, admin" tone="red"/><Metric icon={BusFront} title="Total Armada" value={data.buses.length} sub="PO AYAH & mitra travel" tone="amber"/><Metric icon={Wallet} title="Dana Escrow Masuk" value={rupiah(totalPaid)} sub={`Hak PO: ${rupiah(totalPO)}`} tone="green"/><Metric icon={TrendingUp} title="Profit Platform Mudiak" value={rupiah(totalMargin)} sub="Margin Rp 2.000 / kursi lunas" tone="red"/></div>}
export function AdminHome(){const {data}=useApp();const pends=data.users.filter(u=>u.role==='operator'&&u.status==='pending');const counts=data.bookings.filter(b=>b.status==='lunas').reduce((map,b)=>{const day=b.created?.slice(5)||'11-05';map[day]=(map[day]||0)+b.total;return map},{});const chart=Object.entries(counts).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,total])=>({date,total}));const pie=[{name:'Pelanggan',value:data.users.filter(u=>u.role==='pelanggan').length},{name:'Operator',value:data.users.filter(u=>u.role==='operator').length},{name:'Admin',value:data.users.filter(u=>u.role==='admin').length}];return <><PageTitle eyebrow="MUDIAK CONTROL CENTER • SUPER ADMIN" heading="Dashboard Administrator" description="Pusat kendali data pengguna, operator PO, armada, jadwal, transaksi, dan laporan seluruh sistem Mudiak." actions={<><Badge tone="green"><ShieldCheck size={14}/> Sistem Operasional Aktif</Badge><Link className="btn btn-primary" to="/admin/operator"><Building2 size={16}/> Verifikasi Operator</Link></>}/><SummaryKpis/><div className="admin-quick-grid"><Link to="/admin/pengguna" className="card quick-card"><Users size={22}/><strong>Pengguna</strong><span>Kelola akun & status <ArrowUpRight size={15}/></span></Link><Link to="/admin/operator" className="card quick-card"><Building2 size={22}/><strong>Operator PO</strong><span>{pends.length} perlu persetujuan <ArrowUpRight size={15}/></span></Link><Link to="/admin/jadwal" className="card quick-card"><CalendarDays size={22}/><strong>Jadwal Bus</strong><span>{data.trips.length} jadwal terdata <ArrowUpRight size={15}/></span></Link><Link to="/admin/pemesanan" className="card quick-card"><Ticket size={22}/><strong>Pemesanan</strong><span>{data.bookings.length} booking total <ArrowUpRight size={15}/></span></Link></div><div className="admin-charts"><div className="card padded chart-card"><div className="card-header"><div><h3>Tren Transaksi Tiket QRIS Escrow</h3><p>Akumulasi nominal transaksi tiket terverifikasi per tanggal pemesanan.</p></div><Badge tone="green">Terverifikasi</Badge></div><div className="chart-container"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}><defs><linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#991b1b" stopOpacity={.23}/><stop offset="95%" stopColor="#991b1b" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date"/><YAxis tickFormatter={n=>n>=1000?`${Math.round(n/1000)}k`:n}/><Tooltip formatter={rupiah}/><Area type="monotone" dataKey="total" stroke="#991b1b" strokeWidth={3} fill="url(#adminGrad)"/></AreaChart></ResponsiveContainer></div></div><div className="card padded chart-card"><h3>Distribusi Jenis Akun</h3><p className="muted">Jumlah pengguna pada setiap kategori role.</p><div className="chart-container pie-container"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={67} outerRadius={104} paddingAngle={5} label>{pie.map((_,i)=><Cell key={i} fill={cols[i]}/>)}</Pie><Tooltip/><Legend verticalAlign="bottom"/></PieChart></ResponsiveContainer></div></div></div><div className="admin-charts"><div className="card padded"><div className="card-header"><h3>Operator Menunggu Verifikasi</h3><Link className="link-red" to="/admin/operator">Lihat Semua</Link></div>{pends.length?pends.map(u=><div className="pending-row" key={u.id}><span className="avatar amber">{u.name[0]}</span><div><b>{u.name}</b><small>{data.operators.find(o=>o.id===u.operatorId)?.name} • {u.email}</small></div><Badge tone="amber">Pending</Badge></div>):<div className="notice-muted">Tidak ada operator yang menunggu persetujuan.</div>}</div><div className="card padded"><div className="card-header"><h3>Pemesanan Terbaru</h3><Link className="link-red" to="/admin/pemesanan">Lihat Semua</Link></div>{data.bookings.slice(0,5).map(b=><div className="pending-row" key={b.id}><span className="avatar"><Ticket size={18}/></span><div><b>{b.id}</b><small>{b.buyer.name} • {prettyDate(b.created)}</small></div><strong className="text-red">{rupiah(b.total)}</strong></div>)}</div></div></>}
 export function AdminUsers(){
  const {data,patch,update,remove,notify,user}=useApp();
  const [filter,setFilter]=useState('semua');
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState(null);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:'',email:'',phone:''});
  const list=data.users.filter(u=>(filter==='semua'||u.role===filter)&&(`${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(search.toLowerCase())));
  const toggle=u=>{if(u.id===user.id)return notify('Akun admin yang sedang digunakan tidak bisa dinonaktifkan.');patch('users',u.id,{status:u.status==='aktif'?'nonaktif':'aktif'});notify('Status akun pengguna diperbarui.')};
  const openEditor=u=>{setForm(u?{name:u.name,email:u.email,phone:u.phone}:{name:'',email:'',phone:''});setEditing(u?.id||'new')};
  const save=e=>{e.preventDefault();const dup=data.users.some(u=>u.email.toLowerCase()===form.email.trim().toLowerCase()&&u.id!==editing);if(dup)return notify('Email sudah digunakan akun lain.');if(editing==='new'){update('users',arr=>[...arr,{...form,id:uid('u'),role:'pelanggan',status:'aktif',created:new Date().toISOString().slice(0,10)}]);notify('Akun pelanggan berhasil ditambahkan.')}else{patch('users',editing,form);notify('Profil pengguna berhasil disimpan.')}setEditing(null)};
  const deletePassenger=u=>{if(data.bookings.some(b=>b.userId===u.id))return notify('Akun memiliki riwayat booking dan tidak dapat dihapus.');if(window.confirm(`Hapus akun ${u.name}?`)){remove('users',u.id);notify('Akun pelanggan berhasil dihapus.')}};
  return <>
   <PageTitle eyebrow="AKUN & HAK AKSES" heading="Manajemen Pengguna" description="Lihat, tambah akun pelanggan, edit profil, serta kelola hak akses dan status pengguna." actions={<><Badge tone="neutral">{data.users.length} Akun Terdaftar</Badge><button className="btn btn-primary" onClick={()=>openEditor(null)}><Plus size={16}/> Tambah Pelanggan</button></>}/>
   <div className="card padded"><div className="table-toolbar"><input placeholder="Cari nama, email, atau HP..." value={search} onChange={e=>setSearch(e.target.value)}/><div className="tab-pills">{['semua','pelanggan','operator','admin'].map(v=><button key={v} className={v===filter?'active':''} onClick={()=>setFilter(v)}>{v}</button>)}</div></div>
   <Table rows={list} columns={[
    {key:'user',label:'NAMA PENGGUNA',render:u=><div className="table-primary"><span className="avatar small">{u.name.slice(0,1)}</span><div><strong>{u.name}</strong><small>{u.email}</small></div></div>},
    {key:'role',label:'ROLE',render:u=><Badge tone={u.role==='admin'?'red':u.role==='operator'?'amber':'neutral'}>{u.role}</Badge>},
    {key:'phone',label:'NO. HP'},
    {key:'created',label:'TERDAFTAR',render:u=>prettyDate(u.created)},
    {key:'status',label:'STATUS',render:u=><Status value={u.status}/>},
    {key:'actions',label:'AKSI',render:u=><div className="action-row"><button className="icon-action" onClick={()=>setSelected(u)}><Eye size={15}/> Detail</button><button className="icon-action" onClick={()=>openEditor(u)}><Edit3 size={14}/> Edit</button>{u.role!=='admin'&&!['pending','ditolak'].includes(u.status)&&<button className="icon-action" onClick={()=>toggle(u)}>{u.status==='aktif'?'Nonaktifkan':'Aktifkan'}</button>}{u.role==='pelanggan'&&u.id!==user.id&&<button className="icon-action danger" title="Hapus pelanggan tanpa booking" onClick={()=>deletePassenger(u)}><Trash2 size={14}/></button>}</div>}
   ]}/></div>
   {selected&&<Modal title="Detail Akun Pengguna" onClose={()=>setSelected(null)}><div className="details-list">{[['Nama',selected.name],['Email',selected.email],['Telepon',selected.phone],['Role',selected.role],['Status',data.users.find(u=>u.id===selected.id)?.status],['Tanggal daftar',prettyDate(selected.created)]].map(([k,v])=><div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div><div className="modal-actions"><button className="btn btn-soft" onClick={()=>setSelected(null)}>Tutup</button></div></Modal>}
   {editing&&<Modal title={editing==='new'?'Tambah Akun Pelanggan':'Edit Pengguna'} onClose={()=>setEditing(null)}><form className="modal-form" onSubmit={save}><Field label="Nama Lengkap"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Alamat Email"><input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field><Field label="Nomor WhatsApp"><input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field><div className="notice-peach"><ShieldCheck size={16}/> Pastikan alamat email dan nomor WhatsApp pemesan sudah sesuai untuk penerimaan notifikasi e-tiket.</div><button className="btn btn-primary btn-block"><Save size={16}/> Simpan Pengguna</button></form></Modal>}
  </>
 }

export function AdminOperators(){const {data,patch,notify}=useApp();const [filter,setFilter]=useState('semua');const list=data.operators.filter(x=>filter==='semua'||x.status===filter);const change=(o,status)=>{patch('operators',o.id,{status,verified:status==='aktif'});const target=data.users.find(u=>u.operatorId===o.id);if(target)patch('users',target.id,{status:status==='ditolak'?'ditolak':status});notify(`Operator ${o.name} ditandai ${status}.`)};return <><PageTitle eyebrow="VERIFIKASI MITRA PO" heading="Manajemen Operator PO" description="Kelola mitra bus dan permohonan akun operator. Persetujuan juga mengaktifkan akun operator yang terkait." actions={<Badge tone="amber">{data.operators.filter(o=>o.status==='pending').length} Pending Approval</Badge>}/><div className="card padded"><div className="table-toolbar"><h3>Daftar Operator Terdaftar</h3><div className="tab-pills">{['semua','pending','aktif','ditolak'].map(v=><button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>{v}</button>)}</div></div><Table rows={list} columns={[{key:'po',label:'NAMA OPERATOR',render:o=><div className="table-primary"><span className="po-logo">{o.code}</span><div><b>{o.name}</b><small>{o.pool}</small></div></div>},{key:'contact',label:'KONTAK'},{key:'buses',label:'JUMLAH ARMADA',render:o=>data.buses.filter(b=>b.operatorId===o.id).length+' bus'},{key:'verified',label:'VERIFIKASI',render:o=><Badge tone={o.verified?'green':'amber'}>{o.verified?'Terverifikasi':'Belum Verifikasi'}</Badge>},{key:'status',label:'STATUS',render:o=><Status value={o.status}/>},{key:'action',label:'AKSI',render:o=><div className="action-row">{o.status!=='aktif'&&<button className="btn btn-sm btn-green" onClick={()=>change(o,'aktif')}><CheckCircle2 size={13}/> Setujui</button>}{o.status!=='ditolak'&&<button className="icon-action danger" onClick={()=>change(o,'ditolak')}><XCircle size={14}/> Tolak</button>}</div>} ]}/></div></>}
export function AdminFleet(){const {data,patch,notify,saveBus}=useApp();const [filter,setFilter]=useState('semua');const [search,setSearch]=useState('');const [editing,setEditing]=useState(null);const [form,setForm]=useState({name:'',plate:'',className:'Eksekutif Travel',capacity:16,frontSeats:2,driver:'',status:'siap',features:''});const list=data.buses.filter(b=>(filter==='semua'||b.operatorId===filter)&&`${b.name} ${b.plate} ${b.driver||b.supir||''}`.toLowerCase().includes(search.toLowerCase()));
const saveEdit=async e=>{e.preventDefault();await saveBus(editing,{...form,capacity:Number(form.capacity),frontSeats:Number(form.frontSeats||2),driver:form.driver,supir:form.driver});setEditing(null)};
return <><PageTitle eyebrow="INVENTARIS KENDARAAN SELURUH PO" heading="Monitoring Seluruh Armada" description="Lihat armada PO AYAH dan mitra lain, edit kapasitas & denah bangku, serta perbarui status kendaraan."/><div className="card padded"><div className="table-toolbar"><input placeholder="Cari bus, plat, atau supir..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="semua">Semua Operator</option>{data.operators.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div><Table rows={list} columns={[{key:'bus',label:'UNIT ARMADA',render:b=><div className="table-primary"><BusFront size={19}/><div><b>{b.name}</b><small>{b.plate}</small></div></div>},{key:'po',label:'OPERATOR',render:b=>data.operators.find(o=>o.id===b.operatorId)?.name},{key:'driver',label:'SOPIR',render:b=><Badge tone="green">{b.driver||b.supir||'-'}</Badge>},{key:'capacity',label:'KAPASITAS & DENAH',render:b=><span><b>{b.capacity} Kursi</b><small className="block muted">{b.frontSeats||2} Depan + 2-2</small></span>},{key:'className',label:'KELAS'},{key:'status',label:'STATUS',render:b=><Status value={b.status}/>},{key:'action',label:'AKSI & KESIAPAN',render:b=><div className="action-row"><button className="icon-action" onClick={()=>{setForm({...b,frontSeats:b.frontSeats||2,driver:b.driver||b.supir||''});setEditing(b.id)}}><Edit3 size={14}/> Edit</button><select className="small-select" value={b.status} onChange={e=>{patch('buses',b.id,{status:e.target.value});notify('Status armada diperbarui.')}}><option value="siap">Siap Jalan</option><option value="perjalanan">Dalam Perjalanan</option><option value="perawatan">Perawatan</option></select></div>} ]}/></div>{editing&&<Modal title="Edit Detail Armada & Denah Bangku" onClose={()=>setEditing(null)}><form onSubmit={saveEdit} className="modal-form"><Field label="Nama Armada"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Plat Nomor"><input required value={form.plate} onChange={e=>setForm({...form,plate:e.target.value})}/></Field><div className="two-fields"><Field label="Kapasitas Total Kursi"><input required type="number" min="10" max="35" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})}/></Field><Field label="Bangku Samping Supir"><select value={form.frontSeats||2} onChange={e=>setForm({...form,frontSeats:Number(e.target.value)})}><option value={2}>2 Kursi Samping Supir</option><option value={3}>3 Kursi Samping Supir</option></select></Field></div><div className="two-fields"><Field label="Nama Sopir"><input value={form.driver||form.supir||''} onChange={e=>setForm({...form,driver:e.target.value,supir:e.target.value})} placeholder="Nama sopir"/></Field><Field label="Kelas Layanan"><select value={form.className} onChange={e=>setForm({...form,className:e.target.value})}><option>Eksekutif Travel</option><option>Super Executive</option><option>Super Executive (3 Depan)</option><option>Ekonomi AC</option></select></Field></div><button className="btn btn-primary btn-block"><Save size={16}/> Simpan Perubahan Armada</button></form></Modal>}</>}
export function AdminRoutes(){const {data,update,patch,remove,notify}=useApp();const blank={from:'Padang',to:'Bukittinggi',distance:'95 km',duration:'2j 30m',status:'aktif'};const [modal,setModal]=useState(null);const [form,setForm]=useState(blank);const save=e=>{e.preventDefault();if(form.from===form.to)return notify('Asal dan tujuan harus berbeda.');if(modal==='new')update('routes',prev=>[{id:uid('r'),...form},...prev]);else patch('routes',modal,form);setModal(null);notify('Data rute disimpan.')};return <><PageTitle eyebrow="KORIDOR TRANSPORTASI SUMBAR" heading="Manajemen Rute" description="Tambah dan atur daftar lintasan yang tampil pada halaman rute pelanggan." actions={<button className="btn btn-primary" onClick={()=>{setForm(blank);setModal('new')}}><Plus size={16}/> Tambah Rute</button>}/><div className="card padded"><Table rows={data.routes} columns={[{key:'route',label:'LINTASAN',render:r=><b>{r.from} → {r.to}</b>},{key:'distance',label:'JARAK'},{key:'duration',label:'ESTIMASI'},{key:'tripCount',label:'JADWAL TERKAIT',render:r=>data.trips.filter(t=>t.from===r.from&&t.to===r.to).length+' Jadwal'},{key:'status',label:'STATUS',render:r=><Status value={r.status}/>},{key:'action',label:'AKSI',render:r=><div className="action-row"><button className="icon-action" onClick={()=>{setForm({...r});setModal(r.id)}}><Edit3 size={15}/> Edit</button><button className="icon-action danger" onClick={()=>{if(data.trips.some(t=>t.routeId===r.id))return notify('Rute masih digunakan jadwal.');if(window.confirm('Hapus rute demo?'))remove('routes',r.id)}}><Trash2 size={15}/></button></div>}]}/></div>{modal&&<Modal title={modal==='new'?'Tambah Rute':'Edit Rute'} onClose={()=>setModal(null)}><form className="modal-form" onSubmit={save}><div className="two-fields"><Field label="Kota Asal"><select value={form.from} onChange={e=>setForm({...form,from:e.target.value})}>{cities.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Kota Tujuan"><select value={form.to} onChange={e=>setForm({...form,to:e.target.value})}>{cities.map(c=><option key={c}>{c}</option>)}</select></Field></div><div className="two-fields"><Field label="Jarak"><input required value={form.distance} onChange={e=>setForm({...form,distance:e.target.value})}/></Field><Field label="Estimasi Durasi"><input required value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}/></Field></div><Field label="Status"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></Field><button className="btn btn-primary btn-block"><Save size={16}/> Simpan Rute</button></form></Modal>}</>}
export function AdminSchedules(){const {data,patch,notify}=useApp();const [filter,setFilter]=useState('semua');const list=data.trips.filter(t=>filter==='semua'||t.operatorId===filter);return <><PageTitle eyebrow="MONITOR JADWAL KESELURUHAN PO" heading="Manajemen Jadwal Keberangkatan" description="Pantau seluruh jadwal dan buka atau nonaktifkan perjalanan dari dashboard admin."/><div className="card padded"><div className="table-toolbar"><h3>Data Semua Keberangkatan</h3><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="semua">Semua PO</option>{data.operators.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div><Table rows={list} columns={[{key:'route',label:'RUTE',render:t=><b>{t.from} → {t.to}</b>},{key:'po',label:'OPERATOR',render:t=>data.operators.find(o=>o.id===t.operatorId)?.name},{key:'date',label:'TANGGAL & WAKTU',render:t=><span>{prettyDate(t.date)}<br/><strong>{t.time} WIB</strong></span>},{key:'bus',label:'ARMADA',render:t=>data.buses.find(b=>b.id===t.busId)?.plate},{key:'price',label:'TARIF',render:t=>rupiah(t.price)},{key:'remaining',label:'SISA KURSI'},{key:'status',label:'STATUS',render:t=><Status value={t.status}/>},{key:'action',label:'AKSI',render:t=><button className="icon-action" onClick={()=>{patch('trips',t.id,{status:t.status==='aktif'?'nonaktif':'aktif'});notify('Status perjalanan diubah.')}}>{t.status==='aktif'?'Tutup':'Aktifkan'}</button>} ]}/></div></>}
export function AdminBookings(){
  const {data,patch,update,notify,approvePayment,rejectPayment,approveRefund}=useApp();
  const [search,setSearch]=useState('');
  const [filter,setFilter]=useState('semua');
  const [selected,setSelected]=useState(null);

  const list=data.bookings.filter(b=>(filter==='semua'||b.status===filter)&&`${b.id} ${b.buyer.name} ${b.buyer.phone}`.toLowerCase().includes(search.toLowerCase()));

  const cancel=b=>{
    if(b.status==='dibatalkan')return;
    patch('bookings',b.id,{status:'dibatalkan'});
    update('trips',ts=>ts.map(t=>t.id===b.tripId?{...t,remaining:t.remaining+b.seats.length}:t));
    notify('Pemesanan dibatalkan. Kursi dikembalikan.');
    setSelected(null);
  };

  return <>
    <PageTitle eyebrow="KONTROL TRANSAKSI TIKET" heading="Manajemen Pemesanan" description="Lihat booking seluruh pelanggan, status e-tiket, verifikasi QRIS, dan alokasi penumpang." actions={<button className="btn btn-soft" onClick={()=>downloadCSV('mudiak-pemesanan.csv',['Kode','Pemesan','Total','Status'],list.map(b=>[b.id,b.buyer.name,b.total,b.status]))}><Download size={16}/> Ekspor CSV</button>}/>
    <div className="card padded">
      <div className="table-toolbar">
        <input placeholder="Cari kode booking / nama / nomor WA..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="tab-pills">
          {['semua','menunggu_verifikasi','lunas','menunggu_refund','dibatalkan'].map(v=>(
            <button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>
              {v.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>
      <Table rows={list} columns={[
        {key:'id',label:'KODE BOOKING',render:b=><b className="text-red">{b.id}</b>},
        {key:'buyer',label:'PEMESAN',render:b=><div><b>{b.buyer.name}</b><small className="block">{b.buyer.phone}</small></div>},
        {key:'route',label:'RUTE',render:b=>{const t=data.trips.find(x=>x.id===b.tripId);return `${t?.from} → ${t?.to}`}},
        {key:'seats',label:'KURSI',render:b=>b.seats.join(', ')},
        {key:'total',label:'TOTAL ALL-IN',render:b=>rupiah(b.total)},
        {key:'status',label:'STATUS',render:b=><Status value={b.status}/>},
        {key:'action',label:'AKSI',render:b=><button className="icon-action" onClick={()=>setSelected(b)}><Eye size={15}/> Detail</button>}
      ]}/>
    </div>

    {selected&&(
      <Modal title={`Detail Booking (${selected.id})`} onClose={()=>setSelected(null)}>
        <div className="details-list">
          {[
            ['Booking ID',selected.id],
            ['Pemesan',selected.buyer.name],
            ['Nomor WhatsApp',selected.buyer.phone],
            ['Rekening Pengirim',`${selected.senderName || selected.buyer.name} (${selected.senderBank || 'BCA'})`],
            ['No. Referensi Bank',selected.refNumber || '-'],
            ['Penumpang',selected.passengers.map(p=>p.name).join(', ')],
            ['Alokasi Kursi',selected.seats.join(', ')],
            ['Total Pembayaran (All-in)',rupiah(selected.total)],
            ['Setoran ke PO AYAH',rupiah(selected.total - (selected.seats.length*2000))],
            ['Margin Platform Mudiak',rupiah(selected.seats.length*2000)],
            ['Metode Pembayaran',selected.payment],
            ['Status Tiket',selected.status]
          ].map(([k,v])=>(
            <div key={k}><span>{k}</span><strong>{v}</strong></div>
          ))}
        </div>

        {selected.refund&&(
          <div className="refund-alert-box" style={{marginTop:12}}>
            <b>Permohonan Refund:</b> {selected.refund.bank} No. {selected.refund.accountNumber} a.n {selected.refund.accountName}<br/>
            <small>Alasan: {selected.refund.reason}</small>
          </div>
        )}

        <div className="modal-actions" style={{marginTop:16}}>
          <button className="btn btn-soft" onClick={()=>setSelected(null)}>Tutup</button>
          
          {selected.status==='menunggu_verifikasi'&&(
            <>
              <button className="btn btn-danger-soft" onClick={()=>{
                rejectPayment(selected.id,'Bukti tidak sesuai');
                setSelected(null);
              }}>
                <XCircle size={15}/> Tolak
              </button>
              <button className="btn btn-green" onClick={()=>{
                approvePayment(selected.id);
                setSelected(null);
              }}>
                <CheckCircle2 size={15}/> Setujui & Terbitkan E-Tiket
              </button>
            </>
          )}

          {selected.status==='menunggu_refund'&&(
            <button className="btn btn-green" onClick={()=>{
              approveRefund(selected.id);
              setSelected(null);
            }}>
              <CheckCircle2 size={15}/> Selesaikan Transfer Refund
            </button>
          )}

          {selected.status==='lunas'&&(
            <button className="btn btn-danger-soft" onClick={()=>{
              if(window.confirm('Batalkan tiket ini?'))cancel(selected);
            }}>
              Batalkan Booking
            </button>
          )}
        </div>
      </Modal>
    )}
  </>;
}

export function AdminPayments(){
  const {data,approvePayment,rejectPayment,approveRefund,notify}=useApp();
  const [filter,setFilter]=useState('semua');
  const [selectedProof,setSelectedProof]=useState(null);
  const [selectedRefund,setSelectedRefund]=useState(null);
  const [selectedDetail,setSelectedDetail]=useState(null);

  const paidBookings=data.bookings.filter(b=>b.status==='lunas');
  const pendingVerif=data.bookings.filter(b=>b.status==='menunggu_verifikasi');
  const pendingRefund=data.bookings.filter(b=>b.status==='menunggu_refund');

  const totalEscrow=paidBookings.reduce((s,b)=>s+b.total,0);
  const totalPOPayout=paidBookings.reduce((s,b)=>s+(b.total - (b.seats.length*2000)),0);
  const totalPlatformMargin=paidBookings.reduce((s,b)=>s+(b.seats.length*2000),0);

  const list=data.bookings.filter(b=>{
    if(filter==='semua')return true;
    if(filter==='menunggu_verifikasi')return b.status==='menunggu_verifikasi';
    if(filter==='lunas')return b.status==='lunas';
    if(filter==='menunggu_refund')return b.status==='menunggu_refund';
    if(filter==='dibatalkan')return b.status==='dibatalkan';
    return b.status===filter;
  });

  return <>
    <PageTitle 
      eyebrow="REKONSILIASI PEMBAYARAN & ESCROW MUDIAK" 
      heading="Monitoring Pembayaran QRIS" 
      description="Kelola pembayaran QRIS rekening penampung, verifikasi bukti transfer pelanggan, dan pantau bagi hasil PO AYAH vs margin Mudiak."
      actions={
        <button className="btn btn-soft" onClick={()=>downloadCSV('mudiak-rekonsiliasi.csv',['Kode','Pemesan','Total Bayar','Hak PO AYAH','Margin Mudiak','Metode','Status'],list.map(b=>[b.id,b.buyer.name,b.total,b.total - (b.seats.length*2000),b.seats.length*2000,b.payment,b.status]))}>
          <Download size={16}/> Unduh CSV
        </button>
      }
    />

    {/* Financial Ledger Cards */}
    <div className="disbursement-card-grid">
      <div className="disbursement-card">
        <small>TOTAL DANA ESCROW MASUK</small>
        <strong>{rupiah(totalEscrow)}</strong>
        <span className="muted">{paidBookings.length} pesanan berstatus lunas</span>
      </div>
      <div className="disbursement-card po-highlight">
        <small>HAK BERSIH PO AYAH (DISBURSEMENT)</small>
        <strong style={{color:'#167653'}}>{rupiah(totalPOPayout)}</strong>
        <span className="muted">Tarif tiket flat dikurangi margin Rp 2.000/kursi</span>
      </div>
      <div className="disbursement-card mudiak-highlight">
        <small>PENDAPATAN BERSIH MUDIAK (MARGIN)</small>
        <strong style={{color:'#8c000c'}}>{rupiah(totalPlatformMargin)}</strong>
        <span className="muted">Margin Rp 2.000 per kursi terjual</span>
      </div>
      <div className="disbursement-card">
        <small>MENUNGGU VERIFIKASI QRIS</small>
        <strong style={{color:pendingVerif.length?'#d97706':'#0e8059'}}>{pendingVerif.length} Transaksi</strong>
        <span className="muted">{pendingRefund.length} permohonan refund</span>
      </div>
    </div>

    {pendingVerif.length>0&&(
      <div className="refund-alert-box" style={{marginBottom:18}}>
        <strong>⚠️ Ada {pendingVerif.length} transaksi QRIS menunggu verifikasi bukti transfer.</strong> Silakan klik "Periksa Bukti" untuk memeriksa resi dan menerbitkan E-Tiket resmi bagi penumpang.
      </div>
    )}

    {pendingRefund.length>0&&(
      <div className="refund-alert-box" style={{marginBottom:18,borderColor:'#fca5a5',background:'#fff1f2',color:'#991b1b'}}>
        <strong>⚠️ Ada {pendingRefund.length} permohonan refund menunggu penyelesaian transfer pengembalian dana.</strong>
      </div>
    )}

    <div className="card padded">
      <div className="table-toolbar">
        <h3>Daftar Transaksi Pembayaran</h3>
        <div className="tab-pills">
          {[
            ['semua','Semua Transaksi'],
            ['menunggu_verifikasi',`Perlu Verifikasi (${pendingVerif.length})`],
            ['lunas','Lunas & Aktif'],
            ['menunggu_refund',`Pengajuan Refund (${pendingRefund.length})`],
            ['dibatalkan','Dibatalkan']
          ].map(([v,label])=>(
            <button key={v} className={filter===v?'active':''} onClick={()=>setFilter(v)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <Table 
        rows={list} 
        columns={[
          {key:'id',label:'KODE BOOKING',render:b=><strong className="text-red">{b.id}</strong>},
          {key:'buyer',label:'PEMESAN',render:b=><div><b>{b.buyer.name}</b><small className="block">{b.buyer.phone}</small></div>},
          {key:'route',label:'RUTE & KURSI',render:b=>{
            const t=data.trips.find(x=>x.id===b.tripId);
            return <div><b>{t?.from} → {t?.to}</b><small className="block muted">Kursi: {b.seats.join(', ')} ({b.seats.length} org)</small></div>;
          }},
          {key:'total',label:'TOTAL BAYAR (ALL-IN)',render:b=><b>{rupiah(b.total)}</b>},
          {key:'split',label:'RINCIAN DANA',render:b=>{
            const margin=b.seats.length*2000;
            const poNet=b.total-margin;
            return <div className="split-badge-row">
              <span className="split-po">PO: {rupiah(poNet)}</span>
              <span className="split-margin">Mudiak: {rupiah(margin)}</span>
            </div>;
          }},
          {key:'payment',label:'METODE & PENGIRIM',render:b=><div>
            <small className="block"><b>{b.payment||'QRIS Escrow'}</b></small>
            <small className="muted">{b.senderName||b.buyer.name} ({b.senderBank||'BCA'})</small>
            {b.refNumber&&<small className="block text-red" style={{fontSize:10}}>Ref: {b.refNumber}</small>}
          </div>},
          {key:'status',label:'STATUS',render:b=><Status value={b.status}/>},
          {key:'action',label:'AKSI',render:b=><div className="action-row">
            {b.status==='menunggu_verifikasi'&&(
              <button className="btn btn-sm btn-green" onClick={()=>setSelectedProof(b)}>
                <CheckCircle2 size={13}/> Periksa Pembayaran
              </button>
            )}
            {b.status==='menunggu_refund'&&(
              <button className="btn btn-sm btn-secondary" onClick={()=>setSelectedRefund(b)}>
                <RefreshCcw size={13}/> Proses Refund
              </button>
            )}
            {b.status!=='menunggu_verifikasi'&&b.status!=='menunggu_refund'&&(
              <button className="icon-action" onClick={()=>setSelectedDetail(b)}>
                <Eye size={14}/> Detail
              </button>
            )}
          </div>}
        ]}
      />
    </div>

    {/* Modal Verifikasi Pembayaran Masuk */}
    {selectedProof&&(
      <Modal title={`Verifikasi Pembayaran (${selectedProof.id})`} onClose={()=>setSelectedProof(null)}>
        <div className="proof-info-banner">
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span>Pemesan: <strong>{selectedProof.buyer.name}</strong></span>
            <span>Total Transfer Masuk: <strong className="text-red">{rupiah(selectedProof.total)}</strong></span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span>Rekening Pengirim: <strong>{selectedProof.senderName||selectedProof.buyer.name} ({selectedProof.senderBank||'Bank'})</strong></span>
            <span>No. Referensi: <strong>{selectedProof.refNumber||'-'}</strong></span>
          </div>
        </div>

        <div className="notice-peach" style={{margin:'14px 0'}}>
          <b>💡 Cara Cek Mutasi Bank:</b> Buka m-Banking rekening penampung Mudiak (BCA / Bank Nagari), pastikan ada mutasi kredit masuk senilai <strong>{rupiah(selectedProof.total)}</strong> atas nama <strong>{selectedProof.senderName||selectedProof.buyer.name}</strong>. Setelah dana terlihat, klik tombol setujui di bawah.
        </div>

        <div className="details-list" style={{margin:'12px 0'}}>
          <div><span>Setoran ke PO AYAH</span><strong style={{color:'#166534'}}>{rupiah(selectedProof.total - (selectedProof.seats.length*2000))}</strong></div>
          <div><span>Margin Platform Mudiak</span><strong style={{color:'#8c000c'}}>{rupiah(selectedProof.seats.length*2000)}</strong></div>
          <div><span>Alokasi Kursi</span><span>Kursi {selectedProof.seats.join(', ')} ({selectedProof.seats.length} penumpang)</span></div>
        </div>

        <div className="modal-actions" style={{marginTop:16}}>
          <button className="btn btn-danger-soft" onClick={()=>{
            if(window.confirm(`Tolak konfirmasi pembayaran ${selectedProof.id}?`)){
              rejectPayment(selectedProof.id,'Dana belum masuk ke mutasi rekening');
              setSelectedProof(null);
            }
          }}>
            <XCircle size={15}/> Tolak Pembayaran
          </button>
          <button className="btn btn-green" onClick={()=>{
            approvePayment(selectedProof.id);
            setSelectedProof(null);
          }}>
            <CheckCircle2 size={15}/> Setujui & Terbitkan E-Tiket
          </button>
        </div>
      </Modal>
    )}

    {/* Modal Penyelesaian Refund */}
    {selectedRefund&&(
      <Modal title={`Penyelesaian Refund (${selectedRefund.id})`} onClose={()=>setSelectedRefund(null)}>
        <div className="refund-alert-box">
          <b>Permohonan Refund Penumpang:</b> Dana sebesar <strong>{rupiah(selectedRefund.total)}</strong> harus dikembalikan ke rekening penumpang.
        </div>

        <div className="details-list" style={{margin:'14px 0'}}>
          <div><span>Bank Tujuan</span><strong>{selectedRefund.refund?.bank||'BCA'}</strong></div>
          <div><span>Nomor Rekening</span><strong style={{fontSize:16,color:'#0f172a'}}>{selectedRefund.refund?.accountNumber||'-'}</strong></div>
          <div><span>Atas Nama</span><strong>{selectedRefund.refund?.accountName||selectedRefund.buyer.name}</strong></div>
          <div><span>Alasan Refund</span><span>{selectedRefund.refund?.reason||'Perubahan jadwal'}</span></div>
          <div><span>Waktu Pengajuan</span><small>{selectedRefund.refund?.requestedAt?new Date(selectedRefund.refund.requestedAt).toLocaleString('id-ID'):'-'}</small></div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-soft" onClick={()=>setSelectedRefund(null)}>Tutup</button>
          <button className="btn btn-primary" onClick={()=>{
            approveRefund(selectedRefund.id);
            setSelectedRefund(null);
          }}>
            <CheckCircle2 size={15}/> Konfirmasi Transfer Selesai (Selesaikan Refund)
          </button>
        </div>
      </Modal>
    )}

    {/* Modal Detail Transaksi Umum */}
    {selectedDetail&&(
      <Modal title={`Detail Transaksi (${selectedDetail.id})`} onClose={()=>setSelectedDetail(null)}>
        <div className="details-list">
          {[
            ['Kode Booking',selectedDetail.id],
            ['Pemesan',selectedDetail.buyer.name],
            ['Nomor WhatsApp',selectedDetail.buyer.phone],
            ['Rekening Pengirim',`${selectedDetail.senderName || selectedDetail.buyer.name} (${selectedDetail.senderBank || 'BCA'})`],
            ['No. Referensi Bank',selectedDetail.refNumber || '-'],
            ['Total Bayar All-in',rupiah(selectedDetail.total)],
            ['Setoran ke PO AYAH',rupiah(selectedDetail.total - (selectedDetail.seats.length*2000))],
            ['Margin Platform Mudiak',rupiah(selectedDetail.seats.length*2000)],
            ['Metode Pembayaran',selectedDetail.payment||'QRIS Escrow Mudiak'],
            ['Status',selectedDetail.status],
            ['Tanggal',prettyDate(selectedDetail.created)]
          ].map(([k,v])=>(
            <div key={k}><span>{k}</span><strong>{v}</strong></div>
          ))}
        </div>
        <div className="modal-actions" style={{marginTop:16}}>
          <button className="btn btn-soft" onClick={()=>setSelectedDetail(null)}>Tutup</button>
        </div>
      </Modal>
    )}
  </>;
}
export function AdminReports(){const {data}=useApp();const byOperator=data.operators.map(o=>{const trips=data.trips.filter(t=>t.operatorId===o.id);const paid=data.bookings.filter(b=>b.status==='lunas'&&trips.some(t=>t.id===b.tripId));return {operator:o.name.replace('PO ',''),tiket:paid.reduce((s,b)=>s+b.seats.length,0),pendapatan:paid.reduce((s,b)=>s+b.total,0)}});const byRoute=data.routes.map(r=>({route:`${r.from.slice(0,3)}-${r.to.slice(0,3)}`,jadwal:data.trips.filter(t=>t.from===r.from&&t.to===r.to).length}));return <><PageTitle eyebrow="ANALISIS KINERJA SISTEM" heading="Laporan & Analitik Sistem" description="Rekapitulasi transaksi tiket, pendapatan mitra PO AYAH, dan efektivitas jadwal antarkota." actions={<button className="btn btn-soft" onClick={()=>downloadCSV('mudiak-laporan-po.csv',['Operator','Tiket','Pendapatan'],byOperator.map(o=>[o.operator,o.tiket,o.pendapatan]))}><Download size={16}/> Unduh Laporan CSV</button>}/><SummaryKpis/><div className="admin-charts"><div className="card padded chart-card"><h3>Tiket Terjual per Operator</h3><p className="muted">Kursi berstatus lunas pada masing-masing operator.</p><div className="chart-container"><ResponsiveContainer width="100%" height="100%"><BarChart data={byOperator}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="operator"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="tiket" fill="#991b1b" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></div><div className="card padded chart-card"><h3>Jumlah Jadwal per Rute</h3><p className="muted">Jadwal yang beroperasi pada setiap koridor lintasan.</p><div className="chart-container"><ResponsiveContainer width="100%" height="100%"><BarChart data={byRoute}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="route"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="jadwal" fill="#d97706" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></div></div><div className="card padded"><h3>Ringkasan Performa Operator</h3><Table rows={byOperator} columns={[{key:'operator',label:'OPERATOR PO'},{key:'tiket',label:'TIKET TERJUAL'},{key:'pendapatan',label:'PENDAPATAN PO AYAH',render:o=>rupiah(o.pendapatan)}]}/></div></>}
export function AdminSettings(){const {data,update,reset,notify,user}=useApp();const [f,setF]=useState({...data.settings});const [danger,setDanger]=useState(false);const save=e=>{e.preventDefault();update('settings',f);notify('Pengaturan sistem berhasil disimpan.')};return <><PageTitle eyebrow="KONFIGURASI SISTEM MUDIAK" heading="Pengaturan Sistem" description="Kelola konfigurasi platform, informasi layanan bantuan, kontak darurat, dan pemeliharaan aplikasi."/><div className="settings-grid"><form className="card padded" onSubmit={save}><h3>Konfigurasi Umum</h3><Field label="Nama Platform"><input required value={f.siteName} onChange={e=>setF({...f,siteName:e.target.value})}/></Field><Field label="Email Layanan"><input required type="email" value={f.supportEmail} onChange={e=>setF({...f,supportEmail:e.target.value})}/></Field><Field label="Telepon Layanan"><input value={f.supportPhone} onChange={e=>setF({...f,supportPhone:e.target.value})}/></Field><Field label="Biaya Layanan (Rp)"><input min="0" type="number" value={f.serviceFee} onChange={e=>setF({...f,serviceFee:Number(e.target.value)})}/></Field><label className="inline-check"><input type="checkbox" checked={f.notifications} onChange={e=>setF({...f,notifications:e.target.checked})}/> Aktifkan notifikasi sistem</label><label className="inline-check"><input type="checkbox" checked={f.maintenance} onChange={e=>setF({...f,maintenance:e.target.checked})}/> Mode pemeliharaan sistem</label><button className="btn btn-primary"><Save size={16}/> Simpan Pengaturan</button></form><div className="stack-col"><div className="card padded"><h3>Identitas Administrator</h3><div className="details-list"><div><span>Pengguna</span><strong>{user.name}</strong></div><div><span>Email</span><strong>{user.email}</strong></div><div><span>Role</span><Badge tone="red">Super Admin</Badge></div><div><span>Jumlah PO</span><b>{data.operators.length}</b></div></div><p className="muted">Hak akses Super Admin memiliki wewenang penuh atas verifikasi pembayaran, persetujuan operator, dan pengembalian dana.</p></div><div className="card padded danger-card"><h3><AlertTriangle size={19}/> Zona Inisialisasi Ulang Data</h3><p>Mengembalikan data master pengguna, jadwal, armada, tiket, dan transaksi ke kondisi awal. Tindakan tidak dapat dibatalkan.</p><button className="btn btn-danger-soft" onClick={()=>setDanger(true)}><RefreshCcw size={16}/> Reset Semua Data</button></div></div></div>{danger&&<Modal title="Inisialisasi Ulang Data?" onClose={()=>setDanger(false)}><div className="notice-peach"><AlertTriangle size={18}/> Inisialisasi ulang akan mengatur ulang data lokal ke setelan awal dan mengeluarkan akun dari aplikasi.</div><div className="modal-actions"><button className="btn btn-soft" onClick={()=>setDanger(false)}>Batalkan</button><button className="btn btn-primary" onClick={()=>{reset();setDanger(false);window.location.assign('/')}}>Ya, Reset Data</button></div></Modal>}</>}
