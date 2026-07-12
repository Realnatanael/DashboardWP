/**
 * @file Este é o arquivo principal do servidor (backend) da aplicação.
 *
 * Funções:
 * 1. Inicia um servidor web (usando Express) para receber requisições.
 * 2. Configura a comunicação em tempo real (usando Socket.IO) para que o dashboard
 *    dos usuários atualize automaticamente.
 * 3. Conecta-se a um banco de dados (MongoDB) para guardar um histórico dos dados.
 * 4. Serve os arquivos do "frontend" (a parte visual que roda no navegador).
 * 5. Agenda tarefas automáticas (usando node-cron e setInterval) para buscar
 *    periodicamente os dados mais recentes da API do WebPosto.
 * 6. Após buscar os dados, ele os processa e envia para todos os dashboards conectados.
 *
 * Em resumo, este arquivo é o "coração" do backend, orquestrando a busca de dados,
 * o armazenamento e a comunicação com a interface do usuário.
 */

// Importa a biblioteca 'express', que é a base para criar o servidor web.
// Pense nela como a fundação de uma casa.
import express from 'express';
// Importa a biblioteca 'cors' para permitir que o "frontend" (o site no navegador)
// acesse este servidor, mesmo estando em um "endereço" diferente. É uma medida de segurança.
import cors from 'cors';
// Importa o módulo 'http' do Node.js para criar o servidor HTTP.
import { createServer } from 'http';
// Importa a biblioteca 'socket.io' para permitir comunicação em tempo real
// entre o servidor e os clientes (navegadores). É o que faz o dashboard atualizar sozinho.
import { Server } from 'socket.io';
// Importa o 'mongoose', uma ferramenta para interagir com o banco de dados MongoDB
// de uma forma mais fácil e organizada.
import mongoose from 'mongoose';
// Importa a biblioteca 'node-cron' para agendar tarefas repetitivas, como
// buscar dados da API externa em intervalos de tempo definidos.
import cron from 'node-cron';
// Importa os módulos 'path' e 'url' do Node.js para lidar com caminhos de arquivos
// de forma que funcione em qualquer sistema operacional.
import path from 'path';
import { fileURLToPath } from 'url';

// Importa as configurações da aplicação (como porta do servidor, URL do banco de dados, etc.).
import { config } from './config.js';
// Importa as rotas (os "endereços" da nossa API) relacionadas ao dashboard.
import dashboardRoutes from './routes/dashboard.js';
// Importa as funções que cuidam da sincronização de dados e do carregamento do último estado.
import { runSync, loadLastSnapshot } from './jobs/syncJob.js';

// --- Configuração Inicial ---

// Obtém o caminho do diretório atual do arquivo. É um truque para que o Node.js
// com módulos ES (import/export) saiba onde está.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Cria a aplicação Express. É a nossa "casa" do servidor.
const app = express();
// Cria um servidor HTTP a partir da nossa aplicação Express.
const httpServer = createServer(app);

// --- Configuração do Socket.IO (Comunicação em Tempo Real) ---

// Inicia o servidor de Socket.IO, conectando-o ao servidor HTTP.
// Isso permite que a "mágica" da atualização em tempo real aconteça.
const io = new Server(httpServer, {
  cors: {
    // Permite que o frontend (ex: http://localhost:5173) se conecte a este servidor.
    origin: config.corsOrigin,
    // Define os métodos HTTP permitidos.
    methods: ['GET', 'POST'],
  },
});

// --- Configuração do Express (Servidor Web) ---

// Aplica o middleware CORS para permitir requisições do frontend.
app.use(cors({ origin: config.corsOrigin }));
// Aplica o middleware que permite ao servidor entender requisições com corpo em formato JSON.
app.use(express.json());
// Define que todas as rotas que começam com '/api/dashboard' serão gerenciadas pelo 'dashboardRoutes'.
app.use('/api/dashboard', dashboardRoutes);

// --- Servindo o Frontend (a parte visual do projeto) ---

// Define o caminho para a pasta 'dist' do cliente, que contém a versão final do site.
const clientDist = path.join(__dirname, '../../client/dist');
// Configura o Express para servir os arquivos estáticos (HTML, CSS, JS, imagens) dessa pasta.
app.use(express.static(clientDist));
// Esta é uma rota "catch-all" (pega-tudo). Ela garante que, se alguém acessar qualquer URL
// que não seja uma API (não começa com '/api'), o servidor responderá com o arquivo
// 'index.html' principal. Isso é essencial para que aplicações de página única (SPAs) como o React funcionem.
app.get('*', (req, res, next) => {
  // Ignora as rotas da API e do Socket.IO.
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
  // Envia o arquivo principal do frontend.
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    // Se houver um erro ao enviar o arquivo, passa para o próximo middleware.
    if (err) next();
  });
});

// --- Lógica de Sincronização e Transmissão ---

// Evento disparado quando um novo cliente (navegador) se conecta ao servidor.
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  // Evento disparado quando o cliente se desconecta.
  socket.on('disconnect', () => console.log(`Cliente desconectado: ${socket.id}`));
});

// Função principal que executa a sincronização de dados e os envia para todos os clientes conectados.
// 'includeDre' é um booleano que decide se a sincronização deve incluir os dados do DRE (que são mais pesados).
async function syncAndBroadcast(includeDre = false) {
  try {
    // Chama a função 'runSync' para buscar e processar os dados da API externa.
    const data = await runSync(includeDre);
    // Emite um evento 'dashboard:update' para todos os clientes, enviando os novos dados.
    // É isso que faz o dashboard na tela do usuário atualizar.
    io.emit('dashboard:update', data);
  } catch (err) {
    // Se ocorrer um erro durante a sincronização, emite um evento 'dashboard:error'.
    io.emit('dashboard:error', { message: err.message, timestamp: new Date().toISOString() });
  }
}

// --- Inicialização do Servidor ---

// Função assíncrona que inicia todo o sistema.
async function start() {
  // Conecta-se ao banco de dados MongoDB usando a URL das configurações.
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB conectado');

  // Carrega o último "snapshot" (foto dos dados) salvo no banco de dados para a memória.
  // Isso garante que, se o servidor reiniciar, ele já tenha dados para mostrar imediatamente.
  await loadLastSnapshot();

  // Executa uma primeira sincronização completa (incluindo DRE) assim que o servidor liga.
  await syncAndBroadcast(true);

  // Agenda a sincronização mais leve (sem DRE) para rodar a cada X segundos.
  // O intervalo é definido no arquivo de configuração.
  setInterval(() => syncAndBroadcast(false), config.syncIntervalSeconds * 1000);

  // Agenda a sincronização mais pesada (com DRE) para rodar a cada Y minutos.
  // Usa o formato do 'cron' para agendamento.
  cron.schedule(`*/${config.dreSyncIntervalMinutes} * * * *`, () => {
    syncAndBroadcast(true);
  });

  // Inicia o servidor HTTP, que ficará "ouvindo" por requisições na porta configurada.
  httpServer.listen(config.port, () => {
    console.log(`Servidor rodando em http://localhost:${config.port}`);
    console.log(`Sync a cada ${config.syncIntervalSeconds}s | DRE a cada ${config.dreSyncIntervalMinutes}min`);
  });
}

// Chama a função 'start' para iniciar o servidor.
// Se algo der errado, captura o erro, exibe no console e encerra o processo.
start().catch((err) => {
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});
