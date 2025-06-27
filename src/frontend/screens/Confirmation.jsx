import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDevice } from '../context/DeviceContext';
import Button from '../components/button';
import { useNavigation } from '@react-navigation/native';
import colors from '../contants/colors';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { ROOM_TYPES, APPLIANCES } from '../contants/data.js';

const Confirmation = () => {
  const { selectedDevices, setSelectedDevices } = useDevice();
  const navigation = useNavigation();

  const { roomCount, selectedRooms, roomAppliances, roomNames } =
    selectedDevices || {};

  const getRoomIcon = roomId => {
    const roomType = roomId.split('_')[0];
    const roomTypeData = ROOM_TYPES.find(rt => rt.label === roomType);
    return roomTypeData ? roomTypeData.icon : null;
  };

  const getApplianceIcon = applianceName => {
    const applianceData = APPLIANCES.find(app => app.label === applianceName);
    return applianceData ? applianceData.icon : null;
  };

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

  const validateAppliances = () => {
    if (!roomAppliances || Object.keys(roomAppliances).length === 0) {
      return {
        isValid: false,
        message:
          'Please add at least one appliance to any room before proceeding.',
      };
    }

    const roomsWithoutAppliances = [];
    selectedRooms?.forEach(roomId => {
      const roomDevices = roomAppliances[roomId];
      if (!roomDevices || Object.keys(roomDevices).length === 0) {
        const displayName = roomNames?.[roomId] || roomId;
        roomsWithoutAppliances.push(displayName);
      } else {
        const hasValidAppliances = Object.values(roomDevices).some(device => {
          return getCountValue(device) > 0;
        });
        if (!hasValidAppliances) {
          const displayName = roomNames?.[roomId] || roomId;
          roomsWithoutAppliances.push(displayName);
        }
      }
    });

    if (roomsWithoutAppliances.length > 0) {
      return {
        isValid: false,
        message: `The following rooms don't have any appliances: ${roomsWithoutAppliances.join(
          ', ',
        )}. Please add appliances to all rooms before proceeding.`,
      };
    }

    return { isValid: true };
  };

  const sanitizeForFirestore = obj => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') {
      if (typeof obj === 'function' || typeof obj === 'symbol') return null;
      if (typeof obj === 'number' && (!isFinite(obj) || isNaN(obj))) return 0;
      return obj;
    }
    if (Array.isArray(obj)) {
      const sanitizedArray = obj
        .map(item => sanitizeForFirestore(item))
        .filter(item => item !== null && item !== undefined);
      return sanitizedArray.length > 0 ? sanitizedArray : [];
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof key !== 'string' ||
        key.startsWith('_') ||
        key.includes('.') ||
        key.includes('$')
      )
        continue;
      const sanitizedValue = sanitizeForFirestore(value);
      if (sanitizedValue !== null && sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    }
    return sanitized;
  };

  const handleConfirm = async () => {
    const validation = validateAppliances();
    if (!validation.isValid) {
      Alert.alert('Incomplete Setup', validation.message);
      return;
    }

    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return Alert.alert('Error', 'User not logged in.');

      const rawUserHomeData = {
        roomCount: roomCount || '0',
        selectedRooms: selectedRooms || [],
        roomAppliances: roomAppliances || {},
        roomNames: roomNames || {},
      };

      const userHomeData = sanitizeForFirestore(rawUserHomeData);
      userHomeData.createdAt = firestore.FieldValue.serverTimestamp();

      await firestore()
        .collection('UserHomeProfile')
        .doc(userId)
        .set(userHomeData);
      Alert.alert('Success', 'Your home profile has been saved successfully.');
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Error', `Failed to save home profile: ${error.message}`);
    }
  };

  const handleRemoveAppliance = (room, device) => {
    try {
      const updatedRoomAppliances = { ...roomAppliances };
      const current = updatedRoomAppliances?.[room]?.[device];

      if (current !== undefined) {
        const count = getCountValue(current);

        if (count > 1) {
          if (typeof current === 'number') {
            updatedRoomAppliances[room][device] = count - 1;
          } else if (typeof current === 'object' && current !== null) {
            const newValue = { ...current };
            if (typeof current.count === 'number') {
              newValue.count = count - 1;
            } else if (
              typeof current.count === 'object' &&
              current.count !== null
            ) {
              newValue.count = { ...current.count, actualCount: count - 1 };
            }
            updatedRoomAppliances[room][device] = newValue;
          }
        } else {
          delete updatedRoomAppliances[room][device];
        }

        // Clean up empty room
        if (Object.keys(updatedRoomAppliances[room]).length === 0) {
          delete updatedRoomAppliances[room];
        }

        setSelectedDevices({
          ...selectedDevices,
          roomAppliances: updatedRoomAppliances,
        });
      }
    } catch (error) {
      console.error('Error removing appliance:', error);
      Alert.alert('Error', 'Failed to remove appliance. Please try again.');
    }
  };

  const validation = validateAppliances();
  const canProceed = validation.isValid;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Confirmation</Text>
      <Text style={styles.subtitle}>
        Please review your home details below:
      </Text>

      {!canProceed && (
        <View style={styles.warningContainer}>
          <MaterialIcons
            name="warning"
            size={20}
            color={colors.error || '#FF6B6B'}
          />
          <Text style={styles.warningText}>{validation.message}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Total Rooms: {String(roomCount)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selected Rooms</Text>
        {selectedRooms?.map(roomId => {
          const roomName = roomNames?.[roomId] || roomId;
          const roomIconName = getRoomIcon(roomId);
          const roomDevices = roomAppliances?.[roomId];
          const hasAppliances =
            roomDevices &&
            Object.keys(roomDevices).length > 0 &&
            Object.values(roomDevices).some(
              device => getCountValue(device) > 0,
            );

          return (
            <View
              key={roomId}
              style={[
                styles.roomItem,
                !hasAppliances && styles.roomItemWarning,
              ]}
            >
              {roomIconName && (
                <MaterialCommunityIcons
                  name={roomIconName}
                  size={20}
                  color={
                    hasAppliances ? colors.text : colors.error || '#FF6B6B'
                  }
                />
              )}
              <Text
                style={[
                  styles.textItem,
                  !hasAppliances && styles.textItemWarning,
                  !roomIconName && styles.textItemNoIcon,
                ]}
              >
                {roomName}
                {!hasAppliances && ' (No appliances)'}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appliances Per Room</Text>
        {roomAppliances && Object.keys(roomAppliances).length > 0 ? (
          Object.entries(roomAppliances).map(([room, devices]) => (
            <View key={room} style={styles.roomBlock}>
              <View style={styles.roomTitleContainer}>
                <Text style={styles.roomTitle}>
                  {roomNames?.[room] || room}
                </Text>
              </View>
              <View style={styles.row}>
                {Object.entries(devices)
                  .filter(([_, data]) => getCountValue(data) > 0)
                  .map(([device, data]) => {
                    const count = getCountValue(data);
                    const iconName = getApplianceIcon(device);

                    return (
                      <View key={device} style={styles.deviceBadge}>
                        {iconName && (
                          <MaterialCommunityIcons
                            name={iconName}
                            size={16}
                            color={colors.text}
                            style={styles.deviceIcon}
                          />
                        )}
                        <Text
                          style={[
                            styles.deviceText,
                            !iconName && styles.deviceTextNoIcon,
                          ]}
                        >
                          {device} - {count}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveAppliance(room, device)}
                          style={styles.removeButton}
                        >
                          <View
                            style={{
                              position: 'absolute',
                              top: -22,
                              right: -10,
                              zIndex: 1,
                            }}
                          >
                            <View
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 12,
                                backgroundColor: 'white',
                                borderColor: 'black',
                                borderWidth: 0.5,
                                justifyContent: 'center',
                                alignItems: 'center',
                                elevation: 3,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.3,
                                shadowRadius: 2,
                              }}
                            >
                              <MaterialIcons
                                name="close"
                                size={12}
                                color="black"
                              />
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noAppliancesContainer}>
            <MaterialIcons
              name="devices-off"
              size={40}
              color={colors.textSecondary || '#999'}
            />
            <Text style={styles.noAppliancesText}>No appliances added yet</Text>
            <Text style={styles.noAppliancesSubtext}>
              Please go back and add appliances to your rooms
            </Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          text="   Confirm   "
          onPress={handleConfirm}
          disabled={!canProceed}
          style={!canProceed && styles.disabledButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  content: { padding: 20 },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.link,
    marginBottom: 20,
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBackground || '#FFE6E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.error || '#FF6B6B',
  },
  warningText: {
    fontSize: 14,
    color: colors.error || '#FF6B6B',
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginBottom: 20,
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 5,
  },
  roomItemWarning: { opacity: 0.7 },
  textItem: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  textItemNoIcon: {
    marginLeft: 0,
  },
  textItemWarning: {
    color: colors.error || 'red',
  },
  roomBlock: { marginBottom: 15 },
  roomTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  deviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  deviceIcon: { marginRight: 6 },
  deviceText: {
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  deviceTextNoIcon: {
    marginLeft: 0,
  },
  removeButton: { padding: 2 },
  noAppliancesContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noAppliancesText: {
    fontSize: 16,
    color: colors.textSecondary || '#999',
    marginTop: 10,
    fontWeight: '500',
  },
  noAppliancesSubtext: {
    fontSize: 14,
    color: colors.textSecondary || '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default Confirmation;
