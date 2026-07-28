import { AppLayout } from "@/components/AppLayout";
import { Dashboard } from "@/routes";
import { ContratsPage } from "@/routes/contrats";
import { ClientsPage } from "@/routes/clients";
import { EquipePage } from "@/routes/equipe";
import { InterventionsPage } from "@/routes/interventions";
import { ProspectsPage } from "@/routes/prospects";
import { Navigate, Route, Routes } from "react-router-dom";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Dashboard />} />
        <Route path="contracts" element={<ContratsPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="equipes" element={<EquipePage />} />
        <Route path="interventions" element={<InterventionsPage />} />
        <Route path="prospects" element={<ProspectsPage />} />
      </Route>
    </Routes>
  );
};
export default AdminRoutes;
