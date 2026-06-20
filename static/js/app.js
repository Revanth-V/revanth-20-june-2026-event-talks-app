// App State
let appState = {
    releases: [],
    selectedUpdate: null,
    activeFilter: 'all',
    searchQuery: '',
    lastUpdated: null
};

// DOM Elements
const refreshBtn = document.getElementById('refresh-button');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const themeToggleBtn = document.getElementById('theme-toggle');
const exportCsvBtn = document.getElementById('export-csv-button');
const feedContainer = document.getElementById('feed-container');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-button');
const emptyState = document.getElementById('empty-state');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const lastUpdatedTime = document.getElementById('last-updated-time');

// Stats Counters
const statTotal = document.getElementById('stat-total');
const statFeatures = document.getElementById('stat-features');
const statAnnouncements = document.getElementById('stat-announcements');
const statDeprecations = document.getElementById('stat-deprecations');
const filteredCount = document.getElementById('filtered-count');

// Sidebar Elements
const sidebarEmptyState = document.getElementById('sidebar-empty-state');
const sidebarFilledState = document.getElementById('sidebar-filled-state');
const selectedUpdatePreview = document.getElementById('selected-update-preview');
const sidebarTweetText = document.getElementById('sidebar-tweet-text');
const charCounter = document.getElementById('char-counter');
const tweetBtnSidebar = document.getElementById('tweet-btn-sidebar');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const modalTweetText = document.getElementById('modal-tweet-text');
const modalCharCounter = document.getElementById('modal-char-counter');
const tweetBtnModal = document.getElementById('tweet-btn-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupEventListeners();
    fetchReleases();
});

// Event Listeners Configuration
function setupEventListeners() {
    // Refresh buttons
    refreshBtn.addEventListener('click', fetchReleases);
    retryBtn.addEventListener('click', fetchReleases);
    
    // Search input
    searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value.toLowerCase().trim();
        toggleClearSearchButton();
        renderFeed();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        appState.searchQuery = '';
        toggleClearSearchButton();
        renderFeed();
        searchInput.focus();
    });
    
    // Filter chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            appState.activeFilter = chip.getAttribute('data-filter');
            renderFeed();
        });
    });
    
    // Reset Filters button in empty state
    clearFiltersBtn.addEventListener('click', resetFilters);
    
    // Sidebar Tweet text area typing
    sidebarTweetText.addEventListener('input', (e) => {
        updateCharacterCounter(e.target.value, charCounter, tweetBtnSidebar);
    });
    
    // Modal Tweet text area typing
    modalTweetText.addEventListener('input', (e) => {
        updateCharacterCounter(e.target.value, modalCharCounter, tweetBtnModal);
    });
    
    // Sidebar Tweet button click
    tweetBtnSidebar.addEventListener('click', () => {
        publishTweet(sidebarTweetText.value);
    });
    
    // Modal controls
    modalCloseBtn.addEventListener('click', closeTweetModal);
    modalCancelBtn.addEventListener('click', closeTweetModal);
    tweetBtnModal.addEventListener('click', () => {
        publishTweet(modalTweetText.value);
        closeTweetModal();
    });
    
    // Close modal clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });
    
    // Theme Toggle click
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Export CSV click
    exportCsvBtn.addEventListener('click', downloadCSV);
}

// Show clear search button when search query exists
function toggleClearSearchButton() {
    if (searchInput.value.length > 0) {
        clearSearchBtn.style.display = 'flex';
    } else {
        clearSearchBtn.style.display = 'none';
    }
}

// Reset filters back to initial
function resetFilters() {
    searchInput.value = '';
    appState.searchQuery = '';
    toggleClearSearchButton();
    
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(c => c.classList.remove('active'));
    document.getElementById('btn-filter-all').classList.add('active');
    appState.activeFilter = 'all';
    
    renderFeed();
}

