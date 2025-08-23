import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player } from '../types';

const PLAYERS_STORAGE_KEY = '@VolleyballDraw:players';
const THEME_STORAGE_KEY = '@VolleyballDraw:theme';
const SELECTED_IDS_STORAGE_KEY = '@VolleyballDraw:selectedIds';

// --- Funções de Jogadores ---
export async function savePlayers(players: Player[]): Promise<void> {
  try {
    console.log("--- SALVANDO JOGADORES ---", players.length, "jogadores"); // DEBUG
    const jsonValue = JSON.stringify(players);
    await AsyncStorage.setItem(PLAYERS_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Erro ao salvar jogadores", e);
  }
}

export async function loadPlayers(): Promise<Player[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(PLAYERS_STORAGE_KEY);
    const players = jsonValue != null ? JSON.parse(jsonValue) : [];
    console.log("--- CARREGANDO JOGADORES ---", players.length, "jogadores encontrados"); // DEBUG
    return players;
  } catch (e) {
    console.error("Erro ao carregar jogadores", e);
    return [];
  }
}

// --- Funções do Tema ---
export async function saveTheme(isDark: boolean): Promise<void> {
  try {
    const themeValue = isDark ? 'dark' : 'light';
    console.log("--- SALVANDO TEMA ---", themeValue); // DEBUG
    await AsyncStorage.setItem(THEME_STORAGE_KEY, themeValue);
  } catch (e) {
    console.error("Erro ao salvar o tema", e);
  }
}

export async function loadTheme(): Promise<boolean> {
  try {
    const themeValue = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    console.log("--- CARREGANDO TEMA --- Valor encontrado:", themeValue); // DEBUG
    if (themeValue === null) {
      return true; 
    }
    return themeValue === 'dark';
  } catch (e) {
    console.error("Erro ao carregar o tema", e);
    return true;
  }
}

// --- Funções de Seleção ---
export async function saveSelectedPlayerIds(idSet: Set<string>): Promise<void> {
  try {
    const idArray = Array.from(idSet);
    console.log("--- SALVANDO SELEÇÃO ---", idArray.length, "jogadores selecionados"); // DEBUG
    const jsonValue = JSON.stringify(idArray);
    await AsyncStorage.setItem(SELECTED_IDS_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Erro ao salvar os IDs dos jogadores selecionados", e);
  }
}

export async function loadSelectedPlayerIds(): Promise<Set<string>> {
  try {
    const jsonValue = await AsyncStorage.getItem(SELECTED_IDS_STORAGE_KEY);
    const idArray = jsonValue != null ? JSON.parse(jsonValue) : [];
    console.log("--- CARREGANDO SELEÇÃO ---", idArray.length, "jogadores encontrados"); // DEBUG
    return new Set(idArray);
  } catch (e) {
    console.error("Erro ao carregar os IDs dos jogadores selecionados", e);
    return new Set();
  }
}