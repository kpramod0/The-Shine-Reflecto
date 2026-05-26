// --- SCRIPT FOR ALL PAGES (HEADER & FOOTER) --- //

document.addEventListener("DOMContentLoaded", () => {
    const headerContainer = document.getElementById("main-header-container");
    const footerContainer = document.getElementById("main-footer-container");

    // --- Function to Create the Header --- //
    const createHeader = () => {
        const headerHTML = `
            <div class="header-left">
                <img src="/logo.png" alt="Company Logo" class="logo">
                <div class="company-info">
                    <h1 class="company-name">TSR</h1>
                    <span class="portal-name">Supervisor Portal</span>
                </div>
            </div>
            <div class="header-right">
                <div class="notification">
                    <span class="bell-icon">🔔</span>
                    <span class="badge">1</span>
                </div>
                <img src="https://assets.codepen.io/85188/profile-pic.jpg" alt="Profile" class="profile-pic">
                <div class="user-dropdown">
                    <button class="dropdown-btn">John Smith ▼</button>
                </div>
            </div>
        `;
        headerContainer.innerHTML = headerHTML;
        headerContainer.className = 'main-header';
    };

    // --- Function to Create the Footer --- //
    const createFooter = () => {
        // Determine the current page to set the 'active' class correctly
        const currentPage = window.location.pathname;

        const footerHTML = `
            <div class="scanner-button-container">
                <button id="attendanceScannerBtn" class="scanner-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path d="M208,56H..."></path></svg>
                    <span>Attendance Scanner</span>
                </button>
            </div>
            <nav class="bottom-nav">
                <a href="/index.html" class="nav-link ${currentPage.endsWith('index.html') || currentPage.endsWith('/') ? 'active' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path d="M213.38,109.62l-80-80..."></path></svg>
                    <span>Home</span>
                </a>
                <a href="/Member/index.html" class="nav-link ${currentPage.includes('/Member/') ? 'active' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path d="M234.38,210a112.33..."></path></svg>
                    <span>Member</span>
                </a>
                <a href="/management/index.html" class="nav-link ${currentPage.includes('/management/') ? 'active' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path d="M224,64H176V56a24..."></path></svg>
                    <span>Management</span>
                </a>
                <a href="/Dashboard/index.html" class="nav-link ${currentPage.includes('/Dashboard/') ? 'active' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path d="M240,200V48a16..."></path></svg>
                    <span>Dashboard</span>
                </a>
            </nav>
        `;
        footerContainer.innerHTML = footerHTML;

        // Add event listener for the newly created scanner button
        const scannerButton = document.getElementById('attendanceScannerBtn');
        if (scannerButton) {
            scannerButton.addEventListener('click', () => {
                alert('Attendance Scanner Activated!');
            });
        }
    };

    // --- Build Header and Footer if containers exist --- //
    if (headerContainer) {
        createHeader();
    }
    if (footerContainer) {
        createFooter();
    }
});