// Show system toast messages
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <span class="toast-content">${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Click to dismiss
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// Fetch Release Notes from backend JSON API
async function fetchReleases() {
    setLoadingState(true);
    
    try {
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success && result.data) {
            appState.releases = result.data;
            appState.lastUpdated = new Date();
            updateLastUpdatedDisplay();
            calculateStats();
            renderFeed();
            deselectUpdate(); // Reset selection on new fetch
            showToast('BigQuery release notes synced successfully.');
        } else {
            throw new Error(result.message || 'Unknown server error');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showErrorState(error.message);
        showToast('Sync failed. Using local cache if available.', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Set visual loading indicators
function setLoadingState(isLoading) {
    if (isLoading) {
        refreshBtn.disabled = true;
        refreshBtn.classList.add('loading');
        loadingState.style.display = 'flex';
        feedContainer.style.display = 'none';
        errorState.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        refreshBtn.disabled = false;
        refreshBtn.classList.remove('loading');
        loadingState.style.display = 'none';
    }
}

// Display error state block
function showErrorState(msg) {
    loadingState.style.display = 'none';
    feedContainer.style.display = 'none';
    emptyState.style.display = 'none';
    errorState.style.display = 'flex';
    errorMessage.textContent = msg || 'Could not connect to the release feed server.';
}

// Update Last Updated Timestamp
function updateLastUpdatedDisplay() {
    if (appState.lastUpdated) {
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        lastUpdatedTime.textContent = `Last updated: Today at ${appState.lastUpdated.toLocaleTimeString(undefined, timeOptions)}`;
    } else {
        lastUpdatedTime.textContent = 'Last updated: Never';
    }
}

// Calculate Feed Statistics
function calculateStats() {
    let total = 0;
    let features = 0;
    let announcements = 0;
    let deprecations = 0;
    
    appState.releases.forEach(entry => {
        entry.items.forEach(item => {
            total++;
            const itemType = item.type.toLowerCase();
            if (itemType.includes('feature')) features++;
            else if (itemType.includes('announcement')) announcements++;
            else if (itemType.includes('deprecation')) deprecations++;
        });
    });
    
    statTotal.textContent = total;
    statFeatures.textContent = features;
    statAnnouncements.textContent = announcements;
    statDeprecations.textContent = deprecations;
}

// Filter and Render BigQuery release feed
function renderFeed() {
    feedContainer.innerHTML = '';
    let totalMatches = 0;
    
    appState.releases.forEach(entry => {
        // Filter items within this entry
        const matchedItems = entry.items.filter(item => {
            // Category Filter Check
            const matchesFilter = appState.activeFilter === 'all' || 
                item.type.toLowerCase() === appState.activeFilter.toLowerCase();
                
            // Search Input Text Check
            const matchesSearch = !appState.searchQuery || 
                item.type.toLowerCase().includes(appState.searchQuery) ||
                item.text.toLowerCase().includes(appState.searchQuery);
                
            return matchesFilter && matchesSearch;
        });
        
        if (matchedItems.length > 0) {
            totalMatches += matchedItems.length;
            
            // Create Date Group Element
            const dateGroup = document.createElement('div');
            dateGroup.className = 'feed-date-group';
            
            const dateTitle = document.createElement('div');
            dateTitle.className = 'feed-date-title';
            dateTitle.textContent = entry.date;
            dateGroup.appendChild(dateTitle);
            
            const dateItemsContainer = document.createElement('div');
            dateItemsContainer.className = 'feed-date-items';
            
            matchedItems.forEach(item => {
                const isSelected = appState.selectedUpdate && 
                    appState.selectedUpdate.id === entry.id && 
                    appState.selectedUpdate.text === item.text;
                    
                const card = document.createElement('div');
                card.className = `release-card ${isSelected ? 'selected' : ''}`;
                
                // Determine Tag color class
                let tagClass = 'general';
                const lowerType = item.type.toLowerCase();
                if (lowerType.includes('feature')) tagClass = 'feature';
                else if (lowerType.includes('announcement')) tagClass = 'announcement';
                else if (lowerType.includes('deprecation')) tagClass = 'deprecation';
                else if (lowerType.includes('resolve') || lowerType.includes('fix')) tagClass = 'resolved';
                
                card.innerHTML = `
                    <div class="release-card-header">
                        <span class="tag-badge ${tagClass}">${item.type}</span>
                        <div class="card-actions">
                            <button class="btn-card-copy" title="Copy plain text to clipboard">
                                <svg class="copy-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                            <button class="btn-card-tweet" title="Tweet this update">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="release-card-body">
                        ${item.html}
                    </div>
                `;
                
                // Clicking card triggers selection
                card.addEventListener('click', (e) => {
                    // Avoid trigger selection when clicking link or buttons inside the card
                    if (e.target.closest('a') || e.target.closest('.btn-card-tweet') || e.target.closest('.btn-card-copy')) {
                        return;
                    }
                    selectUpdate(entry, item, card);
                });
                
                // Clicking direct Copy shortcut
                const copyBtn = card.querySelector('.btn-card-copy');
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    copyToClipboard(item.text, copyBtn);
                });
                
                // Clicking direct Tweet shortcut
                card.querySelector('.btn-card-tweet').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openDirectTweetModal(entry, item);
                });
                
                dateItemsContainer.appendChild(card);
            });
            
            dateGroup.appendChild(dateItemsContainer);
            feedContainer.appendChild(dateGroup);
        }
    });
    
    // Update count indicator
    filteredCount.textContent = `${totalMatches} update${totalMatches !== 1 ? 's' : ''} shown`;
    
    // Toggle empty feed layout
    if (totalMatches === 0) {
        feedContainer.style.display = 'none';
        emptyState.style.display = 'flex';
    } else {
        feedContainer.style.display = 'block';
        emptyState.style.display = 'none';
    }
}

