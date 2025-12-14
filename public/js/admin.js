/**
 * Modern Admin Panel JavaScript
 * UCC Engineering CMS
 * Features: Dark Mode, Animations, Charts, Interactive Elements
 */

// ============ DARK MODE FUNCTIONALITY ============
class DarkModeManager {
    constructor() {
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.init();
    }

    init() {
        // Apply saved preference
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        }
        
        // Create toggle button if it doesn't exist
        if (!document.querySelector('.dark-mode-toggle')) {
            this.createToggle();
        }
        
        // Attach event listener
        this.attachListeners();
    }

    createToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'dark-mode-toggle';
        toggle.innerHTML = '<i class="fas fa-moon"></i>';
        toggle.title = 'Toggle Dark Mode';
        document.body.appendChild(toggle);
    }

    attachListeners() {
        const toggle = document.querySelector('.dark-mode-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        this.darkMode = !this.darkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.darkMode);
        
        // Update icon
        const toggle = document.querySelector('.dark-mode-toggle');
        if (toggle) {
            toggle.innerHTML = this.darkMode ? 
                '<i class="fas fa-sun"></i>' : 
                '<i class="fas fa-moon"></i>';
        }
    }
}

// ============ ANIMATED COUNTERS ============
class CountUp {
    constructor(element, end, duration = 2000) {
        this.element = element;
        this.end = parseInt(end);
        this.duration = duration;
        this.start = 0;
    }

    animate() {
        const startTime = performance.now();
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            const current = Math.floor(progress * this.end);
            
            this.element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                this.element.textContent = this.end;
            }
        };
        requestAnimationFrame(step);
    }
}

// ============ CHART INITIALIZATION ============
class ChartManager {
    constructor() {
        this.charts = {};
    }

    initContentChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || typeof Chart === 'undefined') return;

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Services', 'Clients', 'Projects', 'Team Members'],
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(59, 130, 246, 0.8)'
                    ],
                    borderColor: [
                        'rgba(99, 102, 241, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(59, 130, 246, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    initActivityChart(canvasId, labels, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || typeof Chart === 'undefined') return;

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Activity',
                    data: data,
                    backgroundColor: gradient,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }
}

// ============ TOAST NOTIFICATIONS ============
class ToastNotification {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// ============ TABLE ENHANCEMENTS ============
class TableEnhancer {
    constructor(tableSelector) {
        this.table = document.querySelector(tableSelector);
        if (this.table) {
            this.enhance();
        }
    }

    enhance() {
        // Add search functionality
        this.addSearch();
        
        // Add sorting
        this.addSorting();
        
        // Add row highlighting
        this.addRowHighlighting();
    }

    addSearch() {
        const searchBar = document.createElement('div');
        searchBar.className = 'search-bar';
        searchBar.innerHTML = `
            <i class="fas fa-search search-icon"></i>
            <input type="text" class="search-input" placeholder="Search...">
        `;
        
        this.table.parentNode.insertBefore(searchBar, this.table);
        
        const input = searchBar.querySelector('.search-input');
        input.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = this.table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    addSorting() {
        const headers = this.table.querySelectorAll('th');
        headers.forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => this.sortTable(index));
        });
    }

    sortTable(columnIndex) {
        const tbody = this.table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            const aText = a.cells[columnIndex].textContent;
            const bText = b.cells[columnIndex].textContent;
            return aText.localeCompare(bText);
        });
        
        rows.forEach(row => tbody.appendChild(row));
    }

    addRowHighlighting() {
        const rows = this.table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.style.backgroundColor = '#f8fafc';
            });
            row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = '';
            });
        });
    }
}

// ============ FORM VALIDATION ============
class FormValidator {
    constructor(formSelector) {
        this.form = document.querySelector(formSelector);
        if (this.form) {
            this.attachValidation();
        }
    }

    attachValidation() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
        });
        
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
            }
        });
    }

    validateField(field) {
        if (field.hasAttribute('required') && !field.value.trim()) {
            this.showError(field, 'This field is required');
            return false;
        }
        
        if (field.type === 'email' && field.value) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(field.value)) {
                this.showError(field, 'Please enter a valid email');
                return false;
            }
        }
        
        this.clearError(field);
        return true;
    }

    validateForm() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    showError(field, message) {
        field.style.borderColor = '#ef4444';
        let error = field.parentNode.querySelector('.error-message');
        
        if (!error) {
            error = document.createElement('div');
            error.className = 'error-message';
            error.style.color = '#ef4444';
            error.style.fontSize = '0.875rem';
            error.style.marginTop = '0.25rem';
            field.parentNode.appendChild(error);
        }
        
        error.textContent = message;
    }

    clearError(field) {
        field.style.borderColor = '';
        const error = field.parentNode.querySelector('.error-message');
        if (error) {
            error.remove();
        }
    }
}

// ============ DRAG AND DROP FILE UPLOAD ============
class DragDropUpload {
    constructor(selector) {
        this.dropZone = document.querySelector(selector);
        if (this.dropZone) {
            this.init();
        }
    }

    init() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.remove('drag-over');
            });
        });

        this.dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });
    }

    handleFiles(files) {
        // Override this method to handle files
        console.log('Files dropped:', files);
    }
}

