// ============================================
// TURBINE LOGSHEET PRO - VERSION CONTROL
// ============================================
const APP_VERSION = '2.0.3';

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================
const AUTH_CONFIG = {
    SESSION_KEY: 'turbine_session_v2',
    USER_KEY: 'turbine_user_v2',
    SESSION_DURATION: 8 * 60 * 60 * 1000,
    REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000
};

const DRAFT_KEYS = {
    LOGSHEET: 'draft_turbine_v2',
    LOGSHEET_BACKUP: 'draft_turbine_backup_v2',
    BALANCING: 'balancing_draft_v2',
    TPM_OFFLINE: 'tpm_offline_v2',
    LOGSHEET_OFFLINE: 'offline_logsheets_v2',
    BALANCING_OFFLINE: 'balancing_offline_v2',
    TPM_HISTORY: 'tpm_history_v2',
    BALANCING_HISTORY: 'balancing_history_v2'
};

const GAS_URL = "https://script.google.com/macros/s/AKfycbzTahRMM2mmgwNgZuOxpbwVJAqFs7HRx3AjRrkShVX3VJ__NqQ0zbenBugI2KRdOSlDXw/exec";

const USER_CREDENTIALS = {
    'admin': { 
        password: 'admin123', 
        role: 'admin', 
        name: 'Administrator',
        department: 'Unit Utilitas 3B'
    },
    '2146043': { 
        password: 'operator123', 
        role: 'operator', 
        name: 'Ali Husanan',
        department: 'Unit Utilitas 3B'
    },
    '2146033': { 
        password: '2146033', 
        role: 'operator', 
        name: 'Brilian Eriko S',
        department: 'Unit Utilitas 3B'
    }
};

// ============================================
// STATE VARIABLES
// ============================================
let lastData = {};
let currentInput = JSON.parse(localStorage.getItem(DRAFT_KEYS.LOGSHEET)) || {};
let activeArea = "";
let activeIdx = 0;
let totalParams = 0;
let currentInputType = 'text';
let autoCloseTimer = null;
let currentUser = null;
let isAuthenticated = false;
let activeTPMArea = '';
let currentTPMPhoto = null;
let currentTPMStatus = '';
let currentShift = 3;
let balancingAutoSaveInterval = null;
let uploadProgressInterval = null;
let currentUploadController = null;
let deferredPrompt = null;
let installBannerShown = false;

// ============================================
// AREA & PARAMETER DEFINITIONS
// ============================================
const AREAS = {
    "Steam Inlet Turbine": [
        "MPS Inlet 30-TP-6101 PI-6114 (kg/cm2)", 
        "MPS Inlet 30-TP-6101 TI-6153 (°C)", 
        "MPS Inlet 30-TP-6101 PI-6116 (kg/cm2)", 
        "LPS Extrac 30-TP-6101 PI-6123 (kg/cm2)", 
        "Gland Steam TI-6156 (°C)", 
        "MPS Inlet 30-TP-6101 PI-6108 (Kg/cm2)", 
        "Exhaust Steam PI-6111 (kg/cm2)", 
        "Gland Steam PI-6118 (Kg/cm2)"
    ],
    "Low Pressure Steam": [
        "LPS from U-6101 PI-6104 (kg/cm2)", 
        "LPS from U-6101 TI-6102 (°C)", 
        "LPS Header PI-6106 (Kg/cm2)", 
        "LPS Header TI-6107 (°C)"
    ],
    "Lube Oil": [
        "Lube Oil 30-TK-6102 LI-6104 (%)", 
        "Lube Oil 30-TK-6102 TI-6125 (°C)", 
        "Lube Oil 30-C-6101 (On/Off)", 
        "Lube Oil 30-EH-6102 (On/Off)", 
        "Lube Oil Cartridge FI-6143 (%)", 
        "Lube Oil Cartridge PI-6148 (mmH2O)", 
        "Lube Oil Cartridge PI-6149 (mmH2O)", 
        "Lube Oil PI-6145 (kg/cm2)", 
        "Lube Oil E-6104 (A/B)", 
        "Lube Oil TI-6127 (°C)", 
        "Lube Oil FIL-6101 (A/B)", 
        "Lube Oil PDI-6146 (Kg/cm2)", 
        "Lube Oil PI-6143 (Kg/cm2)", 
        "Lube Oil TI-6144 (°C)", 
        "Lube Oil TI-6146 (°C)", 
        "Lube Oil TI-6145 (°C)", 
        "Lube Oil FG-6144 (%)", 
        "Lube Oil FG-6146 (%)", 
        "Lube Oil TI-6121 (°C)", 
        "Lube Oil TI-6116 (°C)", 
        "Lube Oil FG-6121 (%)", 
        "Lube Oil FG-6116 (%)"
    ],
    "Control Oil": [
        "Control Oil 30-TK-6103 LI-6106 (%)", 
        "Control Oil 30-TK-6103 TI-6128 (°C)", 
        "Control Oil P-6106 (A/B)", 
        "Control Oil FIL-6103 (A/B)", 
        "Control Oil PI-6152 (Bar)"
    ],
    "Shaft Line": [
        "Jacking Oil 30-P-6105 PI-6158 (Bar)", 
        "Jacking Oil 30-P-6105 PI-6161 (Bar)", 
        "Electrical Turning Gear U-6103 (Remote/Running/Stop)", 
        "EH-6101 (ON/OFF)"
    ],
    "Condenser 30-E-6102": [
        "LG-6102 (%)", 
        "30-P-6101 (A/B)", 
        "30-P-6101 Suction (kg/cm2)", 
        "30-P-6101 Discharge (kg/cm2)", 
        "30-P-6101 Load (Ampere)"
    ],
    "Ejector": [
        "J-6101 PI-6126 A (Kg/cm2)", 
        "J-6101 PI-6127 B (Kg/cm2)", 
        "J-6102 PI-6128 A (Kg/cm2)", 
        "J-6102 PI-6129 B (Kg/cm2)", 
        "J-6104 PI-6131 (Kg/cm2)", 
        "J-6104 PI-6138 (Kg/cm2)", 
        "PI-6172 (kg/cm2)", 
        "LPS Extrac 30-TP-6101 TI-6155 (°C)", 
        "from U-6102 TI-6104 (°C)"
    ],
    "Generator Cooling Water": [
        "Air Cooler PI-6124 A (Kg/cm2)", 
        "Air Cooler PI-6124 B (Kg/cm2)", 
        "Air Cooler TI-6113 A (°C)", 
        "Air Cooler TI-6113 B (°C)", 
        "Air Cooler PI-6125 A (Kg/cm2)", 
        "Air Cooler PI-6125 B (Kg/cm2)", 
        "Air Cooler TI-6114 A (°C)", 
        "Air Cooler TI-6114 B (°C)"
    ],
    "Condenser Cooling Water": [
        "Condenser PI-6135 A (Kg/cm2)", 
        "Condenser PI-6135 B (Kg/cm2)", 
        "Condenser TI-6118 A (°C)", 
        "Condenser TI-6118 B (°C)", 
        "Condenser PI-6136 A (Kg/cm2)", 
        "Condenser PI-6136 B (Kg/cm2)", 
        "Condenser TI-6119 A (°C)", 
        "Condenser TI-6119 B (°C)"
    ],
    "BFW System": [
        "Condensate Tank TK-6201 (%)", 
        "Condensate Tank TI-6216 (°C)", 
        "P-6202 (A/B)", 
        "P-6202 Suction (kg/cm2)", 
        "P-6202 Discharge (kg/cm2)", 
        "P-6202 Load (Ampere)", 
        "Deaerator LI-6202 (%)", 
        "Deaerator TI-6201 (°C)", 
        "30-P-6201 (A/B)", 
        "30-P-6201 Suction (kg/cm2)", 
        "30-P-6201 Discharge (kg/cm2)", 
        "30-P-6201 Load (Ampere)", 
        "30-C-6202 A (ON/OFF)", 
        "30-C-6202 A (Ampere)", 
        "30-C-6202 B (ON/OFF)", 
        "30-C-6202 B (Ampere)", 
        "30-C-6202 PCV-6216 (%)", 
        "30-C-6202 PI-6107 (kg/cm2)", 
        "Condensate Drum 30-D-6201 LI-6209 (%)", 
        "Condensate Drum 30-D-6201 PI-6218 (kg/cm2)", 
        "Condensate Drum 30-D-6201 TI-6215 (°C)"
    ],
    "Chemical Dosing": [
        "30-TK-6205 LI-6204 (%)", 
        "30-TK-6205 30-P-6205 (A/B)", 
        "30-TK-6205 Disch (kg/cm2)", 
        "30-TK-6205 Stroke (%)", 
        "30-TK-6206 LI-6206 (%)", 
        "30-TK-6206 30-P-6206 (A/B)", 
        "30-TK-6206 Disch (kg/cm2)", 
        "30-TK-6206 Stroke (%)", 
        "30-TK-6207 LI-6208 (%)", 
        "30-TK-6207 30-P-6207 (A/B)", 
        "30-TK-6207 Disch (kg/cm2)", 
        "30-TK-6207 Stroke (%)"
    ]
};

const BALANCING_FIELDS = [
    'balancingDate', 'balancingTime',
    'loadMW', 'eksporMW',
    'plnMW', 'ubbMW', 'pieMW', 'tg65MW', 'tg66MW', 'gtgMW',
    'ss6500MW', 'ss2000Via', 'activePowerMW', 'reactivePowerMVAR', 
    'currentS', 'voltageV', 'hvs65l02MW', 'hvs65l02Current', 'total3BMW',
    'fq1105',
    'stgSteam', 'pa2Steam', 'puri2Steam', 'melterSA2', 
    'ejectorSteam', 'glandSealSteam', 'deaeratorSteam', 
    'dumpCondenser', 'pcv6105',
    'pi6122', 'ti6112', 'ti6146', 'ti6126', 
    'axialDisplacement', 'vi6102', 'te6134',
    'ctSuFan', 'ctSuPompa', 'ctSaFan', 'ctSaPompa',
    'kegiatanShift'
];

const INPUT_TYPES = {
    PUMP_STATUS: {
        patterns: ['(A/B)', '(ON/OFF)', '(On/Off)', '(Running/Stop)', '(Remote/Running/Stop)'],
        options: {
            '(A/B)': ['A', 'B'],
            '(ON/OFF)': ['ON', 'OFF'],
            '(On/Off)': ['On', 'Off'],
            '(Running/Stop)': ['Running', 'Stop'],
            '(Remote/Running/Stop)': ['Remote', 'Running', 'Stop']
        }
    }
};

