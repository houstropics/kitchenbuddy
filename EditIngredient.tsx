import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useRoute } from '@react-navigation/native';
import PickerSelect from 'react-native-picker-select';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';

const db = SQLite.openDatabase('ingredient.db');

interface Ingredient {
  id: number;
  name: string;
  brand: string;
  category: string;
  location: string;
  confectionType: string;
  ripeness: string;
  expirationDate: Date;
}

const EditIngredient: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { ingredient } = route.params as { ingredient: Ingredient };

  const [ingredientName, setIngredientName] = useState<string>(ingredient.name);
  const [category, setCategory] = useState<string>(ingredient.category);
  const [location, setLocation] = useState<string>(ingredient.location);
  const [confectionType, setConfectionType] = useState<string>(
    ingredient.confectionType
  );
  const [expirationDate, setExpirationDate] = useState<Date>(
    ingredient.expirationDate
  );
  const [brandName, setBrandName] = useState<string>(ingredient.name);
  const [ripeness, setRipeness] = useState<string>(ingredient.ripeness);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    setIngredientName(ingredient.name);
    setBrandName(ingredient.brand);
    setCategory(ingredient.category);
    setLocation(ingredient.location);
    setConfectionType(ingredient.confectionType);
    setRipeness(ingredient.ripeness);
    setExpirationDate(ingredient.expirationDate);
  }, [ingredient]);

  const handleUpdateIngredient = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE ingredients SET name=?, category=?, location=?, confectionType=?, expirationDate=?, brand=?, ripeness=? WHERE id=?',
        [
          ingredientName,
          category,
          location,
          confectionType,
          expirationDate.toISOString(),
          brandName,
          confectionType === 'fresh' ? ripeness : null,
          ingredient.id,
        ],
        (_, resultSet) => {
          console.log('Ingredient updated successfully');
        },
        (_, error) => {
          console.log('Error updating ingredient:', error);
          return true;
        }
      );
    });
    navigation.navigate('IngredientsList');
  };

  const handleDayPress = (day: any) => {
    setExpirationDate(new Date(day.dateString));
    setDatePickerVisible(false);
  };

  const formatExpirationDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const openDatePicker = () => {
    setDatePickerVisible(true);
  };

  const closeDatePicker = () => {
    setDatePickerVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Ingredient</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingredient Name"
        value={ingredientName}
        onChangeText={setIngredientName}
      />
      <TextInput
        style={styles.input}
        placeholder="Brand Name"
        value={brandName}
        onChangeText={setBrandName}
      />
      <View style={styles.pickerContainer}>
        <PickerSelect
          placeholder={{ label: 'Category', value: null }}
          value={category}
          onValueChange={(value) => setCategory(value)}
          items={[
            { label: 'fruit', value: 'fruit' },
            { label: 'vegetable', value: 'vegetable' },
            { label: 'dairy', value: 'dairy' },
            { label: 'fish', value: 'fish' },
            { label: 'meat', value: 'meat' },
            { label: 'liquid', value: 'liquid' },
          ]}
        />
      </View>
      <View style={styles.pickerContainer}>
        <PickerSelect
          placeholder={{ label: 'Location', value: null }}
          value={location}
          onValueChange={(value) => setLocation(value)}
          items={[
            { label: 'fridge', value: 'fridge' },
            { label: 'freezer', value: 'freezer' },
            { label: 'pantry', value: 'pantry' },
          ]}
        />
      </View>
      <View style={styles.pickerContainer}>
        <PickerSelect
          placeholder={{ label: 'Confection Type', value: null }}
          value={confectionType}
          onValueChange={(value) => setConfectionType(value)}
          items={[
            { label: 'fresh', value: 'fresh' },
            { label: 'canned', value: 'canned' },
            { label: 'frozen', value: 'frozen' },
            { label: 'cured', value: 'cured' },
          ]}
        />
      </View>
      {confectionType === 'fresh' && (
        <View style={styles.pickerContainer}>
          <PickerSelect
            placeholder={{ label: 'Ripeness', value: null }}
            value={ripeness}
            onValueChange={(value) => setRipeness(value)}
            items={[
              {
                label: 'green',
                value: `green set on ${moment().format('DD/MM/YY')}`,
              },
              {
                label: 'ripe',
                value: `ripe set on ${moment().format('DD/MM/YY')}`,
              },
              {
                label: 'advanced',
                value: `advanced set on ${moment().format('DD/MM/YY')}`,
              },
              {
                label: 'too ripe',
                value: `too ripe set on ${moment().format('DD/MM/YY')}`,
              },
            ]}
          />
        </View>
      )}
      <View style={styles.pickerContainer}>
        <TouchableOpacity onPress={openDatePicker}>
          <Text>
            {expirationDate
              ? `Expiration Date: ${formatExpirationDate(expirationDate)}`
              : 'Select Expiration Date'}
          </Text>
        </TouchableOpacity>
      </View>
      <Button title="Update Ingredient" onPress={handleUpdateIngredient} />
      <Modal visible={isDatePickerVisible} animationType="slide">
        <View>
          <TouchableOpacity onPress={closeDatePicker}>
            <Text>Close</Text>
          </TouchableOpacity>
          <Calendar onDayPress={handleDayPress} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
});

export default EditIngredient;
