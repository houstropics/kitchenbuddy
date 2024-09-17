import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as SQLite from 'expo-sqlite';
import PickerSelect from 'react-native-picker-select';
import { BarCodeScanner, BarCodeScannedCallback } from 'expo-barcode-scanner';

const db = SQLite.openDatabase('ingredient.db');

type Ingredient = {
  name: string;
  brand: string;
  category: string;
  location: string;
  confectionType: string;
  ripeness: string;
  open: boolean;
  expirationDate: Date | null;
};

const Ingredients: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientName, setIngredientName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [confectionType, setConfectionType] = useState('');
  const [ripeness, setRipeness] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    location TEXT,
    confectionType TEXT,
    ripeness TEXT,
    open BOOLEAN,
    expirationDate TEXT,
    
  );`
      );
    });
  }, []);

  const fetchIngredients = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM ingredients',
        [],
        (_, resultSet) => {
          const rows = resultSet.rows;
          const ingredients = [];

          for (let i = 0; i < rows.length; i++) {
            const {
              id,
              name,
              brand,
              category,
              location,
              confectionType,
              ripeness,
              open,
              expirationDate,
            } = rows.item(i);
            ingredients.push({
              id,
              name,
              brand,
              category,
              location,
              confectionType,
              ripeness,
              open,
              expirationDate,
            });
          }

          console.log('Ingredients:', ingredients);
        },
        (_, error) => {
          console.log('Error fetching ingredients:', error);
          return true;
        }
      );
    });
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleAddIngredient = () => {
    if (ingredientName.trim() === '') {
      alert('Please enter the ingredient name.');
      return;
    }

    const ingredient: Ingredient = {
      name: ingredientName,
      brand: brandName,
      category: category,
      location: location,
      confectionType: confectionType,
      ripeness: ripeness,
      open: isOpen,
      expirationDate: isFrozen
        ? extendExpirationDate(expirationDate)
        : expirationDate,
    };

    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO ingredients (name, brand, category, location, confectionType, ripeness, `open`, expirationDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          ingredient.name,
          ingredient.brand,
          ingredient.category,
          ingredient.location,
          ingredient.confectionType,
          ingredient.ripeness,
          ingredient.open ? 1 : 0,
          ingredient.expirationDate
            ? ingredient.expirationDate.toISOString()
            : null,
        ],
        (_, resultSet) => {
          console.log('Ingredient inserted with ID:', resultSet.insertId);
          const savedIngredient = {
            id: resultSet.insertId,
            ...ingredient,
          };
          setIngredients([...ingredients, savedIngredient]);
        },
        (_, error) => {
          console.log('Error inserting ingredient:', error);
          return true;
        }
      );
    });

    setIngredients([...ingredients, ingredient]);
    setIngredientName('');
    setBrandName('');
    setCategory('');
    setLocation('');
    setConfectionType('');
    setRipeness('');
    setIsOpen(false);
    setExpirationDate(null);
  };

  const handleDateChange = (date: string) => {
    setExpirationDate(new Date(date));
  };

  const openDatePicker = () => {
    if (category !== 'vegetable') {
      setDatePickerVisible(true);
    }
  };

  const closeDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDayPress = (day: any) => {
    handleDateChange(day.dateString);
    closeDatePicker();
  };

  const formatExpirationDate = (date: Date | null) => {
    if (date) {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return '';
  };

  const handleAddDays = (days: number) => {
    const currentDate = new Date();
    const expirationDate = new Date(
      currentDate.getTime() + days * 24 * 60 * 60 * 1000
    );

    setExpirationDate(expirationDate);
  };

  const extendExpirationDate = (date: Date | null): Date | null => {
    if (date) {
      const extendedDate = new Date(date.getTime());
      extendedDate.setMonth(extendedDate.getMonth() + 6);
      return extendedDate;
    }
    return null;
  };

  const handleIsOpen = (value: boolean) => {
    setIsOpen(value);

    if (value) {
      const currentDate = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(currentDate.getDate() + 4);
      setExpirationDate(expirationDate);

      Alert.alert(
        'Ingredient Open',
        'Please consume the ingredient within 4 days.',
        [{ text: 'OK' }]
      );
    } else {
      setExpirationDate(null);
    }
  };

  const handleBarcodeScan = async () => {
    if (isScanning) {
      return;
    }

    const { status } = await BarCodeScanner.requestPermissionsAsync();

    if (status === 'granted') {
      setScannedBarcode(null);
      setIsScanning(true);
    } else {
      console.log('Camera permission not granted');
      return;
    }
  };

  const handleBarCodeScanned: BarCodeScannedCallback = async (scannedData) => {
    if (isScanning) {
      setIsScanning(false);

      const barcode = scannedData.data;

      try {
        const response = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
        );
        const data = await response.json();
        const productData = data.product;

        let brand = '';
        if (productData.brands) {
          brand = productData.brands;
        } else if (productData.manufacturer_name) {
          brand = productData.manufacturer_name;
        } else if (productData.producer_name) {
          brand = productData.producer_name;
        }

        setIngredientName(productData.product_name || '');
        setBrandName(brand || '');

        Alert.alert(
          'Scanning Successful',
          `Product: ${productData.product_name}\nBrand: ${brand}`,
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Error retrieving product data:', error);
      }
    }
  };

  const cancelBarcodeScan = () => {
    setIsScanning(false);
  };

  const renderExpirationButton = () => {
    if (category === 'vegetable') {
      return (
        <View style={styles.pickerContainer}>
          <PickerSelect
            placeholder={{ label: 'Expiration Days', value: null }}
            onValueChange={(value) => handleAddDays(value)}
            items={[
              { label: '1 week', value: 7 },
              { label: '2 weeks', value: 14 },
              { label: '10 days', value: 10 },
              { label: '1 month', value: 30 },
            ]}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.pickerContainer}>
          <TouchableOpacity onPress={openDatePicker}>
            <Text>
              {expirationDate
                ? `Select Expiration Date: ${formatExpirationDate(
                    expirationDate
                  )}`
                : 'Select Expiration Date'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  const renderRipenessPicker = () => {
    if (confectionType === 'fresh') {
      return (
        <View>
          <View style={styles.pickerContainer}>
            <PickerSelect
              placeholder={{ label: 'Ripeness', value: null }}
              value={ripeness}
              onValueChange={(value) => setRipeness(value)}
              items={[
                { label: 'green', value: 'green' },
                { label: 'ripe', value: 'ripe' },
                { label: 'advanced', value: 'advanced' },
                { label: 'too ripe', value: 'too ripe' },
              ]}
            />
          </View>
          <View style={styles.frozenContainer}>
            <Text style={styles.frozenText}>Frozen:</Text>
            <Switch value={isFrozen} onValueChange={setIsFrozen} />
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingredients</Text>
      <TouchableOpacity
        onPress={handleBarcodeScan}
        style={[styles.button, { marginBottom: 10 }]}>
        <Text style={styles.buttonText}>Scan with Barcode</Text>
      </TouchableOpacity>

      {isScanning && (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={styles.cancelScanButton}
            onPress={cancelBarcodeScan}>
            <Text style={styles.cancelScanText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {scannedBarcode && (
        <Text style={styles.scannedBarcodeText}>
          Scanned Barcode: {scannedBarcode}
        </Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="Ingredient Name"
        value={ingredientName}
        onChangeText={(text) => setIngredientName(text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Brand Name"
        value={brandName}
        onChangeText={(text) => setBrandName(text)}
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
            { label: 'dried', value: 'dried' },
            { label: 'cured', value: 'cured' },
          ]}
        />
      </View>
      {renderRipenessPicker()}
      <View style={styles.frozenContainer}>
        <Text style={styles.frozenText}>Open:</Text>
        <Switch value={isOpen} onValueChange={handleIsOpen} />
      </View>
      {renderExpirationButton()}

      <Button title="Add Ingredient" onPress={handleAddIngredient} />

      <View>
        {ingredients.map((ingredient, index) => (
          <Text key={index}>
            {ingredient.name} - {ingredient.brand} - {ingredient.category} -{' '}
            {ingredient.location} - {ingredient.confectionType} -{' '}
            {ingredient.ripeness} -{' '}
            {formatExpirationDate(ingredient.expirationDate)}
          </Text>
        ))}
      </View>

      <Modal visible={isDatePickerVisible} animationType="slide">
        <View>
          <Calendar onDayPress={handleDayPress} />
          <Button title="Close" onPress={closeDatePicker} />
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
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  frozenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  cancelScanButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelScanText: {
    fontSize: 16,
  },
  scannedBarcodeText: {
    fontSize: 16,
    marginTop: 16,
  },
  frozenText: {
    marginRight: 10,
  },
});

export default Ingredients;
