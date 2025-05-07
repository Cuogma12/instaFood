import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

interface RecipePostProps {
  recipeDetails: {
    recipeName: string;
    ingredients: string[];
    instructions: string[];
  };
  caption?: string;
}

const MAX_LINES = 6;

const RecipePost: React.FC<RecipePostProps> = ({ recipeDetails, caption }) => {
  const [showFull, setShowFull] = useState(false);

  // Gộp nguyên liệu và hướng dẫn thành 1 mảng dòng
  const contentLines = [
    ...recipeDetails.ingredients.map(ing => `• ${ing}`),
    ...recipeDetails.instructions.map((inst, idx) => `${idx + 1}. ${inst}`)
  ];
  const shouldTruncate = contentLines.length > MAX_LINES;
  const displayedLines = showFull ? contentLines : contentLines.slice(0, MAX_LINES);

  return (
    <View style={styles.container}>
      <Text style={styles.recipeName}>🍳 {recipeDetails.recipeName}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      <Text style={styles.sectionTitle}>📝 Nguyên liệu & Cách nấu:</Text>
      <Text style={styles.content}>
        {displayedLines.join('\n')}
      </Text>
      {shouldTruncate && (
        <TouchableOpacity
          onPress={() => setShowFull(!showFull)}
          style={styles.readMoreButton}
        >
          <Text style={styles.readMoreText}>
            {showFull ? 'Thu gọn' : 'Xem thêm'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  caption: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  readMoreButton: {
    marginTop: 8,
    marginBottom: 4,
  },
  readMoreText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default RecipePost;
