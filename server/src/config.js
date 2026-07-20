// Importa a biblioteca 'dotenv', que serve para carregar variáveis de ambiente
// de um arquivo chamado '.env'. Variáveis de ambiente são usadas para guardar
// configurações sensíveis (como senhas) ou que mudam dependendo de onde o
// código está rodando (desenvolvimento, produção, etc.).
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker-mern',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
