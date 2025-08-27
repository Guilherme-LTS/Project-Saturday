// components/ImportModal.tsx
import { Camera, CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import useTheme from '../hooks/useTheme';
import { useGameStore } from '../stores/gameStore';
import { usePlayersStore } from '../stores/playersStore';
import {
  AppData,
  importFromJSON,
  importFromQRCode,
  importFromText
} from '../utils/exportImportUtils';

// Import icons
import FileIcon from '../assets/icons/file.svg';
import QRCodeIcon from '../assets/icons/qr-code.svg';
import ShareIcon from '../assets/icons/share.svg';

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  darkMode: boolean;
}

type ImportStep = 'select' | 'text-input' | 'qr-scanner';

const ImportModal: React.FC<ImportModalProps> = ({ visible, onClose, darkMode }) => {
  const theme = useTheme(darkMode);
  const { setAllPlayers, setSelectedPlayerIds } = usePlayersStore();
  const { matchHistory, addMatch, deleteAllMatches } = useGameStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ImportStep>('select');
  const [textInput, setTextInput] = useState('');
  const [isScanned, setIsScanned] = useState(false);

  const handleImportComplete = (importedData: AppData) => {
    Alert.alert(
      'Confirmar Importação',
      `Importar ${importedData.players.length} jogadores e ${importedData.matchHistory.length} partidas? Isso substituirá todos os dados atuais.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          style: 'destructive',
          onPress: () => {
            // Replace all data
            setAllPlayers(importedData.players);
            setSelectedPlayerIds(new Set(importedData.selectedPlayerIds));
            
            // Add match history (you might want to replace instead)
            importedData.matchHistory.forEach(match => {
              addMatch(match);
            });

            Alert.alert('Sucesso', 'Dados importados com sucesso!');
            handleClose();
          }
        }
      ]
    );
  };

  const handleImportJSON = async () => {
    setIsLoading(true);
    try {
      const importedData = await importFromJSON();
      if (importedData) {
        handleImportComplete(importedData);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao importar arquivo JSON');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportQR = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Necessária', 'É preciso autorizar o uso da câmera para escanear o QR Code.');
      return;
    }
    setCurrentStep('qr-scanner');
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (isScanned) return; // Prevent multiple triggers
    setIsScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const importedData = importFromQRCode(data);
    if (importedData) {
      handleImportComplete(importedData);
    } else {
      // importFromQRCode shows its own alert on failure
      setIsScanned(false); // Allow user to try scanning again
    }
  };

  const handleImportText = () => {
    setCurrentStep('text-input');
    setTextInput('');
  };

  const handleTextImportSubmit = () => {
    if (!textInput.trim()) {
      Alert.alert('Erro', 'Cole os dados de backup no campo de texto');
      return;
    }

    setIsLoading(true);
    try {
      const importedData = importFromText(textInput.trim());
      if (importedData) {
        handleImportComplete(importedData);
      }
    } catch (error) {
      Alert.alert('Erro', 'Dados de texto inválidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('select');
    setTextInput('');
    setIsScanned(false);
    onClose();
  };

  const renderSelectStep = () => (
    <>
      <Text style={[styles.modalTitle, { color: theme.text }]}>Importar Dados</Text>
      <Text style={[styles.modalSubtitle, { color: theme.placeholder }]}>
        Escolha o formato dos dados que você quer importar
      </Text>

      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: theme.background }]}
        onPress={handleImportJSON}
        disabled={isLoading}
      >
        <FileIcon stroke={theme.primary} width={24} height={24} />
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>
            Arquivo JSON
          </Text>
          <Text style={[styles.optionDescription, { color: theme.placeholder }]}>
            Selecionar arquivo de backup do dispositivo
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: theme.background }]}
        onPress={handleImportQR}
        disabled={isLoading}
      >
        <QRCodeIcon stroke={theme.primary} width={24} height={24} />
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>
            Scanner QR Code
          </Text>
          <Text style={[styles.optionDescription, { color: theme.placeholder }]}>
            Escanear QR Code de outro dispositivo
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: theme.background }]}
        onPress={handleImportText}
        disabled={isLoading}
      >
        <ShareIcon stroke={theme.primary} width={24} height={24} />
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>
            Texto Codificado
          </Text>
          <Text style={[styles.optionDescription, { color: theme.placeholder }]}>
            Colar dados de backup recebidos por mensagem
          </Text>
        </View>
      </TouchableOpacity>
    </>
  );

  const renderTextInputStep = () => (
    <>
      <Text style={[styles.modalTitle, { color: theme.text }]}>Colar Dados</Text>
      <Text style={[styles.modalSubtitle, { color: theme.placeholder }]}>
        Cole aqui os dados de backup que você recebeu
      </Text>

      <TextInput
        style={[
          styles.textInput, 
          { 
            backgroundColor: theme.background, 
            color: theme.text, 
            borderColor: theme.border 
          }
        ]}
        multiline
        placeholder="Cole os dados de backup aqui..."
        placeholderTextColor={theme.placeholder}
        value={textInput}
        onChangeText={setTextInput}
        editable={!isLoading}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: theme.border }]}
          onPress={() => setCurrentStep('select')}
          disabled={isLoading}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleTextImportSubmit}
          disabled={isLoading || !textInput.trim()}
        >
          <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
            Importar
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderScannerStep = () => (
    <View style={styles.scannerContainer}>
      <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 16 }]}>Escanear QR Code</Text>
      <View style={styles.cameraWrapper}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
      </View>
      <TouchableOpacity
        style={[styles.scannerBackButton, { backgroundColor: theme.border }]}
        onPress={() => setCurrentStep('select')}
      >
        <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalView, { backgroundColor: theme.card }]}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.placeholder }]}>
                    Importando dados...
                  </Text>
                </View>
              ) : (
                <>
                  {currentStep === 'select' && renderSelectStep()}
                  {currentStep === 'text-input' && renderTextInputStep()}
                  {currentStep === 'qr-scanner' && renderScannerStep()}
                </>
              )}

              {!isLoading && currentStep === 'select' && (
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={[styles.cancelButtonText, { color: theme.placeholder }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
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
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'stretch',
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
  textInput: {
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    textAlignVertical: 'top',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 16,
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
  scannerContainer: {
    width: '100%',
    alignItems: 'stretch',
  },
  cameraWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  scannerBackButton: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
});

export default ImportModal;