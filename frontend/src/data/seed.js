export const heroPhoto = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCv0Y7_VPvRcEE_sIW7siK6QvMNycgFapONo8TyOP-na5vhgGCmQNH2B49henJV9L6B9J1DsiryxWhIBJ0lDziiYuhn5u98kJLkNOmJzkaJfMA75mNc48YdMthZX5DHDAJuJhcENnM67ML6Dwd8N9A-yXUyFuZa-GUb04E0OIvvEAC7AvGshKg5-g4mop72KoHVwIDsCLasBXdROwyblDiE8YzkiVqKOjw0KiDNFg';
export const cities = ['Padang','Bukittinggi','Payakumbuh','Solok','Pariaman','Batusangkar','Sawahlunto','Padang Panjang'];
export const initialData = {
  users: [
    {id:3,name:'Budi Minang',email:'budi@gmail.com',phone:'081234567892',role:'pelanggan',status:'aktif',created:'2026-10-02'},
    {id:2,name:'PO AYAH Padang',email:'ayah@mudiak.id',phone:'081270410000',role:'operator',status:'aktif',operatorId:2,created:'2026-09-16'},
    {id:1,name:'Administrator Mudiak',email:'admin@mudiak.id',phone:'081234567890',role:'admin',status:'aktif',created:'2026-09-01'}
  ],
  operators: [
    {id:2,name:'PO AYAH Padang',code:'AYAH',contact:'081270410000',pool:'Pool PO AYAH, Jl. Khatib Sulaiman / Ulak Karang, Padang',status:'aktif',verified:true}
  ],
  buses: [
    {id:1,operatorId:2,name:'PO AYAH 01',plate:'BA 7041 AB',className:'Eksekutif Travel',capacity:16,frontSeats:2,driver:'ANDI',supir:'ANDI',status:'siap',features:'Full AC, USB Charger, Reclining Seat'},
    {id:2,operatorId:2,name:'PO AYAH 02',plate:'BA 7094 FA',className:'Eksekutif Travel',capacity:16,frontSeats:2,driver:'EDO',supir:'EDO',status:'siap',features:'Full AC, Port USB, Musik'},
    {id:3,operatorId:2,name:'PO AYAH 03',plate:'BA 7091 NA',className:'Eksekutif Travel',capacity:16,frontSeats:2,driver:'EDI',supir:'EDI',status:'siap',features:'Full AC, Reclining Seat, Audio'},
    {id:4,operatorId:2,name:'PO AYAH 04',plate:'BA 7210 EA',className:'Super Executive',capacity:18,frontSeats:2,driver:'MUL',supir:'MUL',status:'siap',features:'Full AC, Leg Rest, Charger'},
    {id:5,operatorId:2,name:'PO AYAH 05',plate:'BA 7212 TA',className:'Eksekutif Travel',capacity:16,frontSeats:2,driver:'BEN',supir:'BEN',status:'siap',features:'Full AC, Reclining Seat'},
    {id:6,operatorId:2,name:'PO AYAH 06',plate:'BA 7256 LA',className:'Super Executive',capacity:18,frontSeats:2,driver:'ANDI GAMPANG',supir:'ANDI GAMPANG',status:'siap',features:'Full AC, Reclining, Audio'},
    {id:7,operatorId:2,name:'PO AYAH 07',plate:'BA 7074 BO',className:'Eksekutif Travel',capacity:16,frontSeats:2,driver:'HEND SAKATO',supir:'HEND SAKATO',status:'siap',features:'Full AC, USB Charger, Nyaman'},
    {id:8,operatorId:2,name:'PO AYAH 08',plate:'BA 7573 FB',className:'Super Executive (3 Depan)',capacity:18,frontSeats:3,driver:'EF. KAMPAI',supir:'EF. KAMPAI',status:'siap',features:'Full AC, 3 Bangku Depan, Audio'},
    {id:9,operatorId:2,name:'PO AYAH 09',plate:'BA 7093 NB',className:'Eksekutif Travel',capacity:16,frontSeats:2,driver:'BOY',supir:'BOY',status:'siap',features:'Full AC, Reclining Seat'},
    {id:10,operatorId:2,name:'PO AYAH 10',plate:'BA 7832 ZA',className:'Eksekutif Travel',capacity:16,frontSeats:2,driver:'PUTRA',supir:'PUTRA',status:'siap',features:'Full AC, Port USB, Audio'},
    {id:11,operatorId:2,name:'PO AYAH 11',plate:'BA 7202 LB',className:'Super Executive',capacity:18,frontSeats:2,driver:'WANDA',supir:'WANDA',status:'siap',features:'Full AC, Reclining Seat'},
    {id:12,operatorId:2,name:'PO AYAH 12',plate:'BA 7150 QA',className:'Eksekutif Travel',capacity:16,frontSeats:2,driver:'AGUS',supir:'AGUS',status:'siap',features:'Full AC, Audio, Nyaman'},
    {id:13,operatorId:2,name:'PO AYAH 13',plate:'BA 7101 EB',className:'Super Executive',capacity:18,frontSeats:2,driver:'AL',supir:'AL',status:'siap',features:'Full AC, Reclining Seat, USB'},
    {id:14,operatorId:2,name:'PO AYAH 14',plate:'BA 7212 TB',className:'Eksekutif Travel',capacity:16,frontSeats:2,driver:'SAIPUL',supir:'SAIPUL',status:'siap',features:'Full AC, Audio, Port Charger'},
    {id:15,operatorId:2,name:'PO AYAH 15',plate:'BA 7809 RA',className:'Super Executive (3 Depan)',capacity:18,frontSeats:3,driver:'FAPLY',supir:'FAPLY',status:'siap',features:'Full AC, 3 Bangku Depan, Audio'},
    {id:16,operatorId:2,name:'PO AYAH 16',plate:'BA 7075 LC',className:'Eksekutif Travel',capacity:16,frontSeats:2,driver:'BOY',supir:'BOY',status:'siap',features:'Full AC, Reclining Seat'}
  ],
  routes: [
    {id:'r1',from:'Padang',to:'Bukittinggi',distance:'95 km',duration:'2j 30m',status:'aktif'},
    {id:'r2',from:'Padang',to:'Payakumbuh',distance:'124 km',duration:'3j 30m',status:'aktif'},
    {id:'r3',from:'Bukittinggi',to:'Solok',distance:'95 km',duration:'2j 45m',status:'aktif'},
    {id:'r4',from:'Padang',to:'Solok',distance:'68 km',duration:'1j 45m',status:'aktif'},
    {id:'r5',from:'Bukittinggi',to:'Payakumbuh',distance:'32 km',duration:'55m',status:'aktif'}
  ],
  trips: [
    {id:'t1',operatorId:2,busId:1,routeId:'r1',from:'Padang',to:'Bukittinggi',originPool:'Pool PO AYAH Ulak Karang',destinationPool:'Terminal Aur Kuning',date:'2026-11-16',time:'08:00',arrival:'10:30',price:65000,remaining:14,status:'aktif',way:'Via Lembah Anai',className:'Eksekutif Travel'},
    {id:'t2',operatorId:2,busId:2,routeId:'r1',from:'Padang',to:'Bukittinggi',originPool:'Pool PO AYAH Ulak Karang',destinationPool:'Terminal Aur Kuning',date:'2026-11-16',time:'09:30',arrival:'12:00',price:65000,remaining:12,status:'aktif',way:'Rute Utama',className:'Eksekutif Travel'},
    {id:'t3',operatorId:2,busId:4,routeId:'r1',from:'Padang',to:'Bukittinggi',originPool:'Pool PO AYAH Ulak Karang',destinationPool:'Terminal Aur Kuning',date:'2026-11-16',time:'11:00',arrival:'13:30',price:75000,remaining:16,status:'aktif',way:'Bypass Padang',className:'Super Executive'},
    {id:'t4',operatorId:2,busId:8,routeId:'r1',from:'Padang',to:'Bukittinggi',originPool:'Pool PO AYAH Ulak Karang',destinationPool:'Terminal Aur Kuning',date:'2026-11-16',time:'13:30',arrival:'16:00',price:75000,remaining:15,status:'aktif',way:'Keberangkatan Siang',className:'Super Executive (3 Depan)'},
    {id:'t5',operatorId:2,busId:3,routeId:'r2',from:'Padang',to:'Payakumbuh',originPool:'Pool PO AYAH Ulak Karang',destinationPool:'Terminal Koto Nan Ampek',date:'2026-11-16',time:'08:00',arrival:'11:30',price:70000,remaining:13,status:'aktif',way:'Via Padang Panjang',className:'Eksekutif Travel'},
    {id:'t6',operatorId:2,busId:1,routeId:'r1',from:'Padang',to:'Bukittinggi',originPool:'Pool PO AYAH Ulak Karang',destinationPool:'Terminal Aur Kuning',date:'2026-11-20',time:'10:00',arrival:'12:30',price:65000,remaining:12,status:'aktif',way:'Non-Stop Lembah Anai',className:'Eksekutif Travel'},
    {id:'t7',operatorId:2,busId:5,routeId:'r5',from:'Bukittinggi',to:'Payakumbuh',originPool:'Terminal Aur Kuning',destinationPool:'Pool Ngalau Indah',date:'2026-11-22',time:'14:30',arrival:'15:25',price:45000,remaining:14,status:'aktif',way:'Via Baso',className:'Eksekutif Travel'},
    {id:'t8',operatorId:2,busId:6,routeId:'r4',from:'Padang',to:'Solok',originPool:'Pool PO AYAH Ulak Karang',destinationPool:'Terminal Bareh Solok',date:'2026-11-17',time:'07:00',arrival:'08:45',price:55000,remaining:16,status:'aktif',way:'Sitinjau Lauik',className:'Super Executive'}
  ],
  bookings: [],
  settings: {serviceFee:2500,siteName:'Mudiak',supportEmail:'layanan@mudiak.id',supportPhone:'0751-892-100',maintenance:false,notifications:true}
};
