// screens/SettingsScreen.tsx
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import components
import { TAB_BAR_HEIGHT } from '../components/CustomTabBar';
import ExportModal from '../components/ExportModal';
import ImportModal from '../components/ImportModal';

// Import hooks and stores
import useTheme from '../hooks/useTheme';
import { useGameStore } from '../stores/gameStore';
import { usePlayersStore } from '../stores/playersStore';
import { useThemeStore } from '../stores/themeStore';

// Import icons
import DownloadIcon from '../assets/icons/download.svg';
import InfoIcon from '../assets/icons/info.svg';
import MoonIcon from '../assets/icons/moon.svg';
import UploadIcon from '../assets/icons/share.svg';
import SunIcon from '../assets/icons/sun.svg';
import TrashIcon from '../assets/icons/trash.svg';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { darkMode, setDarkMode } = useThemeStore();
  const { deleteAllMatches, matchHistory, teamDisplayNames, setTeamDisplayName } = useGameStore();

  const { deleteAllPlayers, allPlayers } = usePlayersStore();
  const theme = useTheme(darkMode);

  // Modal states
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);

  const handleDeleteAllPlayers = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Apagar Todos os Jogadores?",
      "Esta ação removerá todos os jogadores permanentemente.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Apagar Tudo", 
          style: "destructive", 
          onPress: () => {
            deleteAllPlayers();
            Alert.alert("Sucesso", "Todos os jogadores foram removidos.");
            { cancelable: true };
          }
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAllMatches = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Apagar Histórico de Partidas?",
      "Esta ação removerá todo o histórico de partidas permanentemente.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Apagar Tudo", 
          style: "destructive", 
          onPress: () => {
            deleteAllMatches();
            Alert.alert("Sucesso", "Histórico de partidas foi removido.");
            { cancelable: true };
          }
        },
      ],
      { cancelable: true }
    );
  };

  const handleToggleDarkMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDarkMode(!darkMode);
  };

  const handleShowAppInfo = () => {
    Alert.alert(
      "Sobre o App",
      "Volleyball Draw\nVersão 1.0.0\n\nApp para sortear times de vôlei de forma equilibrada, guardar histórico de partidas e informações de jogadores.",
      [{ text: "OK" }],
      { cancelable: true }
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top + 8, paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Gerenciar Dados
          </Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.cardInactive }]}
            onPress={() => setExportModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <UploadIcon stroke={theme.primary} width={24} height={24} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Exportar Dados
                </Text>
                <Text style={[styles.settingDescription, { color: theme.placeholder }]}>
                  Fazer backup dos jogadores e partidas
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.cardInactive }]}
            onPress={() => setImportModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <DownloadIcon stroke={theme.primary} width={24} height={24} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Importar Dados
                </Text>
                <Text style={[styles.settingDescription, { color: theme.placeholder }]}>
                  Restaurar backup ou receber dados de outro dispositivo
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Team Names Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Nomes dos Times</Text>
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.cardInactive }]}> 
            <View style={styles.settingLeft}>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Time 1</Text>
                <Text style={[styles.settingDescription, { color: theme.placeholder }]}>Nome exibido para o primeiro time</Text>
              </View>
            </View>
            <TextInput
              style={[styles.textInput, { color: theme.text, borderColor: theme.inputArea, backgroundColor: theme.inputArea }]}
              placeholder="Time 1"
              placeholderTextColor={theme.placeholder}
              value={teamDisplayNames?.[0]}
              onChangeText={(t) => setTeamDisplayName(0, t)}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.cardInactive }]}> 
            <View style={styles.settingLeft}>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Time 2</Text>
                <Text style={[styles.settingDescription, { color: theme.placeholder }]}>Nome exibido para o segundo time</Text>
              </View>
            </View>
            <TextInput
              style={[styles.textInput, { color: theme.text, borderColor: theme.inputArea, backgroundColor: theme.inputArea }]}
              placeholder="Time 2"
              placeholderTextColor={theme.placeholder}
              value={teamDisplayNames?.[1]}
              onChangeText={(t) => setTeamDisplayName(1, t)}
            />
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Aparência
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.cardInactive }]}>
            <View style={styles.settingLeft}>
              {darkMode ? (
                <MoonIcon stroke={theme.primary} width={24} height={24} />
              ) : (
                <SunIcon stroke={theme.primary} width={24} height={24} />
              )}
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Modo Escuro
                </Text>
                <Text style={[styles.settingDescription, { color: theme.placeholder }]}>
                  {darkMode ? 'Ativado' : 'Desativado'}
                </Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={darkMode ? theme.primaryText : theme.background}
            />
          </View>
        </View>

        {/* Data Statistics Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Estatísticas
          </Text>
          
          <View style={[styles.statItem, { backgroundColor: theme.card, borderColor: theme.cardInactive }]}>
            <Text style={[styles.statLabel, { color: theme.placeholder }]}>
              Total de Jogadores
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {allPlayers.length}
            </Text>
          </View>

          <View style={[styles.statItem, { backgroundColor: theme.card, borderColor: theme.cardInactive }]}>
            <Text style={[styles.statLabel, { color: theme.placeholder }]}>
              Partidas Registradas
            </Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {matchHistory.length}
            </Text>
          </View>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.danger }]}>
            Limpar Dados
          </Text>
          
          <TouchableOpacity
            style={[styles.dangerItem, { backgroundColor: '#ff2c2c', borderColor: '#ff2c2c' }]}
            onPress={handleDeleteAllPlayers}
          >
            <View style={styles.settingLeft}>
              <TrashIcon stroke={theme.text} width={24} height={24} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Apagar Todos os Jogadores
                </Text>
                <Text style={[styles.settingDescription, { color: theme.text }]}>
                  Remove permanentemente todos os jogadores
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerItem, { backgroundColor: '#ff2c2c', borderColor: '#ff2c2c' }]}
            onPress={handleDeleteAllMatches}
          >
            <View style={styles.settingLeft}>
              <TrashIcon stroke={theme.text} width={24} height={24} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Apagar Histórico de Partidas
                </Text>
                <Text style={[styles.settingDescription, { color: theme.text }]}>
                  Remove permanentemente todo o histórico
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.cardInactive }]}
            onPress={handleShowAppInfo}
          >
            <View style={styles.settingLeft}>
              <InfoIcon stroke={theme.primary} width={24} height={24} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Sobre o App
                </Text>
                <Text style={[styles.settingDescription, { color: theme.placeholder }]}>
                  Informações da versão
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        darkMode={darkMode}
      />
      
      <ImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        darkMode={darkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textInput: {
    minWidth: 120,
    maxWidth: 180,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 12,
  },
});