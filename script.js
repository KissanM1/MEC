// Get references to the form and list elements from the DOM
const form = document.getElementById("shelter-form");
const list = document.getElementById("list");

// Add event listener for form submission
form.addEventListener("submit", (e) => {
  // Prevent the default form submission behavior (page refresh)
  e.preventDefault();

  // Get the current values from the form inputs
  const location = document.getElementById("location").value;
  const status = document.getElementById("status").value;
  const needs = document.getElementById("needs").value;

  // Create a new list item element to display the shelter information
  const li = document.createElement("li");
  
  // Set the inner HTML of the list item with the shelter data
  // Using template literals to embed variables in the HTML string
  li.innerHTML = `
    <strong>${location}</strong> 
    <!-- Display colored dot based on status (green/yellow/red) -->
    <span style="color:${status}; font-size:1.2rem;">●</span> 
    <!-- Show needs or default message if no needs specified -->
    <em>${needs || "No urgent needs"}</em>
  `;
  
  // Add the new list item to the shelter list in the DOM
  list.appendChild(li);

  // Reset the form inputs to their initial empty state
  // This clears all fields after successful submission
  form.reset();
});