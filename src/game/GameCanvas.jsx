import React from 'react';
import { StyleSheet, View, Platform, useWindowDimensions } from 'react-native';
import WebCanvas from './components/WebCanvas';
import SkiaCanvas from './components/SkiaCanvas';
import CanvasControls from './components/CanvasControls';

export default function GameCanvas({ purchaseMultiplier, onToggleMultiplier }) {
  const { width: windowWidth } = useWindowDimensions();
  const canvasSize = windowWidth;

  const [zoom, setZoom] = React.useState(1.0);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(0);
  
  const dragStartRef = React.useRef(null);
  const initialDistanceRef = React.useRef(null);
  const initialZoomRef = React.useRef(1.0);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current) {
      const element = containerRef.current;
      const handleWheel = (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        setZoom(prevZoom => {
          const nextZoom = e.deltaY > 0 ? prevZoom / zoomFactor : prevZoom * zoomFactor;
          return Math.max(0.15, Math.min(3.0, nextZoom));
        });
      };
      element.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        element.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  const onStartShouldSetResponder = () => true;
  const onMoveShouldSetResponder = () => true;

  const onResponderGrant = (evt) => {
    const { touches } = evt.nativeEvent;
    if (touches && touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      const dx = touch1.pageX - touch2.pageX;
      const dy = touch1.pageY - touch2.pageY;
      initialDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      initialZoomRef.current = zoom;
      dragStartRef.current = null;
    } else if (touches && touches.length === 1) {
      const touch = touches[0];
      dragStartRef.current = { x: touch.pageX - panX, y: touch.pageY - panY };
      initialDistanceRef.current = null;
    } else {
      const locX = evt.nativeEvent.pageX;
      const locY = evt.nativeEvent.pageY;
      dragStartRef.current = { x: locX - panX, y: locY - panY };
      initialDistanceRef.current = null;
    }
  };

  const onResponderMove = (evt) => {
    const { touches } = evt.nativeEvent;

    if (touches && touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      const dx = touch1.pageX - touch2.pageX;
      const dy = touch1.pageY - touch2.pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (initialDistanceRef.current === null) {
        initialDistanceRef.current = distance;
        initialZoomRef.current = zoom;
      } else {
        const scale = distance / initialDistanceRef.current;
        const targetZoom = initialZoomRef.current * scale;
        setZoom(Math.max(0.15, Math.min(3.0, targetZoom)));
      }
      dragStartRef.current = null;
    } else if (touches && touches.length === 1) {
      initialDistanceRef.current = null;
      const touch = touches[0];
      const locX = touch.pageX;
      const locY = touch.pageY;

      if (dragStartRef.current === null) {
        dragStartRef.current = { x: locX - panX, y: locY - panY };
      } else {
        setPanX(locX - dragStartRef.current.x);
        setPanY(locY - dragStartRef.current.y);
      }
    } else {
      initialDistanceRef.current = null;
      const locX = evt.nativeEvent.pageX;
      const locY = evt.nativeEvent.pageY;

      if (dragStartRef.current === null) {
        dragStartRef.current = { x: locX - panX, y: locY - panY };
      } else {
        setPanX(locX - dragStartRef.current.x);
        setPanY(locY - dragStartRef.current.y);
      }
    }
  };

  const onResponderRelease = () => {
    initialDistanceRef.current = null;
    dragStartRef.current = null;
  };

  const resetZoomPan = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  };

  return (
    <View 
      ref={containerRef}
      style={[
        styles.canvasContainer,
        Platform.OS === 'web' 
          ? { width: '100%', height: '100%' } 
          : { width: canvasSize, height: canvasSize }
      ]}
      onStartShouldSetResponder={onStartShouldSetResponder}
      onMoveShouldSetResponder={onMoveShouldSetResponder}
      onResponderGrant={onResponderGrant}
      onResponderMove={onResponderMove}
      onResponderRelease={onResponderRelease}
      onResponderTerminate={onResponderRelease}
    >
      {Platform.OS === 'web' ? (
        <WebCanvas zoom={zoom} panX={panX} panY={panY} />
      ) : (
        <SkiaCanvas canvasSize={canvasSize} zoom={zoom} panX={panX} panY={panY} />
      )}
      <CanvasControls 
        zoom={zoom} 
        setZoom={setZoom} 
        resetZoomPan={resetZoomPan}
        purchaseMultiplier={purchaseMultiplier}
        onToggleMultiplier={onToggleMultiplier}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  canvasContainer: {
    backgroundColor: '#050814',
    overflow: 'hidden',
  }
});
