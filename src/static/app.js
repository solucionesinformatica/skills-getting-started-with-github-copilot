document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function addParticipantToCard(activityName, participantEmail) {
    const activityCard = Array.from(
      activitiesList.querySelectorAll(".activity-card")
    ).find((card) => card.querySelector("h4")?.textContent === activityName);

    if (!activityCard) return;

    const participantsList = activityCard.querySelector(".participants-list");
    const noParticipants = participantsList?.querySelector(".no-participants");
    if (noParticipants) noParticipants.remove();

    if (participantsList) {
      const participantItem = document.createElement("li");

      const participantLabel = document.createElement("span");
      participantLabel.className = "participant-email";
      participantLabel.textContent = participantEmail;

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-participant";
      deleteButton.type = "button";
      deleteButton.dataset.activity = activityName;
      deleteButton.dataset.participant = participantEmail;
      deleteButton.title = `Unregister ${participantEmail}`;
      deleteButton.setAttribute("aria-label", `Unregister ${participantEmail}`);
      deleteButton.textContent = "🗑️";

      participantItem.append(participantLabel, deleteButton);
      participantsList.appendChild(participantItem);
    }

    const availability = Array.from(activityCard.querySelectorAll("p")).find(
      (paragraph) => paragraph.textContent.startsWith("Availability:")
    );
    if (availability) {
      const spotsMatch = availability.textContent.match(/(\d+) spots left/);
      if (spotsMatch) {
        const spotsLeft = Math.max(0, Number.parseInt(spotsMatch[1], 10) - 1);
        availability.textContent = `Availability: ${spotsLeft} spots left`;
      }
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantItems = details.participants.length
          ? details.participants
              .map(
                (participant) =>
                  `<li>
                    <span class="participant-email">${participant}</span>
                    <button class="delete-participant" type="button"
                      data-activity="${name}" data-participant="${participant}"
                      title="Unregister ${participant}" aria-label="Unregister ${participant}">🗑️</button>
                  </li>`
              )
              .join("")
          : '<li class="no-participants">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            <ul class="participants-list">
              ${participantItems}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        addParticipantToCard(activity, email);
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".delete-participant");
    if (!deleteButton) return;

    const activity = deleteButton.dataset.activity;
    const participant = deleteButton.dataset.participant;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(participant)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister participant.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
