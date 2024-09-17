import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('ingredient.db');

interface Ingredient {
  id: number;
  name: string;
  category: string;
  location: string;
  confectionType: string;
  open: boolean;
  ripeness: string;
  expirationDate: Date;
}

const ExpireSoon: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filterDays, setFilterDays] = useState<number | null>(null);

  const fetchIngredients = React.useCallback(() => {
    db.transaction((tx) => {
      let query = 'SELECT * FROM ingredients';

      if (filterDays !== null) {
        const currentDate = new Date();
        const expirationDate = new Date(
          currentDate.getTime() + filterDays * 24 * 60 * 60 * 1000
        );
        query += ' WHERE expirationDate <= ?';
        query += ' ORDER BY expirationDate ASC';
        tx.executeSql(
          query,
          [expirationDate.toISOString().split('T')[0]],
          (_, resultSet) => {
            const fetchedIngredients: Ingredient[] = [];
            for (let i = 0; i < resultSet.rows.length; i++) {
              const row = resultSet.rows.item(i);
              const ingredient: Ingredient = {
                id: row.id,
                name: row.name,
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
          }
        );
      } else {
        setIngredients([]);
      }
    });
  }, [filterDays]);

  React.useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleFilterPress = (days: number) => {
    setFilterDays(days);
    fetchIngredients();
  };

 const handleExpirationList = () => {
  db.transaction((tx) => {
    let query =
      'SELECT * FROM ingredients WHERE (ripeness = ? OR open = ?) AND confectionType != ?';
    tx.executeSql(
      query,
      ['ripe', 1, 'frozen'],
      (_, resultSet) => {
        const fetchedIngredients: Ingredient[] = [];
        for (let i = 0; i < resultSet.rows.length; i++) {
          const row = resultSet.rows.item(i);
          const ingredient: Ingredient = {
            id: row.id,
            name: row.name,
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
      }
    );
  });
};


  const clearFilter = () => {
    setFilterDays(null);
    fetchIngredients();
  };

  const getExpirationStatus = (expirationDate: Date): string => {
    const today = new Date();
    const difference = expirationDate.getTime() - today.getTime();
    const daysUntilExpiration = Math.ceil(difference / (1000 * 3600 * 24));

    if (daysUntilExpiration < 1) {
      return 'Expired';
    } else if (daysUntilExpiration === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${daysUntilExpiration} days`;
    }
  };

  const renderIngredient = ({ item }: { item: Ingredient }) => {
    const expirationStatus = getExpirationStatus(item.expirationDate);

    return (
      <View style={styles.ingredientContainer}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{item.name}</Text>
        <Text style={styles.label}>Category:</Text>
        <Text style={styles.value}>{item.category}</Text>
        <Text style={styles.label}>Location:</Text>
        <Text style={styles.value}>{item.location}</Text>
        <Text style={styles.label}>Confection Type:</Text>
        <Text style={styles.value}>{item.confectionType}</Text>
        <Text style={styles.label}>Expiration Date:</Text>
        <Text style={styles.value}>{item.expirationDate.toISOString()}</Text>
        <Text style={styles.label}>Expiration Status:</Text>
        <Text style={styles.value}>{expirationStatus}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleExpirationList}>
          <Text style={styles.buttonText}>Expirationlist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => handleFilterPress(7)}>
          <Text style={styles.buttonText}>Expires in 7 days</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => handleFilterPress(14)}>
          <Text style={styles.buttonText}>Expires in 14 days</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => handleFilterPress(30)}>
          <Text style={styles.buttonText}>Expires in 30 days</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilter}>
          <Text style={styles.buttonText}>Clear Filter</Text>
        </TouchableOpacity>
      </View>

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
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  clearButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
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
});

export default ExpireSoon;
