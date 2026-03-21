import Sidebar from "../Components/Admin/Sidebar";
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import "../Styles/Component_styles/AdminLayout.css";
import Breadcrumb from "../Components/Common/Breadcrumb";

function AdminLayout() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isDesktop) {
    return (
      <div className="admin-blocked">
        <h2>Panel no disponible en dispositivos móviles</h2>
        <p>Por favor accede desde un computador para administrar el sistema.</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="admin-main">
        <Breadcrumb />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;