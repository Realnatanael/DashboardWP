/**
 * Este arquivo define o custom hook `useDashboard` e várias funções de formatação.
 *
 * O hook `useDashboard` é o "cérebro" da interface do dashboard no lado do cliente (frontend).
 * Ele é responsável por toda a lógica de buscar, gerenciar e atualizar os dados exibidos na tela.
 *
 * Principais Funções:
 * 1.  **Gerenciar o Estado:** Controla todas as informações dinâmicas, como os dados do dashboard (`data`),
 *     se a página está carregando (`loading`), se ocorreu algum erro (`error`), e o status da
 *     conexão em tempo real (`connected`).
 *
 * 2.  **Buscar Dados Iniciais:** Quando a página carrega, ele faz uma requisição inicial ao servidor
 *     para obter os dados mais recentes e exibir o dashboard imediatamente, sem que o usuário
 *     precise esperar pela primeira atualização automática.
 *
 * 3.  **Comunicação em Tempo Real:** Estabelece uma conexão contínua com o servidor usando Socket.IO.
 *     Fica "ouvindo" por um evento chamado `dashboard:update`. Quando o servidor envia novos dados
 *     através desse evento, o hook atualiza as informações, e o React redesenha a tela
 *     automaticamente para o usuário.
 *
 * 4.  **Formatação de Dados:** O arquivo também exporta funções auxiliares (como `formatCurrency`, `formatTime`)
 *     que transformam dados brutos (números, datas) em um formato amigável e legível para
 *     serem mostrados nos cartões e painéis do dashboard.
 */

import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// A URL do servidor da API é lida de uma variável de ambiente (arquivo .env).
// Isso permite configurar um endereço para desenvolvimento e outro para produção.
const API_URL = import.meta.env.VITE_API_URL || '';

// `useDashboard` é um "Custom Hook" do React. Pense nele como uma função reutilizável
// que encapsula toda a lógica complexa do dashboard. Componentes React podem "usar"
// este hook para ter acesso fácil aos dados e ao status da aplicação.
export function useDashboard() {
  // --- Estados do Componente ---
  // `useState` é um hook do React que permite adicionar "estado" (memória) a um componente.

  // `data`: Armazena o objeto principal com todos os dados do dashboard (vendas, tanques, etc.).
  // Inicia como `null` porque ainda não temos os dados.
  const [data, setData] = useState(null);
  // `loading`: Um booleano (true/false) que indica se estamos buscando dados.
  // Útil para mostrar uma animação de carregamento na tela. Começa como `true`.
  const [loading, setLoading] = useState(true);
  // `error`: Armazena mensagens de erro, caso algo dê errado na busca de dados.
  // Inicia como `null` porque não há erros ainda.
  const [error, setError] = useState(null);
  // `connected`: Indica se a conexão em tempo real com o servidor está ativa.
  // Usado para mostrar o indicador de status (bolinha verde/vermelha).
  const [connected, setConnected] = useState(false);
  // `lastUpdate`: Guarda a data/hora da última atualização recebida do servidor.
  const [lastUpdate, setLastUpdate] = useState(null);

  // `fetchInitial` é a função que busca os dados iniciais quando a página carrega.
  // `useCallback` é um hook de otimização. Ele "memoriza" a função para que ela não
  // seja recriada a cada renderização, a menos que suas dependências mudem.
  const fetchInitial = useCallback(async () => {
    // O bloco `try...catch...finally` é uma forma segura de lidar com operações
    // que podem falhar, como chamadas de rede.
    try {
      // `fetch` é a função do navegador para fazer requisições HTTP.
      // Aqui, estamos pedindo os dados para a rota `/api/dashboard` do nosso servidor.
      const res = await fetch(`${API_URL}/api/dashboard`);
      // Se a resposta não for bem-sucedida (ex: erro 404 ou 500), lança um erro.
      if (!res.ok) throw new Error('Aguardando primeira sincronização...');
      // Converte a resposta (que vem em formato JSON) para um objeto JavaScript.
      const json = await res.json();
      // Atualiza os estados com os dados recebidos.
      setData(json);
      setLastUpdate(json.geradoEm);
      setError(null); // Limpa qualquer erro anterior.
    } catch (err) {
      // Se ocorrer um erro no `try`, ele é capturado aqui.
      setError(err.message);
    } finally {
      // O bloco `finally` sempre executa, independentemente de sucesso ou erro.
      setLoading(false);
    }
  }, []); // O array vazio `[]` significa que a função não depende de nada e nunca será recriada.

  // `useEffect` é um hook que executa "efeitos colaterais" (operações fora do fluxo normal
  // de renderização), como buscar dados ou configurar conexões.
  useEffect(() => {
    // 1. Busca os dados iniciais para preencher a tela rapidamente.
    fetchInitial();

    // 2. Configura a conexão em tempo real (Socket.IO).
    // `io()` cria uma nova instância do cliente socket, conectando-se ao servidor.
    const socket = io(API_URL || undefined, {
      transports: ['websocket', 'polling'],
    });

    // --- Ouvintes de Eventos do Socket ---
    // `socket.on` registra uma função para ser executada quando um evento específico é recebido.

    // 'connect': Disparado quando a conexão com o servidor é estabelecida com sucesso.
    socket.on('connect', () => setConnected(true));
    // 'disconnect': Disparado quando a conexão é perdida.
    socket.on('disconnect', () => setConnected(false));

    // 'dashboard:update': Este é o evento principal. O servidor o emite quando
    // há novos dados. O `payload` contém o objeto completo do dashboard.
    socket.on('dashboard:update', (payload) => {
      setData(payload);
      setLastUpdate(payload.geradoEm);
      setError(null);
      setLoading(false);
    });

    // 'dashboard:error': Disparado se o servidor encontrar um erro durante a sincronização.
    socket.on('dashboard:error', (err) => {
      setError(err.message);
    });

    // --- Função de Limpeza ---
    // A função retornada pelo `useEffect` é executada quando o componente "desmonta" (sai da tela).
    // Isso é crucial para evitar vazamentos de memória e conexões abertas desnecessariamente.
    return () => socket.disconnect();
  }, [fetchInitial]);

  // Retorna um objeto com todos os estados e funções que os componentes precisarão.
  return { data, loading, error, connected, lastUpdate };
}