// ============================================
// SERVICE WORKER
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`)
            .then(registration => {
                console.log('SW registered:', registration);
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateAlert();
                        }
                    });
                });
            })
            .catch(err => console.log('SW registration failed:', err));
            
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'VERSION_CHECK' && event.data.version !== APP_VERSION) {
                showUpdateAlert();
            }
        });
    });
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('operatorPassword');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
    } else {
        passwordInput.type = 'password';
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
    }
}

function initAuth() {
    const session = getSession();
    
    if (session && isSessionValid(session)) {
        currentUser = session.user;
        isAuthenticated = true;
        updateUIForAuthenticatedUser();
        
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen && loginScreen.classList.contains('active')) {
            navigateTo('homeScreen');
        }
    } else {
        clearSession();
        showLoginScreen();
    }
}

function getSession() {
    try {
        const sessionData = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        return sessionData ? JSON.parse(sessionData) : null;
    } catch (e) {
        console.error('Error reading session:', e);
        return null;
    }
}

function saveSession(user, password, rememberMe = false) {
    const duration = rememberMe ? AUTH_CONFIG.REMEMBER_ME_DURATION : AUTH_CONFIG.SESSION_DURATION;
    const session = {
        user: user,
        username: user.username,
        password: password,
        loginTime: Date.now(),
        expiresAt: Date.now() + duration,
        rememberMe: rememberMe
    };
    
    try {
        localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
    } catch (e) {
        console.error('Error saving session:', e);
    }
}

function isSessionValid(session) {
    if (!session || !session.expiresAt) return false;
    return Date.now() < session.expiresAt;
}

function clearSession() {
    localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    currentUser = null;
    isAuthenticated = false;
}

function loginOperator() {
    const usernameInput = document.getElementById('operatorName');
    const passwordInput = document.getElementById('operatorPassword');
    const errorMsg = document.getElementById('loginError');
    
    if (!usernameInput || !passwordInput) {
        console.error('Login inputs not found');
        return;
    }
    
    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    
    usernameInput.classList.remove('error');
    passwordInput.classList.remove('error');
    errorMsg.style.display = 'none';
    errorMsg.classList.remove('show');
    
    if (!username) {
        showLoginError('Username wajib diisi!', usernameInput);
        return;
    }
    
    if (username.length < 3) {
        showLoginError('Username minimal 3 karakter!', usernameInput);
        return;
    }
    
    if (!password) {
        showLoginError('Password wajib diisi!', passwordInput);
        return;
    }
    
    const user = USER_CREDENTIALS[username];
    
    if (!user || user.password !== password) {
        showLoginError('Username atau password salah!', usernameInput);
        passwordInput.value = '';
        passwordInput.focus();
        return;
    }
    
    const userSession = {
        name: user.name,
        username: username,
        id: user.role.toUpperCase() + '-' + Date.now().toString(36).toUpperCase().slice(-6),
        role: user.role,
        department: user.department,
        loginTime: new Date().toISOString()
    };
    
    saveSession(userSession, password, false);
    currentUser = userSession;
    isAuthenticated = true;
    
    showCustomAlert(`Selamat datang, ${user.name}!`, 'success');
    
    setTimeout(() => {
        updateUIForAuthenticatedUser();
        navigateTo('homeScreen');
        }, 800);
}

function showLoginError(message, focusElement) {
    const errorMsg = document.getElementById('loginError');
    const usernameInput = document.getElementById('operatorName');
    const passwordInput = document.getElementById('operatorPassword');
    
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    errorMsg.classList.add('show');
    
    if (usernameInput) usernameInput.classList.add('error');
    if (passwordInput) passwordInput.classList.add('error');
    
    if (focusElement) {
        focusElement.focus();
    }
    
    setTimeout(() => {
        errorMsg.classList.remove('show');
        if (usernameInput) usernameInput.classList.remove('error');
        if (passwordInput) passwordInput.classList.remove('error');
    }, 3000);
}

function logoutOperator() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        if (Object.keys(currentInput).length > 0) {
            localStorage.setItem(DRAFT_KEYS.LOGSHEET_BACKUP, JSON.stringify(currentInput));
        }
        
        clearSession();
        
        const nameInput = document.getElementById('operatorName');
        const passInput = document.getElementById('operatorPassword');
        if (nameInput) nameInput.value = '';
        if (passInput) passInput.value = '';
        
        showLoginScreen();
        showCustomAlert('Anda telah keluar dari sistem.', 'success');
    }
}

function showLoginScreen() {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });
    
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
        loginScreen.classList.add('active');
    }
    
    const savedUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            const nameInput = document.getElementById('operatorName');
            if (nameInput && user.username) {
                nameInput.value = user.username;
                document.getElementById('operatorPassword')?.focus();
            }
        } catch (e) {
            console.error('Error parsing saved user:', e);
        }
    }
}

function updateUIForAuthenticatedUser() {
    if (!currentUser) return;
    
    const userElements = [
        'displayUserName',
        'tpmHeaderUser',
        'tpmInputUser',
        'areaListUser',
        'paramUser',
        'balancingUser'
    ];
    
    userElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (currentUser.role === 'admin') {
                el.innerHTML = `${currentUser.name} <span style="margin-left: 4px; padding: 2px 6px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; font-size: 0.65rem; border-radius: 4px; text-transform: uppercase; font-weight: 700;">Admin</span>`;
            } else {
                el.textContent = currentUser.name;
            }
        }
    });
}

function requireAuth() {
    if (!isAuthenticated || !isSessionValid(getSession())) {
        clearSession();
        showLoginScreen();
        showCustomAlert('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
        return false;
    }
    return true;
}

// ============================================
// UPLOAD PROGRESS MANAGER
// ============================================
function showUploadProgress(title = 'Mengupload Data...') {
    const overlay = document.getElementById('uploadProgressOverlay');
    const percentage = document.getElementById('progressPercentage');
    const ringFill = document.getElementById('progressRingFill');
    const turbine = document.getElementById('uploadTurbine');
    const statusText = document.getElementById('uploadStatusText');
    
    overlay.classList.remove('hidden', 'success', 'error');
    percentage.textContent = '0%';
    ringFill.style.strokeDashoffset = 339.292;
    turbine.classList.add('spinning');
    statusText.textContent = title;
    
    document.querySelectorAll('.step').forEach((step, idx) => {
        step.classList.remove('active', 'completed');
        if (idx === 0) step.classList.add('active');
    });
    document.querySelectorAll('.step-line').forEach(line => line.classList.remove('active'));
    
    let progress = 0;
    let currentStep = 1;
    
    uploadProgressInterval = setInterval(() => {
        if (progress < 30) {
            progress += Math.random() * 3;
        } else if (progress < 70) {
            progress += Math.random() * 2;
            if (currentStep === 1 && progress > 35) {
                setUploadStep(2);
                currentStep = 2;
            }
        } else if (progress < 95) {
            progress += Math.random() * 1;
            if (currentStep === 2 && progress > 75) {
                setUploadStep(3);
                currentStep = 3;
            }
        } else {
            progress += 0.5;
        }
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(uploadProgressInterval);
        }
        
        updateProgressRing(progress);
        
    }, 100);
    
    return {
        complete: () => completeUploadProgress(),
        error: () => errorUploadProgress(),
        updateText: (text) => { if(statusText) statusText.textContent = text; }
    };
}

function updateProgressRing(percentage) {
    const ringFill = document.getElementById('progressRingFill');
    const percentageText = document.getElementById('progressPercentage');
    const circumference = 339.292;
    const offset = circumference - (percentage / 100) * circumference;
    
    if (ringFill) ringFill.style.strokeDashoffset = offset;
    if (percentageText) percentageText.textContent = Math.round(percentage) + '%';
}

function setUploadStep(stepNum) {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`step${i}`);
        const line = document.getElementById(`stepLine${i}`);
        
        if (step) {
            if (i < stepNum) {
                step.classList.remove('active');
                step.classList.add('completed');
                const icon = step.querySelector('.step-icon');
                if (icon) icon.innerHTML = '✓';
            } else if (i === stepNum) {
                step.classList.add('active');
                step.classList.remove('completed');
            }
        }
        
        if (line && i < stepNum) {
            line.classList.add('active');
        }
    }
}

function completeUploadProgress() {
    clearInterval(uploadProgressInterval);
    updateProgressRing(100);
    setUploadStep(4);
    
    const overlay = document.getElementById('uploadProgressOverlay');
    const turbine = document.getElementById('uploadTurbine');
    const statusText = document.getElementById('uploadStatusText');
    
    if (overlay) overlay.classList.add('success');
    if (turbine) turbine.classList.remove('spinning');
    if (statusText) statusText.textContent = '✓ Berhasil!';
    
    setTimeout(() => {
        hideUploadProgress();
    }, 800);
}

function errorUploadProgress() {
    clearInterval(uploadProgressInterval);
    
    const overlay = document.getElementById('uploadProgressOverlay');
    const turbine = document.getElementById('uploadTurbine');
    const statusText = document.getElementById('uploadStatusText');
    const percentage = document.getElementById('progressPercentage');
    
    if (overlay) overlay.classList.add('error');
    if (turbine) turbine.classList.remove('spinning');
    if (statusText) statusText.textContent = '✗ Gagal Mengirim';
    if (percentage) percentage.textContent = 'Error';
    
    setTimeout(() => {
        hideUploadProgress();
    }, 1500);
}

function hideUploadProgress() {
    const overlay = document.getElementById('uploadProgressOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('success', 'error');
    }
    clearInterval(uploadProgressInterval);
}

function cancelUpload() {
    if (currentUploadController) {
        currentUploadController.abort();
    }
    hideUploadProgress();
    showCustomAlert('Upload dibatalkan', 'warning');
}

// ============================================
// UI & NAVIGATION FUNCTIONS
// ============================================
function setupLoginListeners() {
    const nameInput = document.getElementById('operatorName');
    const passwordInput = document.getElementById('operatorPassword');
    
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            nameInput.classList.remove('error');
        });
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (passwordInput) passwordInput.focus();
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            passwordInput.classList.remove('error');
        });
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginOperator();
            }
        });
    }
}

function setupTPMListeners() {
    const tpmCamera = document.getElementById('tpmCamera');
    if (tpmCamera) {
        tpmCamera.addEventListener('change', handleTPMPhoto);
    }
}

function simulateLoading() {
    let progress = 0;
    const loaderProgress = document.getElementById('loaderProgress');
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                const loader = document.getElementById('loader');
                if (loader) loader.style.display = 'none';
                
                if (isAuthenticated) {
                    renderMenu();
                }
            }, 500);
        }
        if (loaderProgress) loaderProgress.style.width = progress + '%';
    }, 300);
}

function showUpdateAlert() {
    const updateAlert = document.getElementById('updateAlert');
    if (updateAlert) updateAlert.classList.remove('hidden');
}

function applyUpdate() {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
}

function showCustomAlert(msg, type = 'success') {
    const alertContent = document.getElementById('alertContent');
    const alertTitle = document.getElementById('alertTitle');
    const alertIconWrapper = document.getElementById('alertIconWrapper');
    const customAlert = document.getElementById('customAlert');
    
    if (!customAlert || !alertContent || !alertTitle || !alertIconWrapper) {
        console.error('Alert elements not found');
        alert(msg);
        return;
    }
    
    if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
    }
    
    const titleMap = {
        'success': 'Berhasil',
        'error': 'Error',
        'warning': 'Peringatan',
        'info': 'Informasi'
    };
    alertTitle.textContent = titleMap[type] || 'Informasi';
    
    const alertMessage = document.getElementById('alertMessage');
    if (alertMessage) alertMessage.innerText = msg;
    
    alertContent.className = 'alert-content ' + type;
    
    if (type === 'success') {
        alertIconWrapper.innerHTML = `
            <div class="alert-icon-bg"></div>
            <svg class="alert-icon-svg" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="25"></circle>
                <path d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>
            </svg>
        `;
    } else if (type === 'warning') {
        alertIconWrapper.innerHTML = `
            <div class="alert-icon-bg" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);"></div>
            <svg class="alert-icon-svg" viewBox="0 0 52 52" style="stroke: #f59e0b;">
                <circle cx="26" cy="26" r="25"></circle>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        `;
    } else if (type === 'info') {
        alertIconWrapper.innerHTML = `
            <div class="alert-icon-bg" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);"></div>
            <svg class="alert-icon-svg" viewBox="0 0 52 52" style="stroke: #3b82f6;">
                <circle cx="26" cy="26" r="25"></circle>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
        `;
    } else {
        alertIconWrapper.innerHTML = `
            <div class="alert-icon-bg" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);"></div>
            <svg class="alert-icon-svg" viewBox="0 0 52 52" style="stroke: #ef4444;">
                <circle cx="26" cy="26" r="25"></circle>
                <path d="M16 16 L36 36 M36 16 L16 36"></path>
            </svg>
        `;
    }
    
    customAlert.classList.remove('hidden');
    
    if (type === 'success' || type === 'info') {
        autoCloseTimer = setTimeout(() => {
            if (!customAlert.classList.contains('hidden')) closeAlert();
        }, 3000);
    }
}

function closeAlert() {
    const customAlert = document.getElementById('customAlert');
    if (customAlert) customAlert.classList.add('hidden');
    if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
    }
}

function navigateTo(screenId) {
    const protectedScreens = ['homeScreen', 'areaListScreen', 'paramScreen', 'tpmScreen', 'tpmInputScreen', 'balancingScreen'];
    if (protectedScreens.includes(screenId) && !requireAuth()) {
        return;
    }
    
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.animation = 'none';
        setTimeout(() => s.style.animation = '', 10);
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        
        if (screenId === 'tpmScreen' || screenId === 'tpmInputScreen') {
            updateTPMUserInfo();
        }
        
        if (screenId === 'areaListScreen') {
            fetchLastData();
            updateOverallProgress();
        } else if (screenId === 'homeScreen') {
            loadUserStats();
        } else if (screenId === 'balancingScreen') {
            initBalancingScreen();
        }
    }
}

// ============================================
// LOGSHEET FUNCTIONS
// ============================================
function fetchLastData() {
    updateStatusIndicator(false);
    const timeout = setTimeout(() => renderMenu(), 8000);
    const callbackName = 'jsonp_' + Date.now();
    const script = document.createElement('script');
    
    window[callbackName] = (data) => {
        clearTimeout(timeout);
        lastData = data;
        updateStatusIndicator(true);
        delete window[callbackName];
        script.remove();
        renderMenu();
    };
    
    script.src = `${GAS_URL}?callback=${callbackName}`;
    script.onerror = () => {
        clearTimeout(timeout);
        renderMenu();
    };
    document.body.appendChild(script);
}

function updateStatusIndicator(isOnline) {
    console.log('Status:', isOnline ? 'Online' : 'Offline');
}

function renderMenu() {
    const list = document.getElementById('areaList');
    if (!list) return;
    
    const totalAreas = Object.keys(AREAS).length;
    let completedAreas = 0;
    let html = '';
    
    Object.entries(AREAS).forEach(([areaName, params]) => {
        const areaData = currentInput[areaName] || {};
        const filled = Object.keys(areaData).length;
        const total = params.length;
        const percent = Math.round((filled / total) * 100);
        const isCompleted = filled === total && total > 0;
        
        const hasAbnormal = params.some(paramName => {
            const val = areaData[paramName] || '';
            const firstLine = val.split('\n')[0];
            return ['ERROR', 'UPPER', 'NOT_INSTALLED'].includes(firstLine);
        });
        
        if (isCompleted) completedAreas++;
        
        const circumference = 2 * Math.PI * 18;
        const strokeDashoffset = circumference - (percent / 100) * circumference;
        
        html += `
            <div class="area-item ${isCompleted ? 'completed' : ''} ${hasAbnormal ? 'has-warning' : ''}" onclick="openArea('${areaName}')">
                <div class="area-progress-ring">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
                        <circle cx="20" cy="20" r="18" fill="none" stroke="${isCompleted ? '#10b981' : 'var(--primary)'}" 
                                stroke-width="3" stroke-linecap="round" stroke-dasharray="${circumference}" 
                                stroke-dashoffset="${strokeDashoffset}" transform="rotate(-90 20 20)"/>
                        <text x="20" y="24" text-anchor="middle" font-size="10" font-weight="bold" fill="${isCompleted ? '#10b981' : 'var(--text-primary)'}">${filled}</text>
                    </svg>
                </div>
                <div class="area-info">
                    <div class="area-name">${areaName}</div>
                    <div class="area-meta ${hasAbnormal ? 'warning' : ''}">
                        ${hasAbnormal ? '⚠️ Ada parameter bermasalah • ' : ''}${filled} dari ${total} parameter
                    </div>
                </div>
                <div class="area-status">
                    ${hasAbnormal ? '<span style="color: #ef4444; margin-right: 4px;">!</span>' : ''}
                    ${isCompleted ? '✓' : '❯'}
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
    
    const hasData = Object.keys(currentInput).length > 0;
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.style.display = hasData ? 'flex' : 'none';
    
    updateOverallProgressUI(completedAreas, totalAreas);
}

