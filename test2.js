const cleApi = "28b69ab836e033d354bd685ad4e1c330"; 

async function obtenirMeteo() {
  // Récupération des coordonnées actualisées du local storage
  var coordonnees = JSON.parse(localStorage.getItem("coordonnees"));
  var lat = coordonnees[0].y;
  var lon = coordonnees[0].x;
  var paragraph = document.getElementById("p-info");
  var caard = document.getElementById("meteo-info");
  var dateNow = new Date();

  // Requête à l'API
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${cleApi}`;

  try {
      const response = await fetch(url);

      if (!response.ok) {
          throw new Error(`Erreur HTTP : ${response.status}`);
      }

      const data = await response.json();
      console.log(coordonnees[0].label);
      
      // Convertir la température de Kelvin à Celsius
      const temperatureCelsius = data.main.temp - 273;

      console.log(`Température : ${temperatureCelsius.toFixed(1)}°C`);
      console.log(`Conditions : ${data.weather[0].description}`);
      paragraph.style.display = "none";
      caard.style.display = "block";
      document.getElementById("city-carte").innerText = coordonnees[0].label;
      document.getElementById("date-carte").innerText = dateNow.toLocaleDateString()
      document.getElementById("img-weather").src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
      document.getElementById("temperature-carte").innerText = `${temperatureCelsius.toFixed(1)}°C`;
      document.getElementById("weather-carte").innerText = data.weather[0].description;
      document.getElementById("icon-wind").src = "./images/wind.png";
      document.getElementById("p-wind").innerText = "Vent : " + data.wind.speed + " km/h";
      document.getElementById("icon-humidity").src = "./images/humidity.png";
      document.getElementById("p-humidity").innerText = "Humidité : " + data.main.humidity + " %";
      document.getElementById("icon-precipitation").src = "./images/rain.png";
      document.getElementById("p-precipitation").innerText = "Précipitations : " + (data.rain ? data.rain['1h'] : 0) + " mm";
     
  } catch (error) {
      console.error("Erreur lors de la requête :", error);
  }
}

// Créer une carte centrée sur les coordonnées (latitude, longitude)
var map = L.map('map').setView([47.856944, 1.351389], 5);

// Ajouter une couche de tuiles OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Créer un groupe de marqueurs avec Leaflet.markercluster
var markers = L.markerClusterGroup();

var coordonnees = JSON.parse(localStorage.getItem("coordonnees"));
// Ajouter des marqueurs à ce groupe
for (let j = 0; j < 4 && coordonnees && j < coordonnees.length; j++) {
  if (coordonnees[j]) {
      markers.addLayer(L.marker([coordonnees[j].y, coordonnees[j].x]).bindPopup(coordonnees[j].label));
  } else {
      console.error(`coordonnees[${j}] est null ou non défini `);
  }
}










async function ajoueMarquer() {
  if (localStorage.getItem("coordonnees") != null) {
      var coordonnees = JSON.parse(localStorage.getItem("coordonnees"));
      coordonnees.forEach(coordinate => {
          // Vérifier si le marqueur existe déjà
          let existingMarker = markers.getLayers().find(marker => {
              return marker._latlng.lat === coordinate.y && marker._latlng.lng === coordinate.x;
          });
          if (!existingMarker) {
              // Ajouter le marqueur
              let newMarker = L.marker([coordinate.y, coordinate.x]);
              
              // Définir le contenu de la popup
              newMarker.bindPopup(`<b>${coordinate.label}</b><br>Température: En chargement...`);

              // Ajouter le marqueur à la couche des marqueurs
              markers.addLayer(newMarker);

              // Centrer et zoomer sur le nouveau marqueur
              map.flyTo([coordinate.y, coordinate.x], 7);

              // Ajouter un événement 'click' pour mettre à jour la température dans la popup
              newMarker.on('click', function () {
                  // Mettre à jour la température dans la popup
                  updateTemperatureInPopup(newMarker, coordinate);
                   
              });
          }
      });
  }
}

// Fonction pour mettre à jour la température dans la popup
async function updateTemperatureInPopup(marker, coordinate) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinate.y}&lon=${coordinate.x}&appid=${cleApi}`;

  try {
      const response = await fetch(url);

      if (!response.ok) {
          throw new Error(`Erreur HTTP : ${response.status}`);
      }

      const data = await response.json();
      const temperature = data.main.temp;
    
      // Mettre à jour le contenu de la popup avec la température
      marker.setPopupContent(`<b>${coordinate.label}</b><br>Température: ${(temperature - 273).toFixed(1)}°C`);

      marker.openPopup();
  } catch (error) {
      console.error("Erreur lors de la requête :", error);
  }
}









