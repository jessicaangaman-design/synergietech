import { AppLayout } from "@/components/AppLayout";
import { InterventionsPage } from "@/routes/interventions";
import { Navigate, Route, Routes } from "react-router-dom";

const TechnicienRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="interventions" replace />} />
        <Route path="interventions" element={<InterventionsPage />} />
      </Route>
    </Routes>
  );
};
export default TechnicienRoutes;