function updateOverallProgress() {
    const totalAreas = Object.keys(AREAS).length;
    let completedAreas = 0;
    Object.entries(AREAS).forEach(([areaName, params]) => {
        const filled = currentInput[areaName] ? Object.keys(currentInput[areaName]).length : 0;
        if (filled === params.length && filled > 0) completedAreas++;
    });
    updateOverallProgressUI(completedAreas, totalAreas);
}

function updateOverallProgressUI(completedAreas, totalAreas) {
    const percent = Math.round((completedAreas / totalAreas) * 100);
    const progressText = document.getElementById('progressText');
    const overallPercent = document.getElementById('overallPercent');
    const overallProgressBar = document.getElementById('overallProgressBar');
    
    if (progressText) progressText.textContent = `${percent}% Complete`;
    if (overallPercent) overallPercent.textContent = `${percent}%`;
    if (overallProgressBar) overallProgressBar.style.width = `${percent}%`;
}

function openArea(areaName) {
    if (!requireAuth()) return;
    
    activeArea = areaName;
    activeIdx = 0;
    navigateTo('paramScreen');
    const currentAreaName = document.getElementById('currentAreaName');
    if (currentAreaName) currentAreaName.textContent = areaName;
    renderProgressDots();
    showStep();
}

function renderProgressDots() {
    const container = document.getElementById('progressDots');
    if (!container) return;
    const total = AREAS[activeArea].length;
    let html = '';
    
    for (let i = 0; i < total; i++) {
        const fullLabel = AREAS[activeArea][i];
        const savedValue = currentInput[activeArea]?.[fullLabel] || '';
        const lines = savedValue.split('\n');
        const firstLine = lines[0];
        
        const isFilled = savedValue !== '';
        const hasIssue = ['ERROR', 'UPPER', 'NOT_INSTALLED'].includes(firstLine);
        const isActive = i === activeIdx;
        
        let className = '';
        if (isActive) className = 'active';
        else if (hasIssue) className = 'has-issue';
        else if (isFilled) className = 'filled';
        
        html += `<div class="progress-dot ${className}" onclick="jumpToStep(${i})" title="${hasIssue ? firstLine : ''}"></div>`;
    }
    container.innerHTML = html;
}

function jumpToStep(index) {
    const fullLabel = AREAS[activeArea][activeIdx];
    const input = document.getElementById('valInput');
    
    if (input && input.value.trim()) {
        if (!currentInput[activeArea]) currentInput[activeArea] = {};
        
        const checkedStatus = document.querySelector('input[name="paramStatus"]:checked');
        const note = document.getElementById('statusNote')?.value || '';
        let valueToSave = input.value.trim();
        
        if (checkedStatus) {
            if (note) {
                valueToSave = `${checkedStatus.value}\n${note}`;
            } else {
                valueToSave = checkedStatus.value;
            }
        }
        
        currentInput[activeArea][fullLabel] = valueToSave;
        localStorage.setItem(DRAFT_KEYS.LOGSHEET, JSON.stringify(currentInput));
    }
    
    activeIdx = index;
    showStep();
    renderProgressDots();
}

