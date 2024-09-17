import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './Home';
import IngredientForm from './Ingredients';
import IngredientsList from './IngredientsList';
import EditIngredient from './EditIngredient';
import Filters from './Filters';
import ExpireSoon from './ExpireSoon';
import CheckRipeness from './CheckRipeness';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="IngredientForm" component={IngredientForm} />
        <Stack.Screen name="IngredientsList" component={IngredientsList} />
        <Stack.Screen name="EditIngredient" component={EditIngredient} />
        <Stack.Screen name="Filters" component={Filters} />
        <Stack.Screen name="ExpireSoon" component={ExpireSoon} />
        <Stack.Screen name="CheckRipeness" component={CheckRipeness} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
