// components/NotificationBell.js
import React from 'react';
import { TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const NotificationBell = ({ isActive, onToggle }) => {
  return (
    <TouchableOpacity onPress={onToggle}>
      <MaterialCommunityIcons
        name={isActive ? 'bell-ring' : 'bell-outline'}
        size={26}
        color={isActive ? '#000' : '#aaa'}
      />
    </TouchableOpacity>
  );
};

export default NotificationBell;
