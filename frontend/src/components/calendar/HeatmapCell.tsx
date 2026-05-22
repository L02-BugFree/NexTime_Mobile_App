import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

interface HeatmapCellProps {
  busyCount: number;
  totalMembers: number;
  onPress?: () => void;
}

export const HeatmapCell: React.FC<HeatmapCellProps> = ({
  busyCount,
  totalMembers,
  onPress,
}) => {
  const getBackgroundColor = () => {
    if (totalMembers === 0 || busyCount === 0) return '#F1F5F9'; // Soft gray for empty slots instead of harsh white
    
    const ratio = busyCount / totalMembers;
    if (ratio <= 0.25) return '#E0F2FE'; // Level 1: softest blue
    if (ratio <= 0.5) return '#BAE6FD';  // Level 2: light blue
    if (ratio <= 0.75) return '#38BDF8'; // Level 3: sky blue
    return colors.primary;               // Level 4: primary blue (most busy)
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      style={[
        styles.cell, 
        { backgroundColor: getBackgroundColor() }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    height: 38, // slightly compact height for modern aesthetic
    borderRadius: 6, // beautiful rounded corners
    margin: 2, // gap between blocks
  },
});
