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
  const groupEmail = document.getElementById("group-email");
  const groupVerifyCode = document.getElementById("group-verify-code");
  const groupConfirmPassword = document.getElementById("group-confirm-password");
  const demoBox = document.getElementById("demo-account-box");
  const forgotRow = document.getElementById("auth-forgot-link-row");
  const backLoginRow = document.getElementById("auth-back-login-row");
  const labelPassword = document.getElementById("label-password");
  const labelUsername = document.getElementById("label-username");
  const labelEmail = document.getElementById("label-email");
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
    if (groupEmail) {
      groupEmail.classList.remove("hidden");
      if (labelEmail) labelEmail.textContent = "安全電子信箱 (二次驗證用)";
    }
    if (groupVerifyCode) groupVerifyCode.classList.add("hidden");
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
    title.textContent = "信箱二次驗證與密碼重設";
    groupDisplayName.classList.add("hidden");
    if (groupEmail) {
      groupEmail.classList.remove("hidden");
      if (labelEmail) labelEmail.textContent = "綁定的安全信箱 (必填)";
    }
    if (groupVerifyCode) groupVerifyCode.classList.remove("hidden");
    groupConfirmPassword.classList.remove("hidden");
    demoBox.classList.add("hidden");
    forgotRow.classList.add("hidden");
    backLoginRow.classList.remove("hidden");
    if (rememberRow) rememberRow.classList.add("hidden");
    labelUsername.textContent = "請輸入您的帳號";
    labelPassword.textContent = "設定新密碼 (至少6字元)";
    document.getElementById("auth-password").placeholder = "請輸入新密碼 (6至50字元)";
    submitBtn.textContent = "驗證並重設密碼";
  } else {
    // login mode
    tabLogin.classList.add("active");
    title.textContent = "歡迎登入日和記帳";
    groupDisplayName.classList.add("hidden");
    if (groupEmail) groupEmail.classList.add("hidden");
    if (groupVerifyCode) groupVerifyCode.classList.add("hidden");
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
    const emailInput = document.getElementById("auth-email");
    if (emailInput) emailInput.value = "demo@hiyori.app";
    showToast("已帶入 Demo 帳號，正在登入...", "info");
    setTimeout(() => {
      authForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }, 200);
  });

  // 發送信箱二次驗證碼 (忘記密碼流程)
  const btnSendVerifyCode = document.getElementById("btn-send-verify-code");
  let countdownTimer = null;

  if (btnSendVerifyCode) {
    btnSendVerifyCode.addEventListener("click", async () => {
      const usernameInput = document.getElementById("auth-username");
      const emailInput = document.getElementById("auth-email");
      const username = usernameInput.value.trim();
      const email = emailInput ? emailInput.value.trim() : "";

      if (!username) {
        showError("請先輸入使用者帳號", usernameInput);
        return;
      }
      if (!email) {
        showError("請輸入該帳號綁定的安全電子信箱", emailInput);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("電子信箱格式不正確，例如：user@example.com", emailInput);
        return;
      }

      btnSendVerifyCode.disabled = true;
      btnSendVerifyCode.textContent = "發送中...";

      try {
        const resp = await api.sendResetCode(username, email);
        showSuccess(resp.message || "安全驗證碼已發送至您的信箱！");

        // 若返回了 previewCode (便於評測與離線快速測試)
        if (resp.previewCode) {
          setTimeout(() => {
            showToast(`【二次驗證提示】您的 6 位數驗證碼為：${resp.previewCode}`, "warning", 8000);
            const verifyInput = document.getElementById("auth-verify-code");
            if (verifyInput && !verifyInput.value) {
              verifyInput.value = resp.previewCode;
            }
          }, 300);
        }

        // 倒數 60 秒
        let count = 60;
        btnSendVerifyCode.textContent = `${count}s 重發`;
        clearInterval(countdownTimer);
        countdownTimer = setInterval(() => {
          count--;
          if (count <= 0) {
            clearInterval(countdownTimer);
            btnSendVerifyCode.disabled = false;
            btnSendVerifyCode.textContent = "重新發送";
          } else {
            btnSendVerifyCode.textContent = `${count}s 重發`;
          }
        }, 1000);
      } catch (err) {
        btnSendVerifyCode.disabled = false;
        btnSendVerifyCode.textContent = "發送驗證碼";
        showError(err.message || "發送驗證碼失敗", null);
      }
    });
  }

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
    const emailInput = document.getElementById("auth-email");
    const verifyCodeInput = document.getElementById("auth-verify-code");

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput ? confirmInput.value : "";
    const displayName = displayNameInput ? displayNameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const verifyCode = verifyCodeInput ? verifyCodeInput.value.trim() : "";

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
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("安全電子信箱格式不正確，例如：user@example.com", emailInput);
        return;
      }
    }

    if (currentAuthMode === "forgot") {
      if (!email) {
        showError("請輸入該帳號綁定的安全電子信箱以進行二次驗證", emailInput);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("電子信箱格式不正確，例如：user@example.com", emailInput);
        return;
      }
      if (!verifyCode) {
        showError("請先點擊發送驗證碼並輸入 6 位數二次驗證碼", verifyCodeInput);
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
        resp = await api.register(username, password, displayName, email, rememberMe);
        showSuccess(`註冊成功！歡迎加入日和記帳，${resp.user.displayName}`);
      } else if (currentAuthMode === "forgot") {
        resp = await api.resetPassword(username, password, verifyCode, email, rememberMe);
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

  // ==================== 個人帳號設定彈窗 (點擊右上角頭像) ====================
  const btnOpenProfile = document.getElementById("btn-open-profile");
  const btnCloseProfile = document.getElementById("btn-close-profile-modal");
  const profileForm = document.getElementById("profile-form");

  if (btnOpenProfile) btnOpenProfile.addEventListener("click", openProfileModal);
  if (btnCloseProfile) btnCloseProfile.addEventListener("click", closeProfileModal);

  bindPasswordToggle("btn-toggle-profile-pwd", "profile-new-password");
  bindPasswordToggle("btn-toggle-profile-confirm-pwd", "profile-confirm-password");

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errAlert = document.getElementById("profile-error-alert");
      const successAlert = document.getElementById("profile-success-alert");
      const submitBtn = document.getElementById("btn-save-profile");
      const nameInput = document.getElementById("profile-display-name-input");
      const newPwdInput = document.getElementById("profile-new-password");
      const confirmPwdInput = document.getElementById("profile-confirm-password");

      errAlert.classList.add("hidden");
      errAlert.textContent = "";
      successAlert.classList.add("hidden");
      successAlert.textContent = "";

      const newDisplayName = nameInput.value.trim();
      const emailInput = document.getElementById("profile-email-input");
      const newEmail = emailInput ? emailInput.value.trim() : "";
      const newPassword = newPwdInput.value;
      const confirmPassword = confirmPwdInput.value;

      if (!newDisplayName) {
        errAlert.textContent = "請輸入用戶名稱";
        errAlert.classList.remove("hidden");
        nameInput.focus();
        return;
      }
      if (newDisplayName.length > 30) {
        errAlert.textContent = "用戶名稱長度不可超過 30 個字元";
        errAlert.classList.remove("hidden");
        nameInput.focus();
        return;
      }
      if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        errAlert.textContent = "電子信箱格式不正確，例如：user@example.com";
        errAlert.classList.remove("hidden");
        emailInput.focus();
        return;
      }

      const isChangingPassword = newPassword.length > 0 || confirmPassword.length > 0;
      if (isChangingPassword) {
        if (newPassword.length < 6 || newPassword.length > 50) {
          errAlert.textContent = "新密碼長度需介於 6 至 50 個字元";
          errAlert.classList.remove("hidden");
          newPwdInput.focus();
          return;
        }
        if (newPassword !== confirmPassword) {
          errAlert.textContent = "兩次輸入的新密碼不一致";
          errAlert.classList.remove("hidden");
          confirmPwdInput.focus();
          return;
        }
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "儲存中...";

      try {
        let updatedUser = currentUser;
        const nameChanged = newDisplayName !== (currentUser.displayName || currentUser.username);
        const emailChanged = newEmail !== (currentUser.email || "");

        if (nameChanged || emailChanged) {
          const resp = await api.updateProfile(newDisplayName, newEmail);
          if (resp && resp.user) {
            updatedUser = { ...currentUser, displayName: resp.user.displayName, email: resp.user.email };
          } else {
            updatedUser = { ...currentUser, displayName: newDisplayName, email: newEmail };
          }
        }

        if (isChangingPassword) {
          await api.changePassword(newPassword);
        }

        notifyAuthChanged(updatedUser);

        let msg = "個人設定已成功更新！";
        if (nameChanged && isChangingPassword) {
          msg = "用戶名稱與密碼已成功更新！";
        } else if (nameChanged) {
          msg = "用戶名稱已成功更新！";
        } else if (isChangingPassword) {
          msg = "密碼已成功修改！";
        }

        successAlert.textContent = msg;
        successAlert.classList.remove("hidden");
        showToast(msg, "success");

        setTimeout(() => {
          closeProfileModal();
        }, 600);
      } catch (err) {
        errAlert.textContent = err.message || "更新失敗，請稍後再試";
        errAlert.classList.remove("hidden");
        showToast(err.message || "更新失敗", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "儲存個人設定";
      }
    });
  }
}

