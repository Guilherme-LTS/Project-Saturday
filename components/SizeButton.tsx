import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

// Futuramente, moveremos este tipo para types/index.ts
export type TeamSize = 4 | 5 | 6;

// 1. Definindo as props
interface SizeButtonProps {
  size: TeamSize;
  isSelected: boolean;
  onSelect: (size: TeamSize) => void;
}

const SizeButton: React.FC<SizeButtonProps> = ({ size, isSelected, onSelect }) => {
  return (
    <TouchableOpacity
      style={[
        styles.sizeBtn,
        // Aplica um estilo diferente se o botão estiver selecionado
        { backgroundColor: isSelected ? '#388E3C' : '#4CAF50' },
      ]}
      onPress={() => onSelect(size)}
    >
      <Text style={[styles.sizeBtnText, isSelected && styles.sizeBtnTextSelected]}>
        {size}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  sizeBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sizeBtnTextSelected: {
    // Estilo extra para o texto quando selecionado
    textDecorationLine: 'underline',
  },
});

export default SizeButton;