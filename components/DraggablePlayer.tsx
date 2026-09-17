import React, { useRef, useState, useCallback } from 'react';
import { View, LayoutRectangle, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useDragDrop } from '../contexts/DragDropContext';

interface DraggablePlayerProps {
  teamIndex: number;
  playerId: string;
  style?: StyleProp<ViewStyle>;
  onTap?: () => void;
  children: React.ReactNode;
}

const DraggablePlayer: React.FC<DraggablePlayerProps> = ({ teamIndex, playerId, style, onTap, children }) => {
  const { 
    registerZone, 
    unregisterZone, 
    onDragStart, 
    onDragEnd, 
    activeDragPlayerId, 
    swappingPlayerId, 
    translateX, 
    translateY, 
    isDragging 
  } = useDragDrop();
  const viewRef = useRef<View>(null);
  const isBeingDragged = activeDragPlayerId === playerId || swappingPlayerId === playerId;

  const onLayout = useCallback(() => {
    setTimeout(() => {
      viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0 && height > 0) {
          registerZone(teamIndex, playerId, { x: pageX, y: pageY, width, height }, children);
        }
      });
    }, 100);
  }, [registerZone, teamIndex, playerId, children]);

  React.useEffect(() => {
    return () => {
      unregisterZone(playerId);
    };
  }, [playerId, unregisterZone]);

  const handleTapJS = useCallback(() => {
    if (onTap) {
      onTap();
    }
  }, [onTap]);

  const handleStartJS = useCallback((pageX: number, pageY: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    viewRef.current?.measure((x, y, width, height, _px, _py) => {
      onDragStart(teamIndex, playerId, _px, _py, width, height, children);
    });
  }, [teamIndex, playerId, onDragStart, children]);

  const handleEndJS = useCallback((absoluteX: number, absoluteY: number) => {
    onDragEnd(absoluteX, absoluteY);
  }, [onDragEnd]);

  // Tap gesture for instantaneous selection of the team
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      if (onTap) {
        runOnJS(handleTapJS)();
      }
    });

  // Pan gesture with long press activation for dragging
  const panGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart((e) => {
      isDragging.value = true;
      runOnJS(handleStartJS)(e.absoluteX, e.absoluteY);
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      isDragging.value = false;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      runOnJS(handleEndJS)(e.absoluteX, e.absoluteY);
    });

  // Composed gesture: Quick tap triggers tapGesture, holding (>200ms) triggers panGesture
  const composedGesture = Gesture.Race(panGesture, tapGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View 
        ref={viewRef} 
        onLayout={onLayout}
        style={[
          style, 
          isBeingDragged && {
            opacity: 0,
          }
        ]} 
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export default DraggablePlayer;
