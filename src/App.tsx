import {
  HashRouter,  // تغيير من BrowserRouter
  Routes,
  Route
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import AddStone from "./pages/AddStone";
import Shipments from "./pages/Shipments";
import Customers from "./pages/Customers";
import CustomerProfile from "./pages/CustomerProfile";
import MainLayout from "./layouts/MainLayout";


function App() {
  return (
    <HashRouter>  {/* تغيير من BrowserRouter */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/add-stone" element={<AddStone />} />
          <Route path="/customers/profile/:id" element={<CustomerProfile />} />
          <Route path="/shipments" element={<Shipments />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;