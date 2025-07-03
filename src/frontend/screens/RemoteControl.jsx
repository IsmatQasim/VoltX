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

const durationMap = {
  '1 minutes': 1 * 60 * 1000,
  '30 minutes': 30 * 60 * 1000,
  '1 hour': 60 * 60 * 1000,
  '2 hours': 2 * 60 * 60 * 1000,
  '3 hours': 3 * 60 * 60 * 1000,
  '4 hours': 4 * 60 * 60 * 1000,
  '5 hours': 5 * 60 * 60 * 1000,
};

const formatCountdown = (ms) => {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours > 0 ? `${hours}h ` : ''}${
    minutes > 0 ? `${minutes}m ` : ''
  }${seconds}s`;
};

const RemoteControl = () => {
  const navigation = useNavigation();
  const [roomAppliances, setRoomAppliances] = useState({});
  const [roomNames, setRoomNames] = useState({});
  const [selectedRoom, setSelectedRoom] = useState('room');
  const [deviceStatus, setDeviceStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('room');
  const [items, setItems] = useState([]);
  const [tick, setTick] = useState(0); 

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth().currentUser?.uid;
        if (!userId) return;

        const doc = await firestore().collection('UserHomeProfile').doc(userId).get();
        if (doc.exists) {
          const data = doc.data();
          setRoomAppliances(data.roomAppliances || {});
          setRoomNames(data.roomNames || {});
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    setItems(
      ['room', ...Object.keys(roomAppliances)].map((room) => ({
        label: room === 'room' ? 'All Rooms ' : roomNames?.[room] || room,
        value: room,
      }))
    );
  }, [roomAppliances, roomNames]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1); 

      setDeviceStatus(prev => {
        const updated = { ...prev };
        let changed = false;

        Object.entries(updated).forEach(([key, val]) => {
          if (val.timer && val.timerStart) {
            const durationMs =
              durationMap[val.timer] || 
              (() => {
                const parts = val.timer.split(':');
                if (parts.length === 2) {
                  const h = parseInt(parts[0]);
                  const m = parseInt(parts[1]);
                  return (h * 60 + m) * 60 * 1000;
                }
                return 0;
              })();

            const elapsed = Date.now() - val.timerStart;
            if (elapsed >= durationMs) {
              updated[key] = {
                status: !val.status,
                timer: '',
                timerStart: null,
              };
              changed = true;
            }
          }
        });

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getDeviceIcon = (device) => {
    const found = APPLIANCES.find(item =>
      item.label.toLowerCase() === device.toLowerCase()
    );
    return found ? (
      <View style={{ marginTop: 8, marginLeft: 8 }}>
        {renderIcon(found.icon, 28)}
      </View>
    ) : (
      <View style={{ width: 28 }} />
    );
  };

  const getFilteredDevices = () => {
    const rooms = selectedRoom === 'room' ? Object.keys(roomAppliances) : [selectedRoom];
    return rooms.flatMap(room => {
      const devices = roomAppliances[room] || {};
      return Object.entries(devices).flatMap(([device, countObj]) => {
        const count =
          typeof countObj === 'number'
            ? countObj
            : countObj?.count?.actualCount || countObj?.count || 0;

        if (count <= 0) return [];

        const roomName = roomNames?.[room] || room;
        return Array.from({ length: count }, (_, i) => {
          const label = `${device} ${i + 1}`;
          const key = `${room}_${device}_${i + 1}`;
          const status = deviceStatus[key]?.status || false;
          const timer = deviceStatus[key]?.timer || '';
          const timerStart = deviceStatus[key]?.timerStart;

          let remaining = null;
          if (timer && timerStart) {
            const durationMs =
              durationMap[timer] || (() => {
                const parts = timer.split(':');
                if (parts.length === 2) {
                  const h = parseInt(parts[0]);
                  const m = parseInt(parts[1]);
                  return (h * 60 + m) * 60 * 1000;
                }
                return 0;
              })();

            const elapsed = Date.now() - timerStart;
            remaining = durationMs - elapsed;
          }

          return {key,room,roomName,device,label,status,timer
            ,index: i + 1,remaining,};
        });
      });
    });
  };

  const handleToggle = (room, device, index, currentStatus) => {
    const key = `${room}_${device}_${index}`;
    setDeviceStatus(prev => ({
      ...prev,
      [key]: {
        status: !currentStatus,
        timer: '',
        timerStart: null,
      },
    }));
  };

  const handleTurnAllOff = () => {
    const updated = { ...deviceStatus };
    Object.keys(updated).forEach(key => {
      if (updated[key].status) {
        updated[key] = {
          status: false,
          timer: '',
          timerStart: null,
        };
      }
    });
    setDeviceStatus(updated);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#b57f40" />
      </View>
    );
  }

  const devices = getFilteredDevices();

  return (
    <View style={styles.fullScreen}>
      <View style={styles.topFixed}>
        <Text style={styles.title}>Remote Control Access</Text>
        <Text style={styles.subtitle}>Access and manage devices remotely.</Text>

        <View style={styles.topRow}>
          <View style={styles.pickerWrapper}>
            <DropDownPicker
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={(val) => {
                setValue(val);
                setSelectedRoom(val);
              }}
              setItems={setItems}
              style={{ backgroundColor: colors.secondary, borderColor: colors.text, borderWidth: 1, borderRadius: 8 }}
              dropDownContainerStyle={{ backgroundColor: colors.primary, borderColor: colors.text }}
              textStyle={{ fontSize: 16, fontWeight: '700', color: colors.text }}
              arrowIconStyle={{ tintColor: 'black' }}
            />
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={handleTurnAllOff} style={styles.turnAllOffButton}>
              <Text style={styles.turnAllOffText}>Turn All Off</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.deviceCount}>
          {devices.filter(d => d.status).length} Devices On
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {devices.map(({ key, room, device, roomName, label, status, timer, index, remaining }) => (
          <View key={key} style={styles.deviceRow}>
            {getDeviceIcon(device)}

            <View style={{ flex: 1 }}>
              <Text style={styles.deviceLabel}>
                {label}{selectedRoom === 'room' ? ` - ${roomName}` : ''}
              </Text>
              <Text style={styles.deviceTime}>
                {timer ? `${status ? 'OFF' : 'ON'} in ${formatCountdown(remaining)}` : status ? 'ON' : 'OFF'}
              </Text>
            </View>

            <View style={styles.toggleBlock}>
              <Switch
                value={status}
                onValueChange={() => handleToggle(room, device, index, status)}
                trackColor={{ false: '#d2aa6d', true: '#d2aa6d' }}
                thumbColor={status ? '#f4f3f4' : '#f4f3f4'}
              />
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(status ? 'ScheduleOff' : 'ScheduleOn', {
                    room,
                    roomName,
                    device,
                    key,
                    index,
                    setDeviceStatus,
                  })
                }
                style={{ marginTop: 6 }}
              >
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
  title: { fontSize: 28, fontWeight: '700', textAlign: 'left', color: colors.text, marginBottom: 6, marginTop: 10 },
  subtitle: { fontSize: 16, textAlign: 'left', color: colors.link, marginBottom: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pickerWrapper: { flex: 1, marginRight: 24, zIndex: 10 },
  turnAllOffButton: { backgroundColor: colors.secondary, borderColor: colors.text, borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  turnAllOffText: { color: colors.text, fontWeight: '700', fontSize: 16, textAlign: 'center' },
  deviceCount: { fontSize: 16, fontWeight: '700', textAlign: 'right', color: colors.link },
  deviceRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.secondary, padding: 1, borderRadius: 10, marginBottom: 9, elevation: 1 },
  deviceLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginLeft: 8, marginTop: 10 },
  deviceTime: { fontSize: 12, color: colors.link, marginTop: 2, marginLeft: 9 },
  toggleBlock: { alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});

export default RemoteControl;
