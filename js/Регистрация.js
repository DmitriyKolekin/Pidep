// Получаем элементы формы
const phoneInput = document.getElementById('phonenumber');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const repeatInput = document.getElementById('repeatPassword');
const agreeCheck = document.getElementById('politic');
const ageCheck = document.getElementById('more18');
const registerBtn = document.getElementById('finish');
const homeBtn = document.getElementById('home');
const enterBtn = document.getElementById('enter');

// Хранилище для таймаутов debounce
let debounceTimers = {};

// Вспомогательная функция для показа ошибки
function showError(inputElement, message) {
    // Удаляем предыдущее сообщение для этого поля
    const existingError = inputElement.parentNode.querySelector('.error-message');
    if (existingError && existingError.inputField === inputElement) {
        existingError.remove();
    }
    
    if (message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerText = message;
        errorDiv.inputField = inputElement;
        errorDiv.style.position = 'absolute';
        errorDiv.style.left = (inputElement.offsetLeft + 5) + 'px';
        errorDiv.style.top = (inputElement.offsetTop + 60) + 'px';
        inputElement.parentNode.appendChild(errorDiv);
    }
}

function clearError(inputElement) {
    const existingErrors = inputElement.parentNode.querySelectorAll('.error-message');
    existingErrors.forEach(err => {
        if (err.inputField === inputElement) {
            err.remove();
        }
    });
}

// --- ФУНКЦИИ ВАЛИДАЦИИ (согласно ТЗ) ---

// 1. Номер телефона
function validatePhone(phone) {
    if (!phone || phone.trim() === '') {
        return { valid: false, message: 'Номер телефона обязателен для заполнения' };
    }
    
    let raw = phone.trim();
    
    // Проверяем допустимые символы: только цифры и + в начале
    const phoneRegex = /^\+?\d+$/;
    if (!phoneRegex.test(raw)) {
        return { valid: false, message: 'Допустимы только цифры и знак "+" (только в начале)' };
    }
    
    // Проверка положения +
    if (raw.includes('+') && raw.indexOf('+') !== 0) {
        return { valid: false, message: 'Знак "+" может быть только в начале номера' };
    }
    
    // Подсчёт цифр
    let digitsOnly = raw.replace(/^\+/, '');
    if (digitsOnly.length < 11) {
        return { valid: false, message: `Минимальное количество цифр — 11 (сейчас ${digitsOnly.length})` };
    }
    if (digitsOnly.length > 15) {
        return { valid: false, message: `Максимальное количество цифр — 15 (сейчас ${digitsOnly.length})` };
    }
    
    return { valid: true, message: '' };
}

// 2. Email (с проверкой, что после точки есть хотя бы одна буква)
function validateEmail(email) {
    if (!email || email.trim() === '') {
        return { valid: false, message: 'Email обязателен для заполнения' };
    }
    
    let val = email.trim();
    
    // Проверка максимальной длины
    if (val.length > 254) {
        return { valid: false, message: 'Email не может превышать 254 символа' };
    }
    
    // Проверка допустимых символов (латиница, цифры, спецсимволы)
    const allowedPattern = /^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~.@]+$/;
    if (!allowedPattern.test(val)) {
        return { valid: false, message: 'Недопустимые символы. Используйте латиницу, цифры, разрешённые спецсимволы' };
    }
    
    // Проверка @ (ровно один)
    const atCount = (val.match(/@/g) || []).length;
    if (atCount !== 1) {
        return { valid: false, message: 'Должен быть ровно один символ "@"' };
    }
    
    const atIndex = val.indexOf('@');
    const localPart = val.substring(0, atIndex);
    const domainPart = val.substring(atIndex + 1);
    
    // Перед @ минимум 1 символ
    if (localPart.length === 0) {
        return { valid: false, message: 'Перед "@" должен быть минимум один символ' };
    }
    
    // Спецсимвол не может быть первым
    const firstChar = localPart[0];
    const specialChars = '!#$%&\'*+-/=?^_`{|}~.';
    if (specialChars.includes(firstChar)) {
        return { valid: false, message: 'Специальный символ не может быть первым символом в email' };
    }
    
    // Проверка домена: должна быть точка и не сразу после @
    if (!domainPart.includes('.')) {
        return { valid: false, message: 'После "@" должна быть точка (например, mail.ru)' };
    }
    
    const dotIndex = domainPart.indexOf('.');
    if (dotIndex === 0) {
        return { valid: false, message: 'Точка не может быть сразу после "@"' };
    }
    
    // НОВАЯ ПРОВЕРКА: после последней точки должна быть хотя бы одна буква
    const lastDotIndex = domainPart.lastIndexOf('.');
    const afterDot = domainPart.substring(lastDotIndex + 1);
    
    if (afterDot.length === 0) {
        return { valid: false, message: 'После точки в домене должно быть хотя бы одно буквенное обозначение (например, .ru, .com)' };
    }
    
    // Проверка, что после точки только буквы (латиница) и/или цифры (для доменов типа ru, com, net)
    const domainAfterDotRegex = /^[a-zA-Z0-9]+$/;
    if (!domainAfterDotRegex.test(afterDot)) {
        return { valid: false, message: 'После точки в домене должны быть только латинские буквы или цифры (например, .ru, .com, .net)' };
    }
    
    // Максимальная длина домена
    if (domainPart.length > 253) {
        return { valid: false, message: 'Домен не может превышать 253 символа' };
    }
    
    return { valid: true, message: '' };
}

