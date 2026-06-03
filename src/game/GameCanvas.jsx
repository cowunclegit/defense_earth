import React from 'react';
import { StyleSheet, View, Platform, Dimensions } from 'react-native';
import WebCanvas from './components/WebCanvas';
import SkiaCanvas from './components/SkiaCanvas';
import CanvasControls from './components/CanvasControls';

const { height: windowHeight } = Dimensions.get('window');
const canvasSize = Math.min(320, windowHeight * 0.45);

export default function GameCanvas() {
  const [zoom, setZoom] = React.useState(1.0);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(0);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current) {
      const element = containerRef.current;
      const handleWheel = (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        setZoom(prevZoom => {
          const nextZoom = e.deltaY > 0 ? prevZoom / zoomFactor : prevZoom * zoomFactor;
          return Math.max(0.3, Math.min(3.0, nextZoom));
        });
      };
      element.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        element.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  const onStartShouldSetResponder = () => true;
  const onResponderGrant = (evt) => {
    const locX = evt.nativeEvent.pageX;
    const locY = evt.nativeEvent.pageY;
    setDragStart({ x: locX - panX, y: locY - panY });
  };
  const onResponderMove = (evt) => {
    const locX = evt.nativeEvent.pageX;
    const locY = evt.nativeEvent.pageY;
    setPanX(locX - dragStart.x);
    setPanY(locY - dragStart.y);
  };

  const resetZoomPan = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  };

  return (
    <View 
      ref={containerRef}
      style={styles.canvasContainer}
      onStartShouldSetResponder={onStartShouldSetResponder}
      onResponderGrant={onResponderGrant}
      onResponderMove={onResponderMove}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  canvasContainer: {
    ...Platform.select({
      web: {
        width: '100%',
        height: '100%',
      },
      default: {
        width: canvasSize,
        height: canvasSize,
      }
    }),
    backgroundColor: '#050814',
    overflow: 'hidden',
  }
});
