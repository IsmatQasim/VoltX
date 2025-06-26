import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const deviceCounter = ({ label, icon, count, onIncrement, onDecrement }) => {
  return (
    <View style={styles.container}>
      {/* Icon + Label Side by Side */}
      <View style={styles.labelContainer}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color="black"
            style={styles.icon}
          />
        )}
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </View>

      {/* Counter buttons */}
      <View style={styles.counter}>
        <TouchableOpacity onPress={onDecrement} style={styles.button}>
          <Text style={styles.sign}>-</Text>
        </TouchableOpacity>
        <Text style={styles.count}>{count}</Text>
        <TouchableOpacity onPress={onIncrement} style={styles.button}>
          <Text style={styles.sign}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 5,
    width: 110,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
    maxWidth: 100,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 16,
    textAlign: 'left',
    flexShrink: 1,
    maxWidth: 70, 
    flexWrap: 'wrap',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  button: {
    paddingHorizontal: 8,
  },
  sign: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  count: {
    marginHorizontal: 10,
    fontSize: 16,
  },
});



export default deviceCounter;
