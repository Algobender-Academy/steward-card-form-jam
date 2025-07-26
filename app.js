/* 
1. Initialization
    ⦁ Select the main form element
    ⦁ Create a liveData object to store the current input values
    ⦁ If the form exists, select all input fields and the submit button
*/
const form = document.querySelector("#cardDetailsForm");
const liveData = {};
const isIndexPage =
  window.location.pathname.includes("index.html") ||
  window.location.pathname === "/";

// Safety Check
if (form && isIndexPage) {
  const inputs = form.querySelectorAll("input"); // Created a NodeList
  const submitButton = form.querySelector(".submit-button");

  /* 
  2. Set up Input Listeners (for each input field)
    ⦁ keypress events: this will prevent non-allowed characters
    ⦁ input events
    ⦁ pasted events
  */
  inputs.forEach((input) => {
    // Always assume your user is dumb

    // Gatekeepers
    input.addEventListener("keypress", (e) => {
      if (
        (input.name === "cardNumber" ||
          input.name === "month" ||
          input.name === "year" ||
          input.name === "cvc") &&
        /\D/.test(e.key)
      ) {
        e.preventDefault();
        showMessage(input, "Numbers only.", true);
        return;
      } else if (input.name === "fullName" && /[^a-zA-Z\-'\s]/.test(e.key)) {
        e.preventDefault();
        showMessage(input, "Letters, hyphen, or apostrophe only.", true);
        return;
      }
    });

    input.addEventListener("input", (e) => {
      const { name } = e.target;
      console.log(e);
      if (name === "cardNumber") {
        const rawValue = e.target.value.replace(/\D/g, "");
        const formatted = rawValue.replace(/(.{4})/g, "$1 ").trim();
        e.target.value = formatted;
        liveData[name] = formatted;
      } else {
        liveData[name] = e.target.value;
      }

      const wrapper = document.querySelector(".header-wrapper");
      if (wrapper) {
        if (name === "cardNumber") {
          wrapper.querySelector(".card-number").textContent =
            liveData.cardNumber.padEnd(19, "•");
        }
        if (name === "fullName") {
          wrapper.querySelector(".owner-name").textContent = liveData.fullName;
        }
        if (name === "month") {
          wrapper.querySelector(".exp-month").textContent =
            liveData.month.padEnd(2, "•");
        }
        if (name === "year") {
          wrapper.querySelector(".exp-year").textContent = liveData.year.padEnd(
            2,
            "•"
          );
        }
        if (name === "cvc") {
          wrapper.querySelector(".cvc").textContent = liveData.cvc.padEnd(
            3,
            "•"
          );
        }
      }

      validateInput(input);
      updateSubmitButton();
    });

    input.addEventListener("paste", (e) => {
      const pasted = (e.clipboardData || window.Clipboard).getData("text");

      if (
        (input.name === "cardNumber" ||
          input.name === "month" ||
          input.name === "year" ||
          input.name === "cvc") &&
        /\D/.test(pasted)
      ) {
        e.preventDefault();
        showMessage(input, "Numbers only.", true);
        return;
      } else if (input.name === "fullName" && /[^a-zA-Z\-']/.test(pasted)) {
        e.preventDefault();
        showMessage(input, "Letters, hyphen, or apostrophe only.", true);
        return;
      }

      setTimeout(() => {
        if (input.name === "cardNumber") {
          input.value = input.value.replace(/\D/g, "");
          input.value = input.value.replace(/(.{4})/g, "$1 ").trim();
        }
        liveData[input.name] = input.value;

        validateInput(input);
        updateSubmitButton();
      }, 0);
    });
  });

  /* 
  3. Define functions
    ⦁ validateInput(input)
    ⦁ validateFullName(), validatecardNumber(), validateExpiration()
    ⦁ Helper functions: setError(), setSuccess(), clearMessage(), showMessage()
    ⦁ updateSubmitButton()
  */
  // Validation functions
  function validateInput(input) {
    const wrapper =
      input.closest(".full-name-wrapper") ||
      input.closest(".card-num-wrapper") ||
      input.closest(".expiry-group") ||
      input.closest(".cvc-wrapper");

    const message = wrapper.querySelector(".message");
    const value = input.value.trim();

    clearMessage(input, message);

    if (value === "") {
      return setError(input, message, "Can't be blank.");
    }

    let isValid = true;

    if (input.name === "fullName") {
      isValid = validateFullName(input, message);
    } else if (input.name === "cardNumber") {
      isValid = validateCardNumber(input, message);
    } else if (["month", "year"].includes(input.name)) {
      isValid = validateExpiration(input, message);
    } else if (input.name === "cvc") {
      if (!/^\d{3}$/.test(value)) {
        isValid = setError(input, message, "CVC must be exactly 3 digits");
      }
    }

    if (isValid) {
      setSuccess(input, message, "Looks good!");
      liveData[input.name] = input.value;
    }

    return isValid;
  }

  function validateFullName(nameInput, message) {
    let val = nameInput.value
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    nameInput.value = val;
    liveData[nameInput.name] = val;

    const words = val.trim().split(/\s+/);
    if (words.length < 2 || !words.every((w) => /^[A-Za-z\-']+$/.test(w))) {
      return setError(nameInput, message, "Must contain first & last name.");
    }

    return true;
  }

  function validateCardNumber(cardNumInput, message) {
    const digits = cardNumInput.value.replace(/\D/g, "");

    if (digits.length !== 16) {
      return setError(
        cardNumInput,
        message,
        "Credit card number must be exactly 16 digits"
      );
    }

    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();

    cardNumInput.value = formatted;
    liveData[cardNumInput.name] = formatted;
    return true;
  }

  function validateExpiration(dateInput, message) {
    const monthValue = form.querySelector("input[name='month']");
    const yearValue = form.querySelector("input[name='year']");

    const month = parseInt(monthValue.value, 10);
    const year = parseInt(yearValue.value, 10);

    if (isNaN(month)) {
      return setError(dateInput, message, "Month is required.");
    }

    if (isNaN(month) || month < 1 || month > 12) {
      return setError(dateInput, message, "Enter a valid month (01 - 12).");
    }

    if (isNaN(year)) {
      return setError(dateInput, message, "Year is required.");
    }

    const currentDate = new Date();
    const fullYear = 2000 + year;
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (year < currentYear % 100 || year > (currentYear % 100) + 10) {
      return setError(
        dateInput,
        message,
        "Year must be within the next 10 years."
      );
    }

    if (
      fullYear < currentYear ||
      (fullYear === currentYear && month < currentMonth)
    ) {
      return setError(
        dateInput,
        message,
        "Expiration date cannot be in the past."
      );
    }

    return true;
  }

  // Helper functions
  function setError(input, message, sms) {
    input.classList.add("invalid");
    message.classList.add("error-message");
    message.style.display = "block";
    message.textContent = sms;
    return false;
  }

  function setSuccess(input, message, sms) {
    input.classList.add("valid");
    message.classList.add("success-message");
    message.style.display = "block";
    message.textContent = sms;
  }

  function clearMessage(input, message) {
    input.classList.remove("valid", "invalid");
    message.classList.remove("success-message", "error-message");
    message.style.display = "none";
    message.textContent = "";
  }

  function showMessage(input, sms, isError = false) {
    const wrapper =
      input.closest(".full-name-wrapper") ||
      input.closest(".card-num-wrapper") ||
      input.closest(".expiry-group") ||
      input.closest(".cvc-wrapper");

    const message = wrapper.querySelector(".message");

    input.classList.add(isError ? "invalid" : "valid");
    message.classList.add(isError ? "error-message" : "success-message");
    message.style.display = "block";
    message.textContent = sms;
  }

  function updateSubmitButton() {
    let isAllValid = true;

    inputs.forEach((input) => {
      if (!validateInput(input)) isAllValid = false;
    });

    submitButton.disabled = !isAllValid;
  }

  /* 
  4. Set up submit event listener for the form
    ⦁ prevent default submission
    ⦁ perform a final validation check for all input fields
    ⦁ If the inputs are valid save the liveData to localStorage
    ⦁ Open thanks.html in a newpage
  */
  form.addEventListener("submit", (e) => {
    let isFormValid = true;

    inputs.forEach((input) => {
      if (!validateInput(input)) isFormValid = false;
    });

    if (isFormValid) {
      localStorage.setItem("userFormData", JSON.stringify(liveData));
      form.submit();
      window.open("thanks.html", "_blank");
    } else {
      e.preventDefault();
      return;
    }
  });
}

/* 
5. Handle thanks.html
⦁ On page open, it has to retrieve userFormData from localStorage
⦁ Populate the card preview elements
⦁ Add a click event listener that will take us to the Steward Globetrotter FAQs
*/
const storedData = localStorage.getItem("userFormData");
const userData = JSON.parse(storedData);

if (document.querySelector(".main-thanks-wrapper")) {
  window.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.querySelector(".header-wrapper");
    if (wrapper) {
      wrapper.querySelector(".card-number").textContent = userData.cardNumber;
      wrapper.querySelector(".owner-name").textContent = userData.fullName;
      wrapper.querySelector(".exp-month").textContent = userData.month;
      wrapper.querySelector(".exp-year").textContent = userData.year;
      wrapper.querySelector(".cvc").textContent = userData.cvc;
    }
  });

  document.querySelector(".continue-button").addEventListener("click", () => {
    window.open(
      "https://www.stewardbank.co.zw/for-you/cards/visa-globetrotter/",
      "_blank"
    );
  });
}
