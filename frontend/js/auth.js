// ==========================================================
// 日和記帳 - 會員管理與身份驗證模組 (右上角登出入鍵與彈窗)
// ==========================================================

let currentUser = null;
let onAuthChangedCallbacks = [];

function onAuthChanged(cb) {
  onAuthChangedCallbacks.push(cb);
}

function notifyAuthChanged(user) {
  currentUser = user;
  updateHeaderAuthUI();
  for (const cb of onAuthChangedCallbacks) {
    try {
      cb(user);
    } catch (err) {
      console.error("Auth callback error:", err);
    }
  }
}

// Update Header Top-Right corner UI
function updateHeaderAuthUI() {
  const btnLoginOpen = document.getElementById("btn-login-open");
  const userProfileMenu = document.getElementById("user-profile-menu");
  const navUserAvatar = document.getElementById("nav-user-avatar");
  const navUserName = document.getElementById("nav-user-name");
  const headerBudgetBadge = document.getElementById("header-budget-badge");

  if (currentUser) {
    btnLoginOpen.classList.add("hidden");
    userProfileMenu.classList.remove("hidden");
    headerBudgetBadge.classList.remove("hidden");

    const initial = (currentUser.displayName || currentUser.username || "和").charAt(0).toUpperCase();
    navUserAvatar.textContent = initial;
    navUserName.textContent = currentUser.displayName || currentUser.username;
  } else {
    btnLoginOpen.classList.remove("hidden");
    userProfileMenu.classList.add("hidden");
    headerBudgetBadge.classList.add("hidden");
  }
}

// Open / Close Auth Modal
let currentAuthMode = "login"; // "login" | "register" | "forgot"

function openAuthModal(mode = "login") {
  currentAuthMode = mode;
  const modal = document.getElementById("modal-auth");
  const tabLogin = document.getElementById("auth-tab-login");
  const tabRegister = document.getElementById("auth-tab-register");
  const tabForgot = document.getElementById("auth-tab-forgot");
  const title = document.getElementById("auth-modal-title");
  const groupDisplayName = document.getElementById("group-display-name");
  const groupConfirmPassword = document.getElementById("group-confirm-password");
  const demoBox = document.getElementById("demo-account-box");
  const forgotRow = document.getElementById("auth-forgot-link-row");
  const backLoginRow = document.getElementById("auth-back-login-row");
  const labelPassword = document.getElementById("label-password");
  const labelUsername = document.getElementById("label-username");
  const submitBtn = document.getElementById("btn-auth-submit");
  const errAlert = document.getElementById("auth-error-alert");
  const successAlert = document.getElementById("auth-success-alert");
  const rememberRow = document.getElementById("auth-remember-row");

  // 重置密碼顯示狀態為隱藏 (type="password")
  resetPasswordVisibility();

  errAlert.classList.add("hidden");
  errAlert.textContent = "";
  successAlert.classList.add("hidden");
  successAlert.textContent = "";

  tabLogin.classList.remove("active");
  tabRegister.classList.remove("active");
  tabForgot.classList.remove("active");

  if (mode === "register") {
    tabRegister.classList.add("active");
    title.textContent = "註冊日和記帳新帳號";
    groupDisplayName.classList.remove("hidden");
    groupConfirmPassword.classList.remove("hidden");
    demoBox.classList.add("hidden");
    forgotRow.classList.add("hidden");
    backLoginRow.classList.add("hidden");
    if (rememberRow) rememberRow.classList.remove("hidden");
    labelUsername.textContent = "使用者帳號 (必填)";
    labelPassword.textContent = "設定密碼 (至少6字元)";
    document.getElementById("auth-password").placeholder = "請輸入密碼 (6至50字元)";
    submitBtn.textContent = "立即建立帳號";
  } else if (mode === "forgot") {
    tabForgot.classList.add("active");
    title.textContent = "重設帳號密碼";
    groupDisplayName.classList.add("hidden");
    groupConfirmPassword.classList.remove("hidden");
    demoBox.classList.add("hidden");
    forgotRow.classList.add("hidden");
    backLoginRow.classList.remove("hidden");
    if (rememberRow) rememberRow.classList.add("hidden");
    labelUsername.textContent = "請輸入您的帳號";
    labelPassword.textContent = "設定新密碼 (至少6字元)";
    document.getElementById("auth-password").placeholder = "請輸入新密碼 (6至50字元)";
    submitBtn.textContent = "確認重設並登入";
  } else {
    // login mode
    tabLogin.classList.add("active");
    title.textContent = "歡迎登入日和記帳";
    groupDisplayName.classList.add("hidden");
    groupConfirmPassword.classList.add("hidden");
    demoBox.classList.remove("hidden");
    forgotRow.classList.remove("hidden");
    backLoginRow.classList.add("hidden");
    if (rememberRow) rememberRow.classList.remove("hidden");
    labelUsername.textContent = "使用者帳號";
    labelPassword.textContent = "密碼";
    document.getElementById("auth-password").placeholder = "請輸入密碼";
    submitBtn.textContent = "登入系統";
  }

  modal.classList.remove("hidden");
}

