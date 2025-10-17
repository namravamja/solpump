import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import MainGame from "../components/MainGame";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <Navbar />
      <div className="flex flex-col lg:flex-row pt-16 lg:pt-24 overflow-hidden">
        <Sidebar />
        <div className="flex-1 lg:ml-80 bg-gray-900/30 overflow-hidden">
          <MainGame />
        </div>
      </div>
    </div>
  );
}
