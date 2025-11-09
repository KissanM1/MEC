const isAdmin = document.title.includes("Admin");
let shelters = JSON.parse(localStorage.getItem("shelters")) || [];

// API base URL
const API_BASE = 'http://localhost:5000/api';

if (isAdmin) {
  // Admin page logic
  const shelterForm = document.getElementById("shelter-form");
  const shelterList = document.getElementById("list");

  // Load shelters from mecdata.json on page load
  fetch("./ShelterPing/src/mecdata.json")
    .then((response) => response.json())
    .then((data) => {
      shelters = data; // replace current shelters with JSON data
      localStorage.setItem("shelters", JSON.stringify(shelters));
      renderShelters();
    })
    .catch((err) => {
      console.error("Failed to load shelters from mecdata.json:", err);
      renderShelters(); // Still render whatever is in localStorage
    });

  function renderShelters() {
    shelterList.innerHTML = "";
    shelters.forEach((shelter) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${shelter.shelter_name}</strong><br>
        ${shelter.location}<br>
        Capacity: ${shelter.shelter_current_capacity || shelter.capacity}<br>
        Status: ${shelter.status || (shelter.is_open ? "Open" : "Closed")}<br>
        Needs: ${shelter.needs || shelter.shelter_request || "None"}
      `;
      shelterList.appendChild(li);
    });
  }

  // Add shelter functionality - UPDATED to use Flask backend
  shelterForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const newShelter = {
      shelter_name: document.getElementById("shelter-name").value,
      location: document.getElementById("shelter-location").value,
      shelter_max_capacity: parseInt(document.getElementById("shelter-capacity").value),
      shelter_current_capacity: parseInt(document.getElementById("shelter-capacity").value), // Using same as max for now
      status: document.getElementById("status").value,
      shelter_request: document.getElementById("needs").value || "No urgent needs",
      // Set default values for required backend fields
      shelter_latitude: 43.2557, // Default Hamilton coordinates
      shelter_longitude: -79.8711,
      food_available: true,
      beds_available: true,
      is_open: document.getElementById("status").value === "green"
    };

    try {
      // Save to Flask backend
      const response = await fetch(`${API_BASE}/shelters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newShelter)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Shelter saved to backend:', result);
        
        // Also update local storage for immediate UI update
        shelters.push(result.shelter);
        localStorage.setItem("shelters", JSON.stringify(shelters));
        
        alert('Shelter added successfully!');
        shelterForm.reset();
        renderShelters();
      } else {
        throw new Error('Failed to save shelter to backend');
      }
    } catch (error) {
      console.error('Error saving shelter:', error);
      alert('Error adding shelter. Please check if the backend server is running.');
    }
  });

  // Initial render
  renderShelters();

} else {
  // ... your existing user page logic remains completely unchanged ...
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
        <strong>${shelter.location || shelter.shelter_name}</strong><br>
        <span style="color:${shelter.status || (shelter.is_open ? "green" : "red")}; font-size:1.2rem;">●</span>
        Capacity: ${shelter.shelter_current_capacity}/${shelter.shelter_max_capacity}<br>
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