# Gerenciador de Vôlei de Sábado

Um aplicativo móvel desenvolvido em React Native com Expo para gerenciar partidas e times de vôlei.

## Funcionalidades

- **Gerenciamento de Jogadores**
  - Adicionar, editar e excluir jogadores
  - Acompanhar estatísticas e desempenho
  - Importar/Exportar dados via QR code ou JSON
  - Avatares e personalização de jogadores

- **Formação de Times**
  - Balanceamento automático baseado em:
    - Nível de habilidade
    - Taxa de vitórias
    - Habilidades fundamentais
  - Posicionamento visual na quadra
  - Nomeação de times

- **Gerenciamento de Partidas**
  - Acompanhamento de placar em tempo real
  - Seleção de vencedor
  - Histórico de partidas
  - Rotação automática de jogadores
  - Estatísticas de desempenho

- **Interface**
  - Suporte a tema claro/escuro
  - Feedback tátil
  - Controles de placar intuitivos
  - Interface limpa e moderna

## Tecnologias Utilizadas

- React Native
- Expo
- TypeScript
- React Navigation
- Zustand (Gerenciamento de Estado)
- AsyncStorage
- Expo Haptics
- React Native SVG
- Expo Camera (QR Code)

## Instalação

1. Instalar Git e Node.js
    - Baixe e instale o Git (git-scm.com) e o Node.js versão LTS (nodejs.org).
    - Depois de instalar, confirme no terminal com `git --version` e `node -v`.

2. Clonar o repositório
    - No terminal, rode `git clone https://github.com/fabio-a-lima/Project-Saturday.git` e depois `cd Project-Saturday` para entrar na pasta do projeto.

3. Instalar as dependências
    - Dentro da pasta do projeto, rode `npm install`. Isso baixa todas as dependências (Expo, React Navigation, Zustand, etc.) listadas no package.json.

4. (Opcional) Instalar o EAS CLI
    - Rode `npm install -g eas-cli` se for usar o EAS Build depois. Não é obrigatório só para rodar em modo desenvolvimento, mas é necessário se quiser gerar um APK.

5. Iniciar o servidor de desenvolvimento
    - Com tudo instalado, rode `npx expo start`. Isso abre o Metro Bundler com um QR code no terminal.

6. Testar no celular ou navegador
    - No celular (ou emulador), instale o app Expo Go e escaneie o QR code, ou pressione `w` no terminal para abrir uma prévia no navegador. Nenhuma configuração extra de ambiente Android/iOS nativo é necessária nesse modo — só é preciso se for compilar um build nativo standalone.