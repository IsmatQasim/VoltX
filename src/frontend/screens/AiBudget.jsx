import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import BottomBar from '../components/bottomBar';
import colors from '../contants/colors';
//import NotificationBell from '../components/notificationBell';

const AIBudgetPlanner = () => {
  const [loading, setLoading] = useState(true);
 // const [bellActive, setBellActive] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [currentUsage, setCurrentUsage] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [weeklyLimit, setWeeklyLimit] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [savingData, setSavingData] = useState(false);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      const budgetDoc = await firestore()
        .collection('UserBudgetPlanner')
        .doc(userId)
        .get();

      if (budgetDoc.exists) {
        const data = budgetDoc.data();
        setMonthlyBudget(data.monthlyBudget || 0);
        setCurrentUsage(data.currentUsage || 0);
        setDailyLimit(data.dailyLimit || 0);
        setWeeklyLimit(data.weeklyLimit || 0);
        setShowSummary(data.showSummary || false);
        setBudgetInput(data.monthlyBudget?.toString() || '');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      setLoading(false);
    }
  };

  const calculateAILimits = (budget) => {
    const budgetValue = parseFloat(budget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      return { daily: 0, weekly: 0 };
    }

    // AI-based calculation: divide monthly budget intelligently
    const daily = Math.round((budgetValue / 30) * 10) / 10;
    const weekly = Math.round((budgetValue / 4.33) * 10) / 10;

    return { daily, weekly };
  };

  const handleSetBudget = async () => {
    const budgetValue = parseFloat(budgetInput);
    
    if (isNaN(budgetValue) || budgetValue <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid budget amount');
      return;
    }

    setSavingData(true);
    
    try {
      const userId = auth().currentUser?.uid;
      const limits = calculateAILimits(budgetValue);

      const budgetData = {
        monthlyBudget: budgetValue,
        dailyLimit: limits.daily,
        weeklyLimit: limits.weekly,
        currentUsage: currentUsage,
        showSummary: showSummary,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore()
        .collection('UserBudgetPlanner')
        .doc(userId)
        .set(budgetData, { merge: true });

      setMonthlyBudget(budgetValue);
      setDailyLimit(limits.daily);
      setWeeklyLimit(limits.weekly);

      Alert.alert('Success', 'Budget plan set successfully!');
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget plan');
    } finally {
      setSavingData(false);
    }
  };

  const handleIncrementBudget = () => {
    const current = parseFloat(budgetInput) || 0;
    setBudgetInput((current + 10).toString());
  };

  const handleDecrementBudget = () => {
    const current = parseFloat(budgetInput) || 0;
    if (current > 10) {
      setBudgetInput((current - 10).toString());
    }
  };

  const remainingBudget = monthlyBudget - currentUsage;
  const usagePercentage = monthlyBudget > 0 
    ? Math.min((currentUsage / monthlyBudget) * 100, 100) 
    : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading budget planner...</Text>
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
          <Text style={styles.title}>AI-Powered Energy Budget Planner</Text>
          {/* <NotificationBell
            isActive={bellActive}
            onToggle={() => setBellActive(!bellActive)}
          /> */}
        </View>

        <Text style={styles.subtitle}>
          Smart energy planning within your monthly limit
        </Text>

        {/* Set Monthly Budget Section */}
        <View style={styles.budgetCard}>
          <View style={styles.cardHeader}>
            <Icon name="cash-multiple" size={28} color={colors.text} />
            <Text style={styles.cardTitle}>Set Monthly Budget</Text>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Enter your budget :</Text>
            <TextInput
              style={styles.textInput}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.link}
            />
          </View>

          <View style={styles.budgetControlRow}>
            <Text style={styles.inputLabel}>Set Budget</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={handleDecrementBudget}
              >
                <Icon name="minus" size={24} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={handleIncrementBudget}
              >
                <Icon name="plus" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.setBudgetButton}
            onPress={handleSetBudget}
            disabled={savingData}
          >
            {savingData ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.setBudgetButtonText}>Set Budget</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Budget Plan Section */}
        <View style={styles.aiPlanCard}>
          <Text style={styles.sectionTitle}>AI Budget Plan</Text>

          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Daily</Text>
            <Text style={styles.planValue}>{dailyLimit.toFixed(1)} units</Text>
          </View>

          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Weekly</Text>
            <Text style={styles.planValue}>{weeklyLimit.toFixed(1)} units</Text>
          </View>

          <Text style={styles.autoText}>
            Automatically based on your budget
          </Text>
        </View>

        {/* Budget Summary Section */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>Budget Summary</Text>
            <Switch
              value={showSummary}
              onValueChange={(value) => {
                setShowSummary(value);
                const userId = auth().currentUser?.uid;
                if (userId) {
                  firestore()
                    .collection('UserBudgetPlanner')
                    .doc(userId)
                    .update({ showSummary: value });
                }
              }}
              trackColor={{ false: '#767577', true: colors.accent }}
              thumbColor={showSummary ? colors.primary : '#f4f3f4'}
            />
          </View>

          {showSummary && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Budget</Text>
                <Text style={styles.summaryValue}>{monthlyBudget.toFixed(0)} unit</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${usagePercentage}%` }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Used</Text>
                <Text style={styles.summaryValue}>{currentUsage.toFixed(0)} units</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remaining</Text>
                <Text style={[
                  styles.summaryValue,
                  remainingBudget < 0 && { color: '#e74c3c' }
                ]}>
                  {remainingBudget.toFixed(0)} units
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBarContainer}>
        <BottomBar />
      </View>
    </View>
  );
};

export default AIBudgetPlanner;

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
  budgetCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 10,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  textInput: {
    flex: 1,
    marginLeft: 20,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  budgetControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 25,
    overflow: 'hidden',
  },
  controlButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setBudgetButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  setBudgetButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  aiPlanCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 15,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planLabel: {
    fontSize: 16,
    color: colors.text,
  },
  planValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  autoText: {
    fontSize: 14,
    color: colors.link,
    marginTop: 10,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.text,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  progressBarContainer: {
    marginBottom: 15,
  },
  progressBarBackground: {
    height: 20,
    backgroundColor: colors.primary,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.text,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});