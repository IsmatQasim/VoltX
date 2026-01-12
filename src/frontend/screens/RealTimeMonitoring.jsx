import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { LineChart } from 'react-native-chart-kit';
import DropDownPicker from 'react-native-dropdown-picker';

import BottomBar from '../components/bottomBar';
import colors from '../contants/colors';
import { renderIcon, APPLIANCES } from '../contants/data';
import NotificationBell from '../components/notificationBell';

const screenWidth = Dimensions.get('window').width;
const timeRanges = ['Current', 'Today', 'Weekly', 'Monthly'];

const RealTimeMonitoring = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('Current');
  const [rooms, setRooms] = useState([]);
  const [roomNames, setRoomNames] = useState({});
  const [appliances, setAppliances] = useState([]);
  const [energyData, setEnergyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bellActive, setBellActive] = useState(false);

  const [openRoom, setOpenRoom] = useState(false);
  const [roomItems, setRoomItems] = useState([]);
  const [openTime, setOpenTime] = useState(false);
  const [timeItems, setTimeItems] = useState(
    timeRanges.map(range => ({ label: range, value: range })),
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth().currentUser?.uid;
        const doc = await firestore()
          .collection('UserHomeProfile')
          .doc(userId)
          .get();

        if (doc.exists) {
          const data = doc.data();
          const savedRooms = data.selectedRooms || [];
          const roomNamesMap = data.roomNames || {};

          setRooms(savedRooms);
          setRoomNames(roomNamesMap);
          setSelectedRoom(savedRooms[0] || null);
       
          setRoomItems(
            savedRooms.map(room => ({
              label: (roomNamesMap[room] || room).replace(/_/g, ' '),
              value: room,
            })),
          );

          const allAppliances = [];
          Object.entries(data.roomAppliances || {}).forEach(
            ([room, devices]) => {
              Object.entries(devices).forEach(([deviceName, value]) => {
                let count = 1;
                if (typeof value === 'number') {
                  count = value;
                } else if (typeof value === 'object' && value !== null) {
                  if (typeof value.count === 'number') {
                    count = value.count;
                  } else if (typeof value.count?.actualCount === 'number') {
                    count = value.count.actualCount;
                  }
                }
                for (let i = 1; i <= count; i++) {
                  const displayName =
                    count > 1 ? `${deviceName} ${i}` : deviceName;
                  allAppliances.push({
                    room,
                    name: displayName,
                    originalName: deviceName,
                    active: true,
                    energy: (Math.random() * 50 + 10).toFixed(1),
                  });
                }
              });
            },
          );
          setAppliances(allAppliances);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTimeRange === 'Current')
      setEnergyData([50, 80, 60, 90, 70, 100]);
    else if (selectedTimeRange === 'Today')
      setEnergyData([120, 130, 110, 140, 150]);
    else if (selectedTimeRange === 'Weekly')
      setEnergyData([500, 550, 600, 450, 700, 650]);
    else if (selectedTimeRange === 'Monthly')
      setEnergyData([2000, 2200, 2100, 2300, 2500]);
  }, [selectedTimeRange]);

  let chartLabels = [];
  if (selectedTimeRange === 'Current')
    chartLabels = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  else if (selectedTimeRange === 'Today')
    chartLabels = ['00:00', '06:00', '12:00', '18:00', '24:00'];
  else if (selectedTimeRange === 'Weekly')
    chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  else if (selectedTimeRange === 'Monthly')
    chartLabels = ['Week1', 'Week2', 'Week3', 'Week4', 'Week5'];

  const totalEnergy = energyData.reduce((sum, val) => sum + val, 0);
  const filteredAppliances = appliances.filter(
    item => item.room === selectedRoom,
  );

  if (loading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.text, marginTop: 12, fontSize: 16 }}>
          Loading real time energy...
        </Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Title and Bell */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Real-Time Energy Monitoring</Text>
        <NotificationBell
          isActive={bellActive}
          onToggle={() => setBellActive(!bellActive)}
        />
      </View>

      <Text style={styles.subtitle}>
        Continuous real-time energy usage tracking
      </Text>

      {/* Dropdowns */}
      <View style={styles.topRow}>
        <View style={styles.pickerWrapper}>
          <DropDownPicker
            open={openRoom}
            value={selectedRoom}
            items={roomItems}
            setOpen={setOpenRoom}
            setValue={setSelectedRoom}
            setItems={setRoomItems}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            arrowIconStyle={{ tintColor: 'black' }}
            placeholder="Select Room"
          />
        </View>

        <View style={styles.pickerWrapper}>
          <DropDownPicker
            open={openTime}
            value={selectedTimeRange}
            items={timeItems}
            setOpen={setOpenTime}
            setValue={setSelectedTimeRange}
            setItems={setTimeItems}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            arrowIconStyle={{ tintColor: 'black' }}
            placeholder="Select Time Range"
          />
        </View>
      </View>

      {/* Line Chart */}
      <LineChart
        data={{ labels: chartLabels, datasets: [{ data: energyData }] }}
        width={screenWidth - 40}
        height={180}
        yAxisSuffix=" kWh"
        chartConfig={{
          backgroundColor: colors.primary,
          backgroundGradientFrom: colors.primary,
          backgroundGradientTo: colors.primary,
          decimalPlaces: 0,
          color: () => colors.text,
          labelColor: () => colors.text,
        }}
        bezier
        style={{ marginVertical: 8, borderRadius: 16 }}
      />

      <Text style={styles.totalText}>
        Total Energy {selectedTimeRange} : {totalEnergy.toFixed(1)} kWh
      </Text>

      <Text style={styles.heading}>{selectedTimeRange} Appliances</Text>

      {/* Scrollable FlatList */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredAppliances}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            const found = APPLIANCES.find(
              app =>
                app.label.toLowerCase() === item.originalName.toLowerCase(),
            );
            return (
              <View style={styles.applianceItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {found && renderIcon(found.icon, 22, colors.text)}
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.applianceText}>{item.name}</Text>
                    <Text style={styles.applianceEnergy}>
                      Usage: {item.energy} kWh
                    </Text>
                  </View>
                </View>
                <Text style={{ color: item.active ? 'green' : 'red' }}>
                  {item.active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.noAppliances}>No appliances in this room</Text>
          }
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      </View>

      <View style={styles.bottomBarContainer}>
        <BottomBar />
      </View>
    </View>
  );
};

export default RealTimeMonitoring;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 18,
    color: colors.link,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 10,
  },
  pickerWrapper: {
    flex: 1,
    marginRight: 12,
    zIndex: 10,
  },
  dropdown: {
    backgroundColor: colors.secondary,
    borderColor: colors.text,
    borderWidth: 1,
    borderRadius: 8,
  },
  dropdownContainer: {
    backgroundColor: colors.primary,
    borderColor: colors.text,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: colors.text,
  },
  totalText: {
    color: colors.text,
    marginVertical: 5,
    fontSize: 15,
  },
  applianceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  applianceText: {
    color: colors.text,
    fontWeight: '500',
  },
  applianceEnergy: {
    color: colors.link,
    fontSize: 12,
    marginTop: 2,
  },
  noAppliances: {
    textAlign: 'center',
    color: colors.link,
    marginTop: 10,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
