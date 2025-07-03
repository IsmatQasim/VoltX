import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ROOM_TYPES, APPLIANCES } from '../contants/data';
import colors from '../contants/colors';
import Button from '../components/button';
import DeviceCounter from '../components/deviceCounter';

const EditHomeProfile = ({ navigation }) => {
  const [roomNames, setRoomNames] = useState({});
  const [roomAppliances, setRoomAppliances] = useState({});
  const [customAppliances, setCustomAppliances] = useState({});
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [showRoomTypeDropdown, setShowRoomTypeDropdown] = useState(false);
  const [showCustomRoomInput, setShowCustomRoomInput] = useState(false);
  const [newCustomAppliance, setNewCustomAppliance] = useState('');
  const [showCustomApplianceInput, setShowCustomApplianceInput] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasProfileData, setHasProfileData] = useState(false);
  const [editingRoomNames, setEditingRoomNames] = useState({});

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = auth().currentUser?.uid;
        if (!userId) {
          setLoading(false);
          setHasProfileData(false);
          return;
        }

        const [doc] = await Promise.all([
          firestore().collection('UserHomeProfile').doc(userId).get(),
          new Promise(resolve => setTimeout(resolve, 800)),
        ]);

        if (doc.exists) {
          const data = doc.data();

          if (!data) {
            setRoomNames({});
            setRoomAppliances({});
            setCustomAppliances({});
            setSelectedRooms([]);
            setHasProfileData(false);
            setLoading(false);
            return;
          }

          const roomNamesData = data.roomNames || {};
          const roomAppliancesData = data.roomAppliances || {};
          const customAppliancesData = data.customAppliances || {};
          const selectedRoomsData = data.selectedRooms || [];

          setRoomNames(roomNamesData);
          setRoomAppliances(roomAppliancesData);
          setCustomAppliances(customAppliancesData);
          setSelectedRooms(selectedRoomsData);

          const hasData =
            selectedRoomsData.length > 0 ||
            Object.keys(roomAppliancesData).length > 0 ||
            Object.keys(customAppliancesData).length > 0;
          setHasProfileData(hasData);
        } else {
          setRoomNames({});
          setRoomAppliances({});
          setCustomAppliances({});
          setSelectedRooms([]);
          setHasProfileData(false);
        }
      } catch (error) {
        console.error('Error loading home profile:', error);

        setRoomNames({});
        setRoomAppliances({});
        setCustomAppliances({});
        setSelectedRooms([]);
        setHasProfileData(false);
        if (error.code === 'permission-denied') {
          Alert.alert(
            'Access Denied',
            "You don't have permission to access this data. Please check your account settings.",
          );
        } else if (error.code === 'unavailable') {
          Alert.alert(
            'Service Unavailable',
            'Firebase service is temporarily unavailable. Please try again later.',
          );
        } else if (error.code === 'unauthenticated') {
          Alert.alert(
            'Authentication Error',
            'Please log in again to access your profile.',
          );
        } else {
          const isNetworkError =
            error.code === 'unavailable' ||
            error.message?.toLowerCase().includes('network') ||
            error.message?.toLowerCase().includes('connection') ||
            error.code === 'timeout';

          if (isNetworkError) {
            Alert.alert(
              'Connection Error',
              'Failed to load home profile. Please check your internet connection and try again.',
            );
          } else {
            Alert.alert(
              'Error',
              'Failed to load home profile. Please try again.',
            );
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const getAllRoomIds = () => {
    const roomIds = new Set();

    if (Array.isArray(selectedRooms)) {
      selectedRooms.forEach(roomId => roomIds.add(roomId));
    }

    if (roomAppliances && typeof roomAppliances === 'object') {
      Object.keys(roomAppliances).forEach(roomId => roomIds.add(roomId));
    }

    if (customAppliances && typeof customAppliances === 'object') {
      Object.keys(customAppliances).forEach(roomId => roomIds.add(roomId));
    }

    return Array.from(roomIds);
  };

  const getNextRoomNumber = roomType => {
    const allRoomIds = getAllRoomIds();
    const existingNumbers = allRoomIds
      .filter(id => id && id.startsWith(`${roomType}_`))
      .map(id => {
        const parts = id.split('_');
        const numberPart = parts[parts.length - 1];
        return parseInt(numberPart, 10);
      })
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    let nextNumber = 1;
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }

    return nextNumber;
  };

  const getRoomDisplayName = roomId => {
    if (!roomId) return 'Unnamed Room';

    const customName = roomNames?.[roomId];

    if (customName && customName.trim()) {
      return customName;
    }

    const parts = roomId.split('_');
    if (parts.length >= 2) {
      const roomType = parts.slice(0, -1).join(' ');
      const number = parts[parts.length - 1];

      if (!isNaN(parseInt(number, 10))) {
        return `${roomType.replace(/\b\w/g, l => l.toUpperCase())} ${number}`;
      }
    }

    let displayName = roomId.replace(/_/g, ' ');
    return displayName.replace(/\b\w/g, l => l.toUpperCase());
  };

  const toggleEdit = () => {
    if (!isEditing) {
      const initialEditingNames = {};
      const allRoomIds = getAllRoomIds();
      allRoomIds.forEach(roomId => {
        initialEditingNames[roomId] = getRoomDisplayName(roomId);
      });
      setEditingRoomNames(initialEditingNames);
    }
    setIsEditing(prev => !prev);
  };

  const handleRemoveRoom = roomId => {
    Alert.alert(
      'Remove Room',
      `Are you sure you want to delete "${getRoomDisplayName(roomId)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedRooms = { ...roomNames };
            const updatedAppliances = { ...roomAppliances };
            const updatedCustom = { ...customAppliances };
            const updatedSelected = selectedRooms.filter(id => id !== roomId);
            const updatedEditingNames = { ...editingRoomNames };

            delete updatedRooms[roomId];
            delete updatedAppliances[roomId];
            delete updatedCustom[roomId];
            delete updatedEditingNames[roomId];

            setRoomNames(updatedRooms);
            setRoomAppliances(updatedAppliances);
            setCustomAppliances(updatedCustom);
            setSelectedRooms(updatedSelected);
            setEditingRoomNames(updatedEditingNames);
          },
        },
      ],
    );
  };

  const handleApplianceChange = (
    roomId,
    appliance,
    delta,
    isCustom = false,
  ) => {
    const setState = isCustom ? setCustomAppliances : setRoomAppliances;

    setState(prev => {
      const safePrev = prev || {};
      const current = safePrev?.[roomId]?.[appliance] || 0;
      const newCount = Math.max(0, current + delta);
      const updated = { ...safePrev };

      if (!updated[roomId]) updated[roomId] = {};

      if (newCount > 0) {
        updated[roomId][appliance] = newCount;
      } else {
        delete updated[roomId][appliance];
        if (Object.keys(updated[roomId]).length === 0) {
          delete updated[roomId];
        }
      }

      return updated;
    });
  };

  const handleRoomTypeSelect = roomType => {
    setSelectedRoomType(roomType);
    setShowRoomTypeDropdown(false);

    if (roomType.label === 'Others') {
      setShowCustomRoomInput(true);
    } else {
      setShowCustomRoomInput(false);
      setNewRoomName('');
    }
  };

  const handleAddRoom = () => {
    if (!selectedRoomType) {
      Alert.alert('Error', 'Please select a room type.');
      return;
    }

    let roomId = '';
    let customRoomName = null;

    if (selectedRoomType.label === 'Others') {
      if (!newRoomName.trim()) {
        Alert.alert('Error', 'Please enter a custom room name.');
        return;
      }
      const roomName = newRoomName.trim();
      const roomTypeForId = roomName.replace(/\s+/g, '_');
      const nextNumber = getNextRoomNumber(roomTypeForId);
      roomId = `${roomTypeForId}_${nextNumber}`;
      customRoomName = roomName;
    } else {
      const roomTypeForId = selectedRoomType.label.replace(/\s+/g, '_');
      const nextNumber = getNextRoomNumber(roomTypeForId);
      roomId = `${roomTypeForId}_${nextNumber}`;
      customRoomName = null;
    }

    if (customRoomName) {
      setRoomNames(prev => ({ ...prev, [roomId]: customRoomName }));
    }

    setEditingRoomNames(prev => ({
      ...prev,
      [roomId]: getRoomDisplayName(roomId),
    }));
    setSelectedRooms(prev => [...(prev || []), roomId]);
    setSelectedRoomType(null);
    setNewRoomName('');
    setShowCustomRoomInput(false);
  };

  const handleAddCustomAppliance = roomId => {
    if (!newCustomAppliance.trim()) {
      Alert.alert('Error', 'Please enter an appliance name.');
      return;
    }

    const existsInStandard = APPLIANCES.some(
      appl =>
        appl.label.toLowerCase() === newCustomAppliance.trim().toLowerCase(),
    );

    const roomCustomAppliances = customAppliances?.[roomId] || {};
    const existsInCustom = Object.keys(roomCustomAppliances).some(
      appl => appl.toLowerCase() === newCustomAppliance.trim().toLowerCase(),
    );

    if (existsInStandard || existsInCustom) {
      Alert.alert('Error', 'This appliance already exists.');
      return;
    }

    setCustomAppliances(prev => ({
      ...prev,
      [roomId]: {
        ...(prev?.[roomId] || {}),
        [newCustomAppliance.trim()]: 0,
      },
    }));

    setNewCustomAppliance('');
    setShowCustomApplianceInput(prev => ({ ...prev, [roomId]: false }));
  };

  const handleSave = async () => {
    const allRoomIds = getAllRoomIds();

    if (allRoomIds.length === 0) {
      try {
        const userId = auth().currentUser?.uid;
        if (!userId) return;

        await firestore().collection('UserHomeProfile').doc(userId).delete();

        Alert.alert('Success', 'Profile updated successfully.');
        setIsEditing(false);
        setHasProfileData(false);
        return;
      } catch (error) {
        Alert.alert('Error', 'Failed to update profile.');
        return;
      }
    }

    const invalidRooms = allRoomIds.filter(roomId => {
      const appliances = roomAppliances?.[roomId];
      const customApps = customAppliances?.[roomId];
      const hasAppliances = appliances && Object.keys(appliances).length > 0;
      const hasCustomAppliances =
        customApps && Object.keys(customApps).length > 0;
      return !hasAppliances && !hasCustomAppliances;
    });

    if (invalidRooms.length > 0) {
      return Alert.alert(
        'Validation Error',
        `The following room(s) have no appliances:\n\n${invalidRooms
          .map(r => getRoomDisplayName(r))
          .join(', ')}.\n\nPlease add at least one appliance to each room.`,
      );
    }

    const updatedRoomNames = { ...roomNames };
    allRoomIds.forEach(roomId => {
      const editedName = editingRoomNames[roomId];
      const defaultName = getRoomDisplayName(roomId);

      if (editedName && editedName.trim() !== defaultName) {
        updatedRoomNames[roomId] = editedName.trim();
      } else if (editedName === defaultName) {
        delete updatedRoomNames[roomId];
      }
    });

    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;
      const roomCount = allRoomIds.length;

      await firestore()
        .collection('UserHomeProfile')
        .doc(userId)
        .set({
          roomNames: updatedRoomNames,
          roomAppliances: roomAppliances || {},
          customAppliances: customAppliances || {},
          selectedRooms: allRoomIds,
          roomCount: roomCount,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      setRoomNames(updatedRoomNames);
      Alert.alert('Success', 'Profile updated successfully.');
      setIsEditing(false);
      setHasProfileData(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleCreateProfile = () => {
    navigation.navigate('HomeProfile');
  };

  const getApplianceIcon = applianceName => {
    const appliance = APPLIANCES.find(appl => appl.label === applianceName);
    return appliance ? appliance.icon : '';
  };

  const renderApplianceRow = (
    appliance,
    count,
    roomId,
    isCustom = false,
    isLast = false,
  ) => (
    <View key={appliance}>
      <View style={styles.applianceRow}>
        <View style={styles.applianceInfo}>
          <View style={styles.applianceIconContainer}>
            <MaterialCommunityIcons
              name={isCustom ? '' : getApplianceIcon(appliance)}
              size={22}
              color={colors.text}
            />
          </View>
          <Text style={styles.applianceLabel}>{appliance}</Text>
        </View>

        {isEditing ? (
          <DeviceCounter
            label=""
            count={count}
            onIncrement={() =>
              handleApplianceChange(roomId, appliance, 1, isCustom)
            }
            onDecrement={() =>
              handleApplianceChange(roomId, appliance, -1, isCustom)
            }
          />
        ) : (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      {!isLast && <View style={styles.applianceSeparator} />}
    </View>
  );

  const renderApplianceGrid = (appliances, roomId, isCustom = false) => {
    const applianceItems = [];

    for (let i = 0; i < appliances.length; i += 2) {
      const leftAppliance = appliances[i];
      const rightAppliance = appliances[i + 1];

      applianceItems.push(
        <View key={`row-${i}`} style={styles.applianceGridRow}>
          <View style={styles.applianceGridItem}>
            <View style={styles.applianceHeader}>
              {!isCustom && (
                <MaterialCommunityIcons
                  name={getApplianceIcon(leftAppliance.label || leftAppliance)}
                  size={24}
                  color={colors.text}
                />
              )}
              <Text style={styles.gridApplianceLabel}>
                {leftAppliance.label || leftAppliance}
              </Text>
            </View>
            <DeviceCounter
              label=""
              count={
                isCustom
                  ? leftAppliance.count
                  : roomAppliances?.[roomId]?.[leftAppliance.label] || 0
              }
              onIncrement={() =>
                handleApplianceChange(
                  roomId,
                  leftAppliance.label || leftAppliance,
                  1,
                  isCustom,
                )
              }
              onDecrement={() =>
                handleApplianceChange(
                  roomId,
                  leftAppliance.label || leftAppliance,
                  -1,
                  isCustom,
                )
              }
            />
          </View>

          {rightAppliance && (
            <View style={styles.applianceGridItem}>
              <View style={styles.applianceHeader}>
                {!isCustom && (
                  <MaterialCommunityIcons
                    name={getApplianceIcon(
                      rightAppliance.label || rightAppliance,
                    )}
                    size={24}
                    color={colors.text}
                  />
                )}
                <Text style={styles.gridApplianceLabel}>
                  {rightAppliance.label || rightAppliance}
                </Text>
              </View>
              <DeviceCounter
                label=""
                count={
                  isCustom
                    ? rightAppliance.count
                    : roomAppliances?.[roomId]?.[rightAppliance.label] || 0
                }
                onIncrement={() =>
                  handleApplianceChange(
                    roomId,
                    rightAppliance.label || rightAppliance,
                    1,
                    isCustom,
                  )
                }
                onDecrement={() =>
                  handleApplianceChange(
                    roomId,
                    rightAppliance.label || rightAppliance,
                    -1,
                    isCustom,
                  )
                }
              />
            </View>
          )}
        </View>,
      );
    }

    return applianceItems;
  };

  const renderRoomTypeDropdown = () => (
    <Modal
      visible={showRoomTypeDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowRoomTypeDropdown(false)}
    >
      <TouchableOpacity
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => setShowRoomTypeDropdown(false)}
      >
        <View style={styles.dropdownContainer}>
          <FlatList
            data={ROOM_TYPES}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleRoomTypeSelect(item)}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={24}
                  color={colors.text}
                />
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading your home profile...</Text>
      </View>
    );
  }

  const allRoomIds = getAllRoomIds();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.heading}>
              {!hasProfileData
                ? 'Edit Home Profile'
                : isEditing
                ? 'Edit Home Profile'
                : 'View Home Profile'}
            </Text>
          </View>
        </View>
      </View>

      {!hasProfileData && !isEditing ? (
        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons
            name="home-outline"
            size={80}
            color={colors.link}
            style={styles.emptyStateIcon}
          />
          <Text style={styles.emptyStateTitle}>No Home Profile Found</Text>
          <Text style={styles.emptyStateMessage}>
            Start building your home profile by adding rooms and appliances to
            get personalized energy insights.
          </Text>
          <TouchableOpacity
            onPress={handleCreateProfile}
            style={styles.createProfileButton}
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={20}
              color="white"
            />
            <Text style={styles.createProfileButtonText}>
              Create Home Profile
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {isEditing && (
            <View style={styles.addRoomSection}>
              <View style={styles.addRoomHeader}>
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={24}
                  color={colors.text}
                />
                <Text style={styles.sectionTitle}>Add New Room</Text>
              </View>

              <View style={styles.newRoomContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowRoomTypeDropdown(true)}
                >
                  <View style={styles.dropdownButtonContent}>
                    {selectedRoomType ? (
                      <>
                        <MaterialCommunityIcons
                          name={selectedRoomType.icon}
                          size={20}
                          color={colors.text}
                        />
                        <Text style={styles.dropdownButtonText}>
                          {selectedRoomType.label}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.dropdownPlaceholder}>
                        Select Room Type
                      </Text>
                    )}
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color={colors.text}
                  />
                </TouchableOpacity>

                {showCustomRoomInput && (
                  <View style={styles.customRoomInputContainer}>
                    <TextInput
                      placeholder="Enter custom room name"
                      value={newRoomName}
                      onChangeText={setNewRoomName}
                      style={styles.customRoomInput}
                      placeholderTextColor={colors.link}
                    />
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleAddRoom}
                  style={styles.addRoomBtn}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="white" />
                  <Text style={styles.addRoomBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {renderRoomTypeDropdown()}

          {allRoomIds.map(roomId => {
            const standardAppliances = APPLIANCES.filter(appl => {
              const count = roomAppliances?.[roomId]?.[appl.label] || 0;
              return isEditing || count > 0;
            });

            const customAppliancesList = customAppliances?.[roomId]
              ? Object.entries(customAppliances[roomId])
                  .filter(([name, count]) => isEditing || count > 0)
                  .map(([name, count]) => ({
                    label: name,
                    count,
                  }))
              : [];

            return (
              <View key={roomId} style={styles.roomCard}>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveRoom(roomId)}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={30}
                      color="#FF0000"
                    />
                  </TouchableOpacity>
                )}

                <View style={styles.roomHeader}>
                  <View style={styles.roomTitleContainer}>
                    {isEditing ? (
                      <TextInput
                        value={editingRoomNames[roomId] || ''}
                        onChangeText={text =>
                          setEditingRoomNames(prev => ({
                            ...prev,
                            [roomId]: text,
                          }))
                        }
                        style={styles.roomNameInput}
                        placeholder="Enter room name"
                        placeholderTextColor={colors.link}
                      />
                    ) : (
                      <Text style={styles.roomName}>
                        {getRoomDisplayName(roomId)}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.appliancesSection}>
                  {isEditing ? (
                    <View style={styles.applianceGridContainer}>
                      {renderApplianceGrid(standardAppliances, roomId, false)}
                      {renderApplianceGrid(customAppliancesList, roomId, true)}
                    </View>
                  ) : (
                    <>
                      {(() => {
                        const standard = standardAppliances.map(appl => ({
                          label: appl.label,
                          count: roomAppliances?.[roomId]?.[appl.label] || 0,
                          isCustom: false,
                        }));

                        const custom = customAppliancesList.map(
                          ({ label, count }) => ({
                            label,
                            count,
                            isCustom: true,
                          }),
                        );

                        const combined = [...standard, ...custom];

                        return combined.map((item, index) => {
                          const isOnlyOne = combined.length === 1;
                          const isLast = index === combined.length - 1;
                          return renderApplianceRow(
                            item.label,
                            item.count,
                            roomId,
                            item.isCustom,
                            isOnlyOne ? false : isLast,
                          );
                        });
                      })()}
                    </>
                  )}

                  {isEditing && (
                    <View style={styles.customApplianceSection}>
                      {showCustomApplianceInput[roomId] ? (
                        <View style={styles.customApplianceInputRow}>
                          <TextInput
                            placeholder="Enter custom appliance"
                            value={newCustomAppliance}
                            onChangeText={setNewCustomAppliance}
                            style={styles.customApplianceTextInput}
                            placeholderTextColor={colors.link}
                          />
                          <View style={styles.customApplianceInputActions}>
                            <TouchableOpacity
                              onPress={() => handleAddCustomAppliance(roomId)}
                              style={styles.addCustomBtn}
                            >
                              <MaterialCommunityIcons
                                name="check"
                                size={18}
                                color="white"
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                setShowCustomApplianceInput(prev => ({
                                  ...prev,
                                  [roomId]: false,
                                }));
                                setNewCustomAppliance('');
                              }}
                              style={styles.cancelCustomBtn}
                            >
                              <MaterialCommunityIcons
                                name="close"
                                size={18}
                                color="white"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() =>
                            setShowCustomApplianceInput(prev => ({
                              ...prev,
                              [roomId]: true,
                            }))
                          }
                          style={styles.addCustomApplianceBtn}
                        >
                          <MaterialCommunityIcons
                            name="plus"
                            size={20}
                            color="white"
                          />
                          <Text style={styles.addCustomApplianceText}>
                            Add Custom Appliance
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {!isEditing &&
                    (!roomAppliances?.[roomId] ||
                      Object.keys(roomAppliances[roomId]).length === 0) &&
                    (!customAppliances?.[roomId] ||
                      Object.keys(customAppliances[roomId]).length === 0) && (
                      <View style={styles.noAppliancesContainer}>
                        <MaterialCommunityIcons
                          name="alert-circle-outline"
                          size={24}
                          color={colors.link}
                        />
                        <Text style={styles.noAppliancesText}>
                          No appliances added
                        </Text>
                      </View>
                    )}
                </View>
              </View>
            );
          })}

          <View style={styles.actionButtons}>
            {isEditing ? (
              <Button text="Save Changes" onPress={handleSave} />
            ) : (
              <TouchableOpacity onPress={toggleEdit} style={styles.editButton}>
                <MaterialCommunityIcons name="pencil" size={20} color="white" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerContent: {
    marginLeft: 16,
    flex: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: colors.link,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createProfileButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  roomCard: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.accent + '20',
  },
  removeButton: {
    position: 'absolute',
    top: 28,
    right: 16,
    zIndex: 1,
    padding: 2,
  },
  roomHeader: {
    marginBottom: 20,
    paddingRight: 40,
  },
  roomTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  roomNameInput: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingVertical: 8,
    flex: 1,
  },
  appliancesSection: {
    marginTop: -5,
  },
  applianceGridContainer: {
    marginTop: -10,
  },
  applianceGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: -10,
  },
  applianceGridItem: {
    flex: 0.48,
    alignItems: 'center',
    padding: 16,
  },
  applianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -20,
  },
  gridApplianceLabel: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 5,
    fontWeight: '500',
    textAlign: 'center',
  },
  applianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  applianceSeparator: {
    height: 1,
    backgroundColor: colors.text,
    marginHorizontal: 2,
    marginVertical: 4,
  },
  applianceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  applianceIconContainer: {
    marginRight: 12,
  },
  applianceLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  customApplianceSection: {
    marginTop: 10,
    paddingTop: 16,
  },
  customApplianceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  customApplianceTextInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
  },
  customApplianceInputActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addCustomBtn: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCustomApplianceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelCustomBtn: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCustomApplianceText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  noAppliancesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent + '20',
  },
  noAppliancesText: {
    fontSize: 16,
    color: colors.link,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  addRoomSection: {
    margin: 20,
    padding: 24,
    backgroundColor: colors.secondary,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  addRoomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent + '20',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  newRoomContainer: {
    gap: 16,
  },
  addRoomBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    minWidth: 80,
  },
  addRoomBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    maxHeight: '70%',
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.accent + '15',
  },
  dropdownItemText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 10,
    marginBottom: 2,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.accent + '30',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
    marginRight: 12,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: colors.link,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  customRoomInputContainer: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent + '40',
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customRoomInput: {
    fontSize: 16,
    color: colors.text,
    paddingVertical: 14,
    fontWeight: '500',
  },
});

export default EditHomeProfile;
