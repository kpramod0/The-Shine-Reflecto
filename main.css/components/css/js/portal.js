// This function runs automatically when portal.html is loaded
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    // 1. Load the shared header component
    await loadComponent('#main-header-container', '/components/header.html');
    
    // 2. Get user info and populate the header
    const user = await populateHeader(); // This now returns the user object

    // 3. Initialize header interactivity (like the dropdown)
    if (user) {
        initializeHeaderInteractivity(user);
    }
    
    // 4. Load the correct portal based on the user's role
    if (user && user.role) {
        loadPortalForRole(user.role);
    }
}

// Reusable function to load HTML from a file into a specific element
async function loadComponent(selector, url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Component not found at ${url}`);
        document.querySelector(selector).innerHTML = await response.text();
    } catch (error) {
        console.error(`Error loading component:`, error);
    }
}

// Function to get user data from the API and update the header
async function populateHeader() {
    // --- BACKEND COMMENT ---
    // Create a secure endpoint: GET /api/me
    // This endpoint should validate the user's token and return their details.
    // Example response: { "name": "John Smith", "role": "Supervisor", "avatarUrl": "/path/to/image.jpg" }

    try {
        // In a real app, you would fetch from your API
        // const response = await fetch('/api/me', { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }});
        // if (!response.ok) throw new Error('Not authenticated');
        // const user = await response.json();
        
        // Using MOCK data for now
        const mockUser = { name: 'John Smith', role: 'Supervisor', avatarUrl: '/assets/profile-picture.jpg' };

        document.getElementById('user-name-display').textContent = mockUser.name;
        document.getElementById('user-avatar-display').src = mockUser.avatarUrl;
        document.getElementById('portal-name-display').textContent = `${mockUser.role} Portal`;
        return mockUser;
    } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('authToken'); // Clear bad token
        window.location.href = '/login.html'; // Redirect to login
        return null;
    }
}

// This is our main front-end routing logic
async function loadPortalForRole(role) {
    let portalPath;
    let scriptPath;

    switch (role.toLowerCase()) {
        case 'admin':
            portalPath = '/portals/admin.html';
            scriptPath = '/js/admin.js';
            break;
        case 'supervisor':
            portalPath = '/portals/supervisor.html';
            scriptPath = '/js/supervisor.js';
            break;
        // Add cases for 'worker' and 'client' here
        default:
            console.error(`Unknown role: ${role}`);
            document.getElementById('portal-content-container').innerHTML = `<p>Error: Invalid user role.</p>`;
            return;
    }

    // Load the specific portal's HTML and then its dedicated JavaScript
    await loadComponent('#portal-content-container', portalPath);
    if (scriptPath) {
        loadScript(scriptPath);
    }
}

// Utility functions for interactivity and loading scripts
function initializeHeaderInteractivity(user) {
    const dropdownButton = document.getElementById('dropdown-button');
    const dropdownMenu = document.getElementById('dropdown-menu');
    document.getElementById('logout-button').addEventListener('click', () => {
        // --- BACKEND COMMENT ---
        // Optionally, create a POST /api/logout endpoint to invalidate the token on the server.
        localStorage.removeItem('authToken');
        window.location.href = '/login.html';
    });
    dropdownButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => dropdownMenu.classList.add('hidden'));
}

function loadScript(src) {
    // Check if script is already loaded to avoid duplicates
    if (document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.body.appendChild(script);
}