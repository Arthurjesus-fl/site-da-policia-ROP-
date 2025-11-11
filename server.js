// Arquivo: server.js
// Para rodar: node server.js
// Dependências: npm install express cors uuid

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); 

const app = express();
const PORT = 5000;

// Configuração ESSENCIAL para a API
app.use(cors()); // Habilita o CORS para permitir requisições do seu HTML local
app.use(express.json()); // Habilita o Express a receber corpos de requisição em formato JSON

// Simulação de um banco de dados (armazena em memória)
let ocorrenciasDB = [];

// Função auxiliar para encontrar uma ocorrência pelo ID
const encontrarOcorrencia = (id) => {
    return ocorrenciasDB.find(item => item.id === id);
};

// ===============================================
// ROTA ETAPA 1: CRIAR NOVO ROP (POST)
// ===============================================
app.post('/api/rop/etapa1', (req, res) => {
    const dadosEtapa1 = req.body;

    if (!dadosEtapa1.atendimento || !dadosEtapa1.datahora || !dadosEtapa1.local_endereco) {
        return res.status(400).json({ erro: "Campos obrigatórios faltando na Etapa 1." });
    }

    try {
        const dataHoraOcorrencia = new Date(dadosEtapa1.datahora);
        if (dataHoraOcorrencia > new Date()) {
            return res.status(400).json({ erro: "Data e hora da ocorrência não podem ser futuras." });
        }
        
        const novoId = uuidv4();
        
        const novaOcorrencia = {
            id: novoId,
            protocolo_simulado: `ROP-PRE-${ocorrenciasDB.length + 1}`,
            status: "Etapa 1 Completa",
            etapa1: dadosEtapa1,
            etapa2: {},
            etapa3: {}
        };

        ocorrenciasDB.push(novaOcorrencia);

        return res.status(201).json({
            mensagem: "Etapa 1 salva com sucesso!",
            id_ocorrencia: novoId,
            protocolo_simulado: novaOcorrencia.protocolo_simulado
        });

    } catch (e) {
        return res.status(500).json({ erro: `Erro interno na Etapa 1: ${e.message}` });
    }
});

// ===============================================
// ROTA ETAPA 2: ATUALIZAR DADOS (PUT)
// ===============================================
app.put('/api/rop/:id_ocorrencia/etapa2', (req, res) => {
    const { id_ocorrencia } = req.params;
    const dadosEtapa2 = req.body;
    
    const ocorrencia = encontrarOcorrencia(id_ocorrencia);

    if (!ocorrencia) {
        return res.status(404).json({ erro: `Ocorrência ID ${id_ocorrencia} não encontrada.` });
    }

    if (!dadosEtapa2 || !dadosEtapa2.historico) {
        return res.status(400).json({ erro: "O campo 'historico' é obrigatório na Etapa 2." });
    }

    ocorrencia.etapa2 = dadosEtapa2;
    ocorrencia.status = "Etapa 2 Completa";

    return res.status(200).json({
        mensagem: "Etapa 2 atualizada com sucesso!",
        id_ocorrencia: ocorrencia.id,
        status: ocorrencia.status
    });
});

// ===============================================
// ROTA ETAPA 3: FINALIZAR (PUT)
// ===============================================
app.put('/api/rop/:id_ocorrencia/finalizar', (req, res) => {
    const { id_ocorrencia } = req.params;
    const dadosFinalizacao = req.body;
    
    const ocorrencia = encontrarOcorrencia(id_ocorrencia);

    if (!ocorrencia) {
        return res.status(404).json({ erro: `Ocorrência ID ${id_ocorrencia} não encontrada.` });
    }

    if (ocorrencia.status !== "Etapa 2 Completa") {
         return res.status(400).json({ erro: "Ocorrência deve estar na Etapa 2 completa para finalizar." });
    }

    if (!dadosFinalizacao || !dadosFinalizacao.senha_hash) {
        return res.status(400).json({ erro: "É necessária a confirmação de assinatura para finalizar." });
    }
    
    const anoAtual = new Date().getFullYear();
    ocorrencia.etapa3 = dadosFinalizacao;
    ocorrencia.status = "FINALIZADO E ASSINADO";
    // Usa um trecho do UUID como número de protocolo oficial
    ocorrencia.protocolo_oficial = `ROP-PMSE/${anoAtual}/${ocorrencia.id.slice(0, 6)}`;

    return res.status(200).json({
        mensagem: "ROP finalizado com sucesso e assinado digitalmente!",
        id_ocorrencia: ocorrencia.id,
        protocolo_oficial: ocorrencia.protocolo_oficial,
        status: ocorrencia.status
    });
});

// ===============================================
// INICIALIZAÇÃO DO SERVIDOR
// ===============================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor Node.js (API) rodando em http://localhost:${PORT}`);
});