import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import DropDownPicker from 'react-native-dropdown-picker';
import BottomBar from '../components/bottomBar';
import colors from '../contants/colors';
import Button from '../components/button';
import { APPLIANCES, ROOM_TYPES, renderIcon } from '../contants/data';
import { NativeModules } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
const { AlertSound } = NativeModules;

const soundTypes = ['Beep', 'Buzz'];
const alertTimings = ['30 seconds', '1 minute', '2 minutes', '5 minutes', '10 minutes'];

const AlertSystem = () => {
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomNames, setRoomNames] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [affectedDevices, setAffectedDevices] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [roomAppliances, setRoomAppliances] = useState({});
  const [deviceTimers, setDeviceTimers] = useState({});
  const [deviceAlertSettings, setDeviceAlertSettings] = useState({});
  const [showTimerInput, setShowTimerInput] = useState({});
  const [customHour, setCustomHour] = useState('');
  const [customMinute, setCustomMinute] = useState('');
  const [currentDeviceKey, setCurrentDeviceKey] = useState(null);
  const [deviceAlertTriggered, setDeviceAlertTriggered] = useState({});


  // Auto-save whenever important alert states change
useEffect(() => {
  const saveSettings = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      const settings = {
        alertEnabled,
        affectedDevices,
        deviceTimers,
        deviceAlertSettings,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('AlertSettings').doc(userId).set(settings, { merge: true });
      console.log("✅ Auto-saved alert settings");
    } catch (error) {
      console.error("❌ Error auto-saving alert settings:", error);
    }
  };

  saveSettings();
}, [alertEnabled, affectedDevices, deviceTimers, deviceAlertSettings]);


  const getCountValue = deviceData => {
    if (typeof deviceData === 'number') return deviceData;
    if (typeof deviceData === 'object' && deviceData !== null) {
      if (typeof deviceData.count === 'number') return deviceData.count;
      if (
        typeof deviceData.count === 'object' &&
        deviceData.count !== null &&
        typeof deviceData.count.actualCount === 'number'
      ) {
        return deviceData.count.actualCount;
      }
    }
    return 0;
  };

  const getRoomIcon = roomId => {
    const roomType = roomId.split('_')[0];
    const roomTypeData = ROOM_TYPES.find(rt => rt.label === roomType);
    return roomTypeData ? roomTypeData.icon : null;
  };

  const formatTimer = timeInMs => {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const getAlertTimeInMs = alertTiming => {
    switch (alertTiming) {
      case '30 seconds':
        return 30 * 1000;
      case '1 minute':
        return 60 * 1000;
      case '2 minutes':
        return 2 * 60 * 1000;
      case '5 minutes':
        return 5 * 60 * 1000;
      case '10 minutes':
        return 10 * 60 * 1000;
      default:
        return 60 * 1000;
    }
  };

  const playAlertSound = (soundType) => {
    if (soundType === 'Beep') {
      AlertSound.playBeep();
    } else if (soundType === 'Buzz') {
      AlertSound.playBuzz();
    }
  };

  useEffect(() => {
    const fetchHomeProfile = async () => {
      try {
        const uid = auth().currentUser?.uid;
        if (!uid) return;
        const doc = await firestore()
          .collection('UserHomeProfile')
          .doc(uid)
          .get();
        if (doc.exists) {
          const data = doc.data();
          const {
            selectedRooms,
            roomNames: names,
            roomAppliances: appliances,
          } = data;
          if (selectedRooms && selectedRooms.length > 0) {
            setRooms(selectedRooms);
            setRoomNames(names || {});
            setRoomAppliances(appliances || {});
          }
        }
      } catch (e) {
        console.error('Error fetching home profile:', e);
        Alert.alert('Error', 'Failed to load home profile data');
      }
    };
    fetchHomeProfile();
  }, []);

  useEffect(() => {
    const fetchAlertSettings = async () => {
      try {
        const uid = auth().currentUser?.uid;
        if (!uid) return;
        const doc = await firestore()
          .collection('AlertSettings')
          .doc(uid)
          .get();
        if (doc.exists) {
          const data = doc.data();
          setAlertEnabled(data.alertEnabled || false);
          setAffectedDevices(data.affectedDevices || []);
          setDeviceTimers(data.deviceTimers || {});
          setDeviceAlertSettings(data.deviceAlertSettings || {});
        }
      } catch (e) {
        console.error('Error fetching alert settings:', e);
      }
    };
    fetchAlertSettings();
  }, []);

  useEffect(() => {
    if (!selectedRoom || !roomAppliances[selectedRoom]) {
      setDeviceOptions([]);
      return;
    }
    const roomDevices = roomAppliances[selectedRoom];
    const deviceList = [];
    Object.entries(roomDevices).forEach(([deviceName, deviceData]) => {
      const count = getCountValue(deviceData);
      if (count > 0) {
        if (count === 1) {
          deviceList.push({
            label: deviceName.replace(/_/g, ' '),
            value: deviceName,
            originalName: deviceName,
          });
        } else {
          for (let i = 1; i <= count; i++) {
            deviceList.push({
              label: `${deviceName.replace(/_/g, ' ')} ${i}`,
              value: `${deviceName}_${i}`,
              originalName: deviceName,
            });
          }
        }
      }
    });
    setDeviceOptions(
      deviceList.length > 0
        ? deviceList
        : [{ label: 'No devices available', value: null, disabled: true }],
    );
    setSelectedDevice(null);
  }, [selectedRoom, roomAppliances]);

  const handleAddDevice = device => {
    if (
      device &&
      selectedRoom &&
      !affectedDevices.some(x => x.room === selectedRoom && x.device === device)
    ) {
      const deviceOption = deviceOptions.find(opt => opt.value === device);
      const originalName = deviceOption?.originalName || device;
      const deviceKey = `${selectedRoom}_${device}`;
      
      setAffectedDevices(prev => [
        ...prev,
        {
          room: selectedRoom,
          device: device,
          originalName: originalName,
          displayName: deviceOption?.label || device.replace(/_/g, ' '),
        },
      ]);

      // Set default alert settings for new device
      setDeviceAlertSettings(prev => ({
        ...prev,
        [deviceKey]: {
          alertTiming: '1 minute',
          soundType: 'Beep'
        }
      }));
    }
  };

  const handleRemoveDevice = index => {
    const deviceToRemove = affectedDevices[index];
    const deviceKey = `${deviceToRemove.room}_${deviceToRemove.device}`;
    
    setAffectedDevices(prev => prev.filter((_, idx) => idx !== index));
    
    // Remove timer and alert settings for this device
    setDeviceTimers(prev => {
      const updated = { ...prev };
      delete updated[deviceKey];
      return updated;
    });
    
    setDeviceAlertSettings(prev => {
      const updated = { ...prev };
      delete updated[deviceKey];
      return updated;
    });
    
    setDeviceAlertTriggered(prev => {
      const updated = { ...prev };
      delete updated[deviceKey];
      return updated;
    });
  };

  const handleSetDeviceTimer = (deviceKey, hours, minutes) => {
    const totalMinutes = (hours * 60) + minutes;
    const end = Date.now() + totalMinutes * 60000;
    setDeviceTimers(prev => ({ ...prev, [deviceKey]: end }));
    setShowTimerInput(prev => ({ ...prev, [deviceKey]: false }));
    setCustomHour('');
    setCustomMinute('');
    setCurrentDeviceKey(null);
    
    // Reset alert triggered status for this device
    setDeviceAlertTriggered(prev => ({ ...prev, [deviceKey]: false }));
  };

  const handleTimerConfirm = (deviceKey) => {
    const hours = parseInt(customHour) || 0;
    const minutes = parseInt(customMinute) || 0;
    
    if (hours === 0 && minutes === 0) {
      Alert.alert('Invalid input', 'Please enter at least 1 minute');
      return;
    }
    
    handleSetDeviceTimer(deviceKey, hours, minutes);
  };

  const handleTimerCancel = (deviceKey) => {
    setShowTimerInput(prev => ({ ...prev, [deviceKey]: false }));
    setCustomHour('');
    setCustomMinute('');
    setCurrentDeviceKey(null);
  };

  const updateDeviceAlertSetting = (deviceKey, setting, value) => {
    setDeviceAlertSettings(prev => ({
      ...prev,
      [deviceKey]: {
        ...prev[deviceKey],
        [setting]: value
      }
    }));
  };

  const getIcon = originalDeviceName => {
    const match = APPLIANCES.find(
      x => x.label.toLowerCase() === originalDeviceName.toLowerCase(),
    );
    return match?.icon || null;
  };

  const getRemainingTime = (deviceKey) => {
    const endTime = deviceTimers[deviceKey];
    if (!endTime) return null;
    
    const remaining = endTime - Date.now();
    if (remaining <= 0) return null;
    
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      Object.entries(deviceTimers).forEach(([deviceKey, endTime]) => {
        const remaining = endTime - now;
        const alertSettings = deviceAlertSettings[deviceKey] || { alertTiming: '1 minute', soundType: 'Beep' };
        const alertThreshold = getAlertTimeInMs(alertSettings.alertTiming);
        
        if (remaining <= 0) {
          // Timer finished - play final alert
          playAlertSound(alertSettings.soundType);
          
          // Remove timer
          setDeviceTimers(prev => {
            const updated = { ...prev };
            delete updated[deviceKey];
            return updated;
          });
          
          // Reset alert triggered status
          setDeviceAlertTriggered(prev => ({ ...prev, [deviceKey]: false }));
          
          // Show completion notification
          const device = affectedDevices.find(d => `${d.room}_${d.device}` === deviceKey);
          if (device) {
            Alert.alert('Timer Finished', `${device.displayName} timer has finished!`);
          }
        } else if (remaining <= alertThreshold && !deviceAlertTriggered[deviceKey]) {
          // Alert before timer ends
          playAlertSound(alertSettings.soundType);
          setDeviceAlertTriggered(prev => ({ ...prev, [deviceKey]: true }));
        }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [deviceTimers, deviceAlertSettings, deviceAlertTriggered, affectedDevices]);

  const handleReset = () => {
    setAlertEnabled(false);
    setSelectedRoom(null);
    setSelectedDevice(null);
    setAffectedDevices([]);
    setDeviceTimers({});
    setDeviceAlertSettings({});
    setShowTimerInput({});
    setCustomHour('');
    setCustomMinute('');
    setCurrentDeviceKey(null);
    setDeviceAlertTriggered({});
  };

  const handleSave = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const settings = {
        alertEnabled,
        affectedDevices,
        deviceTimers,
        deviceAlertSettings,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('AlertSettings').doc(userId).set(settings);
      Alert.alert('Success', 'Your alert settings have been saved successfully!');
    } catch (error) {
      console.error('Error saving alert settings:', error);
      Alert.alert('Error', 'Failed to save alert settings. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.topFixed}>
          <Text style={styles.title}>Alert System</Text>
          <Text style={styles.subtitle}>
            Set individual timers and alerts for each device
          </Text>
        </View>
        
        <View style={styles.toggleWrapper}>
          <View style={styles.toggleRow}>
            <Text style={styles.label}>Sound Alert Mode</Text>
            <Switch
              value={alertEnabled}
              onValueChange={v => {
                setAlertEnabled(v);
                if (!v) handleReset();
              }}
              trackColor={{ false: '#d3d3d3', true: '#d2aa6d' }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        {alertEnabled && (
          <>
            {rooms.length === 0 && (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No rooms found</Text>
                <Text style={styles.noDataSubtext}>
                  Please complete your home setup first in the Confirmation page
                </Text>
              </View>
            )}

            {rooms.length > 0 && (
              <View style={styles.topRow}>
                <View style={[styles.pickerWrapper, { marginRight: 12 }]}>
                  <DropDownPicker
                    open={roomDropdownOpen}
                    value={selectedRoom}
                    items={rooms.map(r => ({
                      label: roomNames[r] || r.replace(/_/g, ' '),
                      value: r,
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
            )}

            {affectedDevices.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.devicesTitle}>Devices To Monitor</Text>
                {affectedDevices.map((item, index) => {
                  const deviceKey = `${item.room}_${item.device}`;
                  const isShowingInput = showTimerInput[deviceKey];
                  const remainingTime = getRemainingTime(deviceKey);
                  const alertSettings = deviceAlertSettings[deviceKey] || { alertTiming: '1 minute', soundType: 'Beep' };
                  
                  return (
                    <View key={index} style={styles.deviceCard}>
                      <View style={styles.deviceHeader}>
                        <View style={styles.deviceIconContainer}>
                          {getIcon(item.originalName) &&
                            renderIcon(getIcon(item.originalName), 30, colors.text)}
                        </View>
                        <View style={styles.deviceInfo}>
                          <Text style={styles.deviceName}>{item.displayName}</Text>
                          <Text style={styles.deviceRoom}>
                            {roomNames[item.room] || item.room.replace(/_/g, ' ')}
                          </Text>
                          {remainingTime && (
                            <Text style={styles.timerDisplay}>
                              Time: {remainingTime}
                            </Text>
                          )}
                        </View>
                        
                        {isShowingInput ? (
                          <View style={styles.timeInputContainer}>
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
                              <Text style={styles.timeSeparator}>:</Text>
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
                                onPress={() => handleTimerConfirm(deviceKey)}
                                style={styles.iconBtn}
                              >
                                <MaterialCommunityIcons name="check" size={16} color="white" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleTimerCancel(deviceKey)}
                                style={styles.iconBtn}
                              >
                                <MaterialCommunityIcons name="close" size={16} color="white" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => {
                              setShowTimerInput(prev => ({ ...prev, [deviceKey]: true }));
                              setCurrentDeviceKey(deviceKey);
                            }}
                            style={styles.setTimerButton}
                          >
                            <Text style={styles.setTimerText}>Set Timer</Text>
                          </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity
                          onPress={() => handleRemoveDevice(index)}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {/* Individual Alert Settings for each device */}
                      <View style={styles.deviceAlertSettings}>
                        <SimpleDropdown
                          label="Alert Before Timer Ends"
                          value={alertSettings.alertTiming}
                          options={alertTimings}
                          onSelect={(value) => updateDeviceAlertSetting(deviceKey, 'alertTiming', value)}
                        />
                        <SimpleDropdown
                          label="Sound Type"
                          value={alertSettings.soundType}
                          options={soundTypes}
                          onSelect={(value) => updateDeviceAlertSetting(deviceKey, 'soundType', value)}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.buttonRow}>
              <Button
                text="Reset All"
                onPress={handleReset}
                buttonStyle={styles.button}
              />
              <Button
                text="Save"
                onPress={handleSave}
                buttonStyle={styles.button}
              />
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.bottomBarContainer}>
        <BottomBar />
      </View>
    </View>
  );
};

const SimpleDropdown = ({ label, value, options, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.dropdownWrapper}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <DropDownPicker
        open={open}
        value={value}
        items={options.map(o => ({ label: o, value: o }))}
        setOpen={setOpen}
        setValue={v => onSelect(v())}
        setItems={() => {}}
        placeholder={`Select ${label}`}
        style={styles.simpleDropdownStyle}
        dropDownContainerStyle={styles.simpleDropdownContainer}
        textStyle={styles.simpleDropdownText}
        listMode="SCROLLVIEW"
        zIndex={1000}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, padding: 16 },
  topFixed: { padding: 8, backgroundColor: colors.primary, zIndex: 2 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text , marginBottom: 6, marginTop: 10 },
  subtitle: { fontSize: 18, color: colors.link, marginBottom: 16 },
  toggleWrapper: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 18, color: colors.text, fontWeight: '600' },
  noDataContainer: {
    backgroundColor: colors.secondary,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  noDataSubtext: { fontSize: 14, color: colors.link, textAlign: 'center' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    zIndex: 100,
  },
  pickerWrapper: { flex: 1, zIndex: 100 },
  dropdownStyle: {
    backgroundColor: colors.secondary,
    borderColor: colors.text,
    borderWidth: 1,
    borderRadius: 8,
  },
  dropdownContainer: {
    backgroundColor: colors.primary,
    borderColor: colors.text,
  },
  dropdownText: { fontSize: 16, fontWeight: '700', color: colors.text },
  section: { marginTop: 10, marginBottom: 7, zIndex: 10 },
  devicesTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  deviceCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIconContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceInfo: { flex: 1 },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  deviceRoom: { fontSize: 14, color: colors.link, marginBottom: 4 },
  timerDisplay: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent || '#007AFF',
    fontFamily: 'monospace',
  },
  timeInputContainer: {
    marginRight: 8,
  },
  timeInputRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: colors.primary,
    borderColor: colors.text,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    color: colors.text,
    width: 40,
    textAlign: 'center',
    fontSize: 14,
  },
  timeSeparator: { 
    fontSize: 16, 
    color: colors.text, 
    marginHorizontal: 4 
  },
  iconBtn: {
    marginLeft: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent || '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setTimerButton: {
    padding: 8,
    backgroundColor: colors.accent || '#007AFF',
    borderRadius: 8,
    marginRight: 8,
  },
  setTimerText: { 
    color: 'white', 
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: { color: 'black', fontSize: 18, fontWeight: 'bold' },
  deviceAlertSettings: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.text + '20',
  },
  dropdownWrapper: { marginBottom: 12 },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  simpleDropdownStyle: {
    backgroundColor: colors.primary,
    borderColor: colors.text,
    borderWidth: 1,
    borderRadius: 6,
    minHeight: 40,
  },
  simpleDropdownContainer: {
    backgroundColor: colors.primary,
    borderColor: colors.text,
  },
  simpleDropdownText: { fontSize: 14, color: colors.text },
  button: { width: '40%' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 30,
    marginBottom: 20,
  },
  bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});

export default AlertSystem;