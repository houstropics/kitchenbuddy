import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();

  const handleAddIngredient = () => {
    navigation.navigate('IngredientForm');
  };

  const handleIngredientsList = () => {
    navigation.navigate('IngredientsList');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to My Kitchen App</Text>
      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <Button title="Add Ingredient" onPress={handleAddIngredient} />
        </View>
        <View style={styles.button}>
          <Button title="Ingredient List" onPress={handleIngredientsList} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    marginBottom: 10,
  },
});

export default HomeScreen;
