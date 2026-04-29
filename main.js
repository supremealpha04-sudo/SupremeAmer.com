// Main Application Logic
let projects = [];
let investments = [];
let currentFilter = 'all';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadProjects();
    await loadUserInvestments();
    initTheme();
    initEventListeners();
});

// Load projects from Supabase
async function loadProjects() {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            projects = data;
        } else {
            // Load demo projects
            projects = getDemoProjects();
            // Seed to Supabase if empty
            for (const project of projects) {
                await supabase.from('projects').upsert(project);
            }
        }
        
        renderProjects();
        updateStats();
    } catch (error) {
        console.error('Error loading projects:', error);
        projects = getDemoProjects();
        renderProjects();
    }
}

// Demo projects data
function getDemoProjects() {
    return [
        {
            id: '1',
            name: 'AI-Powered Healthcare Platform',
            category: 'AI/ML',
            description: 'Revolutionary healthcare platform using AI for early disease detection and patient monitoring.',
            image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600',
            goal: 500000,
            raised: 325000,
            min_investment: 10000,
            status: 'active',
            investors: 42,
            roi_expected: 45
        },
        {
            id: '2',
            name: 'Decentralized Finance Protocol',
            category: 'Blockchain',
            description: 'Next-gen DeFi platform with yield farming, lending, and cross-chain swaps.',
            image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600',
            goal: 1000000,
            raised: 750000,
            min_investment: 25000,
            status: 'active',
            investors: 28,
            roi_expected: 67
        },
        {
            id: '3',
            name: 'Green Energy Marketplace',
            category: 'SaaS',
            description: 'Peer-to-peer marketplace for renewable energy credits and carbon offsets.',
            image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600',
            goal: 300000,
            raised: 120000,
            min_investment: 5000,
            status: 'active',
            investors: 15,
            roi_expected: 28
        },
        {
            id: '4',
            name: 'Adaptive Learning Platform',
            category: 'Education',
            description: 'AI-driven education platform personalizing K-12 learning experiences.',
            image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600',
            goal: 400000,
            raised: 400000,
            min_investment: 10000,
            status: 'funded',
            investors: 56,
            roi_expected: 32
        },
        {
            id: '5',
            name: 'Autonomous Delivery Drones',
            category: 'Robotics',
            description: 'Last-mile delivery solution using autonomous drone technology.',
            image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600',
            goal: 800000,
            raised: 210000,
            min_investment: 15000,
            status: 'active',
            investors: 12,
            roi_expected: 52
        },
        {
            id: '6',
            name: 'Cybersecurity SaaS Platform',
            category: 'Security',
            description: 'AI-powered threat detection and response platform for SMEs.',
            image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600',
            goal: 600000,
            raised: 480000,
            min_investment: 10000,
            status: 'active',
            investors: 34,
            roi_expected: 41
        }
    ];
}

