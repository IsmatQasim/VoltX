import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const ROOM_TYPES = [
  { label: 'Bedroom', icon: 'bed-outline' },
  { label: 'Living Room', icon: 'sofa-outline' },
  { label: 'Kitchen', icon: 'silverware-fork-knife' },
  { label: 'Drawing Room', icon: 'ruler-square' },
  { label: 'Washroom', icon: 'toilet' },
  { label: 'Others', icon: 'dots-horizontal' },
];

export const APPLIANCES = [
  { label: 'Fan', icon: 'fan' },
  { label: 'Light', icon: 'lightbulb-outline' },
  { label: 'Iron', icon: 'iron-outline' },
  { label: 'AC', icon: 'air-conditioner' },
  { label: 'Fridge', icon: 'fridge-outline' },
  { label: 'Washing Machine', icon: 'washing-machine' },
  { label: 'Motor', icon: 'engine-outline' },
  { label: 'Microwave', icon: 'microwave' },
];

// Helper function to render icon when needed
export const renderIcon = (iconName, size = 22, color = 'black') => (
  <MaterialCommunityIcons name={iconName} size={size} color={color} />
);