map.addLayer(markers);
const search = document.querySelector(".input");
const button = document.getElementById("search-button");

// Fonction pour obtenir les coordonnées de la ville
async function obtenirVille() {
  const inputSearch = document.getElementById("input").value;
  const url = `https://api-adresse.data.gouv.fr/search/?q=${inputSearch}&type=municipality&autocomplete=1`;
  if (inputSearch.length >= 3) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
      }
      const data = await response.json();
      return data.features.map((feature) => ({
        city: feature.properties.city,
        postalCode: feature.properties.postcode,
      }));
    } catch (error) {
      console.error("Erreur lors de la requête obtenirVille :", error);
      console.log("Requête API échouée");
      return [];
    }
  } else {
    console.log("Requête API non effectuée (longueur de recherche < 3)");
    return [];
  }
}


// Fonction pour afficher les city
async function showSuggestions(inputValue) {
  const suggestionsData = await obtenirVille();
  const suggestionsContainer = document.getElementById("suggestions-container");
  suggestionsContainer.innerHTML = "";

  if (inputValue.length >= 3 && suggestionsData.length > 0) {
      const filteredSuggestions = suggestionsData.filter((suggestion) =>
          suggestion.city.toLowerCase().startsWith(inputValue.toLowerCase())
      );

      // Afficher les suggestions filtrées
      filteredSuggestions.forEach((suggestion) => {
          const suggestionItem = document.createElement("div");
          suggestionItem.classList.add("suggestions-container-item"); // Ajoutez cette classe

          // Afficher le nom de la ville et le code postal
          suggestionItem.textContent = `${suggestion.city}, ${suggestion.postalCode}`;

          suggestionItem.addEventListener("click", () => {
              document.querySelector(".input").value = suggestion.city;
              suggestionsContainer.style.display = "none";
          });

          suggestionsContainer.appendChild(suggestionItem);
      });

      suggestionsContainer.style.display = "block";
  } else {
      suggestionsContainer.style.display = "none";
  }
}










// Fonction pour limiter le nombre de requêtes API permet de réduire le nombre d'appels à la fonction showSuggestions
function debounce(callback, delay) {
  var timer;
  return function () {
    var args = arguments;
    var context = this;
    clearTimeout(timer);
    timer = setTimeout(function () {
      callback.apply(context, args);
    }, delay);
  };
}
// Écouter les événements clavier
search.addEventListener(
  "keyup",
  debounce(function (e) {
    showSuggestions(e.target.value);
  }, 500)
);

button.addEventListener("click", () => {
  obtenirCoordonnees();
  setTimeout(ajoueMarquer, 300);
  setTimeout(obtenirMeteo, 500);
});

async function obtenirCoordonnees() {
  const inputSearch = document.getElementById("input").value;
  const url = `https://api-adresse.data.gouv.fr/search/?q=${inputSearch}&type=municipality&autocomplete=1`;
  if (inputSearch.length >= 3) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
      }

      const data = await response.json();

      console.log("il y a :" + data.features.length)
      if (data.features.length > 1) {
        const tabCoordonnees = [];

        for (let i = 0; i < data.features.length; i++) {
          tabCoordonnees.push({
            label: data.features[i].properties.label,
            x: data.features[i].geometry.coordinates[0],
            y: data.features[i].geometry.coordinates[1]
          });
        }
        localStorage.setItem("coordonnees", JSON.stringify(tabCoordonnees));
        console.log(localStorage.getItem("coordonnees"));
      } else {
        const coordonnees = {
          label: data.features[i].properties.label,
          x: data.features[0].geometry.coordinates[0],
          y: data.features[0].geometry.coordinates[1]
        };
        localStorage.setItem("coordonnees", JSON.stringify(coordonnees))
      }


    } catch (error) {
      console.error("Erreur lors de la requête :", error);
    }
  }
}