import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

export default function CreatePostScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tạo bài viết</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  text: {
    fontSize: 20,
    color: colors.text,
  },
});