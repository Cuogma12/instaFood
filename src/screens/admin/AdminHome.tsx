import React from 'react';
import { View, Text, StyleSheet ,TouchableOpacity} from 'react-native';
import { colors } from '../../utils/colors';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/stackparamlist';

export default function AdminHome() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();


  return (
    <View style={styles.container}>
      <Text style={styles.text}>Trang chủ admin </Text>
      <TouchableOpacity 
      style={styles.emptyButton}
      onPress={() => navigation.navigate('MainApp', { screen: 'Home' })}>
        
        <Text style={styles.text}>BackToApp</Text>
      </TouchableOpacity>
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
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});