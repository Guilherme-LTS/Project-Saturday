import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

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