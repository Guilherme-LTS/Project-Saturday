import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permissão necessária',
      'Precisamos de permissão para acessar suas fotos.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

export const requestCameraPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permissão necessária',
      'Precisamos de permissão para acessar a câmera.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

export const pickImageFromGallery = async (): Promise<string | null> => {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }
  return null;
};

export const takePhotoWithCamera = async (): Promise<string | null> => {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }
  return null;
};

export const savePlayerAvatar = async (playerId: string, sourceUri: string): Promise<string> => {
  if (Platform.OS === 'web') {
    if (sourceUri.startsWith('data:')) {
      return sourceUri;
    }
    try {
      const response = await fetch(sourceUri);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          resolve(sourceUri);
        };
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Erro ao converter avatar para Base64 na Web:', e);
      return sourceUri;
    }
  }

  // Native (iOS and Android): Persist from cache to documentDirectory
  try {
    const avatarDir = `${(FileSystem as any).documentDirectory}avatars/`;
    const dirInfo = await FileSystem.getInfoAsync(avatarDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(avatarDir, { intermediates: true });
    }

    const permanentUri = `${avatarDir}${playerId}_${Date.now()}.jpg`;
    await FileSystem.copyAsync({
      from: sourceUri,
      to: permanentUri,
    });
    return permanentUri;
  } catch (error) {
    console.error('Erro ao salvar avatar permanentemente:', error);
    return sourceUri;
  }
};