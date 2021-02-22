const contactForm = document.forms.contact;

contactForm.elements.emailAddress.addEventListener('blur', function (ev) {
  validateEmail(this);
});

contactForm.elements.message.addEventListener('blur', function (ev) {
  validateMessage(this);
});

contactForm.addEventListener('submit', async function (ev) {
  ev.preventDefault();
  setSubmitButtonEnabled(false);

  const emailEl = this.elements.emailAddress;
  const messageEl = this.elements.message;
  const emailFieldIsValid = validateEmail(emailEl);
  const messageFieldIsValid = validateMessage(messageEl);
  const [recaptchaIsValid, recaptchaToken] = validateRecaptcha();

  if (!emailFieldIsValid || !messageFieldIsValid || !recaptchaIsValid) {
    setSubmitButtonEnabled(true);
    return;
  }

  try {
    await submitContactForm(emailEl.value, messageEl.value, recaptchaToken);
    showElementById('formSuccess');
    this.style.display = 'none';
  } catch (error) {
    showElementById('formError');
    setSubmitButtonEnabled(true);
  }
});

async function submitContactForm(emailAddress, message, recaptchaToken) {
  const url = `${CONTACT_BASE_URL}/api/SubmitContactForm`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      emailAddress,
      message,
      recaptchaToken,
    }),
  });

  if (response.status !== 200) {
    throw new Error('Failed to send contact form');
  }
}

function onRecaptchaSuccess() {
  hideElementById('recaptchaError');
}

function validateRecaptcha() {
  const token = grecaptcha.getResponse();
  if (token.length > 0) {
    hideElementById('recaptchaError');
    return [true, token];
  }

  showElementById('recaptchaError');
  return [false, ''];
}

function validateEmail(el) {
  if (el.value.length > 0 && isValidEmail(el.value)) {
    hideElementById('emailError');
    return true;
  }

  showElementById('emailError');
  return false;
}

function validateMessage(el) {
  if (el.value.length > 0) {
    hideElementById('messageError');
    return true;
  }

  showElementById('messageError');
  return false;
}

function setSubmitButtonEnabled(enabled) {
  contactForm.submit.textContent = enabled ? 'Submit' : 'Sending…';
  contactForm.submit.disabled = !enabled;
}

function hideElementById(id) {
  document.getElementById(id).style.display = 'none';
}

function showElementById(id) {
  document.getElementById(id).style.display = 'block';
}

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}
