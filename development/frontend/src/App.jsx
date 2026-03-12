import AppRoutes from "./Routes/AppRoutes";
import { AccessibilityProvider } from "./Context/AccessibilityContext";

function App() {
  return (
    <AccessibilityProvider>
      <AppRoutes />
    </AccessibilityProvider>
  );
}

export default App;




