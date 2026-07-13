# Aplicação que cria um dashboard usando a API do webposto 

## Fluxo de Dados (Passo a Passo)

O fluxo de dados da aplicação, desde a API externa até a interface do usuário, segue as seguintes etapas:

 **Agendamento (Servidor):** O arquivo `server/src/index.js` inicia o servidor e agenda tarefas (`cron` e `setInterval`) para buscar dados em intervalos regulares.
 **Sincronização (Servidor):** O `server/src/jobs/syncJob.js` é acionado. A função `runSync` orquestra a busca de dados de diferentes endpoints da API do WebPosto (vendas, tanques, DRE, etc.).
**Requisição à API (Servidor):** O `server/src/services/postoApi.js` é o responsável por fazer as chamadas `fetch` para a API externa. Ele constrói os cabeçalhos de autenticação e as URLs necessárias com base no `api-docs.json` e no `config.js`.
**Agregação de Dados (Servidor):** Após receber os dados brutos da API, o `syncJob` os envia para o `server/src/services/dataAggregator.js`. Este serviço processa, calcula e resume os dados, transformando-os em uma estrutura otimizada para o dashboard (o `payload`).
**Armazenamento e Transmissão (Servidor):**
*   O `payload` final é salvo no MongoDB como um `Snapshot` para fins de histórico e recuperação rápida.
*   O `server/src/index.js` usa `Socket.IO` para emitir um evento `dashboard:update` para todos os clientes conectados, enviando o novo `payload`.
 **Conexão (Cliente):** No frontend, o hook `client/src/hooks/useDashboard.js` estabelece uma conexão `Socket.IO` com o servidor e também busca os dados iniciais via uma requisição HTTP para carregar o dashboard imediatamente.
**Recebimento de Dados (Cliente):** O hook `useDashboard` "ouve" o evento `dashboard:update`. Ao recebê-lo, atualiza o estado da aplicação React com os novos dados.
**Renderização (Cliente):** O componente principal `client/src/components/Dashboard.jsx` detecta a mudança de estado e se redesenha, passando os dados atualizados como "props" para os componentes filhos (`KpiCard`, `SalesPanel`, etc.).
**Exibição (Cliente):** Os componentes filhos recebem os dados já formatados e os exibem na tela, usando funções auxiliares para formatar moedas, números e datas, completando o ciclo de atualização em tempo real.



## Àrvore do projeto

```
DashboardWP
├─ api-docs.json
├─ client
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ App.jsx
│  │  ├─ components
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ FinancialPanel.jsx
│  │  │  ├─ FuelPanel.jsx
│  │  │  ├─ KpiCard.jsx
│  │  │  ├─ SalesPanel.jsx
│  │  │  └─ StationComparison.jsx
│  │  ├─ hooks
│  │  │  └─ useDashboard.js
│  │  ├─ main.jsx
│  │  └─ styles
│  │     └─ index.css
│  └─ vite.config.js
├─ package-lock.json
├─ package.json
└─ server
   ├─ package-lock.json
   ├─ package.json
   └─ src
      ├─ config.js
      ├─ index.js
      ├─ jobs
      │  └─ syncJob.js
      ├─ models
      │  └─ Snapshot.js
      ├─ routes
      │  └─ dashboard.js
      └─ services
         ├─ dataAggregator.js
         └─ postoApi.js

```