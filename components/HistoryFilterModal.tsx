import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Path, Svg } from 'react-native-svg';
import useTheme from '../hooks/useTheme';
import { Player } from '../types';
import PlayerSelectModal from './PlayerSelectModal';

// --- Filter Types ---
export interface HistoryFilter {
  id: string;
  player1Id: string | null;
  player2Id: string | null;
  type: 'together' | 'against'; // together = same team, against = opposing teams
}

// --- SVG Icons ---
const PlusIcon = ({ color = 'white', size = 20 }: { color?: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const VsIcon = ({ color = 'white', size = 20 }: { color?: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 8l8 8M16 8l-8 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TrashIcon = ({ color = 'white', size = 16 }: { color?: string, size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ClearIcon = ({ color = 'white', size = 20 }: { color?: string, size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
);

// --- Filter Row Component ---
interface FilterRowProps {
    filter: HistoryFilter;
    players: Player[];
    darkMode: boolean;
    allUsedPlayerIds: string[];
    onUpdateFilter: (id: string, updates: Partial<Omit<HistoryFilter, 'id'>>) => void;
    onRemoveFilter: (id: string) => void;
}

const FilterRow: React.FC<FilterRowProps> = ({ 
    filter, 
    players, 
    darkMode, 
    allUsedPlayerIds, 
    onUpdateFilter, 
    onRemoveFilter 
}) => {
    const theme = useTheme(darkMode);
    const [isPlayer1ModalVisible, setPlayer1ModalVisible] = useState(false);
    const [isPlayer2ModalVisible, setPlayer2ModalVisible] = useState(false);

    const handleSelectPlayer1 = (player: Player) => {
        onUpdateFilter(filter.id, { player1Id: player.id });
    };

    const handleSelectPlayer2 = (player: Player) => {
        onUpdateFilter(filter.id, { player2Id: player.id });
    };

    const toggleFilterType = () => {
        const newType = filter.type === 'together' ? 'against' : 'together';
        onUpdateFilter(filter.id, { type: newType });
    };

    const getPlayerName = (playerId: string | null) => {
        if (!playerId) return 'Selecionar';
        return players.find(p => p.id === playerId)?.name ?? 'Selecionar';
    };

    const availablePlayers = players.filter(p => !allUsedPlayerIds.includes(p.id));
    const filterTypeColor = filter.type === 'together' ? theme.accentGreen : theme.accentOrange;

    return (
        <>
            <View style={[styles.filterContainer, { backgroundColor: filterTypeColor + '20' }]}>
                <TouchableOpacity 
                    style={[styles.playerButton, { borderColor: filterTypeColor + '50' }]} 
                    onPress={() => setPlayer1ModalVisible(true)}
                >
                    <Text style={{ color: theme.text }} numberOfLines={1}>
                        {getPlayerName(filter.player1Id)}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.filterToggle, { backgroundColor: filterTypeColor }]} 
                    onPress={toggleFilterType}
                >
                    {filter.type === 'together' ? <PlusIcon /> : <VsIcon />}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.playerButton, { borderColor: filterTypeColor + '50' }]} 
                    onPress={() => setPlayer2ModalVisible(true)}
                >
                    <Text style={{ color: theme.text }} numberOfLines={1}>
                        {getPlayerName(filter.player2Id)}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.trashButton} 
                    onPress={() => onRemoveFilter(filter.id)}
                >
                    <TrashIcon color={theme.placeholder}/>
                </TouchableOpacity>
            </View>

            <PlayerSelectModal
                visible={isPlayer1ModalVisible}
                players={availablePlayers.filter(p => p.id !== filter.player2Id)}
                darkMode={darkMode}
                onClose={() => setPlayer1ModalVisible(false)}
                onSelectPlayer={handleSelectPlayer1}
                title="Selecione o Jogador 1"
            />
            <PlayerSelectModal
                visible={isPlayer2ModalVisible}
                players={availablePlayers.filter(p => p.id !== filter.player1Id)}
                darkMode={darkMode}
                onClose={() => setPlayer2ModalVisible(false)}
                onSelectPlayer={handleSelectPlayer2}
                title="Selecione o Jogador 2"
            />
        </>
    );
};

// --- Main Filter Modal Component ---
interface HistoryFilterModalProps {
    visible: boolean;
    darkMode: boolean;
    players: Player[];
    filters: HistoryFilter[];
    onClose: () => void;
    onFiltersChange: (filters: HistoryFilter[]) => void;
}

const HistoryFilterModal: React.FC<HistoryFilterModalProps> = ({ 
    visible, 
    darkMode, 
    players, 
    filters, 
    onClose, 
    onFiltersChange 
}) => {
    const theme = useTheme(darkMode);

    const addFilter = () => {
        const newFilter: HistoryFilter = {
            id: new Date().toISOString() + Math.random(),
            player1Id: null,
            player2Id: null,
            type: 'together'
        };
        onFiltersChange([...filters, newFilter]);
    };

    const updateFilter = (id: string, updates: Partial<Omit<HistoryFilter, 'id'>>) => {
        onFiltersChange(filters.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const removeFilter = (id: string) => {
        onFiltersChange(filters.filter(f => f.id !== id));
    };

    const clearAllFilters = () => {
        onFiltersChange([]);
    };

    const allUsedPlayerIds = filters.flatMap(f => [f.player1Id, f.player2Id]).filter((id): id is string => id !== null);

    const hasValidFilters = filters.some(f => f.player1Id && f.player2Id);

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.modalView, { backgroundColor: theme.card }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                Filtrar Histórico
                            </Text>
                            
                            <Text style={[styles.modalSubtitle, { color: theme.placeholder }]}>
                                Encontre partidas onde jogadores específicos jogaram juntos ou contra
                            </Text>

                            <View style={[styles.divider, { backgroundColor: theme.cardInactive }]} />
                            
                            {/* This container now wraps the filter list section */}
                            <View>
                                <View style={styles.sectionHeader}>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                        Filtros de Jogadores
                                    </Text>
                                    {filters.length > 0 && (
                                        <TouchableOpacity 
                                            style={[styles.clearAllButton, { backgroundColor: theme.danger + '20' }]} 
                                            onPress={clearAllFilters}
                                        >
                                            <ClearIcon color={theme.danger} size={16} />
                                            <Text style={[styles.clearAllText, { color: theme.danger }]}>
                                                Limpar
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <ScrollView 
                                    style={styles.scrollView} 
                                    showsVerticalScrollIndicator={false} 
                                    contentContainerStyle={{ flexGrow: 1 }}
                                >
                                    {/* Reverted to include the TouchableOpacity wrapper as seen in the other component */}
                                    <TouchableOpacity activeOpacity={1}>
                                        <View>
                                            {filters.map((filter) => (
                                                <FilterRow 
                                                    key={filter.id}
                                                    filter={filter}
                                                    players={players}
                                                    darkMode={darkMode}
                                                    allUsedPlayerIds={allUsedPlayerIds.filter(id => 
                                                        id !== filter.player1Id && id !== filter.player2Id
                                                    )}
                                                    onUpdateFilter={updateFilter}
                                                    onRemoveFilter={removeFilter}
                                                />
                                            ))}
                                            {filters.length === 0 && (
                                                <View style={styles.emptyState}>
                                                    <Text style={[styles.emptyStateText, { color: theme.placeholder }]}>
                                                        Nenhum filtro adicionado.{'\n'}
                                                        Adicione filtros para encontrar partidas específicas.
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                            
                            <TouchableOpacity 
                                style={[styles.addButton, { borderColor: theme.primary }]} 
                                onPress={addFilter}
                            >
                                <Text style={[styles.addButtonText, { color: theme.text }]}>
                                    Adicionar Filtro
                                </Text>
                            </TouchableOpacity>

                            {hasValidFilters && (
                                <TouchableOpacity 
                                    style={[styles.applyButton, { backgroundColor: theme.primary }]} 
                                    onPress={onClose}
                                >
                                    <Text style={[styles.applyButtonText, { color: theme.primaryText }]}>
                                        Aplicar Filtros
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={[styles.cancelButtonText, { color: theme.placeholder }]}>
                                    {hasValidFilters ? 'Cancelar' : 'Fechar'}
                                </Text>
                            </TouchableOpacity>
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
    },
    modalView: {
        width: '90%',
        maxHeight: '85%',
        borderRadius: 12,
        padding: 20
        // Removed flexDirection: 'column' to match the other modal's structure
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center'
    },
    modalSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16
    },
    divider: {
        height: 1,
        marginVertical: 16
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600'
    },
    clearAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 4
    },
    clearAllText: {
        fontSize: 12,
        fontWeight: '500'
    },
    scrollView: {
        // Reverted to a fixed maxHeight, not a flexible one
        maxHeight: 240,
        marginBottom: 8,
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderRadius: 8,
        padding: 4
    },
    playerButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        // Reverted to simple centering
        alignItems: 'center',
        backgroundColor: '#ffffff10'
    },
    filterToggle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 6
    },
    trashButton: {
        padding: 8,
        marginLeft: 4
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center'
    },
    emptyStateText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20
    },
    addButton: { 
        borderRadius: 8, 
        paddingVertical: 12,
        alignItems: 'center', 
        marginBottom: 12,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
    },
    addButtonText: {
        fontWeight: 'bold',
        fontSize: 15
    },
    applyButton: {
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 12
    },
    applyButtonText: {
        fontWeight: 'bold',
        fontSize: 16
    },
    cancelButton: {
        padding: 10,
        marginTop: 4
    },
    cancelButtonText: {
        fontSize: 15,
        textAlign: 'center',
        fontWeight: '500'
    },
});

export default HistoryFilterModal;