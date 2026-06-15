import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { cadernoService } from '../services/cadernoService';

// ---------------------------------------------------------------------------
// Fila de sincronização offline (M8 - PWA)
//
// Armazenamento: IndexedDB (via 'idb'), guardando o arquivo (File/Blob) de
// forma nativa — sem converter para Base64. Isso evita o limite de ~5MB e a
// inflação de ~33% do localStorage, não bloqueia a main thread e permite
// operações atômicas por chave (sem race condition na sincronização).
// ---------------------------------------------------------------------------

const DB_NAME = 'campolog-offline';
const DB_VERSION = 1;
const STORE = 'fila-diario';

export interface RegistoPendente {
    _localId?: number; // chave auto-incremental do IndexedDB
    ciclo: number;
    tipo: string;
    descricao: string;
    anexo?: Blob | null; // arquivo físico guardado nativamente
    anexoNome?: string;
    criadoEm: number;
}

interface CampoLogDB extends DBSchema {
    [STORE]: {
        key: number;
        value: RegistoPendente;
    };
}

let dbPromise: Promise<IDBPDatabase<CampoLogDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<CampoLogDB>> => {
    if (!dbPromise) {
        dbPromise = openDB<CampoLogDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE, { keyPath: '_localId', autoIncrement: true });
                }
            },
        });
    }
    return dbPromise;
};

export const offlineQueue = {
    // Enfileira um novo registro para envio posterior. Retorna a chave local.
    salvar: async (dados: Omit<RegistoPendente, '_localId' | 'criadoEm'>): Promise<number> => {
        const db = await getDB();
        return db.add(STORE, { ...dados, criadoEm: Date.now() });
    },

    obterFila: async (): Promise<RegistoPendente[]> => {
        const db = await getDB();
        return db.getAll(STORE);
    },

    contarPendentes: async (): Promise<number> => {
        const db = await getDB();
        return db.count(STORE);
    },

    // Envia todos os registros pendentes. Cada item é removido individualmente
    // ao ser confirmado pelo servidor; falhas mantêm o item na fila para a
    // próxima tentativa, sem afetar os demais (operação atômica por chave).
    sincronizarPendentes: async (): Promise<void> => {
        if (!navigator.onLine) return;

        const pendentes = await offlineQueue.obterFila();
        if (pendentes.length === 0) return;

        console.log(`📡 Sincronizando ${pendentes.length} registro(s) offline...`);
        const db = await getDB();

        for (const item of pendentes) {
            try {
                const formData = new FormData();
                formData.append('ciclo', String(item.ciclo));
                formData.append('tipo', item.tipo);
                formData.append('descricao', item.descricao);
                if (item.anexo) {
                    formData.append('anexo', item.anexo, item.anexoNome || 'anexo.jpg');
                }

                await cadernoService.createRegisto(formData);

                // Sucesso confirmado pelo servidor → remove apenas este item.
                if (item._localId !== undefined) {
                    await db.delete(STORE, item._localId);
                }
            } catch (error) {
                // Mantém na fila e tenta novamente na próxima reconexão.
                console.error('Falha ao sincronizar item da fila offline.', error);
            }
        }
    },
};