// Render projects to grid
function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    const filtered = currentFilter === 'all' 
        ? projects 
        : projects.filter(p => p.category === currentFilter);
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No projects found</h3>
                <p>Try a different category or check back later.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filtered.map(project => {
        const progress = (project.raised / project.goal) * 100;
        const statusClass = project.status;
        
        return `
            <div class="project-card">
                <div class="project-image">
                    <img src="${project.image}" alt="${project.name}" loading="lazy">
                    <span class="project-badge ${statusClass}">${project.status === 'funded' ? 'Fully Funded' : 'Active'}</span>
                </div>
                <div class="project-content">
                    <div class="project-category">${project.category}</div>
                    <h3>${project.name}</h3>
                    <p class="project-description">${project.description.substring(0, 120)}...</p>
                    <div class="project-meta">
                        <div class="meta-item">
                            <div class="meta-value">$${formatNumber(project.goal)}</div>
                            <div class="meta-label">Goal</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-value">$${formatNumber(project.raised)}</div>
                            <div class="meta-label">Raised</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-value">${project.investors}</div>
                            <div class="meta-label">Investors</div>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="project-footer">
                        <button class="btn-details" onclick="showProjectDetails('${project.id}')">Details</button>
                        <button class="btn-invest" onclick="investInProject('${project.id}')" ${project.status !== 'active' ? 'disabled' : ''}>
                            ${project.status === 'active' ? 'Invest Now' : 'Unavailable'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Format numbers
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
}

// Update statistics
function updateStats() {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalRaised = projects.reduce((sum, p) => sum + p.raised, 0);
    const totalInvestors = projects.reduce((sum, p) => sum + p.investors, 0);
    
    const statElements = {
        statActive: activeProjects,
        statRaised: '$' + formatNumber(totalRaised),
        statInvestors: totalInvestors,
        statAvg: '34%'
    };
    
    for (const [id, value] of Object.entries(statElements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
}

// Load user investments
async function loadUserInvestments() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('investments')
            .select('*')
            .eq('user_id', currentUser.id);
        
        if (!error && data) {
            investments = data;
            updateProfileStats();
        }
    } catch (error) {
        console.error('Error loading investments:', error);
    }
}

// Update profile statistics
function updateProfileStats() {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalInvestments = investments.length;
    const expectedReturn = totalInvested * 0.34;
    
    const elements = {
        totalInvested: '$' + formatNumber(totalInvested),
        totalInvestments: totalInvestments,
        expectedReturn: '$' + formatNumber(expectedReturn)
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
}

// Invest in project
function investInProject(projectId) {
    if (!currentUser) {
        showToast('Please login to invest', 'warning');
        showLoginModal();
        return;
    }
    
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    document.getElementById('investProjectId').value = projectId;
    document.getElementById('investProjectInfo').innerHTML = `
        <div style="display: flex; gap: 15px; align-items: center;">
            <img src="${project.image}" style="width: 60px; height: 60px; border-radius: 12px; object-fit: cover;">
            <div>
                <strong>${project.name}</strong><br>
                <small>Min Investment: $${formatNumber(project.min_investment)}</small>
            </div>
        </div>
    `;
    
    document.getElementById('investModal').classList.add('active');
}

// Submit investment
async function submitInvestment() {
    const projectId = document.getElementById('investProjectId').value;
    const amount = parseInt(document.getElementById('investmentAmount').value);
    const plan = document.getElementById('investmentPlan').value;
    
    if (!amount || amount < 1000) {
        showToast('Please enter a valid investment amount (minimum $1,000)', 'error');
        return;
    }
    
    const project = projects.find(p => p.id === projectId);
    if (amount < project.min_investment) {
        showToast(`Minimum investment for this project is $${formatNumber(project.min_investment)}`, 'error');
        return;
    }
    
    const investment = {
        id: 'inv_' + Date.now(),
        user_id: currentUser.id,
        project_id: projectId,
        project_name: project.name,
        amount: amount,
        plan: plan,
        status: 'pending',
        created_at: new Date().toISOString(),
        expected_return: amount * (project.roi_expected / 100)
    };
    
    try {
        const { error } = await supabase
            .from('investments')
            .insert([investment]);
        
        if (error) throw error;
        
        // Update project raised amount
        project.raised += amount;
        project.investors += 1;
        
        await supabase
            .from('projects')
            .update({ raised: project.raised, investors: project.investors })
            .eq('id', projectId);
        
        investments.push(investment);
        showToast(`Investment of $${formatNumber(amount)} submitted successfully!`, 'success');
        closeModal('investModal');
        
        // Reset form
        document.getElementById('investmentForm').reset();
        
        // Refresh displays
        renderProjects();
        updateProfileStats();
        
    } catch (error) {
        showToast('Investment failed: ' + error.message, 'error');
    }
}

// Show project details
function showProjectDetails(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const progress = (project.raised / project.goal) * 100;
    
    document.getElementById('detailTitle').textContent = project.name;
    document.getElementById('detailContent').innerHTML = `
        <img src="${project.image}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 16px; margin-bottom: 20px;">
        <div class="project-category">${project.category}</div>
        <p style="margin: 20px 0; line-height: 1.8;">${project.description}</p>
        <div class="detail-meta">
            <div class="detail-meta-item">
                <div class="detail-meta-value">$${formatNumber(project.goal)}</div>
                <div class="detail-meta-label">Funding Goal</div>
            </div>
            <div class="detail-meta-item">
                <div class="detail-meta-value">$${formatNumber(project.raised)}</div>
                <div class="detail-meta-label">Raised</div>
            </div>
            <div class="detail-meta-item">
                <div class="detail-meta-value">${project.investors}</div>
                <div class="detail-meta-label">Investors</div>
            </div>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div style="background: var(--bg-secondary); padding: 20px; border-radius: 16px; margin-top: 20px;">
            <h4><i class="fas fa-chart-line"></i> Expected ROI: ${project.roi_expected}%</h4>
            <p style="margin-top: 10px;">Minimum investment: $${formatNumber(project.min_investment)}</p>
        </div>
    `;
    
    document.getElementById('detailModal').classList.add('active');
}

// Theme toggle
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
}

// Filter projects
function filterProjects(category) {
    currentFilter = category;
    renderProjects();
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === category) {
            btn.classList.add('active');
        }
    });
}

// Event listeners
function initEventListeners() {
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.querySelector('.main-nav').classList.toggle('active');
        });
    }
}