function detectInputType(label) {
    for (const [type, config] of Object.entries(INPUT_TYPES)) {
        for (const pattern of config.patterns) {
            if (label.includes(pattern)) {
                return {
                    type: 'select',
                    options: config.options[pattern],
                    pattern: pattern
                };
            }
        }
    }
    return { type: 'text', options: null, pattern: null };
}

function getUnit(label) {
    const match = label.match(/\(([^)]+)\)/);
    return match ? match[1] : "";
}

function getParamName(label) {
    return label.split(' (')[0];
}

function handleStatusChange(checkbox) {
    const chip = checkbox.closest('.status-chip');
    const noteContainer = document.getElementById('statusNoteContainer');
    const fullLabel = AREAS[activeArea][activeIdx];
    const valInput = document.getElementById('valInput');
    
    document.querySelectorAll('input[name="paramStatus"]').forEach(cb => {
        if (cb !== checkbox) {
            cb.checked = false;
            cb.closest('.status-chip').classList.remove('active');
        }
    });
    
    if (checkbox.checked) {
        chip.classList.add('active');
        if (noteContainer) noteContainer.style.display = 'block';
        
        setTimeout(() => {
            const noteInput = document.getElementById('statusNote');
            if (noteInput) noteInput.focus();
        }, 100);
        
        if (checkbox.value === 'NOT_INSTALLED') {
            if (valInput) {
                valInput.value = '-';
                valInput.disabled = true;
                valInput.style.opacity = '0.5';
                valInput.style.background = 'rgba(100, 116, 139, 0.2)';
            }
        }
    } else {
        chip.classList.remove('active');
        if (noteContainer) noteContainer.style.display = 'none';
        const noteInput = document.getElementById('statusNote');
        if (noteInput) noteInput.value = '';
        
        if (valInput) {
            valInput.value = '';
            valInput.disabled = false;
            valInput.style.opacity = '1';
            valInput.style.background = '';
            valInput.focus();
        }
    }
    
    saveCurrentStatusToDraft();
}

function saveCurrentStatusToDraft() {
    const fullLabel = AREAS[activeArea][activeIdx];
    const input = document.getElementById('valInput');
    const checkedStatus = document.querySelector('input[name="paramStatus"]:checked');
    const note = document.getElementById('statusNote')?.value || '';
    
    if (!currentInput[activeArea]) currentInput[activeArea] = {};
    
    let valueToSave = '';
    if (input && input.value.trim()) {
        valueToSave = input.value.trim();
    }
    
    if (checkedStatus) {
        if (checkedStatus.value === 'NOT_INSTALLED') {
            valueToSave = 'NOT_INSTALLED';
            if (note) valueToSave += '\n' + note;
        } else {
            if (note) {
                valueToSave = `${checkedStatus.value}\n${note}`;
            } else {
                valueToSave = checkedStatus.value;
            }
        }
    }
    
    if (valueToSave) {
        currentInput[activeArea][fullLabel] = valueToSave;
    } else {
        delete currentInput[activeArea][fullLabel];
    }
    
    localStorage.setItem(DRAFT_KEYS.LOGSHEET, JSON.stringify(currentInput));
    renderProgressDots();
}

function loadAbnormalStatus(fullLabel) {
    document.querySelectorAll('input[name="paramStatus"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.status-chip').classList.remove('active');
    });
    const noteContainer = document.getElementById('statusNoteContainer');
    const noteInput = document.getElementById('statusNote');
    
    if (noteContainer) noteContainer.style.display = 'none';
    if (noteInput) noteInput.value = '';
    
    const valInput = document.getElementById('valInput');
    if (valInput) {
        valInput.disabled = false;
        valInput.style.opacity = '1';
        valInput.style.background = '';
        valInput.value = '';
    }
    
    if (currentInput[activeArea] && currentInput[activeArea][fullLabel]) {
        const savedValue = currentInput[activeArea][fullLabel];
        const lines = savedValue.split('\n');
        const firstLine = lines[0];
        const secondLine = lines[1] || '';
        
        const isStatus = ['ERROR', 'UPPER', 'NOT_INSTALLED'].includes(firstLine);
        
        if (isStatus) {
            const checkbox = document.querySelector(`input[value="${firstLine}"]`);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.closest('.status-chip').classList.add('active');
                if (noteContainer) noteContainer.style.display = 'block';
                if (noteInput) noteInput.value = secondLine;
                
                if (firstLine === 'NOT_INSTALLED') {
                    if (valInput) {
                        valInput.value = '-';
                        valInput.disabled = true;
                        valInput.style.opacity = '0.5';
                        valInput.style.background = 'rgba(100, 116, 139, 0.2)';
                    }
                } else {
                    if (valInput) valInput.value = '';
                }
            }
        } else {
            if (valInput) valInput.value = savedValue;
        }
    }
}

function showStep() {
    const fullLabel = AREAS[activeArea][activeIdx];
    const total = AREAS[activeArea].length;
    const inputType = detectInputType(fullLabel);
    currentInputType = inputType.type;
    
    const stepInfo = document.getElementById('stepInfo');
    const areaProgress = document.getElementById('areaProgress');
    const labelInput = document.getElementById('labelInput');
    const lastTimeLabel = document.getElementById('lastTimeLabel');
    const prevValDisplay = document.getElementById('prevValDisplay');
    const inputFieldContainer = document.getElementById('inputFieldContainer');
    const unitDisplay = document.getElementById('unitDisplay');
    const mainInputWrapper = document.getElementById('mainInputWrapper');
    
    if (stepInfo) stepInfo.textContent = `Step ${activeIdx + 1}/${total}`;
    if (areaProgress) areaProgress.textContent = `${activeIdx + 1}/${total}`;
    if (labelInput) labelInput.textContent = getParamName(fullLabel);
    if (lastTimeLabel) lastTimeLabel.textContent = lastData._lastTime || '--:--';
    
    let prevVal = lastData[fullLabel] || '--';
    if (prevVal !== '--') {
        const lines = prevVal.toString().split('\n');
        const firstLine = lines[0];
        if (['ERROR', 'UPPER', 'NOT_INSTALLED'].includes(firstLine)) {
            prevVal = firstLine + (lines[1] ? ' - ' + lines[1] : '');
        }
    }
    if (prevValDisplay) prevValDisplay.textContent = prevVal;
    
    if (inputType.type === 'select') {
        let currentValue = (currentInput[activeArea] && currentInput[activeArea][fullLabel]) || '';
        if (currentValue) {
            const lines = currentValue.split('\n');
            const firstLine = lines[0];
            if (!['ERROR', 'UPPER', 'NOT_INSTALLED'].includes(firstLine)) {
                currentValue = firstLine;
            } else {
                currentValue = '';
            }
        }
        
        let optionsHtml = `<option value="" disabled ${!currentValue ? 'selected' : ''}>Pilih Status...</option>`;
        inputType.options.forEach(opt => {
            const selected = currentValue === opt ? 'selected' : '';
            optionsHtml += `<option value="${opt}" ${selected}>${opt}</option>`;
        });
        
        if (inputFieldContainer) {
            inputFieldContainer.innerHTML = `
                <div class="select-wrapper">
                    <select id="valInput" class="status-select">${optionsHtml}</select>
                    <div class="select-arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </div>
                </div>
            `;
        }
        if (unitDisplay) unitDisplay.style.display = 'none';
        if (mainInputWrapper) mainInputWrapper.classList.add('has-select');
    } else {
        let currentValue = (currentInput[activeArea] && currentInput[activeArea][fullLabel]) || '';
        
        if (currentValue) {
            const lines = currentValue.split('\n');
            const firstLine = lines[0];
            if (!['ERROR', 'UPPER', 'NOT_INSTALLED'].includes(firstLine)) {
                currentValue = firstLine;
            } else {
                currentValue = '';
            }
        }
        
        if (inputFieldContainer) {
            inputFieldContainer.innerHTML = `<input type="text" id="valInput" inputmode="decimal" placeholder="0.00" value="${currentValue}" autocomplete="off">`;
        }
        if (unitDisplay) {
            unitDisplay.textContent = getUnit(fullLabel) || '--';
            unitDisplay.style.display = 'flex';
        }
        if (mainInputWrapper) mainInputWrapper.classList.remove('has-select');
    }
    
    loadAbnormalStatus(fullLabel);
    renderProgressDots();
    
    setTimeout(() => {
        const input = document.getElementById('valInput');
        if (input && inputType.type === 'text' && !input.disabled) {
            input.focus();
            input.select();
        }
    }, 100);
}

function saveStep() {
    const input = document.getElementById('valInput');
    const fullLabel = AREAS[activeArea][activeIdx];
    
    if (!currentInput[activeArea]) currentInput[activeArea] = {};
    
    let valueToSave = '';
    if (input && input.value.trim()) {
        valueToSave = input.value.trim();
    }
    
    const checkedStatus = document.querySelector('input[name="paramStatus"]:checked');
    const note = document.getElementById('statusNote')?.value || '';
    
    if (checkedStatus) {
        if (checkedStatus.value === 'NOT_INSTALLED') {
            valueToSave = 'NOT_INSTALLED';
            if (note) valueToSave += '\n' + note;
        } else {
            if (note) {
                valueToSave = `${checkedStatus.value}\n${note}`;
            } else {
                valueToSave = checkedStatus.value;
            }
        }
    }
    
    if (valueToSave) {
        currentInput[activeArea][fullLabel] = valueToSave;
    } else {
        delete currentInput[activeArea][fullLabel];
    }
    
    localStorage.setItem(DRAFT_KEYS.LOGSHEET, JSON.stringify(currentInput));
    
    if (activeIdx < AREAS[activeArea].length - 1) {
        activeIdx++;
        showStep();
    } else {
        showCustomAlert(`Area ${activeArea} selesai diisi!`, 'success');
        setTimeout(() => navigateTo('areaListScreen'), 1500);
    }
}

function goBack() {
    const fullLabel = AREAS[activeArea][activeIdx];
    const input = document.getElementById('valInput');
    
    if (!currentInput[activeArea]) currentInput[activeArea] = {};
    
    let valueToSave = '';
    if (input && input.value.trim()) {
        valueToSave = input.value.trim();
    }
    
    const checkedStatus = document.querySelector('input[name="paramStatus"]:checked');
    const note = document.getElementById('statusNote')?.value || '';
    
    if (checkedStatus) {
        if (checkedStatus.value === 'NOT_INSTALLED') {
            valueToSave = 'NOT_INSTALLED';
            if (note) valueToSave += '\n' + note;
        } else {
            if (note) {
                valueToSave = `${checkedStatus.value}\n${note}`;
            } else {
                valueToSave = checkedStatus.value;
            }
        }
    }
    
    if (valueToSave) {
        currentInput[activeArea][fullLabel] = valueToSave;
    } else {
        delete currentInput[activeArea][fullLabel];
    }
    
    localStorage.setItem(DRAFT_KEYS.LOGSHEET, JSON.stringify(currentInput));
    
    if (activeIdx > 0) {
        activeIdx--;
        showStep();
    } else {
        navigateTo('areaListScreen');
    }
}

