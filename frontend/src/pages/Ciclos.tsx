import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import styles from './Ciclos.module.css';

export default function Ciclos() {
    const navigate = useNavigate();
    const { unidadeAtiva } = useContext(AuthContext);
    const [cicloQr, setCicloQr] = useState<any>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    // Estados de listagem da tabela e loaders
    const [ciclos, setCiclos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // ➡️ RECURSO RECUPERADO: Estados de Filtragem Combinada
    const [termoPesquisa, setTermoPesquisa] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODOS');

    // Coleções para os dropdowns (selects) do formulário
    const [talhoesOpcoes, setTalhoesOpcoes] = useState<any[]>([]);
    const [culturasOpcoes, setCulturasOpcoes] = useState<any[]>([]);

    // Estados do Formulário (Alinhados com o models.py do Django)
    const [idEdit, setIdEdit] = useState<number | null>(null);
    const [talhaoId, setTalhaoId] = useState('');
    const [culturaId, setCulturaId] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFimPrevista, setDataFimPrevista] = useState('');
    const [status, setStatus] = useState('ATIVO');

    // Sempre que a unidade produtiva ativa mudar, recarrega os dropdowns e os ciclos
    useEffect(() => {
        if (unidadeAtiva) {
            carregarDadosFormulario();
            carregarCiclos();
        }
    }, [unidadeAtiva]);

    const carregarDadosFormulario = async () => {
        try {
            const resTalhoes = await api.get('/agronomia/talhoes/');
            setTalhoesOpcoes(resTalhoes.data);

            const resCulturas = await api.get('/agronomia/culturas/');
            setCulturasOpcoes(resCulturas.data);
        } catch (error) {
            console.error("Erro ao carregar opções do formulário:", error);
        }
    };

    const carregarCiclos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/agronomia/ciclos/');
            setCiclos(response.data);
        } catch (error) {
            console.error("Erro ao carregar ciclos de cultivo:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                talhao: Number(talhaoId),
                cultura: Number(culturaId),
                data_inicio: dataInicio,
                data_fim_prevista: dataFimPrevista,
                status: status
            };

            if (idEdit !== null) {
                await api.patch(`/agronomia/ciclos/${idEdit}/`, payload);
                alert('Ciclo de cultivo updated com sucesso!');
            } else {
                await api.post('/agronomia/ciclos/', payload);
                alert('Novo ciclo de cultivo iniciado e registrado para este talhão!');
            }

            limparFormulario();
            carregarCiclos();
        } catch (error: any) {
            console.error('Erro ao guardar ciclo:', error.response?.data || error.message);
            alert('Erro ao salvar ciclo. Certifique-se de que preencheu todos os campos.');
        }
    };

    const handleEditar = (ciclo: any) => {
        setIdEdit(ciclo.id);
        setTalhaoId(String(ciclo.talhao?.id || ciclo.talhao));
        setCulturaId(String(ciclo.cultura?.id || ciclo.cultura));
        setDataInicio(ciclo.data_inicio);
        setDataFimPrevista(ciclo.data_fim_prevista);
        setStatus(ciclo.status);
    };

    const handleExcluir = async (id: number) => {
        if (window.confirm('Atenção: Excluir este ciclo removerá o vínculo fitossanitário da área. Deseja continuar?')) {
            try {
                await api.delete(`/agronomia/ciclos/${id}/`);
                alert('Ciclo de cultivo removido.');
                carregarCiclos();
            } catch (error) {
                console.error('Erro ao excluir ciclo:', error);
                alert('Não foi possível remover o ciclo selecionado.');
            }
        }
    };

    const limparFormulario = () => {
        setIdEdit(null);
        setTalhaoId('');
        setCulturaId('');
        setDataInicio('');
        setDataFimPrevista('');
        setStatus('ATIVO');
    };

    const handleImprimirQr = () => {
        const svg = qrRef.current?.querySelector('svg');
        if (!svg || !cicloQr) return;

        const svgString = new XMLSerializer().serializeToString(svg);
        const nomeCultura = cicloQr.cultura_nome || `Cultura #${cicloQr.cultura}`;
        const variedade = cicloQr.cultura_variedade || '';
        const nomeTalhao = cicloQr.talhao_nome || `Talhão #${cicloQr.talhao}`;
        const nomeUnidade = cicloQr.unidade_nome || '';
        const url = `${window.location.origin}/rastreabilidade/${cicloQr.id}`;

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>QR Code — ${nomeCultura} / ${nomeTalhao}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 210mm; min-height: 297mm; position: relative;
      display: flex; flex-direction: column; align-items: center;
      padding: 1.2cm 2cm 2cm; font-family: Arial, sans-serif;
      background: #ffffff; color: #1E293B;
    }
    .instituicao {
      font-size: 1.55rem; font-weight: bold; color: #2D5A27;
      text-align: center; line-height: 1.5; margin-bottom: 0.4cm;
      border-bottom: 2px solid #2D5A27; padding-bottom: 0.3cm; width: 100%;
    }
    .unidade { font-size: 1rem; color: #475569; text-align: center; margin-bottom: 0.2cm; }
    .cultura { font-size: 1.5rem; font-weight: bold; color: #1E293B; text-align: center; margin-bottom: 0.1cm; }
    .variedade { font-size: 0.95rem; color: #64748B; text-align: center; margin-bottom: 0.5cm; }
    .qr-wrap { flex: 1; display: flex; align-items: center; justify-content: center; }
    .qr-box { padding: 0.8cm; border: 4px solid #2D5A27; border-radius: 12px; background: #ffffff; display: inline-block; }
    .qr-box svg { display: block; width: 14cm !important; height: 14cm !important; }
    .instrucao { margin-top: 0.5cm; font-size: 1.3rem; color: #475569; text-align: center; }
    .url { margin-top: 0.2cm; font-size: 0.7rem; color: #94A3B8; word-break: break-all; text-align: center; max-width: 16cm; }
    .rodape { position: absolute; bottom: 0.8cm; font-size: 0.75rem; color: #CBD5E1; text-align: center; width: 100%; }
  </style>
</head>
<body>
  <div class="instituicao">IFSert&atilde;oPE &mdash; Campus Petrolina Zona Rural</div>
  ${nomeUnidade ? `<div class="unidade">Unidade Produtiva: <strong>${nomeUnidade}</strong></div>` : ''}
  <div class="cultura">${nomeCultura}</div>
  ${variedade ? `<div class="variedade">Variedade: ${variedade}</div>` : ''}
  <div class="qr-wrap">
    <div class="qr-box">${svgString}</div>
  </div>
  <p class="instrucao">Aponte a c&acirc;mera do celular para ver o hist&oacute;rico deste talh&atilde;o</p>
  <p class="url">${url}</p>
  <div class="rodape">Gerado pelo CampoLog &mdash; Desenvolvido pelo LADI</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
    };

    // ➡️ LÓGICA DE FILTRAGEM COMBINADA (Cruzamento de Dados)
    const ciclosFiltrados = ciclos.filter(c => {
        const nomeCultura = c.cultura_nome || c.cultura?.nome || '';
        const nomeTalhao = c.talhao_nome || c.talhao?.nome || '';
        const statusCiclo = c.status || '';

        // Condição 1: Filtro por texto (Cultura ou Lote/Talhão)
        const bateTexto = nomeCultura.toLowerCase().includes(termoPesquisa.toLowerCase()) || 
                          nomeTalhao.toLowerCase().includes(termoPesquisa.toLowerCase());

        // Condição 2: Filtro pelo Dropdown de Status
        const bateStatus = filtroStatus === 'TODOS' || statusCiclo === filtroStatus;

        // O registro só passa se atender a AMBOS os filtros ao mesmo tempo
        return bateTexto && bateStatus;
    });

    return (
        <div className={styles.container || ''} style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: '#1E293B', fontSize: '2rem', fontWeight: 'bold' }}>Ciclos de Cultivo</h1>
                <Link to="/" style={{ color: '#2D5A27', fontWeight: 'bold', textDecoration: 'none' }}>&larr; Voltar ao Painel</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
                
                {/* 📝 FORMULÁRIO DE GESTÃO */}
                <form onSubmit={handleSalvar} style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderTop: '4px solid #2D5A27' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1E293B' }}>
                        {idEdit !== null ? '✏️ Alterar Ciclo' : '🌱 Iniciar Novo Planejamento/Ciclo'}
                    </h2>

                    <div style={{ marginBottom: '1.2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Talhão / Parcela Destino</label>
                        <select 
                            value={talhaoId} 
                            onChange={(e) => setTalhaoId(e.target.value)} 
                            required
                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#ffffff' }}
                        >
                            <option value="">Selecione o local físico...</option>
                            {talhoesOpcoes.map(t => (
                                <option key={t.id} value={t.id}>{t.nome} ({t.area_m2} m²)</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Cultura a Ser Plantada</label>
                        <select 
                            value={culturaId} 
                            onChange={(e) => setCulturaId(e.target.value)} 
                            required
                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#ffffff' }}
                        >
                            <option value="">Selecione a espécie...</option>
                            {culturasOpcoes.map(c => (
                                <option key={c.id} value={c.id}>{c.nome} {c.variedade ? `(${c.variedade})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Data de Início</label>
                            <input 
                                type="date" 
                                value={dataInicio} 
                                onChange={(e) => setDataInicio(e.target.value)} 
                                required
                                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Fim Previsto</label>
                            <input 
                                type="date" 
                                value={dataFimPrevista} 
                                onChange={(e) => setDataFimPrevista(e.target.value)} 
                                required
                                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Status</label>
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)} 
                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#ffffff' }}
                        >
                            <option value="PLANEJADO">Planejado (Em breve)</option>
                            <option value="ATIVO">Ativo (Em Campo / Em Andamento)</option>
                            <option value="COLHIDO">Colhido (Finalizado)</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" style={{ padding: '0.6rem 1.5rem', backgroundColor: '#2D5A27', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {idEdit !== null ? 'Atualizar' : 'Iniciar Ciclo'}
                        </button>
                        {idEdit !== null && (
                            <button type="button" onClick={limparFormulario} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#64748B', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>

                {/* 📊 LISTAGEM COM PAINEL DE CONTROLE DE FILTROS RECUPERADO */}
                <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#1E293B', margin: 0 }}>Ciclos Cadastrados</h2>
                        
                        {/* 🛠️ Barra de Ações: Combina o Dropdown com o campo de Texto */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                value={filtroStatus}
                                onChange={(e) => setFiltroStatus(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#ffffff', color: '#1E293B', fontWeight: '500', width: '40%' }}
                            >
                                <option value="TODOS">🌍 Todos os Estados</option>
                                <option value="PLANEJADO">⏳ PLANEJADO</option>
                                <option value="ATIVO">🟢 ATIVO</option>
                                <option value="COLHIDO">📦 COLHIDO</option>
                                <option value="CANCELADO">❌ CANCELADO</option>
                            </select>

                            <input 
                                type="text"
                                placeholder="🔍 Buscar por cultura ou lote..."
                                value={termoPesquisa}
                                onChange={(e) => setTermoPesquisa(e.target.value)}
                                style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.9rem', width: '60%' }}
                            />
                        </div>
                    </div>

                    {loading ? <p style={{ color: '#64748B' }}>A carregar dados do planeamento agrícola...</p> : ciclosFiltrados.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Nenhum ciclo registado para os critérios de busca selecionados.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#1E293B' }}>
                                        <th style={{ padding: '0.75rem' }}>Manejo (Cultura & Talhão)</th>
                                        <th style={{ padding: '0.75rem' }}>Período</th>
                                        <th style={{ padding: '0.75rem' }}>Estado</th>
                                        <th style={{ padding: '0.75rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ciclosFiltrados.map((c) => {
                                        const nomeCultura = c.cultura_nome || c.cultura?.nome || `Cultura #${c.cultura}`;
                                        const nomeTalhao = c.talhao_nome || c.talhao?.nome || `Talhão #${c.talhao}`;
                                        return (
                                            <tr key={c.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#1E293B', display: 'block' }}>{nomeCultura}</span>
                                                    <small style={{ color: '#64748B' }}>📍 Área: {nomeTalhao}</small>
                                                </td>
                                                <td style={{ padding: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>
                                                    <div>Início: {new Date(c.data_inicio).toLocaleDateString('pt-BR')}</div>
                                                    <div>Previsto: {new Date(c.data_fim_prevista).toLocaleDateString('pt-BR')}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{ 
                                                        fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 'bold',
                                                        backgroundColor: c.status === 'ATIVO' ? '#D1FAE5' : c.status === 'PLANEJADO' ? '#DBEAFE' : c.status === 'CANCELADO' ? '#FEE2E2' : '#F1F5F9',
                                                        color: c.status === 'ATIVO' ? '#065F46' : c.status === 'PLANEJADO' ? '#1E40AF' : c.status === 'CANCELADO' ? '#991B1B' : '#475569'
                                                    }}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditar(c)}
                                                                style={{ padding: '0.25rem 0.5rem', backgroundColor: '#1E293B', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleExcluir(c.id)}
                                                                style={{ padding: '0.25rem 0.5rem', backgroundColor: '#DC2626', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                            >
                                                                Excluir
                                                            </button>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setCicloQr(c)}
                                                                style={{ padding: '0.25rem 0.5rem', backgroundColor: '#F59E0B', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                            >
                                                                QR Code
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/rastreabilidade/${c.id}`)}
                                                                style={{ padding: '0.25rem 0.5rem', backgroundColor: '#2D5A27', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                            >
                                                                Histórico
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL QR CODE */}
            {cicloQr && (
                <div
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setCicloQr(null)}
                >
                    <div
                        style={{ background: '#ffffff', borderRadius: '12px', padding: '2.5rem', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ color: '#1E293B', marginBottom: '0.3rem', fontSize: '1.2rem' }}>
                            {cicloQr.cultura_nome || `Cultura #${cicloQr.cultura}`}
                        </h2>
                        <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            📍 {cicloQr.talhao_nome || `Talhão #${cicloQr.talhao}`}
                        </p>

                        {/* QR Code renderizado (também usado para impressão) */}
                        <div ref={qrRef} style={{ display: 'inline-block', padding: '1rem', border: '3px solid #2D5A27', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                            <QRCode
                                value={`${window.location.origin}/rastreabilidade/${cicloQr.id}`}
                                size={200}
                                fgColor="#1E293B"
                            />
                        </div>

                        <p style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: '0.75rem', wordBreak: 'break-all' }}>
                            {`${window.location.origin}/rastreabilidade/${cicloQr.id}`}
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={handleImprimirQr}
                                style={{ padding: '0.6rem 1.2rem', backgroundColor: '#2D5A27', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                            >
                                🖨️ Imprimir A4
                            </button>
                            <button
                                type="button"
                                onClick={() => setCicloQr(null)}
                                style={{ padding: '0.6rem 1.2rem', backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}