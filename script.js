// Common functions
function getCurrentIST() {
    const now = new Date();
    const ISTOffset = 330; // IST is UTC+5:30
    return new Date(now.getTime() + (ISTOffset + now.getTimezoneOffset()) * 60000);
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function isWithinLoginTime() {
    const now = getCurrentIST();
    const hours = now.getHours();
    return hours >= 8 && hours < 22;
}

function processMonthEnd(wallet) {
    const now = getCurrentIST();
    const isFirstDay = now.getDate() === 1;
    const isLastDayAfter4PM = now.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() && 
                             now.getHours() >= 16;

    if (isFirstDay) {
        wallet.lastMonthBalance = wallet.balance;
        wallet.balance = 0;
        wallet.paymentStatus = 'N/A';
    } else if (isLastDayAfter4PM && wallet.paymentStatus !== 'Paid') {
        wallet.paymentStatus = 'Pending';
    }
}

// Login Page Logic
if (document.getElementById('loginId')) {
    const loginIdInput = document.getElementById('loginId');
    const nameDisplay = document.getElementById('nameDisplay');
    const errorMsg = document.getElementById('errorMsg');
    const loginBtn = document.getElementById('loginBtn');
    const timeInfo = document.getElementById('timeInfo');

    // Check login time
    if (!isWithinLoginTime()) {
        timeInfo.textContent = "Login is only allowed between 8:00 AM to 12:00 PM IST.";
        timeInfo.style.display = 'block';
        loginIdInput.disabled = true;
    } else {
        timeInfo.textContent = "Login time: 8:00 AM to 12:00 PM IST";
        timeInfo.style.display = 'block';
    }

    loginIdInput.addEventListener('input', function() {
        const inputId = this.value.trim();
        const user = userDatabase.find(user => user.loginId === inputId);
        
        if (user) {
            nameDisplay.textContent = `Welcome, ${user.name}`;
            nameDisplay.className = 'name-display valid';
            errorMsg.style.display = 'none';
            loginBtn.disabled = false;
            
            // Store user data for the next page
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else if (inputId.length > 0) {
            nameDisplay.textContent = 'Invalid Login ID';
            nameDisplay.className = 'name-display invalid';
            errorMsg.textContent = 'Please enter a valid Login ID';
            errorMsg.style.display = 'block';
            loginBtn.disabled = true;
        } else {
            nameDisplay.style.display = 'none';
            errorMsg.style.display = 'none';
            loginBtn.disabled = true;
        }
    });

    loginBtn.addEventListener('click', function() {
        if (!isWithinLoginTime()) {
            errorMsg.textContent = "Login is only allowed between 8:00 AM to 12:00 PM IST.";
            errorMsg.style.display = 'block';
            return;
        }
        
        window.location.href = 'home.html';
    });
}

// Home Page Logic
if (document.getElementById('displayName')) {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    document.getElementById('displayName').textContent = currentUser.name;
    document.getElementById('name').value = currentUser.name;

    // Initialize wallet
    const wallet = initializeWallet(currentUser.loginId);
    processMonthEnd(wallet);

    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.id === 'logoutBtn') {
                localStorage.removeItem('currentUser');
                alert('Logout successful!');
                window.close();
                return;
            }

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(tabName).classList.add('active');

            if (tabName === 'tickets') loadTickets();
            else if (tabName === 'wallet') loadWallet();
        });
    });

    // Booking Form Logic
    const foodForm = document.getElementById('foodForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('successMsg');
    const dateInput = document.getElementById('date');

    // Set date to tomorrow
    const today = getCurrentIST();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = formatDate(tomorrow);
    dateInput.value = formatDate(tomorrow);

    // Check booking time
    if (today.getHours() >= 22) {
        document.querySelectorAll('#foodForm input, #foodForm select').forEach(el => {
            el.disabled = true;
        });
        submitBtn.disabled = true;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-msg';
        errorDiv.textContent = 'Food booking is only allowed before 12:00 PM IST for the next day.';
        foodForm.insertBefore(errorDiv, submitBtn);
    }

    // Form validation
    foodForm.addEventListener('input', function() {
        const isFormValid = Array.from(this.elements).every(element => {
            if (element.required) {
                return element.value.trim() !== '';
            }
            return true;
        });
        submitBtn.disabled = !isFormValid;
    });

    // Form submission
    foodForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const ticket = {
            id: 'T' + Date.now(),
            loginId: currentUser.loginId,
            occupation: document.getElementById('occupation').value,
            name: document.getElementById('name').value,
            foodTime: document.getElementById('foodTime').value,
            foodType: document.getElementById('foodType').value,
            date: document.getElementById('date').value,
            bookingTime: new Date().toISOString()
        };

        // Add to tickets
        foodTickets.push(ticket);
        localStorage.setItem('foodTickets', JSON.stringify(foodTickets));

        // Update wallet
        let amount = 0;
        if (ticket.foodTime === 'Breakfast') amount = 15;
        else if (ticket.foodTime === 'Lunch' || ticket.foodTime === 'Dinner') amount = 75;

        wallet.balance += amount;
        wallet.history.push({
            date: new Date().toISOString(),
            amount: `+${amount}`,
            description: `${ticket.foodTime} booking`,
            ticketId: ticket.id
        });
        localStorage.setItem('walletData', JSON.stringify(walletData));
        
        // Show success and switch to tickets
        successMsg.style.display = 'block';
        foodForm.reset();
        document.getElementById('name').value = currentUser.name;
        dateInput.value = formatDate(tomorrow);
        submitBtn.disabled = true;

        setTimeout(() => {
            successMsg.style.display = 'none';
            document.querySelector('.tab[data-tab="tickets"]').click();
        }, 3000);
    });

    // Load tickets function
    function loadTickets() {
        const ticketsList = document.getElementById('ticketsList');
        ticketsList.innerHTML = '';

        const userTickets = foodTickets.filter(ticket => ticket.loginId === currentUser.loginId);

        if (userTickets.length === 0) {
            ticketsList.innerHTML = '<p>No tickets found.</p>';
            return;
        }

        userTickets.forEach(ticket => {
            const ticketElement = document.createElement('div');
            ticketElement.className = 'ticket';
            ticketElement.innerHTML = `
                <div class="ticket-header">
                    <span>${ticket.foodTime}</span>
                    <span>${ticket.date}</span>
                </div>
                <div class="ticket-details">
                    <div><strong>Occupation:</strong> ${ticket.occupation}</div>
                    <div><strong>Food Type:</strong> ${ticket.foodType}</div>
                    <div><strong>Booked On:</strong> ${new Date(ticket.bookingTime).toLocaleString()}</div>
                    <div><strong>Ticket ID:</strong> ${ticket.id}</div>
                </div>
            `;
            ticketsList.appendChild(ticketElement);
        });
    }

    // Load wallet function
    function loadWallet() {
        const walletBalance = document.getElementById('walletBalance');
        const walletHistory = document.getElementById('walletHistory');
        const paymentMessage = document.getElementById('paymentMessage');

        walletBalance.textContent = wallet.balance;

        const now = getCurrentIST();
        const isLastDayAfter4PM = now.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() && 
                                 now.getHours() >= 16;
        
        if (isLastDayAfter4PM && wallet.paymentStatus === 'Pending') {
            paymentMessage.textContent = `Payment Due: Please pay ${wallet.lastMonthBalance} INR for last month's balance.`;
            paymentMessage.style.color = '#dc3545';
        } else if (wallet.paymentStatus === 'Paid') {
            paymentMessage.textContent = `You've paid ${wallet.lastMonthBalance} INR for last month.`;
            paymentMessage.style.color = '#28a745';
        } else {
            paymentMessage.textContent = '';
        }

        walletHistory.innerHTML = '';
        if (wallet.history.length === 0) {
            walletHistory.innerHTML = '<li>No transactions yet.</li>';
            return;
        }

        wallet.history.forEach(transaction => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${new Date(transaction.date).toLocaleDateString()}</span>
                <span>${transaction.description}</span>
                <span class="${transaction.amount.startsWith('+') ? 'text-success' : 'text-danger'}">
                    ${transaction.amount} INR
                </span>
            `;
            walletHistory.appendChild(li);
        });
    }

    // Initialize the page
    loadTickets();
    loadWallet();
}