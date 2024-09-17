import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import * as SQLite from 'expo-sqlite';

type Ingredient = {
  id: number;
  name: string;
  ripeness: string;
  open: number;
  lastCheckedDate: string | null;
};

type CheckRipeness = {
  id: number;
  ingredientId: number;
  date: string;
};

const db = SQLite.openDatabase('ingredient.db');

const CheckRipeness: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [checkRipenessTable, setCheckRipenessTable] = useState<CheckRipeness[]>(
    []
  );
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([]);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      await createTables();
      await fetchIngredients();
      await fetchCheckRipenessTable();
    } catch (error) {
      console.log('Error initializing database:', error);
    }
  };

  const createTables = async () => {
    return new Promise<void>((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'CREATE TABLE IF NOT EXISTS ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, ripeness TEXT, open INTEGER DEFAULT 0, lastCheckedDate TEXT)',
            [],
            () => {
              resolve();
            },
            (_, error) => {
              console.log('Error creating ingredients table:', error);
              reject(error);
              return true;
            }
          );

          tx.executeSql(
            'CREATE TABLE IF NOT EXISTS checkripeness (id INTEGER PRIMARY KEY AUTOINCREMENT, ingredientId INTEGER, date TEXT, FOREIGN KEY (ingredientId) REFERENCES ingredients (id))',
            [],
            () => {
              resolve();
            },
            (_, error) => {
              console.log('Error creating checkripeness table:', error);
              reject(error);
              return true;
            }
          );
        },
        (error) => {
          console.log('Error creating tables:', error);
          reject(error);
        },
        () => {
          resolve();
        }
      );
    });
  };

  const fetchIngredients = async () => {
    return new Promise<void>((resolve, reject) => {
      db.transaction(
        (tx) => {
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
                  ripeness: row.ripeness,
                  open: row.open,
                  lastCheckedDate: row.lastCheckedDate,
                };
                fetchedIngredients.push(ingredient);
              }
              setIngredients(fetchedIngredients);
              resolve();
            },
            (_, error) => {
              console.log('Error fetching ingredients:', error);
              reject(error);
              return true;
            }
          );
        },
        (error) => {
          console.log('Error executing fetchIngredients transaction:', error);
          reject(error);
        }
      );
    });
  };

  const fetchCheckRipenessTable = async () => {
    return new Promise<void>((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'SELECT * FROM checkripeness',
            [],
            (_, resultSet) => {
              const fetchedCheckRipenessTable: CheckRipeness[] = [];
              for (let i = 0; i < resultSet.rows.length; i++) {
                const row = resultSet.rows.item(i);
                const checkRipeness: CheckRipeness = {
                  id: row.id,
                  ingredientId: row.ingredientId,
                  date: row.date,
                };
                fetchedCheckRipenessTable.push(checkRipeness);
              }
              setCheckRipenessTable(fetchedCheckRipenessTable);
              resolve();
            },
            (_, error) => {
              console.log('Error fetching checkripeness table:', error);
              reject(error);
              return true;
            }
          );
        },
        (error) => {
          console.log(
            'Error executing fetchCheckRipenessTable transaction:',
            error
          );
          reject(error);
        }
      );
    });
  };

  const toggleSwitch = (ingredientId: number) => {
    const today = new Date();
    const date = today.toISOString().split('T')[0];

    db.transaction(
      (tx) => {
        tx.executeSql(
          'INSERT INTO checkripeness (ingredientId, date) VALUES (?, ?)',
          [ingredientId, date],
          (_, resultSet) => {
            if (resultSet.rowsAffected > 0) {
              setCheckedIngredients([...checkedIngredients, ingredientId]);
              updateIngredientLastCheckedDate(ingredientId, date);
              console.log('CheckRipeness table:', checkRipenessTable);
            }
          },
          (_, error) => {
            console.log('Error inserting checkripeness record:', error);
            return true;
          }
        );
      },
      (error) => {
        console.log('Error executing toggleSwitch transaction:', error);
      }
    );
  };

  const updateIngredientLastCheckedDate = (
    ingredientId: number,
    date: string
  ) => {
    const updatedIngredients = ingredients.map((ingredient) => {
      if (ingredient.id === ingredientId) {
        return { ...ingredient, lastCheckedDate: date };
      }
      return ingredient;
    });
    setIngredients(updatedIngredients);
  };

  const getIngredientLastCheckedDate = (ingredientId: number) => {
    const checkRipenessRecord = checkRipenessTable.find(
      (record) => record.ingredientId === ingredientId
    );
    if (checkRipenessRecord) {
      return checkRipenessRecord.date;
    }
    return null;
  };

  useEffect(() => {
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];

    const updateOpenStatus = () => {
      const updatedIngredients = ingredients.map((ingredient) => {
        if (ingredient.ripeness && ingredient.lastCheckedDate) {
          const lastCheckedDate = new Date(ingredient.lastCheckedDate);
          const differenceInDays = Math.floor(
            (today - lastCheckedDate) / (1000 * 60 * 60 * 24)
          );
          if (differenceInDays > 3) {
            return { ...ingredient, open: 1 };
          }
        }
        return ingredient;
      });
      setIngredients(updatedIngredients);
    };

    updateOpenStatus();

    db.transaction(
      (tx) => {
        tx.executeSql(
          'UPDATE ingredients SET open = ? WHERE ripeness IS NOT NULL AND lastCheckedDate != ? AND open = ?',
          [1, todayDate, 0],
          (_, resultSet) => {
            if (resultSet.rowsAffected > 0) {
              console.log('Updated open status for ingredients.');
            }
          },
          (_, error) => {
            console.log('Error updating open status:', error);
            return true;
          }
        );
      },
      (error) => {
        console.log('Error executing updateOpenStatus transaction:', error);
      }
    );
  }, [ingredients]);

  return (
    <View style={styles.container}>
      <Text style={styles.checkRipenessText}>Check Ripeness:</Text>
      {ingredients
        .filter((ingredient) => ingredient.ripeness)
        .map((ingredient) => (
          <View style={styles.ingredientItem} key={ingredient.id}>
            <View style={styles.textContainer}>
              <Text style={styles.text}>
                Ingredient Name: {ingredient.name}
              </Text>
              <Text style={styles.text}>Ripeness: {ingredient.ripeness}</Text>
              {checkedIngredients.includes(ingredient.id) && (
                <Text style={styles.lastCheckedText}>
                  Last check on: {getIngredientLastCheckedDate(ingredient.id)}
                </Text>
              )}
            </View>
            <Switch
              value={checkedIngredients.includes(ingredient.id)}
              onValueChange={() => toggleSwitch(ingredient.id)}
            />
          </View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkRipenessText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  textContainer: {
    marginRight: 10,
  },
  text: {
    fontSize: 16,
  },
  lastCheckedText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default CheckRipeness;
