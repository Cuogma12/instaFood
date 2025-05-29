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

  const ingredients = recipeDetails.ingredients.map(ing => `• ${ing}`);
  const instructions = recipeDetails.instructions.map((inst, idx) => `${idx + 1}. ${inst}`);

  const combinedLines = [...ingredients, ...instructions];
  const shouldTruncate = combinedLines.length > MAX_LINES;

  const displayedIngredients = showFull
    ? ingredients
    : ingredients.slice(0, Math.max(0, MAX_LINES));

  const displayedInstructions = showFull
    ? instructions
    : ingredients.length >= MAX_LINES
      ? []
      : instructions.slice(0, MAX_LINES - ingredients.length);

  return (
    <View style={styles.container}>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}

      <Text style={styles.sectionTitle}>🧂 Nguyên liệu:</Text>
      <Text style={styles.content}>
        {displayedIngredients.join('\n') || ''}
      </Text>

      <Text style={styles.sectionTitle}>🍲 Cách nấu:</Text>
      <Text style={styles.content}>
        {displayedInstructions.join('\n') || ''}
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
    marginBottom: -15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: -20,
  },
  readMoreButton: {
    marginTop: -15,
    marginBottom: 5,
  },
  readMoreText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default RecipePost;
