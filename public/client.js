/* Web Dev Weather App Version 0.0.3
 * This version loads the weather for Victoria BC dinamicly from darksky, and is the first of many steps
 * to creating a Progressive Web App that is
 * based on Google Code Lab at https://codelabs.developers.google.com/codelabs/your-first-pwapp/#0
 */

/**
*gets the cached forecast dara from the caches object
*
*@param {string} coords Location object to.
*@param {object} the weather forecast, if request fails return null.
*/
function getForcastFromCache(coords) {
  if (!('caches' in window)){
    return null;
  }
  const url = `${window.location.origin}/forecast/$coords`;
  return caches.match(url)
  .then((response) =>{
    if (response) {
      return response.json();
    }
    return null;
  })
  .catch((err) =>{
    console.erroer('Error getting data from cache', err);
    return null;
  });
}

// gets initial forecast
//function initialize() {
//var card = getForecastCard({label:"Victoria, BC",
//geo:"48.4284,-123.3656"});
//renderForecast(card, weatherData);
//} // initialize
const weatherApp = {
  selectedLocations: {},
  addDialogContainer: document.getElementById("addDialogContainer")
};

//togale visibility of the add location dialog box
function toggleAddDialog() {
  weatherApp.addDialogContainer.classList.toggle("visible");
} //toggle add  dialog

function updateData() {
  Object.keys(weatherApp.selectedLocations).forEach(key => {
    const location = weatherApp.selectedLocations[key];
    const card = getForecastCard(location);

    getForcastFromCache(location.geo)
    .then((forecast) =>{
      renderForecast(card, forecast);
    });
    
    getForecastFromNetwork(location.geo).then(forecast => {
      renderForecast(card, forecast);
    });
  });
} //updates the data shown

//initalizes app gets list of locations from storage
//then renders initial data
//calls for update data
function init() {
  //get location list and update the users inteface
  weatherApp.selectedLocations = loadLocationList();
  updateData();

  //set up the event handelers for all the buttons
  document.getElementById("butRefresh").addEventListener("click", updateData);
  document.getElementById("butAdd").addEventListener("click", toggleAddDialog);
  document
    .getElementById("butDialogCancel")
    .addEventListener("click", toggleAddDialog);
  document
    .getElementById("butDialogAdd")
    .addEventListener("click", addLocation);
} //init

//event handeler for remove city and it removes a location from the list parm of evt
function removeLocation(evt) {
  const parent = evt.srcElement.parentElement;
  parent.remove();
  if (weatherApp.selectedLocations[parent.id]) {
    delete weatherApp.selectedLocations[parent.id];
    saveLocationList(weatherApp.selectedLocations);
  } //if
} //removeLocation

//Event handeler for butDialogAdd, adds the selected location to the list
function addLocation() {
  //hide the dialog
  toggleAddDialog();

  //gets slelected city
  const select = document.getElementById("selectCityToAdd");
  const selected = select.options[select.selectedIndex];
  const geo = selected.value;
  const label = selected.textContent;
  const location = { label: label, geo: geo };

  //creates new card for new city and sends request to dark sky for weather data
  const card = getForecastCard(location);
  getForecastFromNetwork(geo).then(forecast => {
    renderForecast(card, forecast);
  });

  //save updated list as selected citys
  weatherApp.selectedLocations[geo] = location;
  saveLocationList(weatherApp.selectedLocations);
} //add location

//saves the list of locations
function saveLocationList(locations) {
  const data = JSON.stringify(locations);
  localStorage.setItem("locatoinList", data);
} //save location lsit

// loads list of saved locations
function loadLocationList() {
  let locations = localStorage.getItem("locationList");

  if (locations) {
    try {
      locations = JSON.parse(locations);
    } catch (ex) {
      locations = {};
    }
  } //if

  //load victoria data if no city in list
  if (!locations || Object.keys(locations).length === 0) {
    const key = "48.4284,-123.3656";
    locations = {};
    locations[key] = { label: "Victoria, BC", geo: "48.4284,-123.3656" };
  } //if

  return locations;
} //load location list

