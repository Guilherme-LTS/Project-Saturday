import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { LayoutRectangle, View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  runOnJS, 
  Easing, 
  SharedValue 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface DropZone {
  teamIndex: number;
  playerId: string;
  layout: LayoutRectangle; // absolute coordinates on screen
  children?: React.ReactNode;
}

interface SwappingItem {
  teamIndex: number;
  playerId: string;
  startX: number;
  startY: number;
  width: number;
  height: number;
  children: React.ReactNode;
}

interface DragDropContextType {
  registerZone: (teamIndex: number, playerId: string, layout: LayoutRectangle, children?: React.ReactNode) => void;
  unregisterZone: (playerId: string) => void;
  activeDragPlayerId: string | null;
  swappingPlayerId: string | null;
  onDragStart: (teamIndex: number, playerId: string, pageX: number, pageY: number, width: number, height: number, children: React.ReactNode) => void;
  onDragEnd: (absoluteX: number, absoluteY: number) => void;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  startX: SharedValue<number>;
  startY: SharedValue<number>;
  containerOffset: { x: number, y: number };
}

const DragDropContext = createContext<DragDropContextType | null>(null);

export const useDragDrop = () => {
  const ctx = useContext(DragDropContext);
  if (!ctx) throw new Error('useDragDrop must be used within DragDropProvider');
  return ctx;
};

export const DragDropProvider: React.FC<{
  children: React.ReactNode;
  onDrop: (sourceTeam: number, sourcePlayer: string, targetTeam: number, targetPlayer: string) => void;
}> = ({ children, onDrop }) => {
  const dropZones = useRef<Map<string, DropZone>>(new Map());
  const [draggedItem, setDraggedItem] = useState<{
    teamIndex: number;
    playerId: string;
    width: number;
    height: number;
    children: React.ReactNode;
  } | null>(null);

  const [swappingItem, setSwappingItem] = useState<SwappingItem | null>(null);
  const isTransitioning = useRef(false);

  const registerZone = useCallback((teamIndex: number, playerId: string, layout: LayoutRectangle, childrenNodes?: React.ReactNode) => {
    dropZones.current.set(playerId, { teamIndex, playerId, layout, children: childrenNodes });
  }, []);

  const unregisterZone = useCallback((playerId: string) => {
    dropZones.current.delete(playerId);
  }, []);

  // Shared values for dragged item
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Shared values for the target item flying in opposite direction
  const swapTranslateX = useSharedValue(0);
  const swapTranslateY = useSharedValue(0);
  const swapScale = useSharedValue(1);

  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<View>(null);

  const measureContainer = useCallback(() => {
    containerRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      setContainerOffset({ x: pageX, y: pageY });
    });
  }, []);

  const onDragStart = useCallback((teamIndex: number, playerId: string, pageX: number, pageY: number, width: number, height: number, childNodes: React.ReactNode) => {
    if (isTransitioning.current) return;

    const relativeX = pageX - containerOffset.x;
    // 14px lift so finger doesn't obstruct the avatar
    const relativeY = pageY - containerOffset.y - 14;
    
    startX.value = relativeX;
    startY.value = relativeY;
    translateX.value = 0;
    translateY.value = 0;
    setDraggedItem({ teamIndex, playerId, width, height, children: childNodes });
  }, [startX, startY, translateX, translateY, containerOffset]);

  const finalizeSwap = useCallback((sourceTeam: number, sourcePlayer: string, targetTeam: number, targetPlayer: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDrop(sourceTeam, sourcePlayer, targetTeam, targetPlayer);
    setDraggedItem(null);
    setSwappingItem(null);
    isTransitioning.current = false;
  }, [onDrop]);

  const clearDrag = useCallback(() => {
    setDraggedItem(null);
    setSwappingItem(null);
    isTransitioning.current = false;
  }, []);

  const onDragEnd = useCallback((absoluteX: number, absoluteY: number) => {
    if (!draggedItem || isTransitioning.current) return;

    let targetZone: DropZone | null = null;
    const centerX = absoluteX;
    const centerY = absoluteY;

    for (const zone of dropZones.current.values()) {
      if (
        centerX >= zone.layout.x &&
        centerX <= zone.layout.x + zone.layout.width &&
        centerY >= zone.layout.y &&
        centerY <= zone.layout.y + zone.layout.height
      ) {
        targetZone = zone;
        break;
      }
    }

    const isValidSwap = !!(
      targetZone &&
      targetZone.playerId !== draggedItem.playerId &&
      targetZone.teamIndex !== draggedItem.teamIndex &&
      targetZone.children
    );

    if (isValidSwap && targetZone) {
      isTransitioning.current = true;
      isDragging.value = false;

      // 1. Where Dante needs to land (Felipe's slot)
      const felipeContainerX = targetZone.layout.x - containerOffset.x;
      const felipeContainerY = targetZone.layout.y - containerOffset.y - 14;

      // 2. Where Felipe starts (Felipe's slot)
      const felipeStartX = felipeContainerX;
      const felipeStartY = felipeContainerY;

      // 3. Where Felipe needs to land (Dante's original slot)
      const danteOriginalX = startX.value;
      const danteOriginalY = startY.value;

      // Target deltas for Dante (relative to startX / startY)
      const danteTargetDeltaX = felipeContainerX - danteOriginalX;
      const danteTargetDeltaY = felipeContainerY - danteOriginalY;

      // Target deltas for Felipe (relative to felipeStartX / felipeStartY)
      const felipeTargetDeltaX = danteOriginalX - felipeStartX;
      const felipeTargetDeltaY = danteOriginalY - felipeStartY;

      // Instantiate Felipe in the overlay
      setSwappingItem({
        teamIndex: targetZone.teamIndex,
        playerId: targetZone.playerId,
        startX: felipeStartX,
        startY: felipeStartY,
        width: targetZone.layout.width,
        height: targetZone.layout.height,
        children: targetZone.children,
      });

      // Reset Felipe's animation values
      swapTranslateX.value = 0;
      swapTranslateY.value = 0;
      swapScale.value = 1.15;

      const duration = 220;
      const easing = Easing.out(Easing.cubic);

      // Animate Dante gliding to Felipe's slot
      translateX.value = withTiming(danteTargetDeltaX, { duration, easing });
      translateY.value = withTiming(danteTargetDeltaY, { duration, easing });

      // Animate Felipe gliding to Dante's slot
      const sourceTeam = draggedItem.teamIndex;
      const sourcePlayer = draggedItem.playerId;
      const destTeam = targetZone.teamIndex;
      const destPlayer = targetZone.playerId;

      swapTranslateX.value = withTiming(felipeTargetDeltaX, { duration, easing });
      swapScale.value = withTiming(1, { duration, easing });
      swapTranslateY.value = withTiming(felipeTargetDeltaY, { duration, easing }, (finished) => {
        if (finished) {
          runOnJS(finalizeSwap)(
            sourceTeam,
            sourcePlayer,
            destTeam,
            destPlayer
          );
        }
      });
    } else {
      // Invalid drop: spring back to origin
      isTransitioning.current = true;
      isDragging.value = false;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      translateX.value = withSpring(0, { damping: 14, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 14, stiffness: 200 }, (finished) => {
        if (finished) {
          runOnJS(clearDrag)();
        }
      });
    }
  }, [
    draggedItem, 
    containerOffset, 
    startX, 
    startY, 
    translateX, 
    translateY, 
    isDragging, 
    swapTranslateX, 
    swapTranslateY, 
    swapScale, 
    finalizeSwap, 
    clearDrag
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: withSpring(isDragging.value ? 1.15 : 1, { damping: 12, stiffness: 180 }) }
      ],
      opacity: withTiming(isDragging.value || isTransitioning.current ? 0.95 : 1, { duration: 150 }),
      zIndex: 9999,
    };
  });

  const swapAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: swapTranslateX.value },
        { translateY: swapTranslateY.value },
        { scale: swapScale.value }
      ],
      opacity: 0.95,
      zIndex: 9998,
    };
  });

  return (
    <DragDropContext.Provider value={{ 
      registerZone, 
      unregisterZone, 
      activeDragPlayerId: draggedItem?.playerId || null, 
      swappingPlayerId: swappingItem?.playerId || null,
      onDragStart, 
      onDragEnd,
      translateX, 
      translateY, 
      isDragging, 
      startX, 
      startY, 
      containerOffset 
    }}>
      <View style={{ flex: 1 }} ref={containerRef} onLayout={measureContainer}>
        {children}
        {(draggedItem || swappingItem) && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* 1. Dragged player (flying to target slot) */}
            {draggedItem && (
              <Animated.View
                style={[
                  styles.overlayItem,
                  { left: startX.value, top: startY.value, width: draggedItem.width, height: draggedItem.height },
                  animatedStyle
                ]}
              >
                {draggedItem.children}
              </Animated.View>
            )}

            {/* 2. Target player (flying to source slot) */}
            {swappingItem && (
              <Animated.View
                style={[
                  styles.overlayItem,
                  { left: swappingItem.startX, top: swappingItem.startY, width: swappingItem.width, height: swappingItem.height },
                  swapAnimatedStyle
                ]}
              >
                {swappingItem.children}
              </Animated.View>
            )}
          </View>
        )}
      </View>
    </DragDropContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlayItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  }
});