// ============================================
// API COMMUNICATION HELPER
// ============================================
function getCredentialsForAPI() {
    const session = getSession();
    if (session && session.username && session.password) {
        return {
            username: session.username,
            password: session.password
        };
    }
    return null;
}

async function sendToSheet() {
    if (!requireAuth()) return;
    
    const progress = showUploadProgress('Mengirim Logsheet...');
    currentUploadController = new AbortController();
    
    let allParameters = {};
    Object.entries(currentInput).forEach(([areaName, params]) => {
        Object.entries(params).forEach(([paramName, value]) => {
            allParameters[paramName] = value;
        });
    });
    
    const creds = getCredentialsForAPI();
    if (!creds) {
        progress.error();
        showCustomAlert('Sesi tidak valid, silakan login ulang', 'error');
        return;
    }
    
    const finalData = {
        type: 'LOGSHEET',
        ...creds,
        Operator: currentUser ? currentUser.name : 'Unknown',
        ...allParameters
    };
    
    console.log('Sending Logsheet Data:', finalData);
    
    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData),
            signal: currentUploadController.signal
        });
        
        progress.complete();
        showCustomAlert('✓ Data berhasil dikirim ke sistem!', 'success');
        
        currentInput = {};
        localStorage.removeItem(DRAFT_KEYS.LOGSHEET);
        
        setTimeout(() => {
            navigateTo('homeScreen');
        }, 1500);
        
    } catch (error) {
        console.error('Error sending data:', error);
        progress.error();
        
        let offlineData = JSON.parse(localStorage.getItem(DRAFT_KEYS.LOGSHEET_OFFLINE) || '[]');
        offlineData.push(finalData);
        localStorage.setItem(DRAFT_KEYS.LOGSHEET_OFFLINE, JSON.stringify(offlineData));
        
        setTimeout(() => {
            showCustomAlert('Gagal mengirim. Data disimpan lokal.', 'error');
        }, 500);
    }
}

// ============================================
// TPM FUNCTIONS
// ============================================
function updateTPMUserInfo() {
    if (!currentUser) return;
    
    const tpmHeaderUser = document.getElementById('tpmHeaderUser');
    const tpmInputUser = document.getElementById('tpmInputUser');
    
    if (tpmHeaderUser) tpmHeaderUser.textContent = currentUser.name;
    if (tpmInputUser) tpmInputUser.textContent = currentUser.name;
}

function openTPMArea(areaName) {
    if (!requireAuth()) return;
    
    activeTPMArea = areaName;
    currentTPMPhoto = null;
    currentTPMStatus = '';
    
    resetTPMForm();
    
    const title = document.getElementById('tpmInputTitle');
    if (title) title.textContent = areaName;
    
    updateTPMUserInfo();
    navigateTo('tpmInputScreen');
}

function resetTPMForm() {
    const preview = document.getElementById('tpmPhotoPreview');
    const photoSection = document.getElementById('tpmPhotoSection');
    
    if (preview) {
        preview.innerHTML = `
            <div class="photo-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                </svg>
                <span>Ambil Foto</span>
            </div>
        `;
    }
    
    if (photoSection) photoSection.classList.remove('has-photo');
    
    const notes = document.getElementById('tpmNotes');
    if (notes) notes.value = '';
    
    const action = document.getElementById('tpmAction');
    if (action) action.value = '';
    
    resetTPMStatusButtons();
}

function resetTPMStatusButtons() {
    const buttons = ['btnNormal', 'btnAbnormal', 'btnOff'];
    buttons.forEach((id) => {
        const btn = document.getElementById(id);
        if (btn) btn.className = 'status-btn';
    });
}

function handleTPMPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showCustomAlert('Ukuran foto terlalu besar. Maksimal 5MB.', 'error');
        event.target.value = '';
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showCustomAlert('File harus berupa gambar.', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentTPMPhoto = e.target.result;
        const preview = document.getElementById('tpmPhotoPreview');
        const photoSection = document.getElementById('tpmPhotoSection');
        
        if (preview) {
            preview.innerHTML = `<img src="${currentTPMPhoto}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" alt="TPM Photo">`;
        }
        if (photoSection) photoSection.classList.add('has-photo');
        showCustomAlert('Foto berhasil diambil!', 'success');
    };
    reader.readAsDataURL(file);
}

function selectTPMStatus(status) {
    currentTPMStatus = status;
    resetTPMStatusButtons();
    
    const buttonMap = {
        'normal': { id: 'btnNormal', class: 'active-normal' },
        'abnormal': { id: 'btnAbnormal', class: 'active-abnormal' },
        'off': { id: 'btnOff', class: 'active-off' }
    };
    
    const selected = buttonMap[status];
    if (selected) {
        const btn = document.getElementById(selected.id);
        if (btn) btn.classList.add(selected.class);
    }
    
    if ((status === 'abnormal' || status === 'off') && !currentTPMPhoto) {
        setTimeout(() => {
            showCustomAlert('⚠️ Kondisi abnormal/off wajib didokumentasikan dengan foto!', 'warning');
        }, 100);
    }
}

async function submitTPMData() {
    if (!requireAuth()) return;
    
    const notes = document.getElementById('tpmNotes')?.value.trim() || '';
    const action = document.getElementById('tpmAction')?.value || '';
    
    if (!currentTPMStatus) {
        showCustomAlert('Pilih status kondisi terlebih dahulu!', 'error');
        return;
    }
    
    if (!currentTPMPhoto) {
        showCustomAlert('Ambil foto dokumentasi terlebih dahulu!', 'error');
        return;
    }
    
    if (!action) {
        showCustomAlert('Pilih tindakan yang dilakukan!', 'error');
        return;
    }
    
    const creds = getCredentialsForAPI();
    if (!creds) {
        showCustomAlert('Sesi tidak valid, silakan login ulang', 'error');
        return;
    }
    
    const progress = showUploadProgress('Mengupload TPM & Foto...');
    progress.updateText('Mengompresi foto...');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    progress.updateText('Mengirim data...');
    
    const tpmData = {
        type: 'TPM',
        ...creds,
        area: activeTPMArea,
        status: currentTPMStatus,
        action: action,
        notes: notes,
        photo: currentTPMPhoto,
        user: currentUser ? currentUser.name : 'Unknown',
        timestamp: new Date().toISOString()
    };
    
    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tpmData)
        });
        
        progress.complete();
        
        let tpmHistory = JSON.parse(localStorage.getItem(DRAFT_KEYS.TPM_HISTORY) || '[]');
        tpmHistory.push({...tpmData, photo: '[UPLOADED]'});
        localStorage.setItem(DRAFT_KEYS.TPM_HISTORY, JSON.stringify(tpmHistory));
        
        showCustomAlert(`✓ Data TPM ${activeTPMArea} berhasil disimpan!`, 'success');
        currentTPMPhoto = null;
        currentTPMStatus = '';
        
        setTimeout(() => navigateTo('tpmScreen'), 1500);
        
    } catch (error) {
        progress.error();
        
        let offlineTPM = JSON.parse(localStorage.getItem(DRAFT_KEYS.TPM_OFFLINE) || '[]');
        offlineTPM.push(tpmData);
        localStorage.setItem(DRAFT_KEYS.TPM_OFFLINE, JSON.stringify(offlineTPM));
        
        setTimeout(() => {
            showCustomAlert('Gagal mengupload. Data disimpan lokal.', 'error');
        }, 500);
    }
}

// ============================================
// BALANCING FUNCTIONS
// ============================================
function saveBalancingDraft() {
    try {
        const draftData = {};
        
        BALANCING_FIELDS.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                draftData[fieldId] = element.value;
            }
        });
        
        draftData._shift = currentShift;
        draftData._savedAt = new Date().toISOString();
        draftData._user = currentUser ? currentUser.name : 'Unknown';
        draftData._userId = currentUser ? currentUser.id : 'unknown';
        
        localStorage.setItem(DRAFT_KEYS.BALANCING, JSON.stringify(draftData));
        console.log('Balancing draft saved');
        updateDraftStatusIndicator();
        
    } catch (e) {
        console.error('Error saving balancing draft:', e);
    }
}

function loadBalancingDraft() {
    try {
        const draftData = JSON.parse(localStorage.getItem(DRAFT_KEYS.BALANCING));
        
        if (!draftData) {
            console.log('No balancing draft found');
            return false;
        }
        
        let loadedCount = 0;
        BALANCING_FIELDS.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element && draftData[fieldId] !== undefined && draftData[fieldId] !== '') {
                element.value = draftData[fieldId];
                loadedCount++;
            }
        });
        
        const eksporEl = document.getElementById('eksporMW');
        if (eksporEl && eksporEl.value) {
            handleEksporInput(eksporEl);
        }
        
        calculateLPBalance();
        
        if (loadedCount > 0) {
            showCustomAlert(`Draft tersimpan ditemukan! ${loadedCount} field telah diisi.`, 'success');
        }
        
        return loadedCount > 0;
        
    } catch (e) {
        console.error('Error loading balancing draft:', e);
        return false;
    }
}

function clearBalancingDraft() {
    try {
        localStorage.removeItem(DRAFT_KEYS.BALANCING);
        console.log('Balancing draft cleared');
        updateDraftStatusIndicator();
    } catch (e) {
        console.error('Error clearing balancing draft:', e);
    }
}

function setupBalancingAutoSave() {
    if (balancingAutoSaveInterval) {
        clearInterval(balancingAutoSaveInterval);
    }
    
    let lastData = '';
    balancingAutoSaveInterval = setInterval(() => {
        const currentData = JSON.stringify(getCurrentBalancingData());
        if (currentData !== lastData && hasBalancingData()) {
            saveBalancingDraft();
            lastData = currentData;
        }
    }, 10000);
    
    window.addEventListener('beforeunload', () => {
        if (hasBalancingData()) saveBalancingDraft();
    });
    
    const formContainer = document.getElementById('balancingScreen');
    if (formContainer) {
        let timeout;
        formContainer.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                clearTimeout(timeout);
                timeout = setTimeout(() => saveBalancingDraft(), 1000);
            }
        });
    }
}

