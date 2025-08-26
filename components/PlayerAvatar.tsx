// components/PlayerAvatar.tsx

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

// Importe o seu ícone SVG
import UserIcon from '../assets/icons/user.svg';
import { Player } from '../types';

interface PlayerAvatarProps {
  player: Player | null;
  size: number;
  theme: any; // Estamos recebendo o objeto de tema completo
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, size, theme }) => {
  if (!player) return null; // Retorna nulo se não houver jogador

  const hasPhoto = !!player.photoUri;

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: 4,
  };

  if (hasPhoto) {
    return (
      <Image
        source={{ uri: player.photoUri }}
        style={[avatarStyle, styles.image, { borderColor: theme.textBlack }]}
      />
    );
  }

  // Se não tiver foto, renderiza o SVG com um fundo
  return (
    <View style={[avatarStyle, styles.noPhotoContainer, { backgroundColor: '#0000001a', borderColor: theme.textBlack }]}>
      <UserIcon width={size * 0.6} height={size * 0.6} fill={theme.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    borderWidth: 1,
  },
  noPhotoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
});

export default PlayerAvatar;