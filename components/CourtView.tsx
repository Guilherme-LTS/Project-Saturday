// components/CourtView.tsx (versão com fade-in na borda de vitória)

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import FireIcon from '../assets/icons/fire.svg';
import useTheme from '../hooks/useTheme';
import { Match, Team } from '../types';
import { getCurrentWinStreak } from '../utils/helpers';
import PlayerAvatar from './PlayerAvatar';
import DraggablePlayer from './DraggablePlayer';
import NetOverlay from './NetOverlay';

const NET_HEIGHT = 30;
const NET_VERTICAL_OFFSET = 0;
const NET_TOP_OVERHANG_RATIO = 0.045;

interface CourtViewProps {
  teams: Team[];
  darkMode: boolean;
  winnerIndex: number | null;
  onSelectWinner: (index: number) => void;
  matchHistory: Match[];
  streakIconSize?: number;
}

const CourtView: React.FC<CourtViewProps> = ({ teams, darkMode, winnerIndex, onSelectWinner, matchHistory, streakIconSize }) => {
  const theme = useTheme(darkMode);
  const fireSize = streakIconSize ?? 20;
  
  const team1 = teams?.[0]?.players || [];
  const team2 = teams?.[1]?.players || [];

  const isTeam1Large = team1.length >= 10;
  const isTeam2Large = team2.length >= 10;

  const playerContainerStyle: ViewStyle = { width: isTeam1Large ? '23%' : '30%' };
  const avatarSize = isTeam1Large ? 40 : 50;

  // Valores animados para a opacidade das bordas
  const team1BorderOpacity = useRef(new Animated.Value(0)).current;
  const team2BorderOpacity = useRef(new Animated.Value(0)).current;
  const [playingSurfaceLayout, setPlayingSurfaceLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const netTopOverhang = playingSurfaceLayout.width * NET_TOP_OVERHANG_RATIO;

  // The net only knows its real size once `onLayout` measures the
  // playing surface, so on mount there's necessarily a frame or two
  // with no net rendered at all. Rather than letting it snap into
  // existence the instant that measurement lands (which reads as an
  // abrupt "pop"), fade it in smoothly. The `hasMeasured` ref makes
  // sure this only fires once per mount, not on every subsequent
  // layout change (e.g. rotation).
  const netOpacity = useRef(new Animated.Value(0)).current;
  const hasMeasuredNet = useRef(false);

  useEffect(() => {
    if (playingSurfaceLayout.width > 0 && !hasMeasuredNet.current) {
      hasMeasuredNet.current = true;
      Animated.timing(netOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [playingSurfaceLayout.width, netOpacity]);

  useEffect(() => {
    if (winnerIndex === 0) {
      Animated.timing(team1BorderOpacity, {
        toValue: 1,
        duration: 300, // Duração da animação em milissegundos
        useNativeDriver: false, // Opacidade não é nativa
      }).start();
      Animated.timing(team2BorderOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else if (winnerIndex === 1) {
      Animated.timing(team2BorderOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      Animated.timing(team1BorderOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(team1BorderOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      Animated.timing(team2BorderOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [winnerIndex, team1BorderOpacity, team2BorderOpacity]);

  const tapTeam1 = Gesture.Tap().onEnd(() => runOnJS(onSelectWinner)(0));
  const tapTeam2 = Gesture.Tap().onEnd(() => runOnJS(onSelectWinner)(1));

  return (
    <View style={[styles.courtContainer, { backgroundColor: '#0873a7' }]}>
      {/* Background touch areas covering the entire top and bottom halves (including blue margins) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <GestureDetector gesture={tapTeam1}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%' }} />
        </GestureDetector>
        <GestureDetector gesture={tapTeam2}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' }} />
        </GestureDetector>
      </View>

      <View
        style={styles.playingSurface}
        onLayout={event => setPlayingSurfaceLayout(event.nativeEvent.layout)}
      >
        <View style={styles.teamHalf}>
          <GestureDetector gesture={tapTeam1}>
            <View style={StyleSheet.absoluteFill} />
          </GestureDetector>
          {team1.map(player => {
            const streak = getCurrentWinStreak(player.id, matchHistory);
            return (
              <DraggablePlayer 
                key={player.id} 
                teamIndex={0} 
                playerId={player.id} 
                style={[styles.playerContainer, playerContainerStyle]}
                onTap={() => onSelectWinner(0)}
              >
                <View style={{ position: 'relative' }}>
                  {streak >= 3 && (
                    <View style={[styles.streakBadge, { top: -Math.round(fireSize/3), right: -Math.round(fireSize/3) }]}>
                      <FireIcon width={fireSize} height={fireSize} fill="#ff3b30" />
                    </View>
                  )}
                  <PlayerAvatar player={player} size={avatarSize} theme={theme} />
                </View>
                <Text numberOfLines={1} style={styles.playerName}>{player.name}</Text>
              </DraggablePlayer>
            );
          })}
        </View>
        <View style={styles.teamHalf}>
          <GestureDetector gesture={tapTeam2}>
            <View style={StyleSheet.absoluteFill} />
          </GestureDetector>
          {team2.map(player => {
            const streak = getCurrentWinStreak(player.id, matchHistory);
            return (
              <DraggablePlayer 
                key={player.id} 
                teamIndex={1} 
                playerId={player.id} 
                style={[styles.playerContainer, playerContainerStyle]}
                onTap={() => onSelectWinner(1)}
              >
                <View style={{ position: 'relative' }}>
                  {streak >= 3 && (
                    <View style={[styles.streakBadge, { top: -Math.round(fireSize/3), right: -Math.round(fireSize/3) }]}>
                      <FireIcon width={fireSize} height={fireSize} color="#ff3b30" />
                    </View>
                  )}
                  <PlayerAvatar player={player} size={avatarSize} theme={theme} />
                </View>
                <Text numberOfLines={1} style={styles.playerName}>{player.name}</Text>
              </DraggablePlayer>
            );
          })}
        </View>
      </View>

      <View style={styles.fullCourtDividerOverlay} pointerEvents="none">
        <View style={styles.divider} pointerEvents="none" />
        {playingSurfaceLayout.width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.netContainer,
              {
                left: playingSurfaceLayout.x - netTopOverhang,
                top: playingSurfaceLayout.y + playingSurfaceLayout.height / 2,
                width: playingSurfaceLayout.width + netTopOverhang * 2,
                opacity: netOpacity,
              },
            ]}
          >
            <NetOverlay
              width={playingSurfaceLayout.width}
              height={NET_HEIGHT}
              topOverhang={netTopOverhang}
            />
          </Animated.View>
        )}
      </View>

      <View style={styles.overlayContainer} pointerEvents="none">
        <Animated.View
          pointerEvents="none"
          style={[
            styles.clickArea,
            {
              top: 0,
              height: '49.75%',
              borderColor: theme.accentGreen,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderBottomWidth: 0,
              opacity: team1BorderOpacity,
            },
          ]}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.clickArea,
            {
              bottom: 0,
              height: '49.7%',
              borderColor: theme.accentGreen,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              borderTopWidth: 0,
              opacity: team2BorderOpacity,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  courtContainer: {
    flex: 1,
    marginVertical: 16,
    minHeight: 250,
    borderRadius: 8,
    padding: 30,
    overflow: 'hidden',
  },
  playingSurface: {
    flex: 1,
    backgroundColor: '#ff915c',
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  teamHalf: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    padding: 8,
  },
  divider: {
    height: 3,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    transform: [{ translateY: -1.5 }],
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill as any,
    zIndex: 3,
  },
  fullCourtDividerOverlay: {
    ...StyleSheet.absoluteFill as any,
    zIndex: 1,
  },
  clickArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderWidth: 5,
  },
  playerContainer: {
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  avatarBase: {
    borderWidth: 1,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffffff',
    marginTop: 4,
  },
  streakBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 8,
    backgroundColor: 'transparent',
    zIndex: 6,
  },
  netContainer: {
    position: 'absolute',
    transform: [{ translateY: -NET_HEIGHT + NET_VERTICAL_OFFSET }],
    zIndex: 2,
  },
});

export default CourtView;