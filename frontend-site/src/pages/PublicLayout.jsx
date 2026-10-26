import Navbar from "@/components/ui/navbar";
import { Outlet } from "react-router-dom";


export default function PublicLayout() {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet /> {/* Les pages Home, Login s'afficheront ici */}
      </main>
    </div>
  );
}