import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const db = SQLite.openDatabase('ingredient.db');

interface Ingredient {
  id: number;
  name: string;
  brand: string;
  category: string;
  location: string;
  confectionType: string;
  expirationDate: Date;
  open: boolean;
  ripeness: string;
}

const fetchIngredients = (
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>
) => {
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT * FROM ingredients',
      [],
      (_, resultSet) => {
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
            ripeness: row.ripeness,
            open: row.open,
            expirationDate: new Date(row.expirationDate),
          };
          fetchedIngredients.push(ingredient);
        }
        setIngredients(fetchedIngredients);
      },
      (_, error) => {
        console.log('Error fetching ingredients:', error);
        return true;
      }
    );
  });
};

const IngredientsList: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  /* useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS ingredients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          brand TEXT,
          category TEXT,
          location TEXT,
          confectionType TEXT,
          expirationDate TEXT
        );`
      );
    });
  }, []);*/

  useFocusEffect(
    React.useCallback(() => {
      fetchIngredients(setIngredients);
    }, [])
  );

  const formatExpirationDate = (date: Date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined);
  };

  const deleteIngredient = (id: number) => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM ingredients WHERE id = ?',
        [id],
        (_, resultSet) => {
          console.log('Ingredient deleted successfully');
          fetchIngredients(setIngredients);
        },
        (_, error) => {
          console.log('Error deleting ingredient:', error);
          return true;
        }
      );
    });
  };

  const handleEditPress = (ingredient: Ingredient) => {
    navigation.navigate('EditIngredient', { ingredient });
  };

  const handleFilterPress = () => {
    navigation.navigate('Filters');
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

          {item.ripeness !== '' && (
            <>
              <Text style={styles.label}>Ripeness:</Text>
              <Text style={styles.value}>{item.ripeness}</Text>
            </>
          )}

          {item.open === 1 && (
            <>
              <Text style={styles.label}>Open: yes</Text>
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

  const handleSearch = (query: string) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM ingredients WHERE name LIKE '%' || ? || '%'`,
        [query],
        (_, resultSet) => {
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
              ripeness: row.ripeness,
              open: row.open,
              expirationDate: new Date(row.expirationDate),
            };
            fetchedIngredients.push(ingredient);
          }
          setIngredients(fetchedIngredients);
        },
        (_, error) => {
          console.log('Error fetching ingredients:', error);
          return true;
        }
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Ingredients List
        <TouchableOpacity onPress={handleFilterPress}>
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search ingredient"
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          handleSearch(text);
        }}
      />

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
  ingredientContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  ingredientInfo: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  filterButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'blue',
    marginLeft: 35,
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

export default IngredientsList;
