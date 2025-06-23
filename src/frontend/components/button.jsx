import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../contants/colors.js'

export default function Button({ text, onPress, buttonStyle }) {
  return (
    <TouchableOpacity style={[styles.loginBtn, buttonStyle]} onPress={onPress}>
      <Text style={styles.loginText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loginBtn: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  loginText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