function getCurrentBalancingData() {
    const data = {};
    BALANCING_FIELDS.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) data[fieldId] = element.value;
    });
    return data;
}

function hasBalancingData() {
    const data = getCurrentBalancingData();
    return Object.values(data).some(val => val !== '' && val !== null && val !== undefined);
}

function updateDraftStatusIndicator() {
    const indicator = document.getElementById('draftStatusIndicator');
    if (indicator) {
        const hasDraft = localStorage.getItem(DRAFT_KEYS.BALANCING) !== null;
        indicator.style.display = hasDraft ? 'flex' : 'none';
        if (hasDraft) {
            indicator.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Draft tersimpan</span>
            `;
        }
    }
}

function initBalancingScreen() {
    if (!requireAuth()) return;
    
    const balancingUser = document.getElementById('balancingUser');
    if (balancingUser && currentUser) balancingUser.textContent = currentUser.name;
    
    detectShift();
    
    const draftData = JSON.parse(localStorage.getItem(DRAFT_KEYS.BALANCING));
    const hasDraft = draftData !== null;
    
    if (hasDraft) {
        loadBalancingDraft();
    } else {
        loadLastBalancingData();
    }
    
    calculateLPBalance();
    setupBalancingAutoSave();
    setTimeout(updateDraftStatusIndicator, 100);
}

function detectShift() {
    const hour = new Date().getHours();
    let shift = 3;
    let shiftText = "Shift 3 (23:00 - 07:00)";
    
    if (hour >= 7 && hour < 15) {
        shift = 1;
        shiftText = "Shift 1 (07:00 - 15:00)";
    } else if (hour >= 15 && hour < 23) {
        shift = 2;
        shiftText = "Shift 2 (15:00 - 23:00)";
    }
    
    currentShift = shift;
    
    const badge = document.getElementById('currentShiftBadge');
    const info = document.getElementById('balancingShiftInfo');
    const kegiatanNum = document.getElementById('kegiatanShiftNum');
    
    if (badge) badge.textContent = `SHIFT ${shift}`;
    if (info) info.textContent = `${shiftText} • Auto Save Aktif`;
    if (kegiatanNum) kegiatanNum.textContent = shift;
    
    if (badge) {
        if (shift === 1) badge.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        else if (shift === 2) badge.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
        else badge.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }
}

function setDefaultDateTime() {
    const now = new Date();
    const dateInput = document.getElementById('balancingDate');
    const timeInput = document.getElementById('balancingTime');
    
    if (dateInput) dateInput.value = now.toISOString().split('T')[0];
    if (timeInput) timeInput.value = now.toTimeString().slice(0, 5);
}

async function loadLastBalancingData(fromSpreadsheet = true) {
    const loader = document.getElementById('loader');
    const loaderText = document.querySelector('.loader-text h3');
    
    if (loader) loader.style.display = 'flex';
    if (loaderText) loaderText.textContent = 'Mengambil data terakhir...';
    
    try {
        let lastData = null;
        let source = 'local';
        
        if (fromSpreadsheet && navigator.onLine) {
            try {
                const response = await fetch(`${GAS_URL}?action=getLastBalancing&t=${Date.now()}`);
                const result = await response.json();
                
                if (result.success && result.data) {
                    lastData = result.data;
                    source = 'spreadsheet';
                }
            } catch (fetchError) {
                console.warn('Gagal fetch dari spreadsheet:', fetchError);
            }
        }
        
        if (!lastData) {
            const history = JSON.parse(localStorage.getItem(DRAFT_KEYS.BALANCING_HISTORY) || '[]');
            if (history.length > 0) {
                lastData = history[history.length - 1];
                source = 'local';
            }
        }
        
        if (!lastData) {
            setDefaultDateTime();
            if (loader) loader.style.display = 'none';
            return;
        }
        
        const fieldMapping = {
            'loadMW': lastData['Load_MW'],
            'eksporMW': lastData['Ekspor_Impor_MW'],
            'plnMW': lastData['PLN_MW'],
            'ubbMW': lastData['UBB_MW'],
            'pieMW': lastData['PIE_MW'],
            'tg65MW': lastData['TG65_MW'],
            'tg66MW': lastData['TG66_MW'],
            'gtgMW': lastData['GTG_MW'],
            'ss6500MW': lastData['SS6500_MW'],
            'ss2000Via': lastData['SS2000_Via'],
            'activePowerMW': lastData['Active_Power_MW'],
            'reactivePowerMVAR': lastData['Reactive_Power_MVAR'],
            'currentS': lastData['Current_S_A'],
            'voltageV': lastData['Voltage_V'],
            'hvs65l02MW': lastData['HVS65_L02_MW'],
            'hvs65l02Current': lastData['HVS65_L02_Current_A'],
            'total3BMW': lastData['Total_3B_MW'],
            'fq1105': lastData['Produksi_Steam_SA_t/h'],
            'stgSteam': lastData['STG_Steam_t/h'],
            'pa2Steam': lastData['PA2_Steam_t/h'],
            'puri2Steam': lastData['Puri2_Steam_t/h'],
            'melterSA2': lastData['Melter_SA2_t/h'],
            'ejectorSteam': lastData['Ejector_t/h'],
            'glandSealSteam': lastData['Gland_Seal_t/h'],
            'deaeratorSteam': lastData['Deaerator_t/h'],
            'dumpCondenser': lastData['Dump_Condenser_t/h'],
            'pcv6105': lastData['PCV6105_t/h'],
            'pi6122': lastData['PI6122_kg/cm2'],
            'ti6112': lastData['TI6112_C'],
            'ti6146': lastData['TI6146_C'],
            'ti6126': lastData['TI6126_C'],
            'axialDisplacement': lastData['Axial_Displacement_mm'],
            'vi6102': lastData['VI6102_μm'],
            'te6134': lastData['TE6134_C'],
            'ctSuFan': lastData['CT_SU_Fan'],
            'ctSuPompa': lastData['CT_SU_Pompa'],
            'ctSaFan': lastData['CT_SA_Fan'],
            'ctSaPompa': lastData['CT_SA_Pompa'],
            'kegiatanShift': lastData['Kegiatan_Shift']
        };
        
        Object.entries(fieldMapping).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el && value !== undefined && value !== null && value !== '') {
                el.value = value;
            }
        });
        
        const eksporEl = document.getElementById('eksporMW');
        if (eksporEl && eksporEl.value) {
            handleEksporInput(eksporEl);
        }
        
        calculateLPBalance();
        setDefaultDateTime();
        saveBalancingDraft();
        
        const msg = source === 'spreadsheet' 
            ? `✓ Data terakhir dari server dimuat.`
            : `✓ Data terakhir dari penyimpanan lokal dimuat.`;
        
        showCustomAlert(msg, 'success');
        
    } catch (e) {
        console.error('Error loading last data:', e);
        setDefaultDateTime();
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

function resetBalancingForm() {
    if (!confirm('Yakin reset form? Semua data akan dikosongkan dan draft akan dihapus.')) {
        return;
    }
    
    clearBalancingDraft();
    setDefaultDateTime();
    
    BALANCING_FIELDS.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = '';
        }
    });
    
    const selects = ['ss2000Via', 'melterSA2', 'ejectorSteam', 'glandSealSteam'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.selectedIndex = 0;
    });
    
    const eksporEl = document.getElementById('eksporMW');
    const eksporLabel = document.getElementById('eksporLabel');
    const eksporHint = document.getElementById('eksporHint');
    
    if (eksporEl) {
        eksporEl.setAttribute('data-state', '');
        eksporEl.style.borderColor = 'rgba(148, 163, 184, 0.2)';
        eksporEl.style.background = 'rgba(15, 23, 42, 0.6)';
    }
    if (eksporLabel) {
        eksporLabel.textContent = 'Ekspor/Impor (MW)';
        eksporLabel.style.color = '#94a3b8';
    }
    if (eksporHint) {
        eksporHint.innerHTML = '💡 <strong>Minus (-) = Ekspor</strong> | <strong>Plus (+) = Impor</strong>';
        eksporHint.style.color = '#94a3b8';
    }
    
    calculateLPBalance();
    
    showCustomAlert('Form berhasil direset! Semua field dikosongkan.', 'success');
}

function handleEksporInput(input) {
    const label = document.getElementById('eksporLabel');
    const hint = document.getElementById('eksporHint');
    let value = parseFloat(input.value);
    
    if (isNaN(value) || input.value === '') {
        if (label) {
            label.textContent = 'Ekspor/Impor (MW)';
            label.style.color = '#94a3b8';
        }
        if (hint) {
            hint.innerHTML = '💡 <strong>Minus (-) = Ekspor</strong> | <strong>Plus (+) = Impor</strong>';
            hint.style.color = '#94a3b8';
        }
        input.style.borderColor = 'rgba(148, 163, 184, 0.2)';
        input.style.background = 'rgba(15, 23, 42, 0.6)';
        input.setAttribute('data-state', '');
        return;
    }
    
    if (value < 0) {
        if (label) {
            label.textContent = 'Ekspor (MW)';
            label.style.color = '#10b981';
        }
        if (hint) {
            hint.innerHTML = '✓ Posisi: <strong>Ekspor ke Grid</strong> (Nilai negatif)';
            hint.style.color = '#10b981';
        }
        input.style.borderColor = '#10b981';
        input.style.background = 'rgba(16, 185, 129, 0.05)';
        input.setAttribute('data-state', 'ekspor');
        
    } else if (value > 0) {
        if (label) {
            label.textContent = 'Impor (MW)';
            label.style.color = '#f59e0b';
        }
        if (hint) {
            hint.innerHTML = '✓ Posisi: <strong>Impor dari Grid</strong> (Nilai positif)';
            hint.style.color = '#f59e0b';
        }
        input.style.borderColor = '#f59e0b';
        input.style.background = 'rgba(245, 158, 11, 0.05)';
        input.setAttribute('data-state', 'impor');
        
    } else {
        if (label) {
            label.textContent = 'Ekspor/Impor (MW)';
            label.style.color = '#94a3b8';
        }
        if (hint) {
            hint.innerHTML = '⚪ Posisi: <strong>Netral</strong> (Nilai 0)';
            hint.style.color = '#64748b';
        }
        input.style.borderColor = 'rgba(148, 163, 184, 0.2)';
        input.style.background = 'rgba(15, 23, 42, 0.6)';
        input.setAttribute('data-state', '');
    }
}

function getEksporImporValue() {
    const input = document.getElementById('eksporMW');
    if (!input || !input.value) return 0;
    const value = parseFloat(input.value);
    return isNaN(value) ? 0 : value;
}

function calculateLPBalance() {
    const produksi = parseFloat(document.getElementById('fq1105')?.value) || 0;
    
    const konsumsiItems = [
        'stgSteam', 'pa2Steam', 'puri2Steam', 'deaeratorSteam',
        'dumpCondenser', 'pcv6105'
    ];
    
    let totalKonsumsi = 0;
    konsumsiItems.forEach(id => {
        totalKonsumsi += parseFloat(document.getElementById(id)?.value) || 0;
    });
    
    totalKonsumsi += parseFloat(document.getElementById('melterSA2')?.value) || 0;
    totalKonsumsi += parseFloat(document.getElementById('ejectorSteam')?.value) || 0;
    totalKonsumsi += parseFloat(document.getElementById('glandSealSteam')?.value) || 0;
    
    const totalDisplay = document.getElementById('totalKonsumsiSteam');
    if (totalDisplay) {
        totalDisplay.textContent = totalKonsumsi.toFixed(1) + ' t/h';
    }
    
    const balance = produksi - totalKonsumsi;
    
    const balanceField = document.getElementById('lpBalanceField');
    const balanceLabel = document.getElementById('lpBalanceLabel');
    const balanceInput = document.getElementById('lpBalanceValue');
    const balanceStatus = document.getElementById('lpBalanceStatus');
    
    if (balanceInput) balanceInput.value = Math.abs(balance).toFixed(1);
    
    if (balance < 0) {
        if (balanceLabel) balanceLabel.textContent = 'LPS Impor dari SU 3A (t/h)';
        if (balanceStatus) {
            balanceStatus.textContent = 'Posisi: Impor dari 3A (Produksi < Konsumsi)';
            balanceStatus.style.color = '#f59e0b';
        }
        if (balanceInput) {
            balanceInput.style.borderColor = '#f59e0b';
            balanceInput.style.color = '#f59e0b';
            balanceInput.style.background = 'rgba(245, 158, 11, 0.1)';
        }
        if (balanceField) {
            balanceField.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            balanceField.style.background = 'rgba(245, 158, 11, 0.05)';
        }
    } else {
        if (balanceLabel) balanceLabel.textContent = 'LPS Ekspor ke SU 3A (t/h)';
        if (balanceStatus) {
            balanceStatus.textContent = 'Posisi: Ekspor ke 3A (Produksi > Konsumsi)';
            balanceStatus.style.color = '#10b981';
        }
        if (balanceInput) {
            balanceInput.style.borderColor = '#10b981';
            balanceInput.style.color = '#10b981';
            balanceInput.style.background = 'rgba(16, 185, 129, 0.1)';
        }
        if (balanceField) {
            balanceField.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            balanceField.style.background = 'rgba(16, 185, 129, 0.05)';
        }
    }
    
    return balance;
}

function formatWhatsAppMessage(data) {
    const formatNum = (num, maxDecimals = 2) => {
        if (num === undefined || num === null || num === '' || isNaN(num)) return '-';
        const parsed = parseFloat(num);
        if (parsed === 0) return '0';
        return parsed.toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: maxDecimals
        });
    };
    
    const formatInt = (num) => {
        if (num === undefined || num === null || num === '' || isNaN(num)) return '-';
        return parseInt(num).toLocaleString('id-ID');
    };
    
    const tglParts = data.Tanggal.split('-');
    const bulanIndo = {
        '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
        '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
        '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    const tglIndo = `${tglParts[2]} ${bulanIndo[tglParts[1]]} ${tglParts[0]}`;
    
    let message = `*Update STG 17,5 MW*\n`;
    message += `Tgl ${tglIndo}\n`;
    message += `Jam ${data.Jam}\n\n`;
    
    message += `*Output Power STG 17,5*\n`;
    message += `⠂ Load = ${formatNum(data.Load_MW)} MW\n`;
    message += `⠂ ${data.Ekspor_Impor_Status} = ${formatNum(Math.abs(data.Ekspor_Impor_MW), 3)} MW\n\n`;
    
    message += `*Balance Power SCADA*\n`;
    message += `⠂ PLN = ${formatNum(data.PLN_MW)}MW\n`;
    message += `⠂ UBB = ${formatNum(data.UBB_MW)}MW\n`;
    message += `⠂ PIE = ${formatNum(data.PIE_MW)} MW\n`;
    message += `⠂ TG-65 = ${formatNum(data.TG65_MW)} MW\n`;
    message += `⠂ TG-66 = ${formatNum(data.TG66_MW)} MW\n`;
    message += `⠂ GTG = ${formatNum(data.GTG_MW)} MW\n\n`;
    
    message += `*Konsumsi Power 3B*\n`;
    message += `● SS-6500 (TR-Main 01) = ${formatNum(data.SS6500_MW, 3)} MW\n`;
    message += `● SS-2000 *Via ${data.SS2000_Via}*\n`;
    message += `  ⠂ Active power = ${formatNum(data.Active_Power_MW, 3)} MW\n`;
    message += `  ⠂ Reactive power = ${formatNum(data.Reactive_Power_MVAR, 3)} MVAR\n`;
    message += `  ⠂ Current S = ${formatNum(data.Current_S_A, 1)} A\n`;
    message += `  ⠂ Voltage = ${formatInt(data.Voltage_V)} V\n`;
    message += `  ⠂ (HVS65 L02) = ${formatNum(data.HVS65_L02_MW, 3)} MW (${formatInt(data.HVS65_L02_Current_A)} A)\n`;
    message += `● Total 3B = ${formatNum(data.Total_3B_MW, 3)}MW\n\n`;
    
    message += `*Produksi Steam SA*\n`;
    message += `⠂ FQ-1105 = ${formatNum(data['Produksi_Steam_SA_t/h'], 1)} t/h\n\n`;
    
    message += `*Konsumsi Steam 3B*\n`;
    message += `⠂ STG 17,5 = ${formatNum(data['STG_Steam_t/h'], 1)} t/h\n`;
    message += `⠂ PA2 = ${formatNum(data['PA2_Steam_t/h'], 1)} t/h\n`;
    message += `⠂ Puri2 = ${formatNum(data['Puri2_Steam_t/h'], 1)} t/h\n`;
    message += `⠂ Melter SA2 = ${formatNum(data['Melter_SA2_t/h'], 1)} t/h\n`;
    message += `⠂ Ejector = ${formatNum(data['Ejector_t/h'], 1)} t/h\n`;
    message += `⠂ Gland Seal = ${formatNum(data['Gland_Seal_t/h'], 1)} t/h\n`;
    message += `⠂ Deaerator = ${formatNum(data['Deaerator_t/h'], 1)} t/h\n`;
    message += `⠂ Dump Condenser = ${formatNum(data['Dump_Condenser_t/h'], 1)} t/h\n`;
    message += `⠂ PCV-6105 = ${formatNum(data['PCV6105_t/h'], 1)} t/h\n`;
    message += `*⠂ Total Konsumsi* = ${formatNum(data['Total_Konsumsi_Steam_t/h'], 1)} t/h\n\n`;
    
    message += `*${data.LPS_Balance_Status}* = ${formatNum(data['LPS_Balance_t/h'], 1)} t/h\n\n`;
    
    message += `*Monitoring*\n`;
    message += `⠂ Steam Extraction PI-6122 = ${formatNum(data['PI6122_kg/cm2'], 2)} kg/cm² & TI-6112 = ${formatNum(data['TI6112_C'], 1)} °C\n`;
    message += `⠂ Temp. Cooling Air Inlet (TI-6146/47) = ${formatNum(data['TI6146_C'], 2)} °C\n`;
    message += `⠂ Temp. Lube Oil (TI-6126) = ${formatNum(data['TI6126_C'], 2)} °C\n`;
    message += `⠂ Axial Displacement = ${formatNum(data['Axial_Displacement_mm'], 2)} mm (High : 0,6 mm)\n`;
    message += `⠂ Vibrasi VI-6102 = ${formatNum(data['VI6102_μm'], 2)} μm (High : 85 μm)\n`;
    message += `⠂ Temp. Journal Bearing TE-6134 = ${formatNum(data['TE6134_C'], 1)} °C (High : 115 °C)\n`;
    message += `⠂ CT SU = Fan : ${formatInt(data['CT_SU_Fan'])} & Pompa : ${formatInt(data['CT_SU_Pompa'])}\n`;
    message += `⠂ CT SA = Fan : ${formatInt(data['CT_SA_Fan'])} & Pompa : ${formatInt(data['CT_SA_Pompa'])}\n\n`;
    
    message += `*Kegiatan Shift ${data.Shift}*\n`;
    message += data.Kegiatan_Shift || '-';
    
    return message;
}

async function submitBalancingData() {
    if (!requireAuth()) return;
    
    const requiredFields = ['loadMW', 'fq1105', 'stgSteam'];
    for (let id of requiredFields) {
        const el = document.getElementById(id);
        if (!el || !el.value) {
            showCustomAlert(`Field ${id} wajib diisi!`, 'error');
            if (el) el.focus();
            return;
        }
    }
    
    const creds = getCredentialsForAPI();
    if (!creds) {
        showCustomAlert('Sesi tidak valid, silakan login ulang', 'error');
        return;
    }
    
    const progress = showUploadProgress('Mengirim Data Balancing...');
    currentUploadController = new AbortController();
    
    const eksporValue = getEksporImporValue();
    const lpBalance = calculateLPBalance();
    
    const balancingData = {
        type: 'BALANCING',
        ...creds,
        Operator: currentUser ? currentUser.name : 'Unknown',
        Timestamp: new Date().toISOString(),
        
        Tanggal: document.getElementById('balancingDate')?.value || '',
        Jam: document.getElementById('balancingTime')?.value || '',
        Shift: currentShift,
        
        'Load_MW': parseFloat(document.getElementById('loadMW')?.value) || 0,
        'Ekspor_Impor_MW': eksporValue,
        'Ekspor_Impor_Status': eksporValue > 0 ? 'Impor' : (eksporValue < 0 ? 'Ekspor' : 'Netral'),
        
        'PLN_MW': parseFloat(document.getElementById('plnMW')?.value) || 0,
        'UBB_MW': parseFloat(document.getElementById('ubbMW')?.value) || 0,
        'PIE_MW': parseFloat(document.getElementById('pieMW')?.value) || 0,
        'TG65_MW': parseFloat(document.getElementById('tg65MW')?.value) || 0,
        'TG66_MW': parseFloat(document.getElementById('tg66MW')?.value) || 0,
        'GTG_MW': parseFloat(document.getElementById('gtgMW')?.value) || 0,
        
        'SS6500_MW': parseFloat(document.getElementById('ss6500MW')?.value) || 0,
        'SS2000_Via': document.getElementById('ss2000Via')?.value || 'TR-Main01',
        'Active_Power_MW': parseFloat(document.getElementById('activePowerMW')?.value) || 0,
        'Reactive_Power_MVAR': parseFloat(document.getElementById('reactivePowerMVAR')?.value) || 0,
        'Current_S_A': parseFloat(document.getElementById('currentS')?.value) || 0,
        'Voltage_V': parseFloat(document.getElementById('voltageV')?.value) || 0,
        'HVS65_L02_MW': parseFloat(document.getElementById('hvs65l02MW')?.value) || 0,
        'HVS65_L02_Current_A': parseFloat(document.getElementById('hvs65l02Current')?.value) || 0,
        'Total_3B_MW': parseFloat(document.getElementById('total3BMW')?.value) || 0,
        
        'Produksi_Steam_SA_t/h': parseFloat(document.getElementById('fq1105')?.value) || 0,
        'STG_Steam_t/h': parseFloat(document.getElementById('stgSteam')?.value) || 0,
        'PA2_Steam_t/h': parseFloat(document.getElementById('pa2Steam')?.value) || 0,
        'Puri2_Steam_t/h': parseFloat(document.getElementById('puri2Steam')?.value) || 0,
        'Melter_SA2_t/h': parseFloat(document.getElementById('melterSA2')?.value) || 0,
        'Ejector_t/h': parseFloat(document.getElementById('ejectorSteam')?.value) || 0,
        'Gland_Seal_t/h': parseFloat(document.getElementById('glandSealSteam')?.value) || 0,
        'Deaerator_t/h': parseFloat(document.getElementById('deaeratorSteam')?.value) || 0,
        'Dump_Condenser_t/h': parseFloat(document.getElementById('dumpCondenser')?.value) || 0,
        'PCV6105_t/h': parseFloat(document.getElementById('pcv6105')?.value) || 0,
        'Total_Konsumsi_Steam_t/h': parseFloat(document.getElementById('totalKonsumsiSteam')?.textContent) || 0,
        'LPS_Balance_t/h': Math.abs(lpBalance),
        'LPS_Balance_Status': lpBalance < 0 ? 'Impor dari 3A' : 'Ekspor ke 3A',
        
        'PI6122_kg/cm2': parseFloat(document.getElementById('pi6122')?.value) || 0,
        'TI6112_C': parseFloat(document.getElementById('ti6112')?.value) || 0,
        'TI6146_C': parseFloat(document.getElementById('ti6146')?.value) || 0,
        'TI6126_C': parseFloat(document.getElementById('ti6126')?.value) || 0,
        'Axial_Displacement_mm': parseFloat(document.getElementById('axialDisplacement')?.value) || 0,
        'VI6102_μm': parseFloat(document.getElementById('vi6102')?.value) || 0,
        'TE6134_C': parseFloat(document.getElementById('te6134')?.value) || 0,
        'CT_SU_Fan': parseInt(document.getElementById('ctSuFan')?.value) || 0,
        'CT_SU_Pompa': parseInt(document.getElementById('ctSuPompa')?.value) || 0,
        'CT_SA_Fan': parseInt(document.getElementById('ctSaFan')?.value) || 0,
        'CT_SA_Pompa': parseInt(document.getElementById('ctSaPompa')?.value) || 0,
        
        'Kegiatan_Shift': document.getElementById('kegiatanShift')?.value || ''
    };
    
    try {
        progress.updateText('Menghitung ulang balance...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        progress.updateText('Mengirim ke server...');
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(balancingData),
            signal: currentUploadController.signal
        });
        
        progress.complete();
        
        showCustomAlert('✓ Data Balancing berhasil dikirim!', 'success');
        
        let balancingHistory = JSON.parse(localStorage.getItem(DRAFT_KEYS.BALANCING_HISTORY) || '[]');
        balancingHistory.push({
            ...balancingData,
            submittedAt: new Date().toISOString()
        });
        localStorage.setItem(DRAFT_KEYS.BALANCING_HISTORY, JSON.stringify(balancingHistory));
        
        setTimeout(() => {
            const waMessage = encodeURIComponent(formatWhatsAppMessage(balancingData));
            const waNumber = '6281382160345';
            window.open(`https://wa.me/${waNumber}?text=${waMessage}`, '_blank');
            navigateTo('homeScreen');
        }, 1000);
        
    } catch (error) {
        console.error('Balancing Error:', error);
        progress.error();
        
        let offlineBalancing = JSON.parse(localStorage.getItem(DRAFT_KEYS.BALANCING_OFFLINE) || '[]');
        offlineBalancing.push(balancingData);
        localStorage.setItem(DRAFT_KEYS.BALANCING_OFFLINE, JSON.stringify(offlineBalancing));
        
        setTimeout(() => {
            showCustomAlert('Gagal mengirim. Data disimpan lokal.', 'error');
        }, 500);
    }
}

