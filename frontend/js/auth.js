/* ==========================================================================
   InsightBoard — auth.js

   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  wirePasswordToggles();

  const loginForm = document.getElementById("loginForm");
  if (loginForm) initLoginForm(loginForm);

  const signupForm = document.getElementById("signupForm");
  if (signupForm) initSignupForm(signupForm);

  const forgotLink = document.getElementById("forgotPasswordLink");
  if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      IB.toast("Password reset isn't wired to a backend in this demo — try Login instead.", "warning");
    });
  }

  const googleBtn = document.getElementById("googleLoginBtn");
  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
    
      IB.toast("Google sign-in isn't set up yet — please use email and password.", "warning");
    });
  }
});

function wirePasswordToggles() {
  document.querySelectorAll(".field-toggle-visibility").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      btn.innerHTML = showing ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
    });
  });
}

function setFieldError(fieldEl, hasError) {
  fieldEl.classList.toggle("has-error", hasError);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* ---------------------------------------------------------------------- */
/* Login                                                                    */
/* ---------------------------------------------------------------------- */

function initLoginForm(form) {
  const emailField = document.getElementById("emailField");
  const passwordField = document.getElementById("passwordField");
  const submitBtn = document.getElementById("loginSubmitBtn");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const emailOk = isValidEmail(email);
    const passwordOk = password.length >= 6;
    setFieldError(emailField, !emailOk);
    setFieldError(passwordField, !passwordOk);
    if (!emailOk || !passwordOk) {
      IB.toast("Please fix the highlighted fields.", "error");
      return;
    }

    const originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Logging in...';

    IB.apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then(({ ok, data }) => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;

      if (!ok) {
        IB.toast(data.error || "Couldn't log you in. Please try again.", "error");
        return;
      }

      localStorage.setItem(IB.KEYS.TOKEN, data.token);
      IB.setUser(data.user);
      IB.toast("Welcome back! Redirecting to your dashboard...", "success");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 600);
    }).catch(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
      IB.toast("Could not reach the server. Make sure the backend is running, then try again.", "error");
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Signup                                                                   */
/* ---------------------------------------------------------------------- */

function initSignupForm(form) {
  const nameField = document.getElementById("nameField");
  const emailField = document.getElementById("emailField");
  const passwordField = document.getElementById("passwordField");
  const confirmField = document.getElementById("confirmField");
  const termsField = document.getElementById("termsField");
  const submitBtn = document.getElementById("signupSubmitBtn");
  const passwordInput = document.getElementById("password");

  passwordInput.addEventListener("input", () => updateStrengthMeter(passwordInput.value));

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const agreed = document.getElementById("agreeTerms").checked;

    const nameOk = fullName.length >= 2;
    const emailOk = isValidEmail(email);
    const passwordOk = password.length >= 6;
    const confirmOk = passwordOk && password === confirmPassword;

    setFieldError(nameField, !nameOk);
    setFieldError(emailField, !emailOk);
    setFieldError(passwordField, !passwordOk);
    setFieldError(confirmField, !confirmOk);
    setFieldError(termsField, !agreed);

    if (!nameOk || !emailOk || !passwordOk || !confirmOk || !agreed) {
      IB.toast("Please fix the highlighted fields.", "error");
      return;
    }

    const originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Creating account...';

    IB.apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password }),
    }).then(({ ok, data }) => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;

      if (!ok) {
        IB.toast(data.error || "Couldn't create your account. Please try again.", "error");
        return;
      }

      localStorage.setItem(IB.KEYS.TOKEN, data.token);
      IB.setUser(data.user);
      IB.toast("Account created! Redirecting to your dashboard...", "success");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 600);
    }).catch(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
      IB.toast("Could not reach the server. Make sure the backend is running, then try again.", "error");
    });
  });
}

function updateStrengthMeter(password) {
  const bar = document.getElementById("strengthBarFill");
  const label = document.getElementById("strengthLabel");
  if (!bar || !label) return;

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { pct: "0%", color: "var(--color-border)", text: "Use 8+ characters with a mix of letters, numbers & symbols." },
    { pct: "20%", color: "var(--color-danger)", text: "Weak password" },
    { pct: "45%", color: "var(--color-danger)", text: "Weak password" },
    { pct: "65%", color: "var(--color-amber)", text: "Fair password" },
    { pct: "85%", color: "var(--color-accent)", text: "Good password" },
    { pct: "100%", color: "var(--color-accent-dark)", text: "Strong password" },
  ];
  const level = password.length === 0 ? levels[0] : levels[Math.min(score, 5)];
  bar.style.width = level.pct;
  bar.style.background = level.color;
  label.textContent = level.text;
}
