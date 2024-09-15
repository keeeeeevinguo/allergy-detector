document.addEventListener('DOMContentLoaded', function() {
  const badIngredientsTextArea = document.getElementById('badIngredients');
  const savedBadIngredientsList = document.getElementById('savedBadIngredients');
  const saveBtn = document.getElementById('saveBtn');
  let savedBadIngredients = [];

  // Emoji mapping for common ingredients
  const ingredientEmojis = {
    nuts: '🥜',
    peanuts: '🥜',
    wheat: '🌾',
    shrimp: '🍤',
    gluten: '🍞',
    chicken: '🐓',
    beef: '🥩',
    pork: '🐖',
    lamb: '🐑',
    milk: '🥛',
    dairy: '🥛',
    gluten: '🌾',
    mustard: '🌼',
    grapes: '🍇',
    garlic: '🧄	',
    lemon: '🍋',
    pineapple: '🍍',
    melon: '🍈',
    'seed oil': '🌻',
    'high fructose corn syrup': '🍬',
    sugar: '🍭',
    eggs: '🥚',
    fish: '🐟',
    seafood: '🐟',
    sushi: '🍣',
    shellfish: '🦞',
    soy: '🌱'
  };

  // Function to get the emoji corresponding to an ingredient
  function getIngredientEmoji(ingredient) {
    ingredient = ingredient.toLowerCase();
    return ingredientEmojis[ingredient] || '☠️'; // Default emoji if no match found
  }

  // Function to render the list of saved ingredients with emojis
  function renderSavedIngredients() {
    // Clear the current list
    savedBadIngredientsList.innerHTML = '';

    // Append each saved ingredient as a list item with an emoji
    savedBadIngredients.forEach((ingredient) => {
      const listItem = document.createElement('li');
      const emoji = getIngredientEmoji(ingredient);  // Get emoji for ingredient
      listItem.textContent = `${ingredient} ${emoji} `;  // Display emoji with ingredient name
      savedBadIngredientsList.appendChild(listItem);
    });
  }

  // Load saved bad ingredients when the popup is opened
  chrome.storage.local.get(['savedBadIngredients'], function(result) {
    if (result.savedBadIngredients) {
      console.log('Loaded ingredients:', result.savedBadIngredients); // Debugging
      savedBadIngredients = result.savedBadIngredients;
      renderSavedIngredients();  // Render the ingredients in the list
    } else {
      console.log('No ingredients found'); // Debugging
    }
  });

  // Save new bad ingredients when the Save button is clicked
  saveBtn.addEventListener('click', function() {
    const newIngredients = badIngredientsTextArea.value.split(',').map(ingredient => ingredient.trim()).filter(Boolean);

    if (newIngredients.length > 0) {
      // Append the new ingredients to the saved list
      savedBadIngredients = savedBadIngredients.concat(newIngredients);

      // Clear the input field
      badIngredientsTextArea.value = '';

      // Save the updated ingredients list to Chrome storage
      chrome.storage.local.set({ savedBadIngredients: savedBadIngredients }, function() {
        console.log('Bad ingredients saved:', savedBadIngredients); // Debugging
      });

      // Re-render the updated list with emojis
      renderSavedIngredients();
    } else {
      alert('Please enter at least one ingredient.');
    }
  });
  // Check cart for bad ingredients when check button is clicked
  checkIngredientsBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs.length === 0) {
        console.error('No active tab found.');
        return;
      }
      
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content_script.js']
      }, function() {
        console.log('Sending message to content script...');
        chrome.tabs.sendMessage(tabs[0].id, { action: 'checkCartForBadIngredients' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }
        console.log('Response from content script:', response);
        if (response && response.flaggedIngredients.length > 0) {
          alert('Found flagged ingredients: ' + response.flaggedIngredients.join(', '));
        } else {
          alert('No flagged ingredients found.');
        }
      });
    });
  });
    
  });
});
