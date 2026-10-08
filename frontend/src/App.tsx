import { useRoutes } from "react-router-dom";
import { getRoutes } from "@/app/routes";
import SvgSprites from "@/components/common/SvgSprites";

function App() {
  const routing = useRoutes(getRoutes());

  return (
    <>
      <SvgSprites />
      {routing}
    </>
  );
}

export default App;
