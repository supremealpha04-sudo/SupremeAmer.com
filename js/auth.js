// Initialize Supabase
const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseKey = SUPABASE_CONFIG.anonKey;
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Auth State
let currentUser = null;
let authToken = localStorage.getItem('auth_token');

// Check if user is logged in
async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        currentUser = null;
        updateAuthUI();
        return false;
    }
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            logout();
            return false;
        }
        currentUser = user;
        updateAuthUI();
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Login
async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        localStorage.setItem('auth_token', data.session.access_token);
        updateAuthUI();
        showToast('Login successful! Welcome back.', 'success');
        
        // Save user profile to local storage
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        localStorage.setItem('user_profile', JSON.stringify(profile));
        
        return { success: true, user: data.user };
    } catch (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
    }
}

// Register
async function register(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        
        if (error) throw error;
        
        // Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: data.user.id,
                    email: email,
                    full_name: fullName,
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (profileError) console.error('Profile creation error:', profileError);
        
        showToast('Registration successful! Please check your email to verify.', 'success');
        return { success: true, user: data.user };
    } catch (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
    }
}

// Logout
async function logout() {
    try {
        await supabase.auth.signOut();
        currentUser = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_profile');
        updateAuthUI();
        showToast('Logged out successfully', 'success');
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Update UI based on auth state
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (!authButtons) return;
    
    if (currentUser) {
        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            const userNameSpan = document.getElementById('userName');
            if (userNameSpan) {
                userNameSpan.textContent = profile.full_name || currentUser.email?.split('@')[0];
            }
        }
    } else {
        authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Show login modal
function showLoginModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = 'Login';
        document.getElementById('authForm').onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            login(email, password).then(result => {
                if (result.success) {
                    closeModal('authModal');
                    if (window.location.pathname.includes('profile.html')) {
                        window.location.reload();
                    }
                }
            });
        };
        modal.classList.add('active');
    }
}

// Show register modal
function showRegisterModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = 'Register';
        document.getElementById('authForm').innerHTML = `
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="registerName" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="registerEmail" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="registerPassword" required minlength="6">
            </div>
            <div class="form-group">
                <label>Confirm Password</label>
                <input type="password" id="registerConfirmPassword" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Register</button>
        `;
        document.getElementById('authForm').onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirm = document.getElementById('registerConfirmPassword').value;
            
            if (password !== confirm) {
                showToast('Passwords do not match', 'error');
                return;
            }
            
            register(email, password, name).then(result => {
                if (result.success) {
                    closeModal('authModal');
                }
            });
        };
        modal.classList.add('active');
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        newContainer.className = 'toast-container';
        document.body.appendChild(newContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Check if user is authenticated before investment
function requireAuth(callback) {
    if (currentUser) {
        callback();
    } else {
        showToast('Please login to invest', 'warning');
        showLoginModal();
    }
}