// ============ INITIALIZE ON PAGE LOAD ============
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Dark Mode
    const darkMode = new DarkModeManager();

    // Initialize Toast Notifications
    window.toast = new ToastNotification();

    // Animate counters in stat cards
    document.querySelectorAll('.stat-card h3').forEach(element => {
        if (element.textContent && !isNaN(element.textContent)) {
            const counter = new CountUp(element, element.textContent);
            counter.animate();
        }
    });

    // Initialize Chart Manager
    const chartManager = new ChartManager();
    
    // Initialize content chart if canvas exists
    const contentChart = document.getElementById('contentChart');
    if (contentChart && typeof Chart !== 'undefined') {
        // Get data from stat cards
        const statCards = document.querySelectorAll('.stat-card h3');
        const chartData = Array.from(statCards).slice(0, 4).map(card => 
            parseInt(card.textContent) || 0
        );
        
        if (chartData.length > 0) {
            chartManager.initContentChart('contentChart', chartData);
        }
    }

    // Initialize DataTables on all admin tables
    if (typeof $.fn.DataTable !== 'undefined') {
        $('.admin-table, table.table-hover').each(function() {
            if (!$(this).hasClass('no-datatable')) {
                $(this).DataTable({
                    responsive: true,
                    pageLength: 10,
                    lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                    dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                         '<"row"<"col-sm-12"tr>>' +
                         '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
                    language: {
                        search: "_INPUT_",
                        searchPlaceholder: "Search...",
                        lengthMenu: "Show _MENU_ entries",
                        info: "Showing _START_ to _END_ of _TOTAL_ entries",
                        infoEmpty: "Showing 0 to 0 of 0 entries",
                        infoFiltered: "(filtered from _TOTAL_ total entries)",
                        paginate: {
                            first: '<i class="fas fa-angle-double-left"></i>',
                            last: '<i class="fas fa-angle-double-right"></i>',
                            next: '<i class="fas fa-angle-right"></i>',
                            previous: '<i class="fas fa-angle-left"></i>'
                        }
                    },
                    order: [[0, 'desc']],
                    columnDefs: [{
                        targets: 'no-sort',
                        orderable: false
                    }]
                });
            }
        });

        // Initialize DataTables with export buttons
        $('.datatable-export').DataTable({
            responsive: true,
            pageLength: 10,
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                 '<"row"<"col-sm-12 col-md-12"B>>' +
                 '<"row"<"col-sm-12"tr>>' +
                 '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            buttons: [
                {
                    extend: 'copy',
                    className: 'btn btn-sm btn-primary',
                    text: '<i class="fas fa-copy"></i> Copy'
                },
                {
                    extend: 'csv',
                    className: 'btn btn-sm btn-success',
                    text: '<i class="fas fa-file-csv"></i> CSV'
                },
                {
                    extend: 'excel',
                    className: 'btn btn-sm btn-info',
                    text: '<i class="fas fa-file-excel"></i> Excel'
                },
                {
                    extend: 'pdf',
                    className: 'btn btn-sm btn-danger',
                    text: '<i class="fas fa-file-pdf"></i> PDF'
                },
                {
                    extend: 'print',
                    className: 'btn btn-sm btn-secondary',
                    text: '<i class="fas fa-print"></i> Print'
                }
            ],
            language: {
                search: "_INPUT_",
                searchPlaceholder: "Search..."
            }
        });
    }

    // Add smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading state to buttons
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.classList.contains('no-loading')) {
                submitBtn.disabled = true;
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                
                // Re-enable after 3 seconds (failsafe)
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }, 3000);
            }
        });
    });

    // Add confirmation dialogs for delete actions
    document.querySelectorAll('a[href*="delete"], button[onclick*="delete"], .btn-danger[data-action="delete"]').forEach(element => {
        element.addEventListener('click', function(e) {
            if (!this.classList.contains('no-confirm')) {
                if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                    e.preventDefault();
                    return false;
                }
            }
        });
    });

    // Auto-hide alerts after 5 seconds
    document.querySelectorAll('.alert').forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.5s';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    });

    // Load notifications
    loadNotifications();
});

// ============ UTILITY FUNCTIONS ============
function showToast(message, type = 'info') {
    if (window.toast) {
        window.toast.show(message, type);
    }
}

function confirmDelete(message = 'Are you sure you want to delete this?') {
    return confirm(message);
}

// ============ NOTIFICATIONS LOADER ============
function loadNotifications() {
    fetch('/admin/api/notifications')
        .then(response => response.json())
        .then(notifications => {
            if (notifications.length > 0) {
                // Update notification badge
                const badge = document.querySelector('.navbar-badge');
                if (badge) {
                    badge.textContent = notifications.length;
                }
                
                // Show first notification as toast after delay
                setTimeout(() => {
                    if (window.toast && notifications[0]) {
                        window.toast.show(notifications[0].message, notifications[0].type || 'info');
                    }
                }, 2000);
            }
        })
        .catch(err => console.error('Error loading notifications:', err));
}

// Refresh notifications every 5 minutes
setInterval(loadNotifications, 5 * 60 * 1000);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DarkModeManager,
        CountUp,
        ChartManager,
        ToastNotification,
        TableEnhancer,
        FormValidator,
        DragDropUpload
    };
}
