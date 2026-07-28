import PageLayout from "@/components/pagelayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <PageLayout>
      <div className="justify-center w-full text-center lg:p-10 max-auto">
        <div className="justify-center w-full mx-auto">
          <p className="text-5xl tracking-tight text-black lg:text-9xl font-bold">404</p>
          <p className="max-w-xl mx-auto mt-4 text-lg tracking-tight text-gray-400">
            Veuillez vérifier l'URL dans la barre d'adresse et réessayer.
          </p>
        </div>
        <div className="flex justify-center gap-3 mt-10">
          <Button
            onClick={() => {
              navigate("/");
            }}
          >
            Accueil
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default NotFound;
