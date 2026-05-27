import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import styles from './SelecionarUnidade.module.css'; // ➡️ IMPORTA OS ESTILOS AQUI

interface Unidade {
  id: number;
  nome: string;
}

const SelecionarUnidade: React.FC = () => {
  const { selecionarUnidade, logout, unidadeAtiva } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string>('');

  useEffect(() => {
    carregarUnidades();
  }, []);

  useEffect(() => {
    if (unidadeAtiva) {
      navigate('/', { replace: true });
    }
  }, [unidadeAtiva, navigate]);

  const carregarUnidades = async () => {
    try {
      const response = await api.get('/minhas-unidades/');
      const dados = response.data;

      if (dados.length === 0) {
        setErro('Não possui nenhuma Unidade Produtiva associada à sua conta no painel de administração.');
        setLoading(false);
        return;
      }

      if (dados.length === 1) {
        selecionarUnidade(dados[0].id);
        return;
      }

      setUnidades(dados);
      setLoading(false);
      
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
      setErro('Não foi possível carregar os seus locais de trabalho. Verifique a ligação com o servidor.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loadingText}>A processar credenciais e acessos...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Área de Trabalho</h2>
        
        {erro ? (
          <div>
            <div className={styles.errorBox}>{erro}</div>
            <button onClick={logout} className={styles.logoutLink}>
              Voltar para a tela de Login
            </button>
          </div>
        ) : (
          <div>
            <p className={styles.subtitle}>
              Selecione a Unidade Produtiva ou Campus onde irá realizar os registos de manejo hoje.
            </p>
            <div className={styles.grid}>
              {unidades.map((unidade) => (
                <button
                  key={unidade.id}
                  onClick={() => selecionarUnidade(unidade.id)}
                  className={styles.unitButton}
                >
                  {unidade.nome}
                </button>
              ))}
            </div>
            <button onClick={logout} className={styles.logoutLink}>
              Sair da Conta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelecionarUnidade;