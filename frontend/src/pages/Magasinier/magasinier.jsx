import { NavLink, Outlet, Routes, Route } from "react-router-dom";
import Materiel from "./Materiel";
import ListeDemandes from "./ListeDemandes";
import LogoutButton from "../../components/deconnexion";

function MagasinierLayout() {
  return (
    <div className="min-h-screen">
      <header>
        <nav className="p-2 px-4 bg-indigo-950 flex space-x-4 justify-between">
          <div className="space-x-6">
            <NavLink
              to=""
              end
              className={({ isActive }) =>
                isActive
                  ? "px-2 text-white text-xl font-bold underline"
                  : "px-2 text-white text-xl font-medium"
              }
            >
              Matériel
            </NavLink>
            <NavLink
              to="liste-demandes"
              className={({ isActive }) =>
                isActive
                  ? "px-2 text-white text-xl font-bold underline"
                  : "px-2 text-white text-xl font-medium"
              }
            >
              Liste des demandes
            </NavLink>
          </div>
          <div>
            <LogoutButton />
          </div>
        </nav>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function Magasinier() {
  return (
    <Routes>
      <Route path="/" element={<MagasinierLayout />}>
        <Route index element={<Materiel />} />
        <Route path="liste-demandes" element={<ListeDemandes />} />
      </Route>
    </Routes>
  );
}
