import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { useGameStore } from '../store/gameStore';

function NotificationCard({ alert, onClose }) {
  const { id, title, message, buttons } = alert;

  useEffect(() => {
    // Auto-dismiss timers: 5 seconds for confirmation alerts, 2.5 seconds for simple alerts
    const hasMultipleButtons = buttons && buttons.length > 1;
    const delay = hasMultipleButtons ? 5000 : 2500;

    const timer = setTimeout(() => {
      onClose(id);
    }, delay);

    return () => clearTimeout(timer);
  }, [id, buttons, onClose]);

  const handleButtonPress = (onPress) => {
    onClose(id);
    if (onPress) {
      setTimeout(() => {
        onPress();
      }, 50);
    }
  };

  // Determine status color and icon
  const isDestructive = buttons?.some(b => b.style === 'destructive') || title?.includes('경고') || title?.includes('초기화');
  const themeColor = isDestructive ? '#ff0055' : '#00f0ff';
  const statusIcon = isDestructive ? '⚠️' : '📡';

  const alertButtons = buttons && buttons.length > 0 ? buttons : [];

  return (
    <View style={[styles.notificationCard, { borderColor: themeColor }]} pointerEvents="auto">
      {/* Top Section: Icon, Content, and Close Button */}
      <View style={styles.topRow}>
        {/* Status Icon */}
        <Text style={styles.statusIcon}>{statusIcon}</Text>
        
        {/* Title & Message Column */}
        <View style={styles.contentColumn}>
          <Text style={[styles.notificationTitle, { color: themeColor }]}>
            {title}
          </Text>
          {message ? (
            <Text style={styles.notificationMessage}>{message}</Text>
          ) : null}
        </View>

        {/* Close X Button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => onClose(id)}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Section: Action Buttons (Right-aligned) */}
      {alertButtons.length > 0 ? (
        <View style={styles.actionsRow}>
          {alertButtons.map((btn, index) => {
            const isCancel = btn.style === 'cancel';
            const isBtnDestructive = btn.style === 'destructive';
            
            let btnBgColor = '#101c38';
            let btnBorderColor = '#1e305e';
            let btnTextColor = '#8fa0c4';

            if (isBtnDestructive) {
              btnBgColor = '#ff0055';
              btnBorderColor = '#ff0055';
              btnTextColor = '#050814';
            } else if (!isCancel) {
              btnBgColor = themeColor;
              btnBorderColor = themeColor;
              btnTextColor = '#050814';
            }

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  {
                    backgroundColor: btnBgColor,
                    borderColor: btnBorderColor,
                  }
                ]}
                onPress={() => handleButtonPress(btn.onPress)}
              >
                <Text style={[styles.buttonText, { color: btnTextColor }]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export default function CustomAlert() {
  const activeAlerts = useGameStore((state) => state.activeAlerts);
  const closeAlert = useGameStore((state) => state.closeAlert);

  if (!activeAlerts || activeAlerts.length === 0) return null;

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {activeAlerts.map((alert) => (
        <NotificationCard
          key={alert.id}
          alert={alert}
          onClose={closeAlert}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 20,
    right: 20,
    width: 340,
    maxWidth: '90%',
    zIndex: 99999,
    flexDirection: 'column',
    gap: 10,
  },
  notificationCard: {
    width: '100%',
    backgroundColor: 'rgba(10, 16, 35, 0.97)',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 1,
  },
  contentColumn: {
    flex: 1,
    paddingRight: 15,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  notificationMessage: {
    fontSize: 11,
    color: '#8fa0c4',
    textAlign: 'left',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 2,
    marginTop: -2,
    marginRight: -2,
  },
  closeBtnText: {
    color: '#60789a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  button: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  buttonText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
