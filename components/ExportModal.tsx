// components/ExportModal.tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import useTheme from '../hooks/useTheme';
import { useGameStore } from '../stores/gameStore';
import { usePlayersStore } from '../stores/playersStore';
import {
  exportAsJSON,
  exportAsQRCode,
  exportAsText,
  generateAppData
} from '../utils/exportImportUtils';

// Import icons
import FileIcon from '../assets/icons/file.svg';
import QRCodeIcon from '../assets/icons/qr-code.svg';
import ShareIcon from '../assets/icons/share.svg';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  darkMode: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({ visible, onClose, darkMode }) => {
  const theme = useTheme(darkMode);
  const { allPlayers, selectedPlayerIds } = usePlayersStore();
  const { matchHistory } = useGameStore();
  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);

  const handleExportJSON = async () => {
    setIsLoading(true);
    try {
      const appData = generateAppData(allPlayers, selectedPlayerIds, matchHistory);
      const success = await exportAsJSON(appData);
      if (success) {
        Alert.alert('Sucesso', 'Dados exportados como arquivo JSON');
        onClose();
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportQR = async () => {
    setIsLoading(true);
    try {
      const appData = generateAppData(allPlayers, selectedPlayerIds, matchHistory);
      const qrString = await exportAsQRCode(appData);
      if (qrString) {
        setQrData(qrString);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao gerar QR Code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportText = async () => {
    setIsLoading(true);
    try {
      const appData = generateAppData(allPlayers, selectedPlayerIds, matchHistory);
      const textData = await exportAsText(appData);
      if (textData) {
        Alert.alert('Sucesso', 'Dados exportados como texto');
        onClose();
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar como texto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseQR = () => {
    setQrData(null);
  };

  if (qrData) {
    return (
      <Modal transparent visible={visible} animationType="fade" onRequestClose={handleCloseQR}>
        <TouchableWithoutFeedback onPress={handleCloseQR}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.qrModalView, { backgroundColor: theme.card }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>QR Code dos Dados</Text>
                <Text style={[styles.modalSubtitle, { color: theme.placeholder, marginBottom: 24 }]}>
                  Escaneie este código no outro dispositivo para importar os dados
                </Text>

                <View style={{ padding: 16, backgroundColor: '#FFF', borderRadius: 8 }}>
                  <QRCode
                    value={qrData}
                    size={220}
                    backgroundColor="#FFF"
                    color="#000"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.primary }]}
                  onPress={handleCloseQR}
                >
                  <Text style={[styles.buttonText, { color: theme.primaryText }]}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Exportar Dados</Text>
              <Text style={[styles.modalSubtitle, { color: theme.placeholder }]}>
                Escolha o formato para exportar seus jogadores e histórico
              </Text>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.placeholder }]}>
                    Exportando dados...
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.optionButton, { backgroundColor: theme.background }]}
                    onPress={handleExportJSON}
                  >
                    <FileIcon stroke={theme.primary} width={24} height={24} />
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: theme.text }]}>
                        Arquivo JSON
                      </Text>
                      <Text style={[styles.optionDescription, { color: theme.placeholder }]}>
                        Melhor para backup completo e compartilhamento
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, { backgroundColor: theme.background }]}
                    onPress={handleExportQR}
                  >
                    <QRCodeIcon stroke={theme.primary} width={24} height={24} />
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: theme.text }]}>
                        QR Code
                      </Text>
                      <Text style={[styles.optionDescription, { color: theme.placeholder }]}>
                        Compartilhamento rápido entre dispositivos próximos
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, { backgroundColor: theme.background }]}
                    onPress={handleExportText}
                  >
                    <ShareIcon stroke={theme.primary} width={24} height={24} />
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: theme.text }]}>
                        Texto Codificado
                      </Text>
                      <Text style={[styles.optionDescription, { color: theme.placeholder }]}>
                        Copiar e colar em mensagens
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={[styles.cancelButtonText, { color: theme.placeholder }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'stretch',
  },
  qrModalView: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrInstructions: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  qrDataText: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 10,
  },
  closeButton: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    padding: 10,
    marginTop: 4,
  },
  cancelButtonText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});

export default ExportModal;