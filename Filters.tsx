import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import PickerSelect from 'react-native-picker-select';

const db = SQLite.openDatabase('ingredient.db');

interface Ingredient {
  id: number;
  name: string;
  brand: string;
  category: string;
  location: string;
  confectionType: string;
  expirationDate: Date;
}

const Filters: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filterType, setFilterType] = useState<string>('expireSoon');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedCategoryOrType, setSelectedCategoryOrType] =
    useState<string>('');

  const navigation = useNavigation();

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS ingredients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT,
          location TEXT,
          confectionType TEXT,
          expirationDate TEXT
        );`
      );
    });
  }, []);

  const fetchIngredients = useCallback(() => {
    db.transaction((tx) => {
      let query = 'SELECT * FROM ingredients';
      let queryParams: any[] = [];

      switch (filterType) {
        case 'recent':
          query += ' ORDER BY id DESC LIMIT 5';
          break;
        case 'missingData':
          query +=
            ' WHERE category = "" OR location = "" OR confectionType = "" OR expirationDate = ""';
          break;
        case 'sameLocation':
          query += ' WHERE location = ?';
          queryParams.push(selectedLocation);
          break;
        case 'sameCategoryOrType':
          query += ' WHERE category = ? OR confectionType = ?';
          queryParams.push(selectedCategoryOrType, selectedCategoryOrType);
          break;
        default:
          break;
      }

      tx.executeSql(query, queryParams, (_, resultSet) => {
        const fetchedIngredients: Ingredient[] = [];
        for (let i = 0; i < resultSet.rows.length; i++) {
          const row = resultSet.rows.item(i);
          const ingredient: Ingredient = {
            id: row.id,
            name: row.name,
            brand: row.brand,
            category: row.category,
            location: row.location,
            confectionType: row.confectionType,
            expirationDate: new Date(row.expirationDate),
          };
          fetchedIngredients.push(ingredient);
        }
        setIngredients(fetchedIngredients);
      });
    });
  }, [filterType, selectedLocation, selectedCategoryOrType]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleFilterPress = (value: string) => {
    if (value === 'expireSoon') {
      navigation.navigate('ExpireSoon');
    } else if (value === 'sameLocation') {
      setSelectedLocation('');
      setFilterType(value);
    } else if (value === 'checkRipeness') {
      navigation.navigate('CheckRipeness');
    } else {
      setFilterType(value);
    }
  };

  const deleteIngredient = (id: number) => {
    db.transaction((tx) => {
      tx.executeSql('DELETE FROM ingredients WHERE id = ?', [id]);
    });
  };

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
  };

  const handleCategoryOrTypeChange = (value: string) => {
    setSelectedCategoryOrType(value);
  };

  const handleEditPress = (ingredient: Ingredient) => {
    navigation.navigate('EditIngredient', { ingredient });
  };

  const formatExpirationDate = (date: Date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined);
  };

  const renderIngredient = ({ item }: { item: Ingredient }) => {
    return (
      <View style={styles.ingredientContainer}>
        <View style={styles.ingredientInfo}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{item.name}</Text>

          {item.brand !== '' && (
            <>
              <Text style={styles.label}>Brand:</Text>
              <Text style={styles.value}>{item.brand}</Text>
            </>
          )}

          {item.category !== '' && (
            <>
              <Text style={styles.label}>Category:</Text>
              <Text style={styles.value}>{item.category}</Text>
            </>
          )}

          {item.location !== '' && (
            <>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>{item.location}</Text>
            </>
          )}

          {item.confectionType !== '' && (
            <>
              <Text style={styles.label}>Confection Type:</Text>
              <Text style={styles.value}>{item.confectionType}</Text>
            </>
          )}

          {item.expirationDate !== null &&
            item.expirationDate !== undefined &&
            item.expirationDate.getTime() !== 0 && (
              <>
                <Text style={styles.label}>Expiration Date:</Text>
                <Text style={styles.value}>
                  {formatExpirationDate(item.expirationDate)}
                </Text>
              </>
            )}
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditPress(item)}>
          <Text style={styles.editButtonText}>EDIT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteIngredient(item.id)}>
          <Text style={styles.deleteButtonText}>DEL</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter Ingredients</Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleFilterPress('expireSoon')}>
          <Text style={styles.buttonText}>Expire Soon</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleFilterPress('checkRipeness')}>
          <Text style={styles.buttonText}>Check Ripeness</Text>
        </TouchableOpacity>

        <View style={styles.pickerContainer}>
          <PickerSelect
            value={filterType}
            onValueChange={handleFilterPress}
            items={[
              { label: 'Recent', value: 'recent' },
              { label: 'Missing Data', value: 'missingData' },
              { label: 'Same Location', value: 'sameLocation' },
              { label: 'Same Category or Type', value: 'sameCategoryOrType' },
            ]}
          />
        </View>
      </View>

      {filterType === 'sameLocation' && (
        <View style={styles.locationPickerContainer}>
          <PickerSelect
            value={selectedLocation}
            onValueChange={handleLocationChange}
            items={[
              { label: 'Fridge', value: 'fridge' },
              { label: 'Pantry', value: 'pantry' },
              { label: 'Freezer', value: 'freezer' },
            ]}
          />
        </View>
      )}

      {filterType === 'sameCategoryOrType' && (
        <View style={styles.locationPickerContainer}>
          <PickerSelect
            value={selectedCategoryOrType}
            onValueChange={handleCategoryOrTypeChange}
            items={[
              { label: 'vegetable', value: 'vegetable' },
              { label: 'fruit', value: 'fruit' },
              { label: 'dairy', value: 'dairy' },
              { label: 'fish', value: 'fish' },
              { label: 'meat', value: 'meat' },
              { label: 'liquid', value: 'liquid' },
              { label: 'fresh', value: 'fresh' },
              { label: 'canned', value: 'canned' },
              { label: 'frozen', value: 'frozen' },
              { label: 'cured', value: 'cured' },
            ]}
          />
        </View>
      )}

      <FlatList
        data={ingredients}
        renderItem={renderIngredient}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  ingredientInfo: {
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f2f2f2',
  },
  locationPickerContainer: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f2f2f2',
  },
  ingredientContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    marginBottom: 10,
  },
  editButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ccc',
    borderRadius: 5,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 40,
    backgroundColor: 'red',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Filters;
