import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { HeatmapCell } from './HeatmapCell';
import { colors } from '../../theme/colors';

const DAYS = ['T.2', 'T.3', 'T.4', 'T.5', 'T.6', 'T.7', 'CN'];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00 to 23:00

interface WeeklyGridProps {
  data: any; 
  totalMembers: number;
  onCellPress?: (day: number, hour: number) => void;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({ data, totalMembers, onCellPress }) => {
  return (
    <View style={styles.container}>
      {/* Header Days */}
      <View style={styles.headerRow}>
        <View style={styles.timeColumnHeader} />
        {DAYS.map((day, idx) => (
          <View key={idx} style={styles.dayHeader}>
            <Text style={styles.dayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Grid Content */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {HOURS.map((hour) => (
          <View key={hour} style={styles.row}>
            {/* Time Label */}
            <View style={styles.timeLabelContainer}>
              <Text style={styles.timeText}>{`${hour}:00`}</Text>
            </View>

            {/* Cells for each day */}
            {DAYS.map((_, dayIdx) => {
              const cellData = data?.[dayIdx]?.[hour];
              const busyCount = cellData?.busyCount || 0;
              
              return (
                <HeatmapCell
                  key={`${dayIdx}-${hour}`}
                  busyCount={busyCount}
                  totalMembers={totalMembers}
                  onPress={() => onCellPress?.(dayIdx, hour)}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
    marginBottom: 8,
  },
  timeColumnHeader: {
    width: 48,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  timeLabelContainer: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
    height: 38, // matches cell height
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
