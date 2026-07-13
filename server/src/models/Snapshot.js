// Este arquivo define o modelo "Snapshot" para o MongoDB usando Mongoose. Cada snapshot representa um estado do dashboard em um determinado momento, armazenando dados relevantes como vendas, estoque e financeiro.
// Ele é usado para salvar e recuperar snapshots do dashboard, permitindo que o histórico de dados seja acessado posteriormente.
// Importa o Mongoose, uma biblioteca que facilita a interação com o MongoDB, permitindo definir esquemas e modelos de dados de forma estruturada.
import mongoose from 'mongoose';
// Define o esquema do modelo "Snapshot" no MongoDB. Cada snapshot representa um estado do dashboard em um determinado momento.
const snapshotSchema = new mongoose.Schema({
  tipo: { type: String, required: true, index: true }, // O tipo do snapshot, por exemplo, "dashboard". Isso permite diferenciar entre diferentes tipos de snapshots no mesmo banco de dados.
  dados: { type: mongoose.Schema.Types.Mixed, required: true },// Os dados do snapshot, armazenados como um objeto genérico. Pode conter informações de vendas, estoque, financeiro, etc.
  geradoEm: { type: Date, default: Date.now, index: true },// A data e hora em que o snapshot foi gerado. Por padrão, é a data atual. Indexado para permitir consultas rápidas por data.
});
// Cria um índice composto para otimizar consultas que filtram por tipo e ordenam por data de geração. Isso é útil para obter rapidamente o último snapshot de um determinado tipo.
snapshotSchema.index({ tipo: 1, geradoEm: -1 });
// Cria o modelo "Snapshot" a partir do esquema definido. Este modelo será usado para interagir com a coleção de snapshots no MongoDB.
export const Snapshot = mongoose.model('Snapshot', snapshotSchema);
