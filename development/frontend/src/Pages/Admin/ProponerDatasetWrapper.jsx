import { useAuth } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import CrearDataset from "./CrearDataset";
import CrearDatasetUsuario from "./crear_datsets_usuarios";

function ProponerDatasetWrapper() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Si es Super Admin, renderiza el formulario completo
  if (user?.role === 'super_admin') {
    return <CrearDataset onCancel={() => navigate("/administracion/mis-datasets")} />;
  }

  // Si es Data Admin (o cualquier otro), renderiza el simplificado
  return <CrearDatasetUsuario />;
}

export default ProponerDatasetWrapper;