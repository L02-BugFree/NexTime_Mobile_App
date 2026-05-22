import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  votedByMe?: boolean;
}

interface PollCardProps {
  question: string;
  options: PollOption[];
  totalVotes: number;
  onVote?: (optionId: string) => void;
}

export const PollCard: React.FC<PollCardProps> = ({
  question,
  options: initialOptions,
  totalVotes,
  onVote
}) => {
  const [options, setOptions] = useState(initialOptions);

  const handleVote = (id: string) => {
    // Demo logic: toggle vote
    setOptions(prev => prev.map(opt => {
      if (opt.id === id) {
        return { ...opt, votes: opt.votedByMe ? opt.votes - 1 : opt.votes + 1, votedByMe: !opt.votedByMe };
      }
      return opt;
    }));
    onVote?.(id);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.question}>{question}</Text>
      
      <View style={styles.optionsContainer}>
        {options.map(option => {
          const progress = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          return (
            <TouchableOpacity 
              key={option.id} 
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={() => handleVote(option.id)}
            >
              <View style={styles.optionHeader}>
                <View style={styles.optionLeft}>
                  <Ionicons 
                    name={option.votedByMe ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={option.votedByMe ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[styles.optionText, option.votedByMe && styles.optionTextSelected]}>
                    {option.text}
                  </Text>
                </View>
                <View style={styles.optionRight}>
                  {option.votes > 0 && (
                    <View style={styles.avatars}>
                      <Avatar size={16} name="A" style={styles.miniAvatar} />
                      {option.votes > 1 && <Avatar size={16} name="B" style={styles.miniAvatar} />}
                    </View>
                  )}
                  <Text style={styles.voteCount}>{option.votes}</Text>
                </View>
              </View>
              
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <TouchableOpacity style={styles.detailButton}>
        <Text style={styles.detailText}>Chi tiết</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    width: 280,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  question: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionRow: {
    gap: 6,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    ...typography.body2,
    color: colors.text,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatars: {
    flexDirection: 'row',
  },
  miniAvatar: {
    marginLeft: -4,
    borderWidth: 1,
    borderColor: colors.white,
  },
  voteCount: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginLeft: 28, // align with text
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  detailButton: {
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailText: {
    ...typography.button,
    color: colors.primary,
  },
});