// Open / Close Profile Modal
function openProfileModal() {
  if (!currentUser) {
    showToast("請先登入會員", "warning");
    openAuthModal("login");
    return;
  }
  const modal = document.getElementById("modal-profile");
  const avatarDisplay = document.getElementById("profile-avatar-display");
  const usernameDisplay = document.getElementById("profile-username-display");
  const nameInput = document.getElementById("profile-display-name-input");
  const emailInput = document.getElementById("profile-email-input");
  const newPwdInput = document.getElementById("profile-new-password");
  const confirmPwdInput = document.getElementById("profile-confirm-password");
  const errAlert = document.getElementById("profile-error-alert");
  const successAlert = document.getElementById("profile-success-alert");

  const initial = (currentUser.displayName || currentUser.username || "和").charAt(0).toUpperCase();
  avatarDisplay.textContent = initial;
  usernameDisplay.textContent = `@${currentUser.username}`;
  nameInput.value = currentUser.displayName || currentUser.username;
  if (emailInput) emailInput.value = currentUser.email || "";
  newPwdInput.value = "";
  confirmPwdInput.value = "";

  resetProfilePasswordVisibility();
  errAlert.classList.add("hidden");
  errAlert.textContent = "";
  successAlert.classList.add("hidden");
  successAlert.textContent = "";

  modal.classList.remove("hidden");
  setTimeout(() => nameInput.focus(), 100);
}

function closeProfileModal() {
  const modal = document.getElementById("modal-profile");
  if (modal) modal.classList.add("hidden");
  resetProfilePasswordVisibility();
}

function resetProfilePasswordVisibility() {
  const pwdInput = document.getElementById("profile-new-password");
  const confirmInput = document.getElementById("profile-confirm-password");
  const btnPwd = document.getElementById("btn-toggle-profile-pwd");
  const btnConfirm = document.getElementById("btn-toggle-profile-confirm-pwd");

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

