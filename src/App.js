import logo from "./logo.svg";
import "./App.css";
import Sidebar from "./SideBar/Sidebar";

function App() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ width: "100%" }}>
        <h1>Main Content</h1>
      </div>
    </div>
  );
}

export default App;
