import React from 'react';
import {Routes,Route,Navigate,useLocation} from 'react-router-dom';
import {useApp} from './context/AppContext';
import {PublicLayout,DashboardLayout} from './components/UI';
import {Home,Auth,Checkout,Payment,Tickets,RoutesPage,Help,Profile} from './pages/Customer';
import {OperatorHome,OperatorFleet,OperatorSchedule,OperatorManifest,OperatorReports,OperatorSettings} from './pages/Operator';
import {AdminHome,AdminUsers,AdminOperators,AdminFleet,AdminRoutes,AdminSchedules,AdminBookings,AdminPayments,AdminReports,AdminSettings} from './pages/Admin';
function Protected({role,children}){const {user}=useApp();const location=useLocation();if(!user)return <Navigate to="/login" state={{from:location.pathname,role}} replace/>;if(user.role!==role)return <Navigate to={user.role==='pelanggan'?'/':'/'+user.role} replace/>;return children}
const Public=({children})=><PublicLayout>{children}</PublicLayout>;
const Dash=({role,children})=><Protected role={role}><DashboardLayout role={role}>{children}</DashboardLayout></Protected>;
export default function App(){return <Routes>
 <Route path="/" element={<Public><Home/></Public>}/><Route path="/jadwal" element={<Public><Home/></Public>}/>
 <Route path="/login" element={<Auth/>}/><Route path="/daftar" element={<Auth initialMode="register"/>}/>
 <Route path="/pesan/:id" element={<Public><Checkout/></Public>}/>
 <Route path="/pembayaran" element={<Protected role="pelanggan"><Public><Payment/></Public></Protected>}/>
 <Route path="/tiket-saya" element={<Public><Tickets/></Public>}/>
 <Route path="/rute" element={<Public><RoutesPage/></Public>}/><Route path="/bantuan" element={<Public><Help/></Public>}/>
 <Route path="/profil" element={<Protected role="pelanggan"><Public><Profile/></Public></Protected>}/>
 <Route path="/operator" element={<Dash role="operator"><OperatorHome/></Dash>}/>
 <Route path="/operator/armada" element={<Dash role="operator"><OperatorFleet/></Dash>}/>
 <Route path="/operator/jadwal" element={<Dash role="operator"><OperatorSchedule/></Dash>}/>
 <Route path="/operator/manifest" element={<Dash role="operator"><OperatorManifest/></Dash>}/>
 <Route path="/operator/laporan" element={<Dash role="operator"><OperatorReports/></Dash>}/>
 <Route path="/operator/pengaturan" element={<Dash role="operator"><OperatorSettings/></Dash>}/>
 <Route path="/admin" element={<Dash role="admin"><AdminHome/></Dash>}/>
 <Route path="/admin/pengguna" element={<Dash role="admin"><AdminUsers/></Dash>}/>
 <Route path="/admin/operator" element={<Dash role="admin"><AdminOperators/></Dash>}/>
 <Route path="/admin/armada" element={<Dash role="admin"><AdminFleet/></Dash>}/>
 <Route path="/admin/rute" element={<Dash role="admin"><AdminRoutes/></Dash>}/>
 <Route path="/admin/jadwal" element={<Dash role="admin"><AdminSchedules/></Dash>}/>
 <Route path="/admin/pemesanan" element={<Dash role="admin"><AdminBookings/></Dash>}/>
 <Route path="/admin/pembayaran" element={<Dash role="admin"><AdminPayments/></Dash>}/>
 <Route path="/admin/laporan" element={<Dash role="admin"><AdminReports/></Dash>}/>
 <Route path="/admin/pengaturan" element={<Dash role="admin"><AdminSettings/></Dash>}/>
 <Route path="*" element={<Navigate to="/" replace/>}/>
 </Routes>}
