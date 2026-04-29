import { cadernoService } from '../services/cadernoService';

const QUEUE_KEY = 'campolog_diario_queue';

// Função que reconstrói o arquivo físico a partir do texto Base64
const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

export const offlineQueue = {
    salvar: (dados: any) => {
        const fila = offlineQueue.obterFila();
        fila.push({ ...dados, _localId: Date.now() });
        localStorage.setItem(QUEUE_KEY, JSON.stringify(fila));
    },
    
    obterFila: () => {
        const fila = localStorage.getItem(QUEUE_KEY);
        return fila ? JSON.parse(fila) : [];
    },
    
    sincronizarPendentes: async () => {
        if (!navigator.onLine) return; 
        
        const fila = offlineQueue.obterFila();
        if (fila.length === 0) return;

        console.log(`📡 Sincronizando ${fila.length} registros offline...`);
        
        const pendentes = [...fila];
        for (const item of pendentes) {
            try {
                const localId = item._localId;
                delete item._localId; 
                
                const formData = new FormData();
                Object.keys(item).forEach(key => {
                    // Se achar a foto em texto, converte de volta para Arquivo Físico
                    if (key === 'fotoBase64' && item[key]) {
                        const file = base64ToFile(item[key], `offline_upload_${Date.now()}.jpg`);
                        formData.append('anexo', file);
                    } else if (key !== 'fotoBase64' && item[key] !== null && item[key] !== '') {
                        formData.append(key, item[key]);
                    }
                });
                
                await cadernoService.createRegisto(formData as any);
                
                const filaAtualizada = offlineQueue.obterFila().filter((r: any) => r._localId !== localId);
                localStorage.setItem(QUEUE_KEY, JSON.stringify(filaAtualizada));
                
            } catch (error) {
                console.error('Falha ao sincronizar item.', error);
            }
        }
    }
};