//gets json from darksky api
function getForecastFromNetwork(coords) {
  return fetch("forecast/" + coords)
    .then(response => {
      return response.json();
    })
    .catch(() => {
      return null;
    });
} // getforecast from network
/**
 * Get's the HTML element for the weather forecast, or clones the template
 * and adds it to the DOM if we're adding a new item.
 *
 * @param {Object} location Location object
 * @return {Element} The element for the weather forecast.
 */
function getForecastCard(location) {
  const id = location.geo;
  //saves lat/long int the constant id
  const card = document.getElementById(id);

  // if the card exists, return it
  if (card) {
    return card;
  } //if

  //otherwise generate a new card
  //copys weather template
  const newCard = document.getElementById("weather-template").cloneNode(true);

  //quarySelector looks for a child of the new card
  newCard.querySelector(".location").textContent = location.label;

  newCard.setAttribute("id", id);
  newCard
    .querySelector(".remove-city")
    .addEventListener("click", removeLocation);
  document.querySelector(".grid-container").appendChild(newCard);
  newCard.removeAttribute("hidden");
  return newCard;
} //getForcastCard

/**
 * Renders the forecast data into the card element.
 *
 * @param {Element} card The card element to update.
 * @param {Object} data Weather forecast data to update the element with as json object.
 */
function renderForecast(card, data) {
  //Find out when the element was last updated.
  const cardLastUpdatedElem = card.querySelector(".card-last-updated");
  const cardLastUpdated = cardLastUpdatedElem.textContent;
  const lastUpdated = parseInt(cardLastUpdated);

  // If no data, skip the update.
  if (!data) {
    return;
  }

  // Render the forecast data into the card.
  card.querySelector(".description").textContent = data.currently.summary;
  const forecastFrom = luxon.DateTime.fromSeconds(data.currently.time)
    .setZone(data.timezone)
    .toFormat("DDDD t");
  card.querySelector(".date").textContent = forecastFrom;
  card.querySelector(
    ".current .icon"
  ).className = `icon ${data.currently.icon}`;
  card.querySelector(".current .temperature .value").textContent = Math.round(
    farToCel(data.currently.temperature)
  );
  card.querySelector(".current .humidity .value").textContent = Math.round(
    data.currently.humidity * 100
  );
  card.querySelector(".current .wind .value").textContent = Math.round(
    mtok(data.currently.windSpeed)
  );
  card.querySelector(".current .wind .direction").textContent = Math.round(
    data.currently.windBearing
  );
  const sunrise = luxon.DateTime.fromSeconds(data.daily.data[0].sunriseTime)
    .setZone(data.timezone)
    .toFormat("t");
  card.querySelector(".current .sunrise .value").textContent = sunrise;
  const sunset = luxon.DateTime.fromSeconds(data.daily.data[0].sunsetTime)
    .setZone(data.timezone)
    .toFormat("t");
  69;
  card.querySelector(".current .sunset .value").textContent = sunset;

  // Render the next 7 days.
  const futureTiles = card.querySelectorAll(".future .oneday");
  futureTiles.forEach((tile, index) => {
    const forecast = data.daily.data[index + 1];
    const forecastFor = luxon.DateTime.fromSeconds(forecast.time)
      .setZone(data.timezone)
      .toFormat("ccc");
    tile.querySelector(".date").textContent = forecastFor;
    tile.querySelector(".icon").className = `icon ${forecast.icon}`;
    tile.querySelector(".temp-high .value").textContent = Math.round(
      farToCel(forecast.temperatureHigh)
    );
    tile.querySelector(".temp-low .value").textContent = Math.round(
      farToCel(forecast.temperatureLow)
    );
  });

  const spinner = card.querySelector(".card-spinner");
  if (spinner) {
    card.removeChild(spinner);
  }
} // renderForecast

//convers to celceus
function farToCel(f) {
  return (f - 32) * (5.0 / 9.0);
}

function mtok(m) {
  return m * 1.609;
}

init();
