import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../components/button';
import DeviceCounter from '../components/deviceCounter';
import { useDevice } from '../context/DeviceContext';
import colors from '../contants/colors';
import { ROOM_TYPES, APPLIANCES } from '../contants/data.js';

const HomeProfile = () => {
  const navigation = useNavigation();
  const { setSelectedDevices } = useDevice();
  const [roomCount, setRoomCount] = useState('');
  const [roomTypeQuantities, setRoomTypeQuantities] = useState({});
  const [allRooms, setAllRooms] = useState([]);
  const [roomNames, setRoomNames] = useState({});
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomAppliances, setRoomAppliances] = useState({});
  const [customAppliances, setCustomAppliances] = useState({});

  useEffect(() => {
    const rooms = [];
    Object.entries(roomTypeQuantities).forEach(([roomType, qty]) => {
      for (let i = 1; i <= qty; i++) {
        const defaultName = `${roomType} ${i}`;
        rooms.push({
          id: `${roomType}_${i}`,
          defaultName,
          name: roomNames[`${roomType}_${i}`] || defaultName,
        });
      }
    });

    setAllRooms(rooms);

    const validRoomIds = rooms.map(r => r.id);
    setSelectedRooms(prev => prev.filter(rid => validRoomIds.includes(rid)));

    setRoomAppliances(prev => {
      const cleaned = {};
      validRoomIds.forEach(id => {
        if (prev[id]) cleaned[id] = prev[id];
      });
      return cleaned;
    });

    setCustomAppliances(prev => {
      const cleaned = {};
      validRoomIds.forEach(id => {
        if (prev[id]) cleaned[id] = prev[id];
      });
      return cleaned;
    });
  }, [roomTypeQuantities, roomNames]);

  const handleRoomCountChange = text => {
    const numeric = text.replace(/[^0-9]/g, '');
    setRoomCount(numeric);
    setRoomTypeQuantities({});
    setRoomNames({});
    setSelectedRooms([]);
    setRoomAppliances({});
    setCustomAppliances({});
  };

  const getTotalRoomTypes = () =>
    Object.values(roomTypeQuantities).reduce((a, b) => a + b, 0);

  const changeQuantity = (roomType, delta) => {
    setRoomTypeQuantities(prev => {
      const current = prev[roomType] || 0;
      const newQty = Math.max(current + delta, 0);
      const totalExclCurrent = getTotalRoomTypes() - current;
      if (totalExclCurrent + newQty > Number(roomCount)) {
        Alert.alert('Limit Exceeded', `You can only have ${roomCount} rooms.`);
        return prev;
      }
      return { ...prev, [roomType]: newQty };
    });
  };

  const toggleRoom = id => {
    setSelectedRooms(prev => {
      const exists = prev.includes(id);
      const newList = exists ? prev.filter(r => r !== id) : [...prev, id];
      if (newList.length > Number(roomCount)) {
        Alert.alert('Limit Reached', `Select only ${roomCount} rooms.`);
        return prev;
      }
      if (exists) {
        const { [id]: _, ...rest } = roomAppliances;
        const { [id]: __, ...customRest } = customAppliances;
        setRoomAppliances(rest);
        setCustomAppliances(customRest);
      }
      return newList;
    });
  };

  const updateRoomName = (id, newName) => {
    setRoomNames(prev => ({ ...prev, [id]: newName }));
  };

  const updateDeviceCount = (roomId, app, delta) => {
    setRoomAppliances(prev => {
      const currCount = prev[roomId]?.[app] || 0;
      const newCount = Math.max(currCount + delta, 0);
      return {
        ...prev,
        [roomId]: {
          ...prev[roomId],
          [app]: newCount,
        },
      };
    });
  };

  // Optimized function to add a new custom appliance input
  const addCustomAppliance = useCallback(roomId => {
    setCustomAppliances(prev => {
      const currentList = prev[roomId] || [];
      const hasIncompleteInput = currentList.some(item =>
        typeof item === 'string' ? item.trim() === '' : item.name.trim() === '',
      );

      if (hasIncompleteInput) {
        Alert.alert(
          'Complete Current Input',
          'Please complete the current custom appliance name before adding another.',
        );
        return prev;
      }

      // Create a unique object with stable ID
      const newItem = {
        id: `${roomId}_${Date.now()}_${Math.random()}`,
        name: '',
        isEditing: true,
      };

      return {
        ...prev,
        [roomId]: [...currentList, newItem],
      };
    });
  }, []);

  // Optimized function to remove a custom appliance
  const removeCustomAppliance = useCallback((roomId, itemId) => {
    setCustomAppliances(prev => {
      const currentList = prev[roomId] || [];
      const itemToRemove = currentList.find(item =>
        typeof item === 'string' ? false : item.id === itemId,
      );

      const newList = currentList.filter(item =>
        typeof item === 'string' ? true : item.id !== itemId,
      );

      if (
        itemToRemove &&
        itemToRemove.name &&
        itemToRemove.name.trim() !== ''
      ) {
        setRoomAppliances(prevAppliances => {
          const roomApps = prevAppliances[roomId] || {};
          const { [itemToRemove.name]: _, ...rest } = roomApps;
          return {
            ...prevAppliances,
            [roomId]: rest,
          };
        });
      }

      return {
        ...prev,
        [roomId]: newList,
      };
    });
  }, []);

  // Optimized function to update custom appliance name with debouncing
  const updateCustomApplianceName = useCallback((roomId, itemId, newName) => {
    setCustomAppliances(prev => {
      const currentList = [...(prev[roomId] || [])];
      const itemIndex = currentList.findIndex(item =>
        typeof item === 'string' ? false : item.id === itemId,
      );

      if (itemIndex !== -1) {
        currentList[itemIndex] = {
          ...currentList[itemIndex],
          name: newName,
        };
      }

      return {
        ...prev,
        [roomId]: currentList,
      };
    });
  }, []);

  // Function to finish editing a custom appliance
  const finishCustomAppliance = useCallback((roomId, itemId) => {
    setCustomAppliances(prev => {
      const currentList = [...(prev[roomId] || [])];
      const itemIndex = currentList.findIndex(item =>
        typeof item === 'string' ? false : item.id === itemId,
      );

      if (itemIndex !== -1) {
        const item = currentList[itemIndex];
        if (item.name.trim() === '') {
          currentList.splice(itemIndex, 1);
        } else {
          currentList[itemIndex] = {
            ...item,
            isEditing: false,
          };
        }
      }

      return {
        ...prev,
        [roomId]: currentList,
      };
    });
  }, []);

  const handleNext = () => {
    const missing = selectedRooms.filter(
      id =>
        !roomAppliances[id] ||
        Object.values(roomAppliances[id]).every(c => c === 0),
    );
    if (missing.length) {
      const names = missing.map(id => roomNames[id]).join(', ');
      Alert.alert(
        'Missing Appliances',
        `Add at least one appliance for: ${names}`,
      );
      return;
    }

    // Check for empty custom appliances
    const hasEmptyCustom = selectedRooms.some(roomId => {
      const customList = customAppliances[roomId] || [];
      return customList.some(item => {
        const name = typeof item === 'string' ? item : item.name;
        return name.trim() === '';
      });
    });

    if (hasEmptyCustom) {
      Alert.alert(
        'Incomplete Custom Appliances',
        'Please complete all custom appliance names or remove empty ones.',
      );
      return;
    }

    const updatedRoomAppliances = { ...roomAppliances };
    selectedRooms.forEach(roomId => {
      if (customAppliances[roomId]) {
        customAppliances[roomId].forEach(item => {
          const name = typeof item === 'string' ? item : item.name;
          if (name.trim() !== '') {
            if (!updatedRoomAppliances[roomId]) {
              updatedRoomAppliances[roomId] = {};
            }
            if (!updatedRoomAppliances[roomId][name]) {
              updatedRoomAppliances[roomId][name] = 0;
            }
          }
        });
      }
    });

    setSelectedDevices({
      roomCount,
      roomTypeQuantities,
      roomNames,
      selectedRooms,
      roomAppliances: updatedRoomAppliances,
    });
    navigation.navigate('Confirmation');
  };

  const canShowTypes = roomCount > 0;
  const canShowRooms =
    canShowTypes && getTotalRoomTypes() === Number(roomCount);
  const canShowAppliances = canShowRooms && selectedRooms.length > 0;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Home Profile</Text>
      <Text style={styles.subtitle}>
        A few details about your rooms and appliances.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>How many rooms?</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={roomCount}
          onChangeText={handleRoomCountChange}
          placeholder="e.g., 3"
          placeholderTextColor={colors.link}
        />
      </View>

      {canShowTypes && (
        <View style={styles.card}>
          <Text style={styles.label}>Room Types</Text>
          {ROOM_TYPES.map(roomType => (
            <View key={roomType.label} style={styles.typeRow}>
              <View style={styles.roomTypeWithIcon}>
                <MaterialCommunityIcons
                  name={roomType.icon}
                  size={22}
                  color="black"
                />
                <Text style={styles.roomTypeLabel}>{roomType.label}</Text>
              </View>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  onPress={() => changeQuantity(roomType.label, -1)}
                  style={styles.counterBtn}
                >
                  <Text style={styles.counterText}>–</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>
                  {roomTypeQuantities[roomType.label] || 0}
                </Text>
                <TouchableOpacity
                  onPress={() => changeQuantity(roomType.label, +1)}
                  style={styles.counterBtn}
                >
                  <Text style={styles.counterText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <Text style={styles.hint}>
            Total types: {getTotalRoomTypes()}/{roomCount}
          </Text>
        </View>
      )}

      {canShowRooms && (
        <View style={styles.card}>
          <Text style={styles.label}>Choose Rooms & Rename</Text>
          {allRooms.map(r => (
            <View key={r.id} style={styles.roomContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => toggleRoom(r.id)}
              >
                <Text
                  style={{
                    ...styles.checkbox,
                    backgroundColor: selectedRooms.includes(r.id)
                      ? colors.accent
                      : colors.secondary,
                  }}
                >
                  ✓
                </Text>
                <Text style={styles.roomDefaultText}>{r.defaultName}</Text>
              </TouchableOpacity>
              {selectedRooms.includes(r.id) && (
                <TextInput
                  style={styles.roomNameInput}
                  placeholder="Enter room name"
                  placeholderTextColor={colors.link}
                  value={roomNames[r.id] || ''}
                  onChangeText={text => updateRoomName(r.id, text)}
                />
              )}
            </View>
          ))}
        </View>
      )}

      {canShowAppliances && (
        <View style={styles.card}>
          <Text style={styles.label}>Appliances per Room</Text>
          {selectedRooms.map(id => (
            <View key={id} style={styles.roomApplianceContainer}>
              <Text style={styles.roomApplianceTitle}>
                {roomNames[id] || id}
              </Text>

              {/* All Appliances Grid - Default + Custom */}
              <View style={styles.applianceGrid}>
                {/* Default Appliances */}
                {APPLIANCES.filter(app => app.label !== 'Others').map(
                  appliance => (
                    <DeviceCounter
                      key={appliance.label}
                      label={appliance.label}
                      icon={appliance.icon}
                      count={roomAppliances[id]?.[appliance.label] || 0}
                      onIncrement={() =>
                        updateDeviceCount(id, appliance.label, +1)
                      }
                      onDecrement={() =>
                        updateDeviceCount(id, appliance.label, -1)
                      }
                    />
                  ),
                )}

                {/* Custom Appliances (only show completed ones with content) */}
                {(customAppliances[id] || [])
                  .filter(item => {
                    const name = typeof item === 'string' ? item : item.name;
                    return (
                      name.trim() !== '' &&
                      (typeof item === 'string' || !item.isEditing)
                    );
                  })
                  .map((item, displayIndex) => {
                    const name = typeof item === 'string' ? item : item.name;
                    const itemId =
                      typeof item === 'string'
                        ? `legacy_${displayIndex}`
                        : item.id;

                    return (
                      <View
                        key={`${id}_custom_${itemId}`}
                        style={styles.customApplianceInGrid}
                      >
                        <DeviceCounter
                          label={name}
                          count={roomAppliances[id]?.[name] || 0}
                          onIncrement={() => updateDeviceCount(id, name, +1)}
                          onDecrement={() => updateDeviceCount(id, name, -1)}
                        />
                        <TouchableOpacity
                          style={styles.removeCustomBtn}
                          onPress={() => {
                            setCustomAppliances(prev => {
                              const currentList = prev[id] || [];
                              const newList = currentList.filter(listItem => {
                                if (typeof listItem === 'string') {
                                  return listItem !== name;
                                }
                                return listItem.name !== name;
                              });
                              return { ...prev, [id]: newList };
                            });

                            setRoomAppliances(prevAppliances => {
                              const roomApps = prevAppliances[id] || {};
                              const { [name]: _, ...rest } = roomApps;
                              return {
                                ...prevAppliances,
                                [id]: rest,
                              };
                            });
                          }}
                        ></TouchableOpacity>
                      </View>
                    );
                  })}
              </View>

              {/* Add Custom Appliance Section */}
              <View style={styles.addCustomSection}>
                <TouchableOpacity
                  style={styles.addCustomBtn}
                  onPress={() => addCustomAppliance(id)}
                >
                  <Text style={styles.addCustomBtnText}>
                    + Add Custom Appliance
                  </Text>
                </TouchableOpacity>

                {/* Show input fields for empty custom appliances */}
                {(customAppliances[id] || [])
                  .filter(item => typeof item !== 'string' && item.isEditing)
                  .map(item => (
                    <View
                      key={`input_${item.id}`}
                      style={styles.customInputContainer}
                    >
                      <View style={styles.customInputRow}>
                        <TextInput
                          placeholder="Enter custom appliance name"
                          placeholderTextColor={colors.link}
                          style={[styles.roomNameInput, { flex: 1 }]}
                          value={item.name}
                          onChangeText={text =>
                            updateCustomApplianceName(id, item.id, text)
                          }
                          multiline={false}
                          returnKeyType="done"
                          autoFocus={true}
                          onBlur={() => finishCustomAppliance(id, item.id)}
                          onSubmitEditing={() =>
                            finishCustomAppliance(id, item.id)
                          }
                          blurOnSubmit={true}
                        />
                        <TouchableOpacity
                          style={styles.finishBtn}
                          onPress={() => finishCustomAppliance(id, item.id)}
                        >
                          <Text style={styles.finishBtnText}>✓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => removeCustomAppliance(id, item.id)}
                        >
                          <Text style={styles.removeBtnText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {canShowAppliances && (
        <View style={styles.buttonContainer}>
          <Button text="Next" onPress={handleNext} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 20,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.link,
    marginVertical: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.secondary,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    color: colors.text,
    fontSize: 16,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomTypeLabel: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '500',
  },
  counterRow: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.primary,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  counterText: {
    fontSize: 18,
    color: colors.text,
  },
  counterValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.link,
    fontStyle: 'italic',
    marginTop: 8,
  },
  roomContainer: { marginBottom: 15 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 24,
    height: 24,
    marginRight: 10,
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 4,
    color: '#000',
  },
  roomDefaultText: { fontSize: 16, color: colors.text },
  roomNameInput: {
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
    color: colors.text,
  },
  roomApplianceContainer: {
    marginBottom: 15,
  },
  roomApplianceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  applianceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  customApplianceInGrid: {
    position: 'relative',
    marginBottom: 10,
  },
  addCustomSection: {
    marginTop: 10,
  },
  addCustomBtn: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  addCustomBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  customInputContainer: {
    marginBottom: 10,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  finishBtn: {
    backgroundColor: colors.accent,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  finishBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeBtn: {
    backgroundColor: colors.accent,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  roomTypeWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomTypeLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: colors.text,
  },
});

export default HomeProfile;
