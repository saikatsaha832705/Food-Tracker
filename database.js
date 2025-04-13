// User database
const userDatabase = [
    { loginId: "ST001", name: "RAHUL SHARMA" },
    { loginId: "ST002", name: "PRIYA PATEL" },
    { loginId: "ST003", name: "AMIT KUMAR" },
    { loginId: "TC001", name: "DR. SMITA DESAI" },
    { loginId: "TC002", name: "PROF. RAJESH IYER" },
    { loginId: "CS001", name: "MOHAN LAL" },
    { loginId: "GS001", name: "ANITA JOSHI" },
    { loginId: "BSDMT01", name: "SUMAN PATHAK" }
];

// Google Sheets integration

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuV68-ZULsd1JHEWjndzKwWPO_00XxRiuGZUVm-PAJOnpyjKTfxCQldjw32iX43UW3/exec';

// Local storage for demo purposes
let foodTickets = JSON.parse(localStorage.getItem('foodTickets')) || [];
let walletData = JSON.parse(localStorage.getItem('walletData')) || {};

function initializeWallet(loginId) {
    if (!walletData[loginId]) {
        walletData[loginId] = {
            balance: 0,
            history: [],
            lastMonthBalance: 0,
            paymentStatus: 'N/A'
        };
        localStorage.setItem('walletData', JSON.stringify(walletData));
    }
    return walletData[loginId];
}