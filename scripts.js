// Food Bank Finder App
let results = [];
let currentIndex = 0;
let currentView = ‘list’;
let userLocation = null;

// Initialize app
document.addEventListener(‘DOMContentLoaded’, function() {
bindEvents();
checkOnlineStatus();
});

function bindEvents() {
document.getElementById(‘searchBtn’).addEventListener(‘click’, search);
document.getElementById(‘addressInput’).addEventListener(‘keypress’, (e) => {
if (e.key === ‘Enter’) search();
});

```
document.getElementById('listViewBtn').addEventListener('click', () => switchView('list'));
document.getElementById('mapViewBtn').addEventListener('click', () => switchView('map'));

document.getElementById('prevBtn').addEventListener('click', () => navigate(-1));
document.getElementById('nextBtn').addEventListener('click', () => navigate(1));

document.getElementById('statusFilter').addEventListener('change', displayResults);
document.getElementById('distanceFilter').addEventListener('change', displayResults);

document.getElementById('addLocationBtn').addEventListener('click', openModal);
document.querySelector('.close').addEventListener('click', closeModal);
document.getElementById('addLocationForm').addEventListener('submit', addLocation);

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
```

}

async function search() {
const address = document.getElementById(‘addressInput’).value.trim();
if (!address) {
alert(‘Please enter an address’);
return;
}

```
showLoading(true);

try {
    userLocation = await geocodeAddress(address);
    const locations = await findFoodBanks(userLocation);
    results = calculateDistances(locations, userLocation);
    currentIndex = 0;
    displayResults();
    saveToCache();
} catch (error) {
    showError('Search failed. Please try again.');
} finally {
    showLoading(false);
}
```

}

async function geocodeAddress(address) {
const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
const data = await response.json();

```
if (data.length === 0) throw new Error('Address not found');

return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon)
};
```

}

async function findFoodBanks(coords) {
// Mock data - replace with real API calls
return [
{
name: “Central Food Bank”,
address: “123 Main St”,
lat: coords.lat + 0.01,
lng: coords.lng + 0.01,
type: “food-bank”,
phone: “(555) 123-4567”,
hours: “Mon-Fri 9AM-5PM”,
status: “open”
},
{
name: “Community Pantry”,
address: “456 Oak Ave”,
lat: coords.lat + 0.02,
lng: coords.lng - 0.01,
type: “pantry”,
phone: “(555) 234-5678”,
hours: “Wed 10AM-2PM”,
status: “closed”
}
];
}

function calculateDistances(locations, userCoords) {
return locations.map(location => {
const distance = getDistance(userCoords.lat, userCoords.lng, location.lat, location.lng);
return { …location, distance };
}).sort((a, b) => a.distance - b.distance);
}

function getDistance(lat1, lng1, lat2, lng2) {
const R = 3959; // miles
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLng = (lng2 - lng1) * Math.PI / 180;
const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
Math.sin(dLng/2) * Math.sin(dLng/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
return R * c;
}

function displayResults() {
const container = document.getElementById(‘resultsContainer’);
const header = document.getElementById(‘resultsHeader’);

```
const filtered = applyFilters();

if (filtered.length === 0) {
    container.innerHTML = '<p class="loading">No locations found</p>';
    header.classList.add('hidden');
    return;
}

header.classList.remove('hidden');
document.getElementById('resultsCount').textContent = `${filtered.length} locations found`;

if (currentView === 'list') {
    displayList(filtered);
} else {
    displayMap();
}

updateNavigation();
```

}

function displayList(locations) {
const container = document.getElementById(‘resultsContainer’);

```
container.innerHTML = locations.map((loc, index) => `
    <div class="location-card ${index === currentIndex ? 'highlighted' : ''}">
        <div class="location-header">
            <div>
                <div class="location-name">${loc.name}</div>
                <div class="location-type">${formatType(loc.type)}</div>
            </div>
            <div class="location-distance">${loc.distance.toFixed(1)} mi</div>
        </div>
        
        <div class="location-address">📍 ${loc.address}</div>
        <div class="location-hours">🕒 ${loc.hours}</div>
        
        <div class="location-contact">
            ${loc.phone ? `<a href="tel:${loc.phone}" class="contact-btn">📞 Call</a>` : ''}
            <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc.address)}" target="_blank" class="contact-btn">🚗 Directions</a>
        </div>
    </div>
