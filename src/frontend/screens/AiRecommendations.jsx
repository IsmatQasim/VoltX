import React, { useEffect, useState } from 'react';
import { getRecommendations } from '../services/aiService';
import { 
  Alert, 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Switch, 
  Platform,
  ScrollView 
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';

import BottomBar from '../components/bottomBar';
import colors from '../contants/colors';
import { renderIcon, APPLIANCES } from '../contants/data';

const SmartEnergyRecommendations = () => {
  const [loading, setLoading] = useState(true);
  const [totalAppliances, setTotalAppliances] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);
  const [workingAppliances, setWorkingAppliances] = useState(0);

  const [peakHoursEnabled, setPeakHoursEnabled] = useState(false);
  const [fromTime, setFromTime] = useState(new Date());
  const [toTime, setToTime] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const [allAppliances, setAllAppliances] = useState([]);

  useEffect(() => {
    console.log('✅ Component mounted');
    console.log('✅ getRecommendations function:', typeof getRecommendations);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth().currentUser?.uid;
        
        if (!userId) {
          console.error('❌ No user logged in');
          setLoading(false);
          return;
        }

        console.log('📊 Fetching data for user:', userId);
        const doc = await firestore().collection('UserHomeProfile').doc(userId).get();

        if (doc.exists) {
          const data = doc.data();
          const savedRooms = data.selectedRooms || [];
          const roomNamesMap = data.roomNames || {};

          setTotalRooms(savedRooms.length);

          const allAppliancesList = [];
          let totalCount = 0;
          let workingCount = 0;

          Object.entries(data.roomAppliances || {}).forEach(([room, devices]) => {
            Object.entries(devices).forEach(([deviceName, value]) => {
              let count = 1;
              if (typeof value === 'number') count = value;
              else if (typeof value === 'object' && value !== null) {
                count = value.count ?? value.count?.actualCount ?? 1;
              }

              for (let i = 1; i <= count; i++) {
                const displayName = count > 1 ? `${deviceName} ${i}` : deviceName;
                const isWorking = Math.random() > 0.3;
                allAppliancesList.push({
                  room: roomNamesMap[room] || room.replace(/_/g, ' '),
                  name: displayName,
                  originalName: deviceName,
                  active: isWorking,
                });

                totalCount++;
                if (isWorking) workingCount++;
              }
            });
          });

          console.log('📊 Total appliances:', totalCount);
          console.log('📊 Working appliances:', workingCount);

          setTotalAppliances(totalCount);
          setWorkingAppliances(workingCount);
          setAllAppliances(allAppliancesList);

          const defaultFrom = new Date(); 
          defaultFrom.setHours(10, 0, 0, 0);
          const defaultTo = new Date(); 
          defaultTo.setHours(19, 0, 0, 0);
          setFromTime(defaultFrom);
          setToTime(defaultTo);
        } else {
          console.log('❌ No user profile found');
        }
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to load user data', [{ text: 'OK' }]);
      }
    };

    fetchData();
  }, []);

  const formatTime = date => date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });

  const onFromTimeChange = (event, selectedDate) => { 
    setShowFromPicker(Platform.OS === 'ios'); 
    if (selectedDate) setFromTime(selectedDate); 
  };
  
  const onToTimeChange = (event, selectedDate) => { 
    setShowToPicker(Platform.OS === 'ios'); 
    if (selectedDate) setToTime(selectedDate); 
  };

  // ✅ Check if current time is within peak hours
  const isPeakHour = () => {
    if (!peakHoursEnabled) return 0;
    
    const now = new Date();
    const currentHour = now.getHours();
    const fromHour = fromTime.getHours();
    const toHour = toTime.getHours();
    
    if (fromHour <= toHour) {
      return (currentHour >= fromHour && currentHour < toHour) ? 1 : 0;
    } else {
      return (currentHour >= fromHour || currentHour < toHour) ? 1 : 0;
    }
  };

  // ✅ Generate AI Recommendations with DEFAULT DATA
  const generateRecommendations = async () => {
    console.log('🔵 === Generate Recommendations Started ===');
    
    try {
      setLoading(true);

      if (typeof getRecommendations !== 'function') {
        throw new Error('getRecommendations is not a function. Check aiService.js export.');
      }

      // ✅ OPTION 1: Use real appliances if available
      let activeAppliances = allAppliances.filter(app => app.active);
      
      // ✅ OPTION 2: If no appliances, use DEFAULT/DEMO DATA
      if (activeAppliances.length === 0) {
        console.log('⚠️ No active appliances found, using default demo data');
        activeAppliances = [
          { name: 'Air Conditioner', originalName: 'Air Conditioner', room: 'Living Room', active: true },
          { name: 'Refrigerator', originalName: 'Refrigerator', room: 'Kitchen', active: true },
          { name: 'Washing Machine', originalName: 'Washing Machine', room: 'Laundry', active: true },
          { name: 'LED TV', originalName: 'LED TV', room: 'Bedroom', active: true },
          { name: 'Fan', originalName: 'Fan', room: 'Living Room', active: true }
        ];
      }
      
      console.log('📊 Active appliances to process:', activeAppliances.length);

      // ✅ Build payload with DEFAULT values
      const currentHour = new Date().getHours();
      const isPeak = isPeakHour();

      const appliancesPayload = activeAppliances.map((app, index) => {
        // Get power rating from APPLIANCES data or use sensible defaults
        const applianceData = APPLIANCES.find(a => a.name === app.originalName);
        let powerRating = 1000; // Default 1000W
        
        // ✅ Smart defaults based on appliance type
        if (applianceData) {
          powerRating = applianceData.power_rating;
        } else if (app.originalName.toLowerCase().includes('ac') || 
                   app.originalName.toLowerCase().includes('conditioner')) {
          powerRating = 1500; // AC typically 1500W
        } else if (app.originalName.toLowerCase().includes('refrigerator') || 
                   app.originalName.toLowerCase().includes('fridge')) {
          powerRating = 150; // Fridge typically 150W
        } else if (app.originalName.toLowerCase().includes('washing')) {
          powerRating = 500; // Washing machine 500W
        } else if (app.originalName.toLowerCase().includes('tv')) {
          powerRating = 100; // TV typically 100W
        } else if (app.originalName.toLowerCase().includes('fan')) {
          powerRating = 75; // Fan typically 75W
        }

        console.log(`📊 ${index + 1}. ${app.name}: ${powerRating}W, Hour: ${currentHour}, Peak: ${isPeak}`);

        return {
          power_rating: powerRating,
          usage_duration: 3, // Default 3 hours usage
          hour: currentHour,
          is_peak_hour: isPeak
        };
      });

      const payload = { appliances: appliancesPayload };

      console.log('🔵 Peak hours enabled:', peakHoursEnabled);
      console.log('🔵 Current hour:', currentHour);
      console.log('🔵 Is peak hour:', isPeak === 1 ? 'Yes' : 'No');
      console.log('🔵 Full Payload:', JSON.stringify(payload, null, 2));

      // Call API
      const data = await getRecommendations(payload);

      console.log('✅ API Response received:', data);

      if (!data || !data.recommendations) {
        throw new Error('Invalid API response: No recommendations field');
      }

      if (!Array.isArray(data.recommendations)) {
        throw new Error('Invalid API response: recommendations is not an array');
      }

      // Process recommendations
      const processedRecommendations = data.recommendations.map((rec, index) => {
        const appliance = activeAppliances[index];
        const applianceData = APPLIANCES.find(a => a.name === appliance?.originalName);
        
        return {
          room: appliance?.room || 'Unknown',
          applianceName: appliance?.name || `Appliance ${index + 1}`,
          icon: applianceData?.icon || 'power',
          originalName: appliance?.originalName || `Appliance ${index + 1}`,
          suggestion: rec
        };
      });

      console.log('✅ Processed recommendations:', processedRecommendations.length);

      setRecommendations(processedRecommendations);
      setShowRecommendations(true);
      setLoading(false);
      
      Alert.alert(
        'Success!', 
        `Generated ${processedRecommendations.length} AI recommendations for your appliances.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('❌ === Generate Recommendations Failed ===');
      console.error('❌ Error Type:', error.name);
      console.error('❌ Error Message:', error.message);
      console.error('❌ Error Stack:', error.stack);
      
      setLoading(false);
      
      let errorTitle = 'Error';
      let errorMessage = 'Unable to fetch AI recommendations.\n\n';
      
      if (error.message.includes('not a function')) {
        errorTitle = 'Import Error';
        errorMessage += 'The getRecommendations function is not properly imported.';
      } else if (error.response) {
        errorTitle = 'Server Error';
        errorMessage += `Server error (${error.response.status}):\n`;
        errorMessage += JSON.stringify(error.response.data, null, 2);
      } else if (error.request) {
        errorTitle = 'Connection Error';
        errorMessage += 'Cannot reach the server. Check:\n\n';
        errorMessage += '✓ Server running on computer\n';
        errorMessage += '✓ Phone and computer on same WiFi\n';
        errorMessage += '✓ Firewall allows port 8000\n';
        errorMessage += '\nTry: http://192.168.10.7:8000/docs';
      } else {
        errorMessage += error.message;
      }
      
      Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
    }
  };

  if (loading && allAppliances.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading recommendations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>AI Energy Recommendations</Text>
        </View>

        <Text style={styles.subtitle}>
          Monitor your home's energy use with AI-powered recommendations for optimization.
        </Text>

        {/* Home Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Home Summary</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Applications</Text>
            <Text style={styles.summaryValue}>{totalAppliances}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rooms</Text>
            <Text style={styles.summaryValue}>
              {totalRooms.toString().padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Working Appliances</Text>
            <Text style={styles.summaryValue}>
              {workingAppliances.toString().padStart(2, '0')}
            </Text>
          </View>
        </View>

        {/* Peak Hours */}
        <View style={styles.peakHoursCard}>
          <View style={styles.peakHoursHeader}>
            <Text style={styles.peakHoursTitle}>Peak Hours</Text>
            <Switch 
              value={peakHoursEnabled} 
              onValueChange={setPeakHoursEnabled} 
              trackColor={{ false: '#767577', true: colors.accent }} 
              thumbColor={peakHoursEnabled ? colors.text : '#f4f3f4'} 
            />
          </View>

          {peakHoursEnabled && (
            <>
              <Text style={styles.inputLabel}>Input peak hours</Text>
              <View style={styles.timeInputRow}>
                <View style={styles.timeInputWrapper}>
                  <Text style={styles.timeLabel}>From</Text>
                  <TouchableOpacity 
                    style={styles.timeButton} 
                    onPress={() => setShowFromPicker(true)}
                  >
                    <Text style={styles.timeText}>{formatTime(fromTime)}</Text>
                    <Text style={styles.clockIcon}>🕐</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeInputWrapper}>
                  <Text style={styles.timeLabel}>To</Text>
                  <TouchableOpacity 
                    style={styles.timeButton} 
                    onPress={() => setShowToPicker(true)}
                  >
                    <Text style={styles.timeText}>{formatTime(toTime)}</Text>
                    <Text style={styles.clockIcon}>🕐</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showFromPicker && (
                <DateTimePicker 
                  value={fromTime} 
                  mode="time" 
                  is24Hour={false} 
                  display="default" 
                  onChange={onFromTimeChange} 
                />
              )}
              {showToPicker && (
                <DateTimePicker 
                  value={toTime} 
                  mode="time" 
                  is24Hour={false} 
                  display="default" 
                  onChange={onToTimeChange} 
                />
              )}
            </>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.recommendButton, loading && styles.recommendButtonDisabled]} 
          onPress={generateRecommendations}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={styles.recommendButtonText}>Get AI Recommendations</Text>
          )}
        </TouchableOpacity>

        {/* Recommendations List */}
        {showRecommendations && (
          <>
            <Text style={styles.recommendationsHeading}>
              AI Recommendations ({recommendations.length})
            </Text>
            {recommendations.map((item, index) => (
              <View key={index} style={styles.recommendationItem}>
                <View style={styles.recommendationHeader}>
                  {renderIcon(item.icon, 24, colors.text)}
                  <View style={styles.recommendationTextContainer}>
                    <Text style={styles.recommendationTitle}>{item.applianceName}</Text>
                    <Text style={styles.recommendationRoom}>- {item.room}</Text>
                  </View>
                </View>
                <Text style={styles.recommendationSuggestion}>{item.suggestion}</Text>
              </View>
            ))}
            {recommendations.length === 0 && (
              <Text style={styles.noRecommendations}>
                No recommendations available
              </Text>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBarContainer}>
        <BottomBar />
      </View>
    </View>
  );
};

export default SmartEnergyRecommendations;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    marginTop: 12,
    fontSize: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    flexShrink: 1,
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.link,
    marginBottom: 20,
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.text,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  peakHoursCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  peakHoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  peakHoursTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  timeInputWrapper: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  timeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: colors.text,
  },
  clockIcon: {
    fontSize: 18,
  },
  recommendButton: {
    backgroundColor: colors.secondary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.text,
    minHeight: 50,
  },
  recommendButtonDisabled: {
    opacity: 0.6,
  },
  recommendButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  recommendationsHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  recommendationItem: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  recommendationRoom: {
    fontSize: 14,
    color: colors.link,
    marginTop: 2,
  },
  recommendationSuggestion: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
    lineHeight: 20,
  },
  noRecommendations: {
    textAlign: 'center',
    color: colors.link,
    marginTop: 20,
    fontSize: 16,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});