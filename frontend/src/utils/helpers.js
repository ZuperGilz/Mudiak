export const rupiah = n => 'Rp '+Number(n||0).toLocaleString('id-ID');
export const prettyDate = d => d ? new Date(`${d}T12:00:00`).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-';
export const shortDate = d => d ? new Date(`${d}T12:00:00`).toLocaleDateString('id-ID',{day:'numeric',month:'short'}) : '-';
export const uid = p => `${p}${Math.random().toString(36).slice(2,8).toUpperCase()}`;
export const downloadCSV = (name,headers,rows) => {
  const clean = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const content='\ufeff'+[headers,...rows].map(row=>row.map(clean).join(',')).join('\r\n');
  const blob=new Blob([content],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);
};
export const statusTone = status => ({
  aktif: 'green',
  lunas: 'green',
  siap: 'green',
  selesai: 'green',
  pending: 'amber',
  menunggu_verifikasi: 'amber',
  menunggu_refund: 'amber',
  perjalanan: 'amber',
  perawatan: 'red',
  ditolak: 'red',
  nonaktif: 'red',
  dibatalkan: 'red',
  ditangguhkan: 'red'
})[status] || 'neutral';
