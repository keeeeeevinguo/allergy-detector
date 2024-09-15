// content_script.js
// Open Food Facts API URL
const openFoodFactsSearchUrl = 'https://world.openfoodfacts.org/cgi/search.pl';
const openFoodFactsProductUrl = 'https://world.openfoodfacts.org/api/v0/product/';

// Function to search for a product by name and get its barcode
async function searchProductByName(productName) {
  const searchUrl = `${openFoodFactsSearchUrl}?search_terms=${encodeURI(productName)}&search_simple=1&action=process&json=1`;
  console.log('search url is ', searchUrl);
  try {
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.products && data.products.length > 0) {
      // Return the first product's code (barcode)
      console.log('Found product. barcode is: ', data.products[0].code);
      return data.products[0].code;
    } else {
      console.log('No product found with that name.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching product data:', error);
    return null;
  }
}

// Function to get ingredients for a product using its barcode
async function getProductIngredientsByBarcode(barcode) {
  const productUrl = `${openFoodFactsProductUrl}${barcode}.json`;

  try {
    const response = await fetch(productUrl);
    const productData = await response.json();

    if (productData && productData.product && productData.product.ingredients_text) {
      return productData.product.ingredients_text;
    } else {
      console.log('No ingredients found for this product.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return null;
  }
}

// Function to search for a product by name and get its ingredients
async function getProductIngredientsByName(productName) {
  const barcode = await searchProductByName(productName);
  if (barcode) {
    const ingredients = await getProductIngredientsByBarcode(barcode);
    return ingredients;
  } else {
    console.log('Could not find product ingredients.');
    return null;
  }
}

// Function to scrape the Instacart cart for product information
function scrapeCart() {
  let cartItems = document.querySelectorAll('div.e-b311fy');
  console.log('Found cart items: ', cartItems);
  let foundProducts = [];

  cartItems.forEach(item => {
    let productName = item.querySelector('div.e-19z482m').innerText;

    if (productName) {
      foundProducts.push(productName);
    }
  });

  return foundProducts;
}

// content_script.js

chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
  console.log('heard message: ', message);
  if (message.action === 'checkCartForBadIngredients') {
    processMessage(message).then(sendResponse);
    return true;
  }
});
async function processMessage(msg) {
  try{
      console.log('scraping cart');
      let cartData = scrapeCart();
      console.log('scraped cart:', cartData);
      let flaggedIngredients = [];
      for (let product of cartData) {
        let ingredients = await getProductIngredientsByName(product);
        if (ingredients) {
          // Check if any of the saved bad ingredients are in the product ingredients
          let savedBadIngredients = await new Promise((resolve) => {
            chrome.storage.local.get(['savedBadIngredients'], (result) => {
              resolve(result.savedBadIngredients || []);
            });
          });

          savedBadIngredients.forEach(badIngredient => {
            if (ingredients.toLowerCase().includes(badIngredient.toLowerCase())) {
              flaggedIngredients.push(`${product} contains ${badIngredient}`);
            }
          });
          console.log('flagged ingredients are', flaggedIngredients);
        }
      }
     return {flaggedIngredients};

    } catch (error) {
      console.error('Error scraping cart:', error);
      return { flaggedIngredients: [] };
    }

    // Indicate that the response is asynchronous
    return true;
  }

