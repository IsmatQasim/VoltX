import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CoverImage from '../assets/Home.png';
import LogoImage from '../assets/Logo.png';
import colors from '../contants/colors';
const Cover = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.arrow}
      >
        <Image
          source={{
            uri: 'https://cdn-icons-png.flaticon.com/128/3114/3114931.png',
          }}
          style={styles.arrowImage}
        />
      </TouchableOpacity>

      <Image source={LogoImage} style={styles.logo} resizeMode="contain" />

      <Text style={styles.title}>
        AI-Optimized Smart Home Energy Automation & Budget Manager
      </Text>
      <Image source={CoverImage} style={styles.image} resizeMode="cover" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
  },
  arrow: {
    position: 'absolute',
    top: 30,
    right: 20,
    zIndex: 10,
  },
  arrowImage: {
    width: 32,
    height: 32,
  },
  logo: {
    width: 200,
    height: 150,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
    color: colors.link,
    padding:10,
    marginTop:-40,
  },
  image: {
    marginTop:-1,
    width: '115%',
    height: 520,
  },
});

export default Cover;