// ============================================
// PWA INSTALL HANDLER
// ============================================
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if (!isAppInstalled() && !installBannerShown) {
        setTimeout(() => {
            showCustomInstallBanner();
        }, 3000);
    }
});

window.addEventListener('appinstalled', () => {
    hideCustomInstallBanner();
    deferredPrompt = null;
    installBannerShown = true;
    showToast('✓ Aplikasi berhasil diinstall!', 'success');
});

function showCustomInstallBanner() {
    if (document.getElementById('customInstallBanner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'customInstallBanner';
    banner.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 20px;
            padding: 32px 24px;
            width: 90%;
            max-width: 340px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            z-index: 10002;
            text-align: center;
            animation: scaleIn 0.3s ease;
        ">
            <div style="
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
            ">
                ⚡
            </div>
            
            <h3 style="
                color: #f8fafc;
                font-size: 1.25rem;
                font-weight: 700;
                margin-bottom: 8px;
            ">
                Install Aplikasi
            </h3>
            
            <p style="
                color: #94a3b8;
                font-size: 0.875rem;
                margin-bottom: 24px;
                line-height: 1.5;
            ">
                Tambahkan Turbine Log ke layar utama untuk akses lebih cepat dan pengalaman seperti aplikasi native.
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="installPWA()" style="
                    width: 100%;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                    Install Sekarang
                </button>
                
                <button onclick="hideCustomInstallBanner()" style="
                    width: 100%;
                    padding: 12px 24px;
                    background: transparent;
                    color: #64748b;
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    border-radius: 12px;
                    font-size: 0.9375rem;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    Nanti Saja
                </button>
            </div>
        </div>
        
        <div style="
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
            z-index: 10001;
        " onclick="hideCustomInstallBanner()"></div>
    `;
    
    document.body.appendChild(banner);
    installBannerShown = true;
}

function hideCustomInstallBanner() {
    const banner = document.getElementById('customInstallBanner');
    if (banner) {
        banner.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => banner.remove(), 200);
    }
}

async function installPWA() {
    if (!deferredPrompt) {
        showToast('Aplikasi sudah terinstall atau browser tidak mendukung', 'info');
        return;
    }
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('User installed PWA');
        hideCustomInstallBanner();
        showToast('✓ Menginstall aplikasi...', 'success');
    } else {
        console.log('User dismissed install');
        hideCustomInstallBanner();
    }
    
    deferredPrompt = null;
}

function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
}

function showToast(msg, type) {
    console.log(`[${type}] ${msg}`);
}

// ============================================
// VERSION AUTO-UPDATE SYSTEM
// ============================================

/**
 * Update semua elemen yang menampilkan versi di seluruh halaman
 * serta resource links untuk cache busting
 */
function updateVersionDisplays() {
    // 1. Update elemen dengan class 'version-display'
    document.querySelectorAll('.version-display').forEach(el => {
        el.textContent = 'v' + APP_VERSION;
    });
    
    // 2. Update meta tag app-version
    const metaVersion = document.querySelector('meta[name="app-version"]');
    if (metaVersion) {
        metaVersion.content = APP_VERSION;
    }
    
    console.log(`[Version System] UI Updated to v${APP_VERSION}`);
}

/**
 * Check for version updates and notify user
 */
function checkVersionUpdate() {
    const storedVersion = localStorage.getItem('app_stored_version');
    if (storedVersion && storedVersion !== APP_VERSION) {
        console.log(`[Version] Updated from ${storedVersion} to ${APP_VERSION}`);
        // Optional: Show update notification
        // showCustomAlert(`Aplikasi diperbarui ke v${APP_VERSION}`, 'info');
    }
    localStorage.setItem('app_stored_version', APP_VERSION);
}

/**
 * Get current app version
 */
function getAppVersion() {
    return APP_VERSION;
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    const paramScreen = document.getElementById('paramScreen');
    if (!paramScreen || !paramScreen.classList.contains('active')) return;
    
    if (e.key === 'Enter') {
        e.preventDefault();
        if (currentInputType !== 'select') saveStep();
    } else if (e.key === 'Escape') {
        goBack();
    }
});

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    // Update versi di seluruh UI terlebih dahulu
    updateVersionDisplays();
    checkVersionUpdate();
    
    totalParams = Object.values(AREAS).reduce((acc, arr) => acc + arr.length, 0);
    
    initAuth();
    setupLoginListeners();
    setupTPMListeners();
    
    simulateLoading();
});

function toggleSS2000Detail() {
    const select = document.getElementById('ss2000Via');
    const detail = document.getElementById('ss2000Detail');
    if (select && detail) {
        detail.style.display = select.value ? 'block' : 'none';
    }
}
