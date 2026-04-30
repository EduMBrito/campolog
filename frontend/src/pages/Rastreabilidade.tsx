import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cadernoService } from '../services/cadernoService';
import styles from './Rastreabilidade.module.css';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Rastreabilidade() {
    const { id } = useParams<{ id: string }>();
    const [ciclo, setCiclo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(false);
    const [gerandoPdf, setGerandoPdf] = useState(false);

    // 1. Criamos uma referência para o "miolo" do relatório
    const relatorioRef = useRef<HTMLDivElement>(null);

    const gerarPDF = async () => {
        const elemento = relatorioRef.current;
        if (!elemento) return;

        setGerandoPdf(true);

        try {
            // Tira a "fotografia" da div
            const canvas = await html2canvas(elemento, {
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Dimensões da página A4 no jsPDF
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight(); 

            // Altura total que a nossa foto terá no PDF
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            
            let heightLeft = imgHeight; // O quanto falta imprimir
            let position = 0; // Posição Y da imagem

            // 1. Imprime a primeira página
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pageHeight;

            // 2. Enquanto ainda sobrar conteúdo, adiciona página e sobe a imagem
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight; 
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Dossie_CampoLog_Lote_${id}.pdf`);
            
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Falha ao gerar o arquivo PDF.");
        } finally {
            setGerandoPdf(false);
        }
    };

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
            <Link to="/" style={{ color: '#2D5A27', fontWeight: 'bold' }}>Voltar ao Início</Link>
        </div>
    );

    return (
        <div>
            {/* CABEÇALHO DOS BOTÕES (Fica de fora da impressão) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', maxWidth: '600px', margin: '0 auto' }}>
                <button 
                    onClick={gerarPDF} 
                    disabled={gerandoPdf}
                    style={{
                        backgroundColor: gerandoPdf ? '#94A3B8' : '#2D5A27', 
                        color: 'white', border: 'none',
                        padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 'bold', 
                        cursor: gerandoPdf ? 'wait' : 'pointer'
                    }}
                >
                    {gerandoPdf ? '⏳ Gerando Arquivo...' : '🖨️ Baixar Relatório (PDF)'}
                </button>
            </div>

            {/* ÁREA DO RELATÓRIO (É isso aqui que a biblioteca vai clonar e imprimir) */}
            <div ref={relatorioRef} className={styles.container}>
                <div className={styles.headerCard}>
                    <h1 className={styles.culturaTitle}>{ciclo.cultura_nome}</h1>
                    <p style={{ margin: 0, opacity: 0.9 }}>{ciclo.talhao_nome}</p>
                    
                    <div className={styles.badgesContainer}>
                        <span className={styles.badge}>Início: {new Date(ciclo.data_inicio).toLocaleDateString('pt-BR')}</span>
                        <span className={styles.badge}>Status: {ciclo.status}</span>
                    </div>
                </div>

                <h2 style={{ color: '#2D5A27', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                    Histórico de Operações
                </h2>

                {ciclo.registos && ciclo.registos.length > 0 ? (
                    <div className={styles.timeline}>
                        {ciclo.registos.map((reg: any) => (
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

                                    {/* Na impressão, a foto sai perfeitamente se existir */}
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
        </div>
    );
}