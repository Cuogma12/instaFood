import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Trang chủ</Text>
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