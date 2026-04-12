import { useEffect, useState } from "react";
import axios from "axios";

interface HealthStatus {
  status: string;
  projeto: string;
  versao: string;
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios
      .get<HealthStatus>("/api/health/")
      .then((res) => setHealth(res.data))
      .catch(() => setError(true));
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">
          <span className="logo-icon">🌱</span> CampoLog
        </h1>
        <p className="slogan">Transformando manejo em informação</p>
      </header>

      <main className="main">
        <div className="status-card">
          <h2>Status da API</h2>
          {health ? (
            <div className="status-ok">
              <span className="dot dot-ok" />
              <div>
                <p><strong>{health.projeto}</strong> v{health.versao}</p>
                <p className="status-text">Backend conectado</p>
              </div>
            </div>
          ) : error ? (
            <div className="status-ok">
              <span className="dot dot-err" />
              <div>
                <p><strong>Sem conexão</strong></p>
                <p className="status-text">Verifique se o backend está rodando</p>
              </div>
            </div>
          ) : (
            <p className="status-text">Conectando...</p>
          )}
        </div>

        <div className="info-card">
          <h2>Módulo 0 — Fundação</h2>
          <p>Estrutura do projeto configurada com sucesso.</p>
          <ul>
            <li>Backend Django + DRF</li>
            <li>Frontend React + TypeScript</li>
            <li>PostgreSQL + PostGIS</li>
            <li>PWA base configurada</li>
          </ul>
          <p className="next">Próximo: <strong>M1 — Autenticação e Perfis</strong></p>
        </div>
      </main>

      <footer className="footer">
        <p>IF Sertão Pernambucano — CampoLog v0.1.0</p>
      </footer>
    </div>
  );
}

export default App;
