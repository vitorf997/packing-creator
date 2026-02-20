import React, { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./Components/SideBar/Sidebar";
import Content from "./Components/Content/Content";

const DUMMY_DATA_SIZE_MATRIX = ["XS", "S", "M", "L", "XL"];

// Componente principal da aplicação
function App() {
  // Guarda a view atual
  const [view, setView] = useState({ key: "packing_create", params: {} });
  const [theme, setTheme] = useState(() => localStorage.getItem("app-theme") || "light");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  // Atualiza o item selecionado
  const selectItemHandler = (itemNumber) => {
    setView({ key: itemNumber, params: {} });
  };
  const navigateHandler = (key, params = {}) => setView({ key, params });
  const goBackHandler = () => {
    const backKey = view.params?.backKey;
    if (backKey) {
      setView({ key: backKey, params: {} });
      return;
    }
    setView({ key: "packing_create", params: {} });
  };

  const toggleThemeHandler = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <div className="appRoot" data-theme={theme}>
      <div className="appLayout">
        <Sidebar onSelectItem={selectItemHandler} selectedItem={view.key} />
        <div className="appMain">
          <div className="appTopBar">
            <div>
              {view.params?.backKey ? (
                <button
                  type="button"
                  className="backBtn"
                  onClick={goBackHandler}
                  aria-label="Voltar"
                >
                  <span aria-hidden="true">←</span> Voltar
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="themeToggleBtn"
              onClick={toggleThemeHandler}
              aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              <ThemeIcon theme={theme} />
            </button>
          </div>
          <div className="appContent">
            <Content
              data={DUMMY_DATA_SIZE_MATRIX}
              selectedItem={view.key}
              viewParams={view.params}
              onNavigate={navigateHandler}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const ThemeIcon = ({ theme }) => {
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 18.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm0-15.5h1v3h-1V3Zm0 15h1v3h-1v-3ZM3 11h3v1H3v-1Zm15 0h3v1h-3v-1ZM5.22 5.93l.71-.71 2.12 2.12-.71.71-2.12-2.12Zm10.73 10.73.71-.71 2.12 2.12-.71.71-2.12-2.12Zm2.83-10.73 2.12-2.12.71.71-2.12 2.12-.71-.71ZM5.93 18.78l2.12-2.12.71.71-2.12 2.12-.71-.71Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7.2 7.2 0 1 0 9.8 9.8Z" />
    </svg>
  );
};

export default App;
