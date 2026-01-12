import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Switch, TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import colors from '../contants/colors';
import BottomBar from '../components/bottomBar';
import NotificationBell from '../components/notificationBell';
import { APPLIANCES, renderIcon } from '../contants/data';
import Button from '../components/button';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


const SleepMode = () => {
  const [autoSleepEnabled, setAutoSleepEnabled] = useState(false);
  const [roomAppliances, setRoomAppliances] = useState({});
  const [roomNames, setRoomNames] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [affectedDevices, setAffectedDevices] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [durationOpen, setDurationOpen] = useState(false);
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [customHour, setCustomHour] = useState('');
  const [customMinute, setCustomMinute] = useState('');
  const [bellActive, setBellActive] = useState(false);
  const [tick, setTick] = useState(0);
  const [deviceTimers, setDeviceTimers] = useState({});
  const [durationConfirmed, setDurationConfirmed] = useState(false);

  const baseDurations = [
    { label: '5 minutes', value: '5 minutes' },
    { label: '10 minutes', value: '10 minutes' },
    { label: '15 minutes', value: '15 minutes' },
    { label: 'Other', value: 'Other' },
  ];
  const durationOptions = baseDurations.map(item =>
    item.value === selectedDuration ? { label: selectedDuration, value: selectedDuration } : item
  );

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth().currentUser?.uid;
      if (!uid) return;
      const rc = await firestore().collection('RemoteControl').doc(uid).get();
      if (rc.exists) {
        const rooms = {}, names = {};
        Object.entries(rc.data()).forEach(([r, rd]) => {
          const on = {};
          Object.entries(rd).forEach(([k, v]) => {
            if (k !== 'roomName' && v.status === 'ON') on[k] = true;
          });
          if (Object.keys(on).length) {
            rooms[r] = on;
            names[r] = typeof rd.roomName === 'string' && rd.roomName.trim() ? rd.roomName.trim() : null;
          }
        });
        setRoomAppliances(rooms);
        setRoomNames(names);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const checkSleepTimer = async () => {
      const uid = auth().currentUser?.uid;
      if (!uid) return;

      const sleepDoc = await firestore().collection('SleepMode').doc(uid).get();
      if (!sleepDoc.exists) return;

      const data = sleepDoc.data();
      const now = Date.now();

      const stillValid = data.affectedDevices.filter(d => d.timers > now);
      const expired = data.affectedDevices.filter(d => d.timers <= now);

      if (expired.length) {
        const rcRef = firestore().collection('RemoteControl').doc(uid);
        const rcDoc = await rcRef.get();
        const rcData = rcDoc.data();

        expired.forEach(({ room, device }) => {
          if (
            rcData?.[room]?.[device] &&
            rcData[room][device].status === 'ON'
          ) {
            rcData[room][device].status = 'OFF';
          }
        });

        await rcRef.set(rcData);
        await firestore().collection('SleepMode').doc(uid).delete();
        setAffectedDevices([]);
        setDeviceTimers({});
        setAutoSleepEnabled(false);
      }

      if (stillValid.length) {
        const timers = {};
        stillValid.forEach(i => {
          timers[`${i.room}_${i.device}`] = i.timers;
        });
        setAffectedDevices(stillValid);
        setDeviceTimers(timers);
        setAutoSleepEnabled(true);
        setDurationConfirmed(true);
      }
    };

    checkSleepTimer(); 
    const interval = setInterval(checkSleepTimer, 60000); 
        return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!selectedRoom) return setDeviceOptions([]);
    const opts = Object.keys(roomAppliances[selectedRoom] || {}).map(d => ({
      label: d.replace(/_/g, ' '),
      value: d,
    }));
    setDeviceOptions(
      opts.length ? opts : [{ label: 'No device available', value: null, disabled: true }]
    );
    setSelectedDevice(null);
  }, [selectedRoom, roomAppliances]);

  const handleAddDevice = dev => {
    if (dev && selectedRoom && !affectedDevices.some(x => x.room === selectedRoom && x.device === dev)) {
      setAffectedDevices(prev => [...prev, { room: selectedRoom, device: dev }]);
    }
  };

  const handleRemoveDevice = i => setAffectedDevices(prev => prev.filter((_, idx) => idx !== i));

  const getIcon = d => {
    const m = APPLIANCES.find(x => x.label.toLowerCase() === d.toLowerCase());
    return m?.icon || null;
  };

  const formatRemaining = () => {
    const vals = Object.values(deviceTimers);
    if (!vals.length) return null;
    const min = Math.min(...vals) - Date.now();
    if (min <= 0) return null;
    const h = Math.floor(min / 3600000),
      m = Math.floor((min % 3600000) / 60000),
      s = Math.floor((min % 60000) / 1000);
    return h > 0
      ? [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
      : [m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const handleSave = async () => {
    if (!affectedDevices.length) return;
    let ms = 0;
    if (selectedDuration === 'Other') {
      const hh = parseInt(customHour) || 0;
      const mm = parseInt(customMinute) || 0;
      ms = (hh * 3600 + mm * 60) * 1000;
    } else if (selectedDuration.includes(':')) {
      const [hh, mm] = selectedDuration.split(':').map(n => parseInt(n));
      ms = (hh * 3600 + mm * 60) * 1000;
    } else {
      ms = parseInt(selectedDuration) * 60000;
    }
    if (ms <= 0) return;
    const now = Date.now(), timers = {};
    affectedDevices.forEach(({ room, device }) => {
      timers[`${room}_${device}`] = now + ms;
    });
    setDeviceTimers(timers);
    const arr = affectedDevices.map(({ room, device }) => ({
      room,
      device,
      selectedDuration,
      customHour,
      customMinute,
      timers: now + ms,
      roomName: roomNames[room] ?? null,
    }));
    const uid = auth().currentUser?.uid;
    await firestore().collection('SleepMode').doc(uid).set({ affectedDevices: arr });
    setTimeout(() => {
      setAffectedDevices([]);
      setDeviceTimers({});
      setDurationConfirmed(false); 
    }, ms);
  };

  const handleWakeAll = async () => {
    setAffectedDevices([]);
    setDeviceTimers({});
    setSelectedDuration(null);
    setCustomHour('');
    setCustomMinute('');
    setDurationConfirmed(false); 
    const uid = auth().currentUser?.uid;
    await firestore().collection('SleepMode').doc(uid).delete();
  };

const getDurationPlaceholder = () => {
  if (selectedDuration === 'Other' && customHour && customMinute) {
    const hh = parseInt(customHour) || 0;
    const mm = parseInt(customMinute) || 0;

    let parts = [];
    if (hh > 0) parts.push(`${hh} hour${hh > 1 ? 's' : ''}`);
    if (mm > 0) parts.push(`${mm} minute${mm > 1 ? 's' : ''}`);
    return parts.length ? parts.join(' ') : 'Select Duration';
  } else if (selectedDuration && selectedDuration.includes(':')) {
    const [hh, mm] = selectedDuration.split(':').map(n => parseInt(n));
    let parts = [];
    if (hh > 0) parts.push(`${hh} hour${hh > 1 ? 's' : ''}`);
    if (mm > 0) parts.push(`${mm} minute${mm > 1 ? 's' : ''}`);
    return parts.length ? parts.join(' ') : 'Select Duration';
  } else if (selectedDuration && selectedDuration !== 'Other') {
    return selectedDuration;
  }
  return 'Select Duration';
};


  return (
    <View style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.topFixed}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Sleep Mode</Text>
            <NotificationBell isActive={bellActive} onToggle={() => setBellActive(b => !b)} />
          </View>
          <Text style={styles.subtitle}>Save energy by turning off inactive devices
</Text>
        </View>

        <View style={styles.toggleWrapper}>
          <View style={styles.toggleRow}>
            <Text style={styles.label}>Auto Sleep Mode</Text>
            <Switch
              value={autoSleepEnabled}
              onValueChange={v => {
                setAutoSleepEnabled(v);
                if (!v) handleWakeAll();
              }}
              trackColor={{ false: '#d3d3d3', true: '#d2aa6d' }}
              thumbColor="#f4f3f4"
            />
         
          </View>
        </View>

{autoSleepEnabled && (
  <>
    {/* Rooms and Devices */}
    <View style={styles.topRow}>
      <View style={[styles.pickerWrapper, { marginRight: 12 }]}>
        <DropDownPicker
          open={roomDropdownOpen}
          value={selectedRoom}
          items={Object.keys(roomAppliances).map(k => ({
            label: roomNames[k] ?? k.replace(/_/g, ' '),
            value: k,
          }))}
          setOpen={setRoomDropdownOpen}
          setValue={setSelectedRoom}
          setItems={() => {}}
          placeholder="Select Room"
          style={styles.dropdownStyle}
          dropDownContainerStyle={styles.dropdownContainer}
          textStyle={styles.dropdownText}
          listMode="SCROLLVIEW"
          zIndex={3000}
          zIndexInverse={1000}
        />
      </View>
      <View style={styles.pickerWrapper}>
        <DropDownPicker
          open={deviceDropdownOpen}
          value={selectedDevice}
          items={deviceOptions}
          setOpen={setDeviceDropdownOpen}
          setValue={cb => {
            const v = cb(selectedDevice);
            setSelectedDevice(v);
            handleAddDevice(v);
            return v;
          }}
          setItems={() => {}}
          placeholder="Select Device"
          style={styles.dropdownStyle}
          dropDownContainerStyle={styles.dropdownContainer}
          textStyle={styles.dropdownText}
          listMode="SCROLLVIEW"
          zIndex={2000}
          zIndexInverse={2000}
        />
      </View>
    </View>

    {!!affectedDevices.length && (
      <>
        <View style={styles.section}>
          <View style={styles.devicesHeader}>
            <Text style={styles.subTitle}>Devices Affected</Text>
            {!!formatRemaining() && <Text style={styles.timerText}>{formatRemaining()}</Text>}
          </View>
          {affectedDevices.map((item, idx) => (
            <View key={idx} style={styles.deviceBox}>
              {getIcon(item.device) && renderIcon(getIcon(item.device), 30, colors.text)}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.deviceText}>{item.device.replace(/_/g, ' ')}</Text>
                <Text style={styles.roomText}>{roomNames[item.room] ?? item.room.replace(/_/g, ' ')}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveDevice(idx)}>
                <Text style={{ color: colors.link, fontSize: 26 }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.subTitle}>Inactivity Timer</Text>
          <DropDownPicker
            open={durationOpen}
            value={selectedDuration}
            items={durationOptions}
            setOpen={setDurationOpen}
            setValue={v => {
              setSelectedDuration(v);
              setDurationConfirmed(v !== 'Other');
            }}
            setItems={() => {}}
            placeholder={getDurationPlaceholder()}
            style={styles.dropdownStyle}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            listMode="SCROLLVIEW"
            zIndex={1000}
            zIndexInverse={3000}
          />

          {selectedDuration === 'Other' && (
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
              <Text style={{ fontSize: 18, color: '#ccc', marginHorizontal: 4 }}>:</Text>
              <TextInput
                placeholder="MM"
                placeholderTextColor="#555"
                value={customMinute}
                onChangeText={setCustomMinute}
                keyboardType="numeric"
                maxLength={2}
                style={styles.timeInput}
              />
              <TouchableOpacity
  onPress={() => {
    const hh = parseInt(customHour) || 0;
    const mm = parseInt(customMinute) || 0;
    if (hh === 0 && mm === 0) return;
    setSelectedDuration(`${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`);
    setDurationConfirmed(true);
  }}
  style={styles.iconBtn}
>
  <MaterialCommunityIcons name="check" size={20} color="white" />
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    setCustomHour('');
    setCustomMinute('');
    setSelectedDuration(null);
    setDurationConfirmed(false);
  }}
  style={styles.iconBtn}
>
  <MaterialCommunityIcons name="close" size={20} color="white" />
</TouchableOpacity>
            </View>
          )}
        </View>

        {durationConfirmed && (
          <View style={styles.buttonRow}>
            <Button text="Save" onPress={handleSave} buttonStyle={styles.button} />
            <Button text="Wake Up All" onPress={handleWakeAll} buttonStyle={styles.button} />
          </View>
        )}
      </>
    )}
  </>
)}
      </ScrollView>
      <View style={styles.bottomBarContainer}>
        <BottomBar />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, padding: 16 },
  topFixed: { padding: 8, backgroundColor: colors.primary, zIndex: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 25, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 18, color: colors.link, marginBottom: 8 },
  toggleWrapper: { backgroundColor: colors.secondary, borderRadius: 10, padding: 12, marginBottom: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 18, color: colors.text, fontWeight: '600' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, zIndex: 100 },
  pickerWrapper: { flex: 1, zIndex: 100 },
  dropdownStyle: { backgroundColor: colors.secondary, borderColor: colors.text, borderWidth: 1, borderRadius: 8 },
  dropdownContainer: { backgroundColor: colors.primary, borderColor: colors.text },
  dropdownText: { fontSize: 16, fontWeight: '700', color: colors.text },
  section: { marginTop: 10, marginBottom: 7, zIndex: 10 },
  subTitle: { fontSize: 20, fontWeight: '700', color: colors.text  },
  devicesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timerText: { fontSize: 18, fontWeight: '700', color: colors.link },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  timeInput: {backgroundColor: colors.secondary, borderColor: colors.text,borderWidth: 1,borderRadius: 8,padding: 10,color: colors.text,width: 60,textAlign: 'center',},
  iconBtn: {marginLeft: 10,width: 36,height: 36,borderRadius: 18,backgroundColor: colors.accent,justifyContent: 'center',alignItems: 'center',},
  deviceBox: { flexDirection: 'row',alignItems: 'center',backgroundColor: colors.secondary,borderRadius: 8,padding: 12,borderWidth: 1,borderColor: colors.text,marginBottom: 10,},
  deviceText: { fontSize: 16, fontWeight: '700', color: colors.text },
  roomText: { fontSize: 14, color: colors.link },
  button: { width: '40%' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 50, marginBottom: 20 },
  bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});

export default SleepMode;
