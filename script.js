const isAdmin = document.title.includes("Admin");
let shelters = JSON.parse(localStorage.getItem("shelters")) || [];

if (isAdmin) {
  // ... your existing admin logic remains unchanged ...
} else {
  const shelterList = document.getElementById("shelter-list");

  function renderShelters() {
    shelterList.innerHTML = "";
    if (shelters.length === 0) {
      shelterList.innerHTML = "<p>No shelters available yet.</p>";
      return;
    }
    shelters.forEach((shelter) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${shelter.location || shelter.shelter_name}</strong>
        <span style="color:${shelter.status || (shelter.is_open ? "green" : "red")}; font-size:1.2rem;">●</span>
        <em>${shelter.needs || shelter.shelter_request || "No urgent needs"}</em>
      `;
      shelterList.appendChild(li);
    });
  }

  // Initialize Leaflet map
  const map = L.map("map").setView([43.2557, -79.8711], 12); // Default Hamilton, ON
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // Load shelters from JSON file
  fetch("./ShelterPing/src/mecdata.json")
    .then((response) => response.json())
    .then((data) => {
      shelters = data; // replace current shelters with JSON
      renderShelters();

      // Add markers from JSON
      shelters.forEach((shelter) => {
        if (shelter.shelter_latitude && shelter.shelter_longitude) {
          L.marker([shelter.shelter_latitude, shelter.shelter_longitude])
            .addTo(map)
            .bindPopup(
              `<strong>${shelter.shelter_name}</strong><br>
               Beds: ${shelter.shelter_current_capacity}/${shelter.shelter_max_capacity}<br>
               ${shelter.shelter_request || "No urgent requests"}`
            );
        }
      });
    })
    .catch((err) => console.error("Failed to load shelters JSON:", err));

  // Get user location
  document.getElementById("locate-btn").addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      document.getElementById("user-location-display").textContent =
        `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
      map.setView([latitude, longitude], 13);
      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();
    });
  });

  renderShelters();
}
