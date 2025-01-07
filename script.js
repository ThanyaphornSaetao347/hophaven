const aleAPI = 'https://api.sampleapis.com/beers/ale';
const stoutsAPI = 'https://api.sampleapis.com/beers/stouts';
const currencyAPI = 'https://api.frankfurter.dev/v1/latest?base=EUR';
// aleAPI และ stoutsAPI ใช้สำหรับดึงข้อมูลเบียร์ประเภท Ale และ Stouts
// currencyAPI ใช้สำหรับดึงข้อมูลอัตราแลกเปลี่ยนสกุลเงิน

const beerGrid = document.getElementById('beer-grid');// beerGrid: ใช้แสดงรายการเบียร์
const currencySelector = document.getElementById('currencySelector');// currencySelector: ใช้เลือกสกุลเงิน

let beers = [];// beers: เก็บข้อมูลเบียร์ทั้งหมด
let currentPage = 1;// currentPage: หน้าปัจจุบัน
const itemsPerPage = 30;// itemsPerPage: จำนวนเบียร์ที่แสดงต่อหน้า
let exchangeRates = {};// exchangeRates: เก็บอัตราแลกเปลี่ยนสกุลเงิน

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
    shuffleBeers();// สุ่มลำดับเบียร์

    displayBeers();// แสดงผลเบียร์
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
  // ใช้อัลกอริทึม Fisher-Yates Shuffle เพื่อสุ่มลำดับของข้อมูลใน beers
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
  // แปลงราคาจากข้อมูลเบียร์ให้เป็นสกุลเงินที่เลือกโดยใช้อัตราแลกเปลี่ยน
}

document.getElementById('search-btn').addEventListener('click', async () => { // addEventListener เพื่อกำหนดให้ฟังก์ชันทำงานเมื่อผู้ใช้งานคลิกปุ่มค้นหา
  const nameFilter = document.getElementById('filter-name').value.toLowerCase();
  // อ่านค่าชื่อที่ผู้ใช้กรอกในช่องค้นหา (filter-name) และแปลงเป็นตัวพิมพ์เล็กด้วย .toLowerCase() เพื่อให้การค้นหาไม่สนใจตัวพิมพ์เล็กหรือใหญ่
  const typeFilter = document.getElementById('filter-type').value;
  // อ่านค่าประเภทเบียร์ที่เลือก (filter-type) เช่น ale, stouts หรือ all
  const ratingFilter = document.getElementById('filter-rating').value;
  // อ่านค่าคะแนนที่เลือก (filter-rating) เช่น all, 1, 2, ..., 5

  await fetchBeers(typeFilter); // เรียกฟังก์ชัน fetchBeers(typeFilter) เพื่อดึงข้อมูลเบียร์ตามประเภทที่เลือก
// ใช้ await เพื่อรอให้ข้อมูลถูกดึงมาเสร็จก่อนดำเนินการต่อ

  beers = beers.filter(beer => {
    const matchesName = beer.name.toLowerCase().includes(nameFilter); 
    // ใช้ .includes() เพื่อตรวจสอบว่าชื่อเบียร์ (beer.name) มีคำที่ผู้ใช้กรอกอยู่หรือไม่ (ไม่สนใจตัวพิมพ์เล็กหรือใหญ่)
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
    return matchesName && matchesRating; // คืนค่าข้อมูลเบียร์ที่ตรงกับทั้งชื่อและคะแนน
  });

  currentPage = 1; // ตั้งค่าหน้าปัจจุบัน (currentPage) เป็นหน้าแรก (1)
  displayBeers(); // เรียกฟังก์ชัน displayBeers() เพื่อแสดงผลเบียร์ที่ผ่านการกรอง
});

document.getElementById('prev-page').addEventListener('click', () => {
  if (currentPage > 1) {// ตรวจสอบเมื่อกดปุ่มก่อนหน้าว่าหมายเลขหน้าปัจจุบัน > 1 หรือไม่ ถ้ามากกว่า 1 จะทำการลดค่าของ current page ลง 1 เพื่อเปลี่ยนไปยังหน้าก่อนหน้า
    currentPage--;// หาก currentPage เท่ากับ 1 จะไม่ทำอะไร
    displayBeers(); // เรียกใช้ฟังก์ชันdisplayBeers() เพื่อแสดงผลข้อมูลเบียร์ของหน้าก่อนหน้า
  }
});

document.getElementById('next-page').addEventListener('click', () => {
  if (currentPage * itemsPerPage < beers.length) { 
    // currentPage คือหมายเลขหน้าปัจจุบัน itemsPerPage คือจำนวนข้อมูลที่แสดงต่อหน้า (เช่น 30 รายการ) 
    // beers.length คือจำนวนข้อมูลเบียร์ทั้งหมด 
    // เงื่อนไขนี้ตรวจสอบว่ามีข้อมูลที่ยังไม่ได้แสดงในหน้าถัดไปหรือไม่
    currentPage++;
    displayBeers();
    // หากเงื่อนไขเป็นจริง:
    // เพิ่มค่าของ currentPage ขึ้น 1 (เปลี่ยนไปยังหน้าถัดไป)
    // เรียกฟังก์ชัน displayBeers() เพื่อแสดงผลข้อมูลเบียร์ของหน้าถัดไป
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
// ดึงข้อมูลอัตราแลกเปลี่ยนจาก API
// อัปเดตตัวเลือกสกุลเงินใน currencySelector


async function updateBeerPrices() {
  displayBeers();
}

fetchBeers();
fetchCurrencyRates();
// เรียกฟังก์ชัน fetchBeers และ fetchCurrencyRates เพื่อดึงข้อมูลเบื้องต้นและเริ่มต้นแสดงผล