// 3. Пароль
function validatePassword(pwd) {
    if (!pwd) {
        return { valid: false, message: 'Пароль обязателен для заполнения' };
    }
    
    if (pwd.length < 6) {
        return { valid: false, message: `Минимальная длина пароля — 6 символов (сейчас ${pwd.length})` };
    }
    if (pwd.length > 40) {
        return { valid: false, message: `Максимальная длина пароля — 40 символов (сейчас ${pwd.length})` };
    }
    
    // Проверка допустимых символов
    const allowedPass = /^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~]+$/;
    if (!allowedPass.test(pwd)) {
        return { valid: false, message: 'Разрешены только латиница, цифры и спецсимволы (!#$%...)' };
    }
    
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    const hasSpecial = /[!#$%&'*+\-/=?^_`{|}~]/.test(pwd);
    
    if (!hasLetter) {
        return { valid: false, message: 'Пароль должен содержать хотя бы одну латинскую букву' };
    }
    if (!hasDigit) {
        return { valid: false, message: 'Пароль должен содержать хотя бы одну цифру' };
    }
    if (!hasSpecial) {
        return { valid: false, message: 'Пароль должен содержать хотя бы один спецсимвол (!#$%...)' };
    }
    
    return { valid: true, message: '' };
}

// 4. Повтор пароля
function validateRepeat(password, repeat) {
    if (!repeat) {
        return { valid: false, message: 'Повторите пароль' };
    }
    if (repeat.length > 40) {
        return { valid: false, message: 'Повтор пароля не может превышать 40 символов' };
    }
    if (password !== repeat) {
        return { valid: false, message: 'Пароли не совпадают' };
    }
    return { valid: true, message: '' };
}

// 5. Чекбоксы
function validateCheckboxes(agree, age) {
    if (!agree) {
        return { valid: false, message: 'Необходимо согласие с условиями' };
    }
    if (!age) {
        return { valid: false, message: 'Необходимо подтверждение, что вам есть 18 лет' };
    }
    return { valid: true, message: '' };
}

// --- ОСНОВНАЯ ФУНКЦИЯ ВАЛИДАЦИИ С ПОДСВЕТКОЙ ---
function validateField(inputElement, validationFn, customValue = null) {
    const value = customValue !== null ? customValue : inputElement.value;
    const result = validationFn(value);
    
    if (!result.valid) {
        inputElement.classList.remove('valid');
        inputElement.classList.add('invalid');
        showError(inputElement, result.message);
    } else {
        inputElement.classList.remove('invalid');
        inputElement.classList.add('valid');
        clearError(inputElement);
    }
    
    return result.valid;
}

// Функция обновления состояния кнопки
function updateButtonState() {
    const phoneValid = validatePhone(phoneInput.value).valid;
    const emailValid = validateEmail(emailInput.value).valid;
    const passValid = validatePassword(passwordInput.value).valid;
    const repeatValid = validateRepeat(passwordInput.value, repeatInput.value).valid;
    const checksValid = validateCheckboxes(agreeCheck.checked, ageCheck.checked).valid;
    
    const isFormValid = phoneValid && emailValid && passValid && repeatValid && checksValid;
    
    if (isFormValid) {
        registerBtn.classList.remove('disabled-btn');
        registerBtn.disabled = false;
    } else {
        registerBtn.classList.add('disabled-btn');
        registerBtn.disabled = true;
    }
    
    // Отдельное сообщение для чекбоксов (общее)
    let checkboxErrorMsg = '';
    if (!agreeCheck.checked && !ageCheck.checked) {
        checkboxErrorMsg = '❌ Установите обе галочки: согласие с условиями и подтверждение 18+';
    } else if (!agreeCheck.checked) {
        checkboxErrorMsg = '❌ Необходимо согласие с условиями';
    } else if (!ageCheck.checked) {
        checkboxErrorMsg = '❌ Подтвердите, что вам есть 18 лет';
    }
    
    const oldBoxError = document.getElementById('checkboxGlobalError');
    if (oldBoxError) oldBoxError.remove();
    
    if (checkboxErrorMsg && !isFormValid) {
        const globalError = document.createElement('div');
        globalError.id = 'checkboxGlobalError';
        globalError.innerText = checkboxErrorMsg;
        globalError.style.position = 'absolute';
        globalError.style.left = '400px';
        globalError.style.top = '750px';
        globalError.style.color = '#ffaaaa';
        globalError.style.fontWeight = 'bold';
        globalError.style.backgroundColor = 'rgba(0,0,0,0.8)';
        globalError.style.padding = '5px 15px';
        globalError.style.borderRadius = '30px';
        globalError.style.fontSize = '14px';
        document.getElementById('main').appendChild(globalError);
    }
    
    return isFormValid;
}

