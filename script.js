const aleAPI = 'https://api.sampleapis.com/beers/ale';
const stoutsAPI = 'https://api.sampleapis.com/beers/stouts';
const currencyAPI = 'https://api.frankfurter.dev/v1/latest?base=EUR';

const beerGrid = document.getElementById('beer-grid');
const currencySelector = document.getElementById('currencySelector');

let beers = [];
let currentPage = 1;
const itemsPerPage = 30;
let exchangeRates = {};

async function fetchBeers(filterType = 'all') {
  beers = [];
  try {
    if (filterType === 'all' || filterType === 'ale') {
      const aleResponse = await fetch(aleAPI);
      const aleData = await aleResponse.json();
      beers = beers.concat(aleData);
    }
    if (filterType === 'all' || filterType === 'stouts') {
      const stoutsResponse = await fetch(stoutsAPI);
      const stoutsData = await stoutsResponse.json();
      beers = beers.concat(stoutsData);
    }

    // Shuffle the beers to display a random selection
    shuffleBeers();

    displayBeers();
  } catch (error) {
    console.error('Error fetching beers:', error);
    beerGrid.innerHTML = '<p>Error loading beers. Please try again later.</p>';
  }
}

function shuffleBeers() {
  for (let i = beers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [beers[i], beers[j]] = [beers[j], beers[i]]; // Swap elements
  }
}

function displayBeers() {
  beerGrid.innerHTML = '';
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBeers = beers.slice(startIndex, endIndex);

  currentBeers.forEach(beer => {
    const beerCard = document.createElement('div');
    beerCard.className = 'beer-card';
    const rating = beer.rating ? beer.rating.average : 0;
    const fullStars = Math.floor(rating);
    const partialStar = rating % 1;
    const emptyStars = 5 - fullStars - (partialStar > 0 ? 1 : 0);

    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<div class="star full"></div>';
    }
    if (partialStar > 0) {
        starsHTML += `<div class="star partial" style="--partial-width: ${partialStar * 100}%"></div>`;
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<div class="star empty"></div>';
    }

    beerCard.innerHTML = `
      <img 
        src="${beer.image || 'https://via.placeholder.com/150'}" 
        alt="${beer.name}" 
        onerror="this.onerror=null; this.src='https://via.placeholder.com/150';"
      >
      <h3>${beer.name}</h3>
      <div class="rating">
        <span class="rating-number">${rating.toFixed(1)}</span>
        <div class="stars">${starsHTML}</div>
        <p class="reviews">${beer.rating ? beer.rating.reviews : 'No reviews available'} Reviews</p>
        </div>
      <p class="price">${convertPrice(beer.price || 0)} ${currencySelector.value}</p>
    `;
    beerGrid.appendChild(beerCard);
  });
}


// Function to convert the price based on the selected currency
function convertPrice(price) {
  // Remove any non-numeric characters (e.g., $) and convert to float
  const priceFloat = parseFloat(price.replace(/[^\d.-]/g, ''));

  const selectedCurrency = currencySelector.value;
  const rate = exchangeRates[selectedCurrency] || 1;
  return (priceFloat * rate).toFixed(2);
}

document.getElementById('search-btn').addEventListener('click', async () => {
  const nameFilter = document.getElementById('filter-name').value.toLowerCase();
  const typeFilter = document.getElementById('filter-type').value;
  const ratingFilter = document.getElementById('filter-rating').value;

  await fetchBeers(typeFilter);

  beers = beers.filter(beer => {
    const matchesName = beer.name.toLowerCase().includes(nameFilter);
    let matchesRating = true;
    if (ratingFilter !== 'all') {
      const rating = beer.rating?.average || 0;
      const ratingValue = parseInt(ratingFilter);
      if (ratingValue === 5) {
        matchesRating = rating === 5;
      } else {
        matchesRating = rating >= ratingValue && rating < ratingValue + 1;
      }
    }
    return matchesName && matchesRating;
  });

  currentPage = 1;
  displayBeers();
});

document.getElementById('prev-page').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    displayBeers();
  }
});

document.getElementById('next-page').addEventListener('click', () => {
  if (currentPage * itemsPerPage < beers.length) {
    currentPage++;
    displayBeers();
  }
});

async function fetchCurrencyRates() {
  try {
    const response = await fetch(currencyAPI);
    const data = await response.json();
    exchangeRates = data.rates;

    // Populate the currency selector with available rates
    const currencySelectorHTML = Object.keys(exchangeRates).map(currency => 
      `<option value="${currency}">${currency}</option>`
    ).join('');
    currencySelector.innerHTML = `<option value="EUR">EUR</option>` + currencySelectorHTML;
    
    // Set default currency to EUR
    currencySelector.value = "EUR";

    currencySelector.addEventListener('change', updateBeerPrices);

  } catch (error) {
    console.error('Error fetching currency rates:', error);
  }
}

async function updateBeerPrices() {
  displayBeers();
}

fetchBeers();
fetchCurrencyRates();
