import {
    BrowserRouter,
    Route,
    Routes,
    useLocation,
    useNavigate,
  } from "react-router-dom";

// import {DualRingSpinnerLoaderi} from '@/components/ui/dualRingsloader'
import { useEffect, useState } from "react";
import { ConnexionPage } from "@/routes/connexion";
import AdminRoutes from "./AdminRoute";
import useAuth from "@/hooks/authUser";
import NotAuthorized from "@/screens/notAuthorized";
import SecretaireRoutes from "./secretaireRoute";
import TechnicienRoutes from "./technicienRoute";
const GlobalRoutes = () => {
  // const { isLogin, isAdmin } = useAuth();
  // console.log("isLogin: ", isLogin);
  //   const [loading, setLoading] = useState(true);
  //   useEffect(() => {
  //       const timer = setTimeout(() => {
  //           setLoading(false);
  //       }, 5000);

  //       return () => clearTimeout(timer);
  //   }, []);
    // if(!isLogin){
    //     return (
    //         < CircularBarsSpinnerLoader />
    //     )
    // }
   

    const  renderRoute = () => {
          const ProtectedAdminRoute = ({ element }: { element: React.ReactNode }) => {
            const { isLogin, isAdmin, isSuperAdmin } = useAuth();
            console.log("isLogin : ", isLogin)
            const location = useLocation();
            if (!isLogin) {
              localStorage.setItem(
                "redirectPath",
                location.pathname + location.search,
              );
              return <ConnexionPage />;
            }
            if (!isAdmin && !isSuperAdmin) {
              return <NotAuthorized />;
            }
            return element;
          };
          const ProtectedSecretaireRoute = ({ element }: { element: React.ReactNode }) => {
            const { isLogin, isSecretaire, isSuperAdmin } = useAuth();
            // console.log("isLogin : ", isLogin)
            const location = useLocation();
            if (!isLogin) {
              localStorage.setItem(
                "redirectPath",
                location.pathname + location.search,
              );
              return <ConnexionPage />;
            }
            if (!isSecretaire ) {
              return <NotAuthorized />;
            }
            return element;
          };
          const ProtectedTechnicienRoute = ({ element }: { element: React.ReactNode }) => {
            const { isLogin, isTechnicien, isSuperAdmin } = useAuth();
            // console.log("isLogin : ", isLogin)
            const location = useLocation();
            if (!isLogin) {
              localStorage.setItem(
                "redirectPath",
                location.pathname + location.search,
              );
              return <ConnexionPage />;
            }
            if (!isTechnicien ) {
              return <NotAuthorized />;
            }
            return element;
          };
        return (
            <Routes>
                <Route path={"/"} element={<ConnexionPage />} />
                {/* <Route path="/home" element=
                {
                  <Home>
                     < User />
                  </Home>
                } /> */}
                <Route path={"/admin/*"} element={<ProtectedAdminRoute element={<AdminRoutes />} />}  />
                <Route path={"/secretaire/*"} element={<ProtectedSecretaireRoute element={<SecretaireRoutes />} />} />
                <Route path={"/technicien/*"} element={<ProtectedTechnicienRoute element={<TechnicienRoutes />} />} />
            </Routes>
        )
    }

    return renderRoute();
  }



export default GlobalRoutes

