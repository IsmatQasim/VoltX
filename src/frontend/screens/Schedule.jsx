import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Button from '../components/button';
import BottomBar from '../components/bottomBar';
import colors from '../contants/colors.js';
import { APPLIANCES, renderIcon } from '../contants/data';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const durationMap = {
  '1 minutes': 1 * 60 * 1000,
  '30 minutes': 30 * 60 * 1000,
  '1 hour': 60 * 60 * 1000,
  '2 hours': 2 * 60 * 60 * 1000,
  '3 hours': 3 * 60 * 60 * 1000,
  '4 hours': 4 * 60 * 60 * 1000,
  '5 hours': 5 * 60 * 60 * 1000,
};

const Schedule = ({ route, navigation, isOn }) => {
  const [enabled, setEnabled] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [customHour, setCustomHour] = useState('');
  const [customMinute, setCustomMinute] = useState('');

  const {
    device,
    room,
    roomName,
    setDeviceStatus,
    key,
    idx,
    roomAppliances,
    roomNames,
  } = route.params || {};

  const options = [
    '1 minutes',
    '30 minutes',
    '1 hour',
    '2 hours',
    '3 hours',
    '4 hours',
    '5 hours',
    'Other',
  ];

  const getDeviceIcon = (device) => {
    const found = APPLIANCES.find(
      (item) => item.label.toLowerCase() === device?.toLowerCase()
    );
    return found ? renderIcon(found.icon, 32) : <View style={{ width: 32 }} />;
  };

  const updateRemoteControlData = async (updatedStatus) => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    const updatedData = {};

    Object.entries(roomAppliances || {}).forEach(([roomKey, devices]) => {
      const roomDevices = {};

      Object.entries(devices || {}).forEach(([devType, cnt]) => {
        const count = typeof cnt === 'number' ? cnt : cnt.count || 0;
        for (let i = 1; i <= count; i++) {
          const devKey = `${roomKey}_${devType}_${i}`;
          const s = updatedStatus[devKey] || {};
          roomDevices[`${devType}_${i}`] = {
            status: s.status ? 'ON' : 'OFF',
            timer: s.timer || null,
            timerStart: s.timerStart || null,
          };
        }
      });

      roomDevices.roomName = roomNames?.[roomKey] || null;
      updatedData[roomKey] = roomDevices;
    });

    await firestore().collection('RemoteControl').doc(uid).set(updatedData);
  };

  const handleSave = async () => {
    let durationMs = 0;
    let timeToSave = selectedTime;

    if (!enabled) {
      if (setDeviceStatus && key) {
        setDeviceStatus((prev) => {
          const updated = {
            ...prev,
            [key]: {
              ...(prev[key] || {}),
              timer: null,
              timerStart: null,
            },
          };
          updateRemoteControlData(updated);
          return updated;
        });
      }
      navigation.goBack();
      return;
    }

    // Handle "Other"
    if (selectedTime === 'Other') {
      const hh = parseInt(customHour) || 0;
      const mm = parseInt(customMinute) || 0;

      if (customHour === '' || customMinute === '') {
        Alert.alert('Validation Error', 'Please enter both hours and minutes.');
        return;
      }

      durationMs = (hh * 60 + mm) * 60 * 1000;

      if (durationMs <= 0) {
        Alert.alert('Invalid Time', 'Please enter a valid duration greater than 00:00');
        return;
      }

      timeToSave = `${hh.toString().padStart(2, '0')}:${mm
        .toString()
        .padStart(2, '0')}`;
    } else {
      durationMs = durationMap[selectedTime] || 0;
      if (durationMs <= 0) {
        Alert.alert('Invalid Selection', 'Please select a valid time.');
        return;
      }
    }

    const currentTimestamp = Date.now();

    if (setDeviceStatus && key) {
      const newState = {
        ...(setDeviceStatus[key] || {}),
        status: isOn,
        timer: timeToSave,
        timerStart: currentTimestamp,
      };

      setDeviceStatus((prev) => {
        const updated = {
          ...prev,
          [key]: newState,
        };
        updateRemoteControlData(updated);
        return updated;
      });
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Schedule</Text>

        <View style={styles.deviceHeader}>
          <View style={styles.iconContainer}>{getDeviceIcon(device)}</View>
          <Text style={styles.deviceLabel}>{`${device} ${idx || ''}`}</Text>
          <Text style={styles.roomName}>{roomName || room}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Auto-Turn {isOn ? 'Off' : 'On'}</Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: '#d2aa6d', true: '#d2aa6d' }}
              thumbColor="#fff"
            />
          </View>

          {enabled && <View style={styles.divider} />}
          {enabled && (
            <>
              <Text style={styles.subLabel}>
                This device will automatically turn {isOn ? 'off' : 'on'} after:
              </Text>

              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setSelectedTime(option)}
                  style={styles.optionRow}
                >
                  <View style={styles.radio}>
                    {selectedTime === option && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}

              {selectedTime === 'Other' && (
                <View style={styles.timeInputRow}>
                  <TextInput
                    placeholder="HH"
                    placeholderTextColor="#555"
                    value={customHour}
                    onChangeText={setCustomHour}
                    keyboardType="numeric"
                    maxLength={2}
                    style={styles.timeInput}
                  />
                  <Text style={{ fontSize: 18, color: '#ccc', marginHorizontal: 4 }}>
                    :
                  </Text>
                  <TextInput
                    placeholder="MM"
                    placeholderTextColor="#555"
                    value={customMinute}
                    onChangeText={setCustomMinute}
                    keyboardType="numeric"
                    maxLength={2}
                    style={styles.timeInput}
                  />
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.buttonRow}>
          {enabled && (
            <>
              <Button text=" Cancel " onPress={() => navigation.goBack()} />
              <View style={{ width: 20 }} />
              <Button text="   Save   " onPress={handleSave} />
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBarContainer}>
        <BottomBar />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  scrollContent: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 40, fontWeight: '700', marginBottom: 15, marginTop: 12, textAlign: 'center' },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'space-between' },
  iconContainer: { marginRight: 10 },
  deviceLabel: { flex: 1, fontSize: 20, fontWeight: '600', color: colors.text },
  roomName: { fontSize: 20, fontWeight: '600', color: colors.text },
  card: { backgroundColor: colors.secondary, borderRadius: 10, padding: 20, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 22, fontWeight: '500' },
  subLabel: { marginTop: 14, fontSize: 18, fontWeight: '500' },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.accent,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  radioSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#d2aa6d' },
  optionText: { fontSize: 16 },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  timeInput: {
    borderWidth: 1, borderColor: '#000', padding: 8,
    borderRadius: 6, width: 60, textAlign: 'center', fontSize: 16, color: '#000',
  },
  divider: { height: 1, backgroundColor: '#000', marginVertical: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 1, marginRight: 7 },
  bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 }
});

export const ScheduleOn = (props) => <Schedule {...props} isOn={false} />;
export const ScheduleOff = (props) => <Schedule {...props} isOn={true} />;