// Select an update to compose tweet in sidebar
function selectUpdate(entry, item, cardElement) {
    // Remove previous selection styling
    document.querySelectorAll('.release-card').forEach(c => c.classList.remove('selected'));
    
    // Set selection
    cardElement.classList.add('selected');
    appState.selectedUpdate = {
        id: entry.id,
        date: entry.date,
        type: item.type,
        text: item.text,
        link: entry.link
    };
    
    // Update Sidebar views
    sidebarEmptyState.style.display = 'none';
    sidebarFilledState.style.display = 'block';
    
    // Render brief preview inside selection detail card
    selectedUpdatePreview.innerHTML = `
        <div class="preview-header">
            <span class="tag-badge ${item.type.toLowerCase().includes('feature') ? 'feature' : item.type.toLowerCase().includes('announcement') ? 'announcement' : 'general'}">${item.type}</span>
            <span class="preview-date">${entry.date}</span>
        </div>
        <div class="preview-text">${escapeHtml(item.text)}</div>
    `;
    
    // Generate pre-populated Tweet Content
    const initialTweet = generateDefaultTweet(entry.date, item.type, item.text, entry.link);
    sidebarTweetText.value = initialTweet;
    
    // Render live characters counter
    updateCharacterCounter(initialTweet, charCounter, tweetBtnSidebar);
    
    // Smooth scroll sidebar status card into view on small screens
    if (window.innerWidth <= 1024) {
        document.getElementById('detail-sidebar').scrollIntoView({ behavior: 'smooth' });
    }
}

// Deselect selected update card
function deselectUpdate() {
    appState.selectedUpdate = null;
    document.querySelectorAll('.release-card').forEach(c => c.classList.remove('selected'));
    sidebarEmptyState.style.display = 'flex';
    sidebarFilledState.style.display = 'none';
}

// Open tweet preview and compose modal (For direct clicking)
function openDirectTweetModal(entry, item) {
    const tweetContent = generateDefaultTweet(entry.date, item.type, item.text, entry.link);
    modalTweetText.value = tweetContent;
    updateCharacterCounter(tweetContent, modalCharCounter, tweetBtnModal);
    
    tweetModal.style.display = 'flex';
    modalTweetText.focus();
}

function closeTweetModal() {
    tweetModal.style.display = 'none';
}

// Format default Tweet body ensuring character constraints
function generateDefaultTweet(date, type, text, link) {
    // Standard Tweet format
    const prefix = `BigQuery ${type} (${date}):\n`;
    
    // In Twitter/X URLs are shortened via t.co taking exactly 23 characters
    const urlReplacementLength = 23;
    const paddingAndNewlines = 4; // newlines and spacings
    
    const availableLength = 280 - prefix.length - urlReplacementLength - paddingAndNewlines;
    
    let cleanText = text.replace(/\s+/g, ' ').trim();
    if (cleanText.length > availableLength) {
        cleanText = cleanText.substring(0, availableLength - 3) + '...';
    }
    
    return `${prefix}${cleanText}\n\n${link}`;
}