/**
 * Formata um número como moeda brasileira (Real).
 * Ex: 12345.67 -> "R$ 12.346"
 * @param {number} value O valor numérico a ser formatado.
 * @returns {string} A string formatada como moeda.
 */
export function formatCurrency(value) {
  // `Intl.NumberFormat` é uma API nativa do JavaScript para formatação de números
  // sensível à localidade e ao idioma.
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', // Formato de moeda.
    currency: 'BRL',   // Moeda brasileira.
    minimumFractionDigits: 0, // Não mostra centavos.
    maximumFractionDigits: 0, // Arredonda para o inteiro mais próximo.
  }).format(value || 0); // `value || 0` garante que se `value` for nulo ou indefinido, ele formata 0.
}

/**
 * Formata um número com separadores de milhar.
 * Ex: 12345.67 -> "12.345,67"
 * @param {number} value O valor numérico.
 * @param {number} decimals O número de casas decimais a serem exibidas.
 * @returns {string} A string formatada.
 */
export function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

/**
 * Formata um número e adiciona o sufixo " L" (litros).
 * Ex: 15000 -> "15.000 L"
 * @param {number} value O valor em litros.
 * @returns {string} A string formatada com a unidade.
 */
export function formatLiters(value) {
  return `${formatNumber(value, 0)} L`;
}

/**
 * Formata um número e adiciona o sufixo "%".
 * Ex: 85.123 -> "85,1%"
 * @param {number} value O valor percentual.
 * @returns {string} A string formatada com o símbolo de porcentagem.
 */
export function formatPercent(value) {
  return `${formatNumber(value, 1)}%`;
}

/**
 * Converte uma data no formato ISO (ex: "2023-10-27T14:30:15.123Z")
 * para um horário local amigável.
 * Ex: "2023-10-27T14:30:15.123Z" -> "11:30:15" (considerando fuso -3)
 * @param {string} iso A string da data em formato ISO.
 * @returns {string} O horário formatado ou '—' se a data for inválida.
 */
export function formatTime(iso) {
  // Se a data não for fornecida, retorna um traço para não quebrar a interface.
  if (!iso) return '—';
  // `toLocaleTimeString` formata a parte do horário de um objeto Date
  // de acordo com a localidade e as opções fornecidas.
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
