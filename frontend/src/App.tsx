import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Plan from './pages/Plan';
import Projections from './pages/Projections';
import Demanda from './pages/Demanda';
import Oferta from './pages/Oferta';
import AdminAccess from './pages/AdminAccess';
import NotFound from './pages/NotFound';
import Forgot from './pages/Forgot';
import Avance from './pages/Avance';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/admin" element={<AdminAccess />} />
      <Route element={<DashboardLayout />}>
        <Route path="/avance" element={<Avance />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/proyecciones" element={<Projections />} />
        <Route path="/demanda" element={<Demanda />} />
        <Route path="/oferta" element={<Oferta />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
