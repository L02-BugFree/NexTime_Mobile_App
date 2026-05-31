import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Ionicons } from '@expo/vector-icons';

interface ChecklistItem {
  _id: string;
  text: string;
  completed: boolean;
}

interface ChecklistCardProps {
  title: string;
  items: ChecklistItem[];
  onToggleItem?: (itemId: string) => void;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  title,
  items: initialItems,
  onToggleItem
}) => {
  const [items, setItems] = useState(initialItems || []);

  const handleToggle = (id: string) => {
    setItems(prev => prev.map(item => 
      item._id === id ? { ...item, completed: !item.completed } : item
    ));
    onToggleItem?.(id);
  };

  const safeItems = items || [];
  const completedCount = safeItems.filter(i => i.completed).length;
  const progress = safeItems.length > 0 ? (completedCount / safeItems.length) * 100 : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="list" size={16} color={colors.white} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressText}>Tiến độ</Text>
          <Text style={styles.progressCount}>{completedCount}/{safeItems.length}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {safeItems.map(item => (
          <TouchableOpacity 
            key={item._id} 
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={() => handleToggle(item._id)}
          >
            <Ionicons 
              name={item.completed ? "checkbox" : "square-outline"} 
              size={22} 
              color={item.completed ? colors.success : colors.textSecondary} 
            />
            <Text style={[styles.itemText, item.completed && styles.itemTextCompleted]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    width: 260,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressCount: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  itemsContainer: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemText: {
    ...typography.body2,
    color: colors.text,
    flex: 1,
  },
  itemTextCompleted: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});