// Debounce-функция для отложенной валидации
function debounceValidate(inputElement, validationFn, delay = 300) {
    clearTimeout(debounceTimers[inputElement.id]);
    debounceTimers[inputElement.id] = setTimeout(() => {
        validateField(inputElement, validationFn);
        updateButtonState();
    }, delay);
}

// --- ОБРАБОТЧИКИ СОБЫТИЙ ---

// Для текстовых полей: валидация с debounce
phoneInput.addEventListener('input', function() {
    debounceValidate(phoneInput, validatePhone, 300);
});

emailInput.addEventListener('input', function() {
    debounceValidate(emailInput, validateEmail, 300);
});

passwordInput.addEventListener('input', function() {
    debounceValidate(passwordInput, validatePassword, 300);
    if (repeatInput.value) {
        debounceValidate(repeatInput, (val) => validateRepeat(passwordInput.value, val), 300);
    }
});

repeatInput.addEventListener('input', function() {
    debounceValidate(repeatInput, (val) => validateRepeat(passwordInput.value, val), 300);
});

// Чекбоксы
agreeCheck.addEventListener('change', function() {
    updateButtonState();
});

ageCheck.addEventListener('change', function() {
    updateButtonState();
});

// При потере фокуса проверяем сразу
phoneInput.addEventListener('blur', function() {
    validateField(phoneInput, validatePhone);
    updateButtonState();
});

emailInput.addEventListener('blur', function() {
    validateField(emailInput, validateEmail);
    updateButtonState();
});

passwordInput.addEventListener('blur', function() {
    validateField(passwordInput, validatePassword);
    updateButtonState();
});

repeatInput.addEventListener('blur', function() {
    validateField(repeatInput, (val) => validateRepeat(passwordInput.value, val));
    updateButtonState();
});

// --- КНОПКА РЕГИСТРАЦИИ ---
function handleRegister() {
    if (!registerBtn.disabled) {
        const isPhoneOk = validateField(phoneInput, validatePhone);
        const isEmailOk = validateField(emailInput, validateEmail);
        const isPassOk = validateField(passwordInput, validatePassword);
        const isRepeatOk = validateField(repeatInput, (val) => validateRepeat(passwordInput.value, val));
        const isChecksOk = validateCheckboxes(agreeCheck.checked, ageCheck.checked).valid;
        
        if (isPhoneOk && isEmailOk && isPassOk && isRepeatOk && isChecksOk) {
            alert('✅ Регистрация успешно завершена! Все данные корректны.');
        } else {
            alert('❌ Регистрация невозможна. Проверьте правильность заполнения всех полей.');
        }
    } else {
        alert('⚠️ Заполните все поля корректно и установите обе галочки.');
    }
}

registerBtn.addEventListener('click', handleRegister);

// --- ИСПРАВЛЕННАЯ КНОПКА "ВХОД" ---
if (enterBtn) {
    enterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Переход на страницу входа');
        // window.location.href = "Авторизация.html";
    });
}

// --- ИСПРАВЛЕННАЯ КНОПКА "ДОМОЙ" ---
if (homeBtn) {
    homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        alert('Переход на главную страницу');
        // Раскомментируйте для реального перехода:
        // window.location.href = "Pidep.html";
        // Или если нужно вернуться на этот же页面:
        // window.location.href = window.location.pathname;
    });
}

// Ссылки условий
document.querySelectorAll('#politictext a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        alert('📄 Документ с условиями и положениями (демонстрационный режим)');
    });
});

// Инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    updateButtonState();
    
    // Сброс классов подсветки
    phoneInput.classList.remove('valid', 'invalid');
    emailInput.classList.remove('valid', 'invalid');
    passwordInput.classList.remove('valid', 'invalid');
    repeatInput.classList.remove('valid', 'invalid');
    
    // Картинка для кнопки "Домой"
    const homeImg = document.getElementById('homeImg');
    if (homeImg && (!homeImg.src || homeImg.src === '' || homeImg.src.includes('#'))) {
        homeImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="white"%3E%3Cpath d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"%3E%3C/path%3E%3C/svg%3E';
    }
});