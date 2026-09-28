import { Outlet } from "react-router-dom";
import CitizenSidebar from "./CitizenSidebar";

export default function CitizenLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <CitizenSidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
