// utils/exportImportUtils.ts
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { Match, Player } from '../types';

export interface AppData {
  version: string;
  exportDate: string;
  players: Player[];
  selectedPlayerIds: string[];
  matchHistory: Match[];
}

// Export Methods

export const exportAsJSON = async (data: AppData): Promise<boolean> => {
  try {
    const fileName = `volleyball-backup-${new Date().toISOString().split('T')[0]}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(data, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Compartilhar backup dos dados',
      });
    } else {
      Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error exporting JSON:', error);
    Alert.alert('Erro', 'Falha ao exportar dados como JSON');
    return false;
  }
};

export const exportAsQRCode = async (data: AppData): Promise<string | null> => {
  try {
    // Compress data for QR code
    const compressedData = {
      v: data.version,
      d: data.exportDate,
      p: data.players.map(p => ({
        i: p.id,
        n: p.name,
        a: p.active,
        w: p.weight,
        ...(p.photoUri && { u: p.photoUri })
      })),
      s: data.selectedPlayerIds,
      m: data.matchHistory.slice(0, 10) // Limit matches for QR code size
    };

    const jsonString = JSON.stringify(compressedData);
    
    // Check if data is too large for QR code (limit ~2000 characters)
    if (jsonString.length > 2000) {
      Alert.alert(
        'Dados muito grandes',
        'Os dados são muito grandes para QR Code. Use exportação por arquivo ou texto.'
      );
      return null;
    }

    return jsonString;
  } catch (error) {
    console.error('Error preparing QR code data:', error);
    Alert.alert('Erro', 'Falha ao preparar dados para QR Code');
    return null;
  }
};

export const exportAsText = async (data: AppData): Promise<string | null> => {
  try {
    const compressed = JSON.stringify(data);
    const base64Data = btoa(compressed); // Base64 encode
    
    const textToShare = `VOLLEYBALL_BACKUP_V1:${base64Data}`;
    
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      // Create temporary file for sharing
      const fileName = `volleyball-backup-${new Date().toISOString().split('T')[0]}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, textToShare);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Compartilhar backup (texto)',
      });
    }
    
    return textToShare;
  } catch (error) {
    console.error('Error exporting as text:', error);
    Alert.alert('Erro', 'Falha ao exportar como texto');
    return null;
  }
};

// Import Methods

export const importFromJSON = async (): Promise<AppData | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const data = JSON.parse(fileContent) as AppData;
    
    return validateImportedData(data);
  } catch (error) {
    console.error('Error importing JSON:', error);
    Alert.alert('Erro', 'Arquivo JSON inválido ou corrompido');
    return null;
  }
};

export const importFromQRCode = (qrData: string): AppData | null => {
  try {
    const parsedData = JSON.parse(qrData);
    
    // Expand compressed QR data back to full format
    const fullData: AppData = {
      version: parsedData.v || '1.0.0',
      exportDate: parsedData.d || new Date().toISOString(),
      players: parsedData.p?.map((p: any) => ({
        id: p.i,
        name: p.n,
        active: p.a,
        weight: p.w,
        ...(p.u && { photoUri: p.u })
      })) || [],
      selectedPlayerIds: parsedData.s || [],
      matchHistory: parsedData.m || []
    };

    return validateImportedData(fullData);
  } catch (error) {
    console.error('Error importing QR code:', error);
    Alert.alert('Erro', 'QR Code inválido ou corrompido');
    return null;
  }
};

export const importFromText = (textData: string): AppData | null => {
  try {
    if (!textData.startsWith('VOLLEYBALL_BACKUP_V1:')) {
      Alert.alert('Erro', 'Formato de backup inválido');
      return null;
    }

    const base64Data = textData.replace('VOLLEYBALL_BACKUP_V1:', '');
    const jsonString = atob(base64Data); // Base64 decode
    const data = JSON.parse(jsonString) as AppData;
    
    return validateImportedData(data);
  } catch (error) {
    console.error('Error importing text:', error);
    Alert.alert('Erro', 'Dados de texto inválidos ou corrompidos');
    return null;
  }
};

// Helper Functions

const validateImportedData = (data: any): AppData | null => {
  try {
    // Basic validation
    if (!data || typeof data !== 'object') {
      throw new Error('Dados inválidos');
    }

    // Validate players array
    if (!Array.isArray(data.players)) {
      throw new Error('Lista de jogadores inválida');
    }

    // Validate each player
    data.players.forEach((player: any, index: number) => {
      if (!player.id || !player.name || typeof player.active !== 'boolean') {
        throw new Error(`Jogador ${index + 1} tem dados inválidos`);
      }
      if (![1, 2, 3].includes(player.weight)) {
        throw new Error(`Jogador ${player.name} tem nível inválido`);
      }
    });

    // Validate selectedPlayerIds
    if (!Array.isArray(data.selectedPlayerIds)) {
      data.selectedPlayerIds = [];
    }

    // Validate match history
    if (!Array.isArray(data.matchHistory)) {
      data.matchHistory = [];
    }

    return {
      version: data.version || '1.0.0',
      exportDate: data.exportDate || new Date().toISOString(),
      players: data.players,
      selectedPlayerIds: data.selectedPlayerIds,
      matchHistory: data.matchHistory
    };
  } catch (error) {
    Alert.alert('Erro de Validação', error instanceof Error ? error.message : 'Dados corrompidos');
    return null;
  }
};

export const generateAppData = (
  players: Player[], 
  selectedPlayerIds: Set<string>, 
  matchHistory: Match[]
): AppData => {
  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    players,
    selectedPlayerIds: Array.from(selectedPlayerIds),
    matchHistory
  };
};