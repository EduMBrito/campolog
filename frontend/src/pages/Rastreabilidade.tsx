import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { cadernoService } from '../services/cadernoService';
import styles from './Rastreabilidade.module.css';

export default function Rastreabilidade() {
    const { id } = useParams<{ id: string }>(); // Pega o ID da URL
    const [ciclo, setCiclo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(false);

    useEffect(() => {
        const carregarDossie = async () => {
            if (!id) return;
            try {
                const response = await cadernoService.getRelatorioCiclo(id);
                setCiclo(response.data);
            } catch (error) {
                console.error("Erro ao carregar relatório:", error);
                setErro(true);
            } finally {
                setLoading(false);
            }
        };
        carregarDossie();
    }, [id]);

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>A carregar dados de rastreabilidade...</div>;
    
    if (erro || !ciclo) return (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#dc2626' }}>
            <h2>⚠️ Ciclo não encontrado</h2>
            <p>O lote solicitado não existe ou o QR Code é inválido.</p>
        </div>
    );

    // Inverte a ordem para cronológica (do mais antigo para o mais novo) apenas para a Timeline
    const registosCronologicos = ciclo.registos ? [...ciclo.registos].sort((a, b) => 
        new Date(a.data_registo).getTime() - new Date(b.data_registo).getTime()
    ) : [];
    return (
        <div className={styles.container}>
            {/* Cabeçalho do Lote */}
            <div className={styles.headerCard}>
                <p style={{ margin: '0 0 0.5rem 0', opacity: 0.8, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Rastreabilidade Aberta • Lote #{ciclo.id}
                </p>
                <h1 className={styles.culturaTitle}>{ciclo.cultura_nome}</h1>
                <div className={styles.badgesContainer}>
                    <span className={styles.badge}>📍 {ciclo.talhao_nome} ({ciclo.area_m2}m²)</span>
                    <span className={styles.badge}>📅 Plantio: {new Date(ciclo.data_inicio).toLocaleDateString('pt-BR')}</span>
                    <span className={styles.badge}>🔄 Status: {ciclo.status}</span>
                </div>
            </div>

            {/* Linha do Tempo de Atividades */}
            <h2 style={{ fontSize: '1.25rem', color: '#1E293B', marginBottom: '1.5rem' }}>Histórico de Manejo</h2>
            
            {registosCronologicos && registosCronologicos.length > 0 ? (
                <div className={styles.timeline}>
                    {registosCronologicos.map((reg: any) => (
                        <div key={reg.id} className={styles.timelineItem}>
                            <div className={styles.timelineDot}></div>
                            <div className={styles.timelineContent}>
                                <div className={styles.itemHeader}>
                                    <span className={styles.itemDate}>{new Date(reg.data_registo).toLocaleDateString('pt-BR')}</span>
                                    <span className={styles.itemType}>{reg.tipo_display}</span>
                                </div>
                                <p className={styles.itemDescription}>{reg.descricao}</p>
                                
                                {reg.quantidade && (
                                    <div style={{ color: '#2D5A27', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                        Quantidade: {reg.quantidade}
                                    </div>
                                )}

                                {reg.anexo && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <img src={reg.anexo} alt="Anexo do registro" style={{ maxWidth: '100%', borderRadius: '6px' }} />
                                    </div>
                                )}
                                
                                <div className={styles.itemAuthor}>Registrado por: {reg.autor_nome}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem', border: '1px dashed #E2E8F0', borderRadius: '8px' }}>
                    Nenhum registro lançado para este ciclo ainda.
                </p>
            )}
        </div>
    );
}