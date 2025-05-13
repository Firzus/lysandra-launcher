import { Divider } from "@heroui/divider";

import Sidebar from "@/components/sidebar";
import Home from "@/pages/home";

function App() {
  return (
    <>
      <Sidebar />
      <Divider orientation="vertical" />
      <Home />
    </>
  );
}

export default App;
