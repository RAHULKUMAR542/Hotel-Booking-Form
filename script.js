// DOM Elements
const form = document.getElementById("bookingForm");
const fullname = document.getElementById("fullname");
const email = document.getElementById("email");
const hotel = document.getElementById("hotel");
const checkin = document.getElementById("checkin");
const checkout = document.getElementById("checkout");
const room = document.getElementById("room");
const guests = document.getElementById("guests");
const requests = document.getElementById("requests");
const feedback = document.getElementById("feedback");
const requestsCounter = document.getElementById("requestsCounter");
const nightsCount = document.getElementById("nightsCount");
const priceEstimate = document.getElementById("priceEstimate");
const submitBtn = document.getElementById("submitBtn");
const spinner = document.getElementById("spinner");
const submitText = document.getElementById("submitText");

// Constants
const PROCESSING_DELAY_MS = 700;

const ROOM_PRICES = {
  Single: 2000,
  Double: 3500,
  Suite: 6000,
};

const formatDate = (date) => date.toISOString().split("T")[0];
const today = formatDate(new Date());

const setMinDates = () => {
  checkin.min = today;
  checkout.min = checkin.value || today;
};

const setMessage = (text, type = "error") => {
  if (!feedback) return;
  feedback.textContent = text;
  feedback.classList.remove("is-error", "is-success");
  feedback.classList.add(type === "success" ? "is-success" : "is-error");
};

const setLoading = (isLoading) => {
  if (!submitBtn || !spinner || !submitText) return;
  if (isLoading) {
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
    submitText.textContent = "Processing...";
  } else {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
    submitText.textContent = "Book Now";
  }
};

const parseDate = (value) => (value ? new Date(`${value}T00:00:00`) : null);

const clearFieldErrors = () => {
  document.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
  });
  [fullname, email, hotel, checkin, checkout, room, guests].forEach((el) =>
    el.classList.remove("error")
  );
};

const setFieldError = (id, message) => {
  const field = document.getElementById(id);
  const errorEl = document.querySelector(`[data-error-for="${id}"]`);
  if (field) {
    field.classList.add("error");
  }
  if (errorEl) {
    errorEl.textContent = message;
  }
};

const calculateNights = () => {
  const checkinDate = parseDate(checkin?.value);
  const checkoutDate = parseDate(checkout?.value);
  if (!checkinDate || !checkoutDate || checkoutDate <= checkinDate) {
    if (nightsCount) nightsCount.textContent = "0";
    return 0;
  }
  const diffMs = checkoutDate - checkinDate;
  const nights = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (nightsCount) nightsCount.textContent = String(nights);
  return nights;
};

const updatePriceEstimate = () => {
  if (!priceEstimate || !room) return;
  const nights = calculateNights();
  const roomType = room.value;
  const basePrice = ROOM_PRICES[roomType] || 0;
  const total = nights * basePrice;
  priceEstimate.textContent = String(total);
};

checkin.addEventListener("change", () => {
  if (checkin.value) {
    checkout.min = checkin.value;
    if (checkout.value && checkout.value < checkin.value) {
      checkout.value = "";
    }
  } else {
    checkout.min = today;
  }
  updatePriceEstimate();
});

checkout.addEventListener("change", updatePriceEstimate);
room.addEventListener("change", updatePriceEstimate);

// Live character counter for special requests
if (requests && requestsCounter) {
  requests.addEventListener("input", () => {
    const length = requests.value.length;
    const max = requests.maxLength || 300;
    requestsCounter.textContent = `${length} / ${max}`;
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // show loading state with rotating indicator
  setLoading(true);

  // small delay so the user can see the spinner, then run validation/logic
  setTimeout(() => {
    clearFieldErrors();

    let hasError = false;

    if (!fullname.value.trim()) {
      setFieldError("fullname", "Please enter your full name.");
      hasError = true;
    }

    const emailValue = email.value.trim();
    if (!emailValue) {
      setFieldError("email", "Please enter your email ID.");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setFieldError("email", "Please enter a valid email address.");
      hasError = true;
    }

    if (!hotel.value.trim()) {
      setFieldError("hotel", "Please enter the hotel name.");
      hasError = true;
    }

    const checkinDate = parseDate(checkin.value);
    const checkoutDate = parseDate(checkout.value);

    if (!checkinDate) {
      setFieldError("checkin", "Please select a check-in date.");
      hasError = true;
    }

    if (!checkoutDate) {
      setFieldError("checkout", "Please select a check-out date.");
      hasError = true;
    }

    if (checkinDate && checkoutDate && checkoutDate <= checkinDate) {
      setFieldError("checkout", "Check-out date must be after check-in date.");
      hasError = true;
    }

    if (!room.value) {
      setFieldError("room", "Please select a room type.");
      hasError = true;
    }

    const guestCount = Number(guests.value);
    if (
      !Number.isInteger(guestCount) ||
      guestCount < Number(guests.min) ||
      guestCount > Number(guests.max)
    ) {
      setFieldError(
        "guests",
        `Number of guests must be between ${guests.min} and ${guests.max}.`
      );
      hasError = true;
    }

    const nights = calculateNights();
    const price = (ROOM_PRICES[room.value] || 0) * nights;

    if (hasError) {
      setMessage("Please fix the highlighted fields.", "error");
      setLoading(false);
      return;
    }

    const notes = requests?.value.trim();
    const requestsText = notes ? ` Special requests: "${notes}".` : "";

    // store booking in localStorage for the summary page
    const bookingData = {
      fullname: fullname.value,
      email: email.value,
      hotel: hotel.value,
      room: room.value,
      guests: guestCount,
      checkin: checkin.value,
      checkout: checkout.value,
      nights,
      price,
      requests: notes || "",
    };

    try {
      // lastBooking: the most recent booking (used by summary page)
      localStorage.setItem("lastBooking", JSON.stringify(bookingData));

      // bookingHistory: array of all bookings
      const existing = localStorage.getItem("bookingHistory");
      const history = existing ? JSON.parse(existing) : [];
      history.push(bookingData);
      localStorage.setItem("bookingHistory", JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save booking data", e);
      setMessage("Failed to save booking. Please try again.", "error");
      setLoading(false);
      return;
    }

    setMessage("Booking successful! Redirecting to summary...", "success");

    setLoading(false);

    // navigate to dedicated summary page
    setTimeout(() => {
      window.location.href = "summary.html";
    }, 500);
  }, PROCESSING_DELAY_MS);
});

// Initialize on load
setMinDates();
if (requestsCounter) {
  requestsCounter.textContent = `0 / ${requests.maxLength || 300}`;
}
updatePriceEstimate();