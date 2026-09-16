import { registerRootComponent } from 'expo';
import { Alert, Platform } from 'react-native';
import App from './app/App';

// Polyfill Alert.alert for Web platform since react-native-web has a no-op implementation
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const fullMessage = [title, message].filter(Boolean).join('\n\n');
    if (!buttons || buttons.length === 0) {
      window.alert(fullMessage);
      return;
    }
    if (buttons.length === 1) {
      window.alert(fullMessage);
      buttons[0]?.onPress?.();
      return;
    }
    const cancelBtn = buttons.find(b => b.style === 'cancel');
    const confirmBtn = buttons.find(b => b.style !== 'cancel') || buttons[buttons.length - 1];

    if (window.confirm(fullMessage)) {
      confirmBtn?.onPress?.();
    } else {
      cancelBtn?.onPress?.();
    }
  };
}

registerRootComponent(App);