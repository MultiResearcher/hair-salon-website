async function checkAuth() {
    try {
        const response = await fetch('/api/admin/check');
        const data = await response.json();
        
        if (!data.isAdmin) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    } catch (error) {
        window.location.href = 'login.html';
        return false;
    }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = 'login.html';
});

document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        document.querySelectorAll('.sidebar-menu a').forEach(l => l.classList.remove('active'));
        
        link.classList.add('active');
        
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetId = link.getAttribute('href').substring(1);
        document.getElementById(targetId).classList.add('active');
        
        loadSectionData(targetId);
    });
});

async function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'appointments':
            await loadAppointments();
            break;
        case 'contacts':
            await loadContacts();
            break;
        case 'reviews':
            await loadReviews();
            break;
    }
}

async function loadDashboard() {
    try {
        const [appointmentsRes, contactsRes, reviewsRes] = await Promise.all([
            fetch('/api/admin/appointments'),
            fetch('/api/admin/contacts'),
            fetch('/api/admin/reviews')
        ]);
        
        const appointments = await appointmentsRes.json();
        const contacts = await contactsRes.json();
        const reviews = await reviewsRes.json();
        
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(a => 
            a.appointment_date && a.appointment_date.startsWith(today)
        ).length;
        
        document.getElementById('todayAppointments').textContent = todayAppointments;
        document.getElementById('pendingAppointments').textContent = 
            appointments.filter(a => a.status === 'pending').length;
        document.getElementById('newContacts').textContent = 
            contacts.filter(c => c.status === 'new').length;
        document.getElementById('pendingReviews').textContent = 
            reviews.filter(r => !r.approved).length;
        
        const recentAppointments = appointments.slice(0, 5);
        const appointmentsList = document.getElementById('recentAppointmentsList');
        if (appointmentsList) {
            appointmentsList.innerHTML = recentAppointments.map(appointment => `
                <div class="recent-appointment">
                    <strong>${appointment.customer_name}</strong> - 
                    ${appointment.service_name || 'Без услуга'} - 
                    ${new Date(appointment.appointment_date).toLocaleString('bg-BG')} - 
                    <span class="status-badge status-${appointment.status}">${appointment.status}</span>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Грешка при зареждане на таблото:', error);
    }
}

async function loadAppointments() {
    try {
        const response = await fetch('/api/admin/appointments');
        const appointments = await response.json();
        
        const tableBody = document.getElementById('appointmentsTable');
        if (tableBody) {
            tableBody.innerHTML = appointments.map(appointment => `
                <tr>
                    <td>${appointment.customer_name}</td>
                    <td>${appointment.customer_phone}</td>
                    <td>${appointment.service_name || 'N/A'}</td>
                    <td>${new Date(appointment.appointment_date).toLocaleString('bg-BG')}</td>
                    <td>
                        <select class="status-select" data-id="${appointment.id}" data-type="appointment">
                            <option value="pending" ${appointment.status === 'pending' ? 'selected' : ''}>Чакащ</option>
                            <option value="confirmed" ${appointment.status === 'confirmed' ? 'selected' : ''}>Потвърден</option>
                            <option value="cancelled" ${appointment.status === 'cancelled' ? 'selected' : ''}>Отменен</option>
                            <option value="completed" ${appointment.status === 'completed' ? 'selected' : ''}>Завършен</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-save" onclick="saveStatus(${appointment.id}, 'appointment')">Запази</button>
                    </td>
                </tr>
            `).join('');
        }
        
    } catch (error) {
        console.error('Грешка при зареждане на запазванията:', error);
    }
}

async function loadContacts() {
    try {
        const response = await fetch('/api/admin/contacts');
        const contacts = await response.json();
        
        const tableBody = document.getElementById('contactsTable');
        if (tableBody) {
            tableBody.innerHTML = contacts.map(contact => `
                <tr>
                    <td>${contact.name}</td>
                    <td>${contact.email}</td>
                    <td style="max-width: 300px; word-wrap: break-word;">${contact.message}</td>
                    <td>${new Date(contact.created_at).toLocaleString('bg-BG')}</td>
                    <td>
                        <select class="status-select" data-id="${contact.id}" data-type="contact">
                            <option value="new" ${contact.status === 'new' ? 'selected' : ''}>Нов</option>
                            <option value="read" ${contact.status === 'read' ? 'selected' : ''}>Прочетен</option>
                            <option value="replied" ${contact.status === 'replied' ? 'selected' : ''}>Отговорен</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-save" onclick="saveStatus(${contact.id}, 'contact')">Запази</button>
                    </td>
                </tr>
            `).join('');
        }
        
    } catch (error) {
        console.error('Грешка при зареждане на контактите:', error);
    }
}

async function loadReviews() {
    try {
        const response = await fetch('/api/admin/reviews');
        const reviews = await response.json();
        
        const tableBody = document.getElementById('reviewsTable');
        if (tableBody) {
            tableBody.innerHTML = reviews.map(review => `
                <tr>
                    <td>${review.customer_name}</td>
                    <td>${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</td>
                    <td style="max-width: 300px; word-wrap: break-word;">${review.comment}</td>
                    <td>${new Date(review.created_at).toLocaleString('bg-BG')}</td>
                    <td>
                        <select class="status-select" data-id="${review.id}" data-type="review">
                            <option value="0" ${!review.approved ? 'selected' : ''}>Чакащ</option>
                            <option value="1" ${review.approved ? 'selected' : ''}>Одобрен</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-save" onclick="saveStatus(${review.id}, 'review')">Запази</button>
                    </td>
                </tr>
            `).join('');
        }
        
    } catch (error) {
        console.error('Грешка при зареждане на отзивите:', error);
    }
}

window.saveStatus = async function(id, type) {
    const select = document.querySelector(`.status-select[data-id="${id}"][data-type="${type}"]`);
    const status = select.value;
    
    let endpoint = '';
    let body = {};
    
    switch(type) {
        case 'appointment':
            endpoint = `/api/admin/appointments/${id}`;
            body = { status, notes: '' };
            break;
        case 'contact':
            endpoint = `/api/admin/contacts/${id}`;
            body = { status };
            break;
        case 'review':
            endpoint = `/api/admin/reviews/${id}`;
            body = { approved: status === '1' };
            break;
    }
    
    try {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (response.ok) {
            alert('Статусът е запазен успешно!');
            loadSectionData(document.querySelector('.section.active').id);
        }
    } catch (error) {
        console.error('Грешка при запазване на статус:', error);
        alert('Грешка при запазване на статуса');
    }
}

(async () => {
    const isAuthenticated = await checkAuth();
    if (isAuthenticated) {
        await loadDashboard();
    }
})();
