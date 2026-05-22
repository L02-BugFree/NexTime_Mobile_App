import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface BadgeProps {
  count?: number;
  dot?: boolean;
  color?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ 
  count, 
  dot = false, 
  color = colors.danger,
  style 
}) => {
  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          { backgroundColor: color },
          style,
        ]}
      />
    );
  }

  if (count === undefined || count <= 0) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: color },
        style,
      ]}
    >
      <Text style={styles.text}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  text: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
