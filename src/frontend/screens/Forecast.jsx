import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { LineChart } from 'react-native-chart-kit';

import BottomBar from '../components/bottomBar';
import colors from '../contants/colors';
//import NotificationBell from '../components/notificationBell';

const screenWidth = Dimensions.get('window').width;

const EnergySavingForecast = () => {
  const [loading, setLoading] = useState(true);
 // const [bellActive, setBellActive] = useState(false);
  
  // Today's and Tomorrow's consumption
  const [todayConsumption, setTodayConsumption] = useState(0);
  const [tomorrowPredicted, setTomorrowPredicted] = useState(0);
  
  // Forecast data for next 24 hours
  const [forecastData, setForecastData] = useState([]);
  const [forecastLabels, setForecastLabels] = useState([]);
  
  // Total energy today
  const [totalEnergyToday, setTotalEnergyToday] = useState(0);
  
  // Energy usage insights
  const [expectedSavings, setExpectedSavings] = useState(0);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth().currentUser?.uid;
        
        // Fetch user's appliances and rooms
        const doc = await firestore()
          .collection('UserHomeProfile')
          .doc(userId)
          .get();

        if (doc.exists) {
          const data = doc.data();
          
          // Calculate base consumption from appliances
          let baseConsumption = 0;
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
                // Assume average power consumption per appliance
                baseConsumption += count * (Math.random() * 2 + 0.5);
              });
            },
          );

          // Set today's consumption (simulated)
          const todayValue = (baseConsumption * 0.8 + Math.random() * 2).toFixed(1);
          setTodayConsumption(parseFloat(todayValue));
          
          // Predict tomorrow's consumption (10-20% higher for realistic forecast)
          const tomorrowValue = (parseFloat(todayValue) * (1.1 + Math.random() * 0.1)).toFixed(1);
          setTomorrowPredicted(parseFloat(tomorrowValue));

          // Generate forecast for next 24 hours (hourly data starting from current hour)
          const currentHour = new Date().getHours();
          const hours = [];
          const forecastValues = [];
          
          for (let i = 0; i < 6; i++) {
            const hour = (currentHour + i) % 24;
            hours.push(`${hour.toString().padStart(2, '0')}:00`);
            
            // Generate realistic hourly consumption pattern
            let hourlyValue = baseConsumption / 24;
            
            // Peak hours: 7-10 AM and 6-10 PM
            if ((hour >= 7 && hour <= 10) || (hour >= 18 && hour <= 22)) {
              hourlyValue *= (1.5 + Math.random() * 0.5);
            } else if (hour >= 0 && hour <= 6) {
              // Low consumption during night
              hourlyValue *= (0.3 + Math.random() * 0.2);
            } else {
              hourlyValue *= (0.8 + Math.random() * 0.4);
            }
            
            forecastValues.push(Math.round(hourlyValue * 10) / 10);
          }
          
          setForecastLabels(hours);
          setForecastData(forecastValues);
          
          // Calculate total energy today
          const totalToday = forecastValues.reduce((sum, val) => sum + val, 0) * 4;
          setTotalEnergyToday(Math.round(totalToday * 10) / 10);
          
          // Calculate expected savings (random 8-15%)
          const savings = Math.round((8 + Math.random() * 7));
          setExpectedSavings(savings);
          
          // Generate insights
          const generatedInsights = [
            'Shift heavy appliances usage to afternoon hours',
            'Avoid 7-10 PM to save energy',
          ];
          
          // Add dynamic insight based on current hour
          if (currentHour >= 18 && currentHour <= 22) {
            generatedInsights.unshift('Peak hour detected - reduce usage now');
          }
          
          setInsights(generatedInsights);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching forecast data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading forecast data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title and Bell */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Energy Saving Forecast</Text>
          {/* <NotificationBell
            isActive={bellActive}
            onToggle={() => setBellActive(!bellActive)}
          /> */}
        </View>

        <Text style={styles.subtitle}>
          Predict your future energy usage and save smarter
        </Text>

        {/* Consumption Cards */}
        <View style={styles.cardsRow}>
          <View style={styles.consumptionCard}>
            <Text style={styles.cardTitle}>Today's</Text>
            <Text style={styles.cardTitle}>Consumption</Text>
            <Text style={styles.cardValue}>{todayConsumption} kWh</Text>
          </View>

          <View style={styles.consumptionCard}>
            <Text style={styles.cardTitle}>Tomorrow's</Text>
            <Text style={styles.cardTitle}>predicted</Text>
            <Text style={styles.cardValue}>{tomorrowPredicted} kWh</Text>
          </View>
        </View>

        {/* Forecast Chart */}
        <Text style={styles.sectionTitle}>Forecast next 24 Hours</Text>

        <LineChart
          data={{
            labels: forecastLabels,
            datasets: [{ data: forecastData }],
          }}
          width={screenWidth - 40}
          height={220}
          yAxisSuffix="kWh"
          chartConfig={{
            backgroundColor: colors.primary,
            backgroundGradientFrom: colors.primary,
            backgroundGradientTo: colors.primary,
            decimalPlaces: 0,
            color: () => colors.text,
            labelColor: () => colors.text,
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: colors.accent,
            },
          }}
          bezier
          style={styles.chart}
        />

        <Text style={styles.totalEnergyText}>
          Total Energy Today : {totalEnergyToday} kWh
        </Text>

        {/* Energy Usage Insights */}
        <Text style={styles.insightsTitle}>Energy usage insights</Text>

        <View style={styles.insightsContainer}>
          <View style={styles.savingsRow}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.insightLabel}>Expected Savings :</Text>
            <Text style={styles.savingsValue}>{expectedSavings}%</Text>
          </View>

          {insights.map((insight, index) => (
            <View key={index} style={styles.insightRow}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBarContainer}>
        <BottomBar />
      </View>
    </View>
  );
};

export default EnergySavingForecast;

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
    fontSize: 25,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    flexShrink: 1,
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    color: colors.link,
    marginBottom: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  consumptionCard: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.text,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  totalEnergyText: {
    fontSize: 16,
    color: colors.link,
    marginTop: 8,
    marginBottom: 20,
  },
  insightsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  insightsContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 20,
    color: colors.text,
    marginRight: 8,
  },
  insightLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  savingsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});