`).join('');
```

}

function displayMap() {
document.getElementById(‘map’).innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0;"> <div style="text-align: center; color: #666;"> <div style="font-size: 48px;">🗺️</div> <div>Map integration would go here</div> </div> </div>`;
}

function applyFilters() {
const status = document.getElementById(‘statusFilter’).value;
const distance = parseFloat(document.getElementById(‘distanceFilter’).value);

```
return results.filter(loc => {
    if (loc.distance > distance) return false;
    if (status === 'open' && loc.status !== 'open') return false;
    if (status === 'opening-soon' && loc.status !== 'opening-soon') return false;
    return true;
});
```

}

function switchView(view) {
currentView = view;
document.querySelectorAll(’.view-toggle button’).forEach(btn => btn.classList.remove(‘active’));
document.getElementById(`${view}ViewBtn`).classList.add(‘active’);

```
document.getElementById('listView').classList.toggle('hidden', view !== 'list');
document.getElementById('mapView').classList.toggle('hidden', view !== 'map');

displayResults();
```

}

function navigate(direction) {
const filtered = applyFilters();
currentIndex = Math.max(0, Math.min(filtered.length - 1, currentIndex + direction));
displayResults();
}

function updateNavigation() {
const filtered = applyFilters();
document.getElementById(‘prevBtn’).disabled = currentIndex === 0;
document.getElementById(‘nextBtn’).disabled = currentIndex >= filtered.length - 1;
document.getElementById(‘currentIndex’).textContent = `${currentIndex + 1} of ${filtered.length}`;
}

function openModal() {
document.getElementById(‘addLocationModal’).classList.remove(‘hidden’);
}

function closeModal() {
document.getElementById(‘addLocationModal’).classList.add(‘hidden’);
}

function addLocation(e) {
e.preventDefault();
const formData = new FormData(e.target);

```
// Save to localStorage for offline use
const saved = JSON.parse(localStorage.getItem('userLocations') || '[]');
saved.push({
    name: formData.get('resourceName'),
    address: formData.get('resourceAddress'),
    type: formData.get('resourceType'),
    hours: formData.get('resourceHours'),
    phone: formData.get('resourcePhone'),
    notes: formData.get('resourceNotes'),
    userSubmitted: true
});

localStorage.setItem('userLocations', JSON.stringify(saved));
closeModal();
e.target.reset();
alert('Location added successfully!');
```

}

function formatType(type) {
const types = {
‘food-bank’: ‘Food Bank’,
‘pantry’: ‘Food Pantry’,
‘community’: ‘Community’,
‘mobile’: ‘Mobile Unit’
};
return types[type] || type;
}

function showLoading(show) {
document.getElementById(‘searchIcon’).classList.toggle(‘hidden’, show);
document.getElementById(‘loadingIcon’).classList.toggle(‘hidden’, !show);
document.getElementById(‘searchBtn’).disabled = show;
}

function showError(message) {
alert(message);
}

function checkOnlineStatus() {
updateOnlineStatus();
}

function updateOnlineStatus() {
const isOnline = navigator.onLine;
document.getElementById(‘offlineNotice’).classList.toggle(‘hidden’, isOnline);

```
if (!isOnline) {
    loadFromCache();
}
```

}

function saveToCache() {
localStorage.setItem(‘foodbank_cache’, JSON.stringify({
results,
userLocation,
timestamp: Date.now()
}));
}

function loadFromCache() {
const cached = localStorage.getItem(‘foodbank_cache’);
if (cached) {
const data = JSON.parse(cached);
results = data.results || [];
userLocation = data.userLocation;
displayResults();
}
}
