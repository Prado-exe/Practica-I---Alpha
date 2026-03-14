import AppRoutes from "./Routes/AppRoutes";
import { AccessibilityProvider } from "./Context/AccessibilityContext";
import { AuthProvider } from "./Context/AuthContext";

function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </AccessibilityProvider>
  );
}

export default App;




