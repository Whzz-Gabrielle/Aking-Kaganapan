import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Services from './pages/Services.jsx';
import Faq from './pages/Faq.jsx';
import Contact from './pages/Contact.jsx';
import { Privacy, Terms } from './pages/Legal.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewBooking from './pages/NewBooking.jsx';
import Profile from './pages/Profile.jsx';
import Payments from './pages/Payments.jsx';
import Expenses from './pages/Expenses.jsx';
import { ManagePackages, ManageVenues } from './pages/CatalogManager.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public / static */}
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="faq" element={<Faq />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />

        {/* Signed-in only */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          {/* Same URL, different screen for each role */}
          <Route path="payments" element={<Payments />} />
        </Route>

        {/* Clients only */}
        <Route element={<ProtectedRoute role="Client" />}>
          <Route path="bookings/new" element={<NewBooking />} />
        </Route>

        {/* Coordinators only */}
        <Route element={<ProtectedRoute role="Coordinator" />}>
          <Route path="expenses" element={<Expenses />} />
          <Route path="manage/packages" element={<ManagePackages />} />
          <Route path="manage/venues" element={<ManageVenues />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