// Compute length matching Twitter's exact URL-counting logic
function countTweetLength(text) {
    // Simple regex matching common http/https links
    const urlRegex = /https?:\/\/[^\s]+/gi;
    let rawLength = text.length;
    
    const matches = text.match(urlRegex);
    if (matches) {
        matches.forEach(url => {
            // Subtract original url length and add fixed 23 characters for Twitter's t.co shortener
            rawLength = rawLength - url.length + 23;
        });
    }
    
    return rawLength;
}

// Live update character indicators
function updateCharacterCounter(text, counterElement, actionButton) {
    const len = countTweetLength(text);
    counterElement.textContent = `${len} / 280`;
    
    // Reset colors
    counterElement.className = 'char-counter';
    
    if (len > 280) {
        counterElement.classList.add('danger');
        actionButton.disabled = true;
    } else if (len > 250) {
        counterElement.classList.add('warning');
        actionButton.disabled = false;
    } else {
        actionButton.disabled = false;
    }
}

// Open external Twitter/X intent tab to draft and post the tweet
function publishTweet(tweetText) {
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(intentUrl, '_blank', 'width=600,height=400,resizable=yes');
    showToast('Redirected to Twitter / X to complete your post.');
}

// Utility to escape raw HTML text previews safely
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copy plain text to clipboard with button indicator feedback
async function copyToClipboard(text, buttonElement) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Update text copied to clipboard!');
        
        // Swap icon feedback
        const originalSvg = buttonElement.innerHTML;
        buttonElement.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        buttonElement.classList.add('copied');
        
        setTimeout(() => {
            buttonElement.innerHTML = originalSvg;
            buttonElement.classList.remove('copied');
        }, 1500);
    } catch (err) {
        console.error('Clipboard copy error:', err);
        showToast('Failed to copy to clipboard.', 'error');
    }
}

// Extract filtered updates based on current search & filter state
function getFilteredUpdates() {
    const list = [];
    appState.releases.forEach(entry => {
        entry.items.forEach(item => {
            const matchesFilter = appState.activeFilter === 'all' || 
                item.type.toLowerCase() === appState.activeFilter.toLowerCase();
                
            const matchesSearch = !appState.searchQuery || 
                item.type.toLowerCase().includes(appState.searchQuery) ||
                item.text.toLowerCase().includes(appState.searchQuery);
                
            if (matchesFilter && matchesSearch) {
                list.push({
                    date: entry.date,
                    type: item.type,
                    text: item.text,
                    link: entry.link
                });
            }
        });
    });
    return list;
}

// Format and download current filtered releases as CSV file
function downloadCSV() {
    const updates = getFilteredUpdates();
    if (updates.length === 0) {
        showToast('No updates to export.', 'error');
        return;
    }
    
    // Header Row
    let csvContent = 'Date,Type,Description,Documentation Link\n';
    
    updates.forEach(u => {
        // Sanitize double quotes and clean spacing
        const cleanText = u.text.replace(/\s+/g, ' ').replace(/"/g, '""').trim();
        csvContent += `"${u.date}","${u.type}","${cleanText}","${u.link}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const cleanDate = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `bigquery_release_notes_${cleanDate}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Successfully exported ${updates.length} updates to CSV.`);
}

// Theme handling (Light / Dark mode toggle overrides)
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
        document.body.classList.add('light-theme');
        updateThemeToggleButton(true);
    } else {
        document.body.classList.remove('light-theme');
        updateThemeToggleButton(false);
    }
}

function toggleTheme() {
    const isLightNow = document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLightNow ? 'light' : 'dark');
    updateThemeToggleButton(isLightNow);
    showToast(`Swapped to ${isLightNow ? 'light' : 'dark'} theme mode.`);
}

function updateThemeToggleButton(isLight) {
    const sunIcon = themeToggleBtn.querySelector('.sun-icon');
    const moonIcon = themeToggleBtn.querySelector('.moon-icon');
    
    if (isLight) {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
        themeToggleBtn.title = 'Switch to dark theme';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
        themeToggleBtn.title = 'Switch to light theme';
    }
}
