import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { APPLIANCES, renderIcon } from '../contants/data';
import BottomBar from '../components/bottomBar';
import colors from '../contants/colors';
import NotificationBell from '../components/notificationBell';

const durationMap = {
  '1 minutes': 1 * 60 * 1000,
  '30 minutes': 30 * 60 * 1000,
  '1 hour': 60 * 60 * 1000,
  '2 hours': 2 * 60 * 60 * 1000,
  '3 hours': 3 * 60 * 60 * 1000,
  '4 hours': 4 * 60 * 60 * 1000,
  '5 hours': 5 * 60 * 60 * 1000,
};

// ✅ NEW: Handle custom timer format like "00:02"
const parseDuration = (timer) => {
  if (!timer) return 0;
  if (durationMap[timer]) return durationMap[timer];

  const match = timer.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10) || 0;
  const minutes = parseInt(match[2], 10) || 0;

  return (hours * 60 + minutes) * 60 * 1000;
};

const formatCountdown = ms => {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${sec}s`;
};

const updateRemoteControlData = async (deviceStatus, roomAppliances, roomNames) => {
  const uid = auth().currentUser?.uid;
  if (!uid) return;
  const updatedData = {};

  Object.entries(roomAppliances || {}).forEach(([room, devices]) => {
    const roomDevices = {};
    Object.entries(devices || {}).forEach(([device, cnt]) => {
      const count = typeof cnt === 'number' ? cnt : cnt.count || 0;
      for (let i = 1; i <= count; i++) {
        const key = `${room}_${device}_${i}`;
        const s = deviceStatus[key] || {};
        roomDevices[`${device}_${i}`] = {
          status: s.status ? 'ON' : 'OFF',
          timer: s.timer || null,
          timerStart: s.timerStart || null,
        };
      }
    });
    roomDevices.roomName = roomNames?.[room] || null;
    updatedData[room] = roomDevices;
  });

  await firestore().collection('RemoteControl').doc(uid).set(updatedData);
};

const RemoteControl = () => {
  const nav = useNavigation();
  const [roomAppliances, setRoomAppliances] = useState({});
  const [roomNames, setRoomNames] = useState({});
  const [selectedRoom, setSelectedRoom] = useState('room');
  const [deviceStatus, setDeviceStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('room');
  const [items, setItems] = useState([]);
  const [tick, setTick] = useState(0);
  const [bellActive, setBellActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) return setLoading(false);

    const unsubscribe = firestore()
      .collection('UserHomeProfile')
      .doc(uid)
      .onSnapshot(async doc => {
        const data = doc.data();
        if (doc.exists && data) {
          setRoomAppliances(data.roomAppliances || {});
          setRoomNames(data.roomNames || {});
        } else {
          setRoomAppliances({});
          setRoomNames({});
          await firestore().collection('RemoteControl').doc(uid).delete().catch(() => {});
        }
        setLoading(false);
      }, err => {
        console.error('Error fetching profile:', err);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    const unsubscribe = firestore()
      .collection('RemoteControl')
      .doc(uid)
      .onSnapshot(snapshot => {
        const data = snapshot.data();
        if (!data) return;

        const updatedStatus = {};
        Object.entries(data).forEach(([room, devices]) => {
          Object.entries(devices || {}).forEach(([devKey, value]) => {
            if (devKey === 'roomName') return;
            const fullKey = `${room}_${devKey}`;
            updatedStatus[fullKey] = {
              status: value.status === 'ON',
              timer: value.timer || null,
              timerStart: value.timerStart?.toMillis
                ? value.timerStart.toMillis()
                : value.timerStart || null,
            };
          });
        });

        setDeviceStatus(updatedStatus);
      });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setItems(['room', ...Object.keys(roomAppliances)].map(r => ({
      label: r === 'room' ? 'All Rooms' : roomNames?.[r] || r.replace(/_/g, ' '),
      value: r,
    })));
  }, [roomAppliances, roomNames]);

  // ✅ Timer countdown logic and switch
  useEffect(() => {
    const interval = setInterval(() => {
      setDeviceStatus(prev => {
        const updated = { ...prev };
        let changed = false;
        Object.entries(prev).forEach(([key, value]) => {
          if (value.timer && value.timerStart) {
            const duration = parseDuration(value.timer);
            const elapsed = Date.now() - value.timerStart;
            if (elapsed >= duration) {
              updated[key] = {
                status: !value.status,
                timer: null,
                timerStart: null
              };
              changed = true;
            }
          }
        });
        if (changed) updateRemoteControlData(updated, roomAppliances, roomNames);
        return changed ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [roomAppliances, roomNames]);

  const getDevices = (tick) => {
    const rooms = selectedRoom === 'room' ? Object.keys(roomAppliances || {}) : [selectedRoom];
    return rooms.flatMap(room =>
      Object.entries(roomAppliances?.[room] || {}).flatMap(([dev, cntObj]) => {
        const count = typeof cntObj === 'number' ? cntObj : cntObj?.count || 0;
        return [...Array(count)].map((_, i) => {
          const key = `${room}_${dev}_${i + 1}`;
          const s = deviceStatus[key] || {};
          let rem = null;

          if (s.timer && s.timerStart) {
            const dur = parseDuration(s.timer);
            rem = dur - (Date.now() - s.timerStart);
          }

          return {
            key, room, dev, idx: i + 1,
            label: `${dev} ${i + 1}`,
            status: s.status || false,
            timer: s.timer,
            remaining: rem,
            roomName: roomNames?.[room] || room.replace(/_/g, ' ')
          };
        });
      })
    );
  };

  const toggleDevice = async (room, dev, idx, currentStatus) => {
    const key = `${room}_${dev}_${idx}`;
    const prev = deviceStatus[key] || {};
    const updated = {
      ...deviceStatus,
      [key]: {
        ...prev,
        status: !currentStatus,
        timer: null,
        timerStart: null,
      }
    };
    setDeviceStatus(updated);
    await updateRemoteControlData(updated, roomAppliances, roomNames);
  };

  const turnAllOff = async () => {
    const updated = {};
    Object.entries(deviceStatus).forEach(([key, value]) => {
      if (value.status) {
        updated[key] = { status: false, timer: null, timerStart: null };
      }
    });
    setDeviceStatus(prev => ({ ...prev, ...updated }));
    await updateRemoteControlData({ ...deviceStatus, ...updated }, roomAppliances, roomNames);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.primary }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading Remote Control...</Text>
      </View>
    );
  }

  const devices = getDevices(tick);

  return (
    <View style={styles.fullScreen}>
      <View style={styles.topFixed}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Remote Control Access</Text>
          <NotificationBell isActive={bellActive} onToggle={() => setBellActive(!bellActive)} />
        </View>
        <Text style={styles.subtitle}>Manage devices remotely</Text>
        <View style={styles.topRow}>
          <View style={styles.pickerWrapper}>
            <DropDownPicker
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={val => { setValue(val); setSelectedRoom(val); }}
              setItems={setItems}
              style={styles.picker}
              dropDownContainerStyle={styles.dropdown}
              textStyle={styles.pickerText}
              arrowIconStyle={{ tintColor: 'black' }}
            />
          </View>
          <TouchableOpacity onPress={turnAllOff} style={styles.turnAllOffButton}>
            <Text style={styles.turnAllOffText}>Turn All Off</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.deviceCount}>{devices.filter(d => d.status).length} Devices On</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {devices.map(d => (
          <View key={d.key} style={styles.deviceRow}>
            <View style={{ marginTop: 8, marginLeft: 5 }}>
              {renderIcon(
                APPLIANCES.find(a => a.label.toLowerCase() === d.dev.toLowerCase())?.icon,
                30
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceLabel}>
                {d.label}{selectedRoom === 'room' ? ` - ${d.roomName}` : ''}
              </Text>
              <Text style={styles.deviceTime}>
                {d.timer
                  ? `${d.status ? 'OFF' : 'ON'} in ${formatCountdown(d.remaining)}`
                  : d.status ? 'ON' : 'OFF'}
              </Text>
            </View>
            <View style={styles.toggleBlock}>
              <Switch
                value={d.status}
                onValueChange={() => toggleDevice(d.room, d.dev, d.idx, d.status)}
                trackColor={{ false: '#d2aa6d', true: '#d2aa6d' }}
                thumbColor="#f4f3f4"
              />
              <TouchableOpacity onPress={() => nav.navigate(
                d.status ? 'ScheduleOff' : 'ScheduleOn',
                {
                  room: d.room,
                  roomName: d.roomName,
                  device: d.dev,
                  key: d.key,
                  idx: d.idx,
                  setDeviceStatus,
                  roomAppliances,
                  roomNames,
                }
              )} style={{ marginTop: 6 }}>
                {renderIcon('chevron-right', 18, '#8b4513')}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBarContainer}>
        <BottomBar />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: colors.primary },
  topFixed: { padding: 16, backgroundColor: colors.primary, zIndex: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 80 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, color: colors.link, marginVertical: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pickerWrapper: { flex: 1, marginRight: 24, zIndex: 10 },
  picker: { backgroundColor: colors.secondary, borderColor: colors.text, borderWidth: 1, borderRadius: 8 },
  dropdown: { backgroundColor: colors.primary, borderColor: colors.text },
  pickerText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  turnAllOffButton: { backgroundColor: colors.secondary, borderColor: colors.text, borderWidth: 1, borderRadius: 8, padding: 8 },
  turnAllOffText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  deviceCount: { textAlign: 'right', color: colors.link, fontSize: 16, fontWeight: '700' },
  deviceRow: { flexDirection: 'row', backgroundColor: colors.secondary, borderRadius: 10, marginBottom: 9, elevation: 1 },
  deviceLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginLeft: 8, marginTop: 9 },
  deviceTime: { fontSize: 12, color: colors.link, marginLeft: 9 },
  toggleBlock: { alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.text, fontStyle: 'italic' },
});

export default RemoteControl;