function closeAuthModal() {
  const modal = document.getElementById("modal-auth");
  modal.classList.add("hidden");
  resetPasswordVisibility();
}

// 簡約向量眼睛圖標 (SVG)：顯示 vs 隱藏 (帶斜線)
const SVG_EYE_OPEN = `
  <svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
`;

const SVG_EYE_CLOSED = `
  <svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
`;

// 密碼顯示/隱藏切換輔助函數
function resetPasswordVisibility() {
  const pwdInput = document.getElementById("auth-password");
  const confirmInput = document.getElementById("auth-password-confirm");
  const btnPwd = document.getElementById("btn-toggle-password");
  const btnConfirm = document.getElementById("btn-toggle-confirm-password");

  if (pwdInput) pwdInput.type = "password";
  if (confirmInput) confirmInput.type = "password";
  if (btnPwd) {
    btnPwd.innerHTML = SVG_EYE_OPEN;
    btnPwd.setAttribute("aria-label", "顯示密碼");
  }
  if (btnConfirm) {
    btnConfirm.innerHTML = SVG_EYE_OPEN;
    btnConfirm.setAttribute("aria-label", "顯示密碼");
  }
}

function bindPasswordToggle(btnId, inputId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    btn.innerHTML = isPassword ? SVG_EYE_CLOSED : SVG_EYE_OPEN;
    btn.setAttribute("aria-label", isPassword ? "隱藏密碼" : "顯示密碼");
    input.focus();
  });
}

