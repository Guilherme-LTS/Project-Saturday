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

1. Clone o repositório
```bash
git clone https://github.com/seuusuario/saturday-volleyball.git
```

2. Instale as dependências
```bash
cd saturday-volleyball
npm install
```

3. Inicie o servidor de desenvolvimento
```bash
npx expo start
```

## Compilação

Para gerar o APK Android:
```bash
eas build -p android
```
