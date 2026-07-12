// Importa a biblioteca 'dotenv', que serve para carregar variáveis de ambiente
// de um arquivo chamado '.env'. Variáveis de ambiente são usadas para guardar
// configurações sensíveis (como senhas) ou que mudam dependendo de onde o
// código está rodando (desenvolvimento, produção, etc.).
import dotenv from 'dotenv';

// Executa a configuração do dotenv, fazendo com que as variáveis do arquivo .env
// fiquem disponíveis no objeto 'process.env' do Node.js.
dotenv.config();

// Exporta um objeto chamado 'config' que centraliza todas as configurações da aplicação.
// 'export' permite que outros arquivos do projeto importem e usem essas configurações.
export const config = {
  // Define a porta em que o servidor web vai rodar.
  // Pense nisso como o número de um apartamento em um prédio.
  // Ele tenta ler a variável de ambiente 'PORT'. Se não existir, usa '4000' como padrão.
  // O 'parseInt' garante que o valor seja um número inteiro.
  port: parseInt(process.env.PORT || '4000', 10),

  // Define o endereço de conexão com o banco de dados MongoDB.
  // O banco de dados é onde as informações do dashboard (snapshots) são armazenadas.
  // Tenta ler a variável 'MONGODB_URI'. Se não existir, usa um endereço local padrão.
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dashboard-posto',

  // Define o endereço base da API externa de onde os dados dos postos são buscados.
  // Tenta ler a variável 'API_BASE_URL'. Se não existir, usa a URL da Quality Automação.
  apiBaseUrl: process.env.API_BASE_URL || 'http://web.qualityautomacao.com.br',

  // Define o "token de acesso" para a API. É uma chave de segurança que prova
  // que temos permissão para solicitar dados.
  // Tenta ler a variável 'API_TOKEN'. Se não existir, fica vazio.
  apiToken: process.env.API_TOKEN || '',

  // Define o nome de usuário para acessar a API, caso a autenticação seja do tipo "Basic".
  // Tenta ler a variável 'API_USER'. Se não existir, fica vazio.
  apiUser: process.env.API_USER || '',

  // Define a senha para acessar a API, caso a autenticação seja do tipo "Basic".
  // Tenta ler a variável 'API_PASSWORD'. Se não existir, fica vazio.
  apiPassword: process.env.API_PASSWORD || '',

  // Define o intervalo, em segundos, para a sincronização de dados mais frequentes (vendas, tanques, etc.).
  // Tenta ler a variável 'SYNC_INTERVAL_SECONDS'. Se não existir, usa 30 segundos como padrão.
  syncIntervalSeconds: parseInt(process.env.SYNC_INTERVAL_SECONDS || '30', 10),

  // Define o intervalo, em minutos, para a sincronização de dados mais pesados e menos voláteis, como o DRE.
  // Tenta ler a variável 'DRE_SYNC_INTERVAL_MINUTES'. Se não existir, usa 5 minutos como padrão.
  dreSyncIntervalMinutes: parseInt(process.env.DRE_SYNC_INTERVAL_MINUTES || '5', 10),

  // Define de qual endereço (URL) o "frontend" (a parte visual do dashboard no navegador)
  // tem permissão para acessar este servidor. É uma medida de segurança chamada CORS.
  // Tenta ler a variável 'CORS_ORIGIN'. Se não existir, permite o acesso do ambiente de desenvolvimento local.
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