// Setup Auth Event Handlers
function setupAuthHandlers() {
  const btnLoginOpen = document.getElementById("btn-login-open");
  const btnCloseModal = document.getElementById("btn-close-auth-modal");
  const modal = document.getElementById("modal-auth");
  const tabLogin = document.getElementById("auth-tab-login");
  const tabRegister = document.getElementById("auth-tab-register");
  const tabForgot = document.getElementById("auth-tab-forgot");
  const btnToForgot = document.getElementById("btn-to-forgot");
  const btnBackToLogin = document.getElementById("btn-back-to-login");
  const authForm = document.getElementById("auth-form");
  const btnLogout = document.getElementById("btn-logout");
  const btnFillDemo = document.getElementById("btn-fill-demo");
  const errAlert = document.getElementById("auth-error-alert");
  const successAlert = document.getElementById("auth-success-alert");

  btnLoginOpen.addEventListener("click", () => openAuthModal("login"));
  btnCloseModal.addEventListener("click", closeAuthModal);

  // 綁定密碼與確認密碼的眼睛符號切換
  bindPasswordToggle("btn-toggle-password", "auth-password");
  bindPasswordToggle("btn-toggle-confirm-password", "auth-password-confirm");

  // 大面積彈窗：停用點擊背景遮罩關閉，僅允許右上角 ✕ 按鈕關閉，防止誤觸
  // modal.addEventListener("click", (e) => {
  //   if (e.target === modal) closeAuthModal();
  // });

  tabLogin.addEventListener("click", () => openAuthModal("login"));
  tabRegister.addEventListener("click", () => openAuthModal("register"));
  tabForgot.addEventListener("click", () => openAuthModal("forgot"));
  btnToForgot.addEventListener("click", () => openAuthModal("forgot"));
  btnBackToLogin.addEventListener("click", () => openAuthModal("login"));

  // Auto-fill Demo Account & Auto Login
  btnFillDemo.addEventListener("click", () => {
    openAuthModal("login");
    document.getElementById("auth-username").value = "demo";
    document.getElementById("auth-password").value = "password123";
    showToast("已帶入 Demo 帳號，正在登入...", "info");
    setTimeout(() => {
      authForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }, 200);
  });

  // Handle Form Submit with Strict Validation
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errAlert.classList.add("hidden");
    errAlert.textContent = "";
    successAlert.classList.add("hidden");
    successAlert.textContent = "";

    const usernameInput = document.getElementById("auth-username");
    const passwordInput = document.getElementById("auth-password");
    const confirmInput = document.getElementById("auth-password-confirm");
    const displayNameInput = document.getElementById("auth-display-name");

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput ? confirmInput.value : "";
    const displayName = displayNameInput ? displayNameInput.value.trim() : "";

    // 1. 必填與格式檢核 (目標 1: 檢查必填、格式與合理範圍)
    if (!username) {
      showError("請輸入使用者帳號", usernameInput);
      return;
    }

    if (currentAuthMode === "register") {
      if (username.length < 3 || username.length > 30) {
        showError("帳號長度需介於 3 至 30 個字元", usernameInput);
        return;
      }
      const usernamePattern = /^[a-zA-Z0-9_.@\-\u4e00-\u9fa5]+$/;
      if (!usernamePattern.test(username)) {
        showError("帳號格式不合：僅允許英數字母、數字、底線、減號、點、@ 或中文字", usernameInput);
        return;
      }
      if (displayName && displayName.length > 20) {
        showError("暱稱長度不能超過 20 個字元", displayNameInput);
        return;
      }
    }

    if (!password) {
      showError("請輸入密碼", passwordInput);
      return;
    }

    if (currentAuthMode === "register" || currentAuthMode === "forgot") {
      if (password.length < 6 || password.length > 50) {
        showError("密碼長度需介於 6 至 50 個字元", passwordInput);
        return;
      }
      if (!confirmPassword) {
        showError("請輸入確認密碼", confirmInput);
        return;
      }
      if (password !== confirmPassword) {
        showError("兩次輸入的密碼不一致，請重新確認", confirmInput);
        return;
      }
    }

    const rememberCheckbox = document.getElementById("auth-remember-me");
    const rememberMe = rememberCheckbox ? rememberCheckbox.checked : true;

    const submitBtn = document.getElementById("btn-auth-submit");
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "處理中...";

    try {
      let resp;
      if (currentAuthMode === "register") {
        resp = await api.register(username, password, displayName, rememberMe);
        showSuccess(`註冊成功！歡迎加入日和記帳，${resp.user.displayName}`);
      } else if (currentAuthMode === "forgot") {
        resp = await api.resetPassword(username, password, rememberMe);
        showSuccess(`密碼重設成功！歡迎回來，${resp.user.displayName}`);
      } else {
        resp = await api.login(username, password, rememberMe);
        showSuccess(`登入成功！歡迎回來，${resp.user.displayName}`);
      }

      // Close modal and update state after short delay
      setTimeout(() => {
        closeAuthModal();
        notifyAuthChanged(resp.user);
      }, 500);
    } catch (err) {
      showError(err.message || "操作失敗，請稍後再試", null);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  function showError(msg, focusElem) {
    errAlert.textContent = msg;
    errAlert.classList.remove("hidden");
    showToast(msg, "error");
    if (focusElem) focusElem.focus();
  }

  function showSuccess(msg) {
    successAlert.textContent = msg;
    successAlert.classList.remove("hidden");
    showToast(msg, "success");
  }

  // Handle Logout
  btnLogout.addEventListener("click", async () => {
    await api.logout();
    notifyAuthChanged(null);
    showToast("已安全登出", "info");
  });
}

// Initial session check on page load
async function initAuth() {
  setupAuthHandlers();
  try {
    const me = await api.getMe();
    if (me && me.user) {
      notifyAuthChanged(me.user);
    } else {
      notifyAuthChanged(null);
    }
  } catch {
    notifyAuthChanged(null);
  }
}

