import AppRouter from "./routes/AppRouter";
import Navbar from "./pages/Navbar";

const App = () => {
  return (
    <>
      <Navbar />
      <AppRouter />
    </>
  );
};

export default App;