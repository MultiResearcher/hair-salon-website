document.addEventListener('DOMContentLoaded', function() {

    fetch('/api/services')
        .then(response => response.json())
        .then(services => {
            const servicesList = document.getElementById('services-list');
            const serviceSelect = document.getElementById('service');
            
            if (servicesList) {
                services.forEach(service => {
                    const serviceItem = document.createElement('div');
                    serviceItem.className = 'service-item';
                    serviceItem.innerHTML = `
                        <h3>${service.name}</h3>
                        <p>Цена: ${service.price} лв.</p>
                        <p>Продължителност: ${service.duration} мин.</p>
                    `;
                    servicesList.appendChild(serviceItem);
                });
            }
            
            if (serviceSelect) {
                services.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.id;
                    option.textContent = `${service.name} - ${service.price} лв.`;
                    serviceSelect.appendChild(option);
                });
            }
        });

    fetch('/api/working-hours')
        .then(response => response.json())
        .then(hours => {
            const hoursList = document.getElementById('hours-list');
            if (hoursList) {
                const days = ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'];
                
                hours.forEach(day => {
                    const dayElement = document.createElement('div');
                    dayElement.className = 'working-day';
                    dayElement.innerHTML = `
                        <span>${days[day.day_of_week - 1]}</span>
                        <span>${day.opening_time} - ${day.closing_time}</span>
                    `;
                    hoursList.appendChild(dayElement);
                });
            }
        });

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const appointment = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                service_id: document.getElementById('service').value,
                date: document.getElementById('date').value
            };
            
            fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointment)
            })
            .then(response => response.json())
            .then(data => {
                const messageDiv = document.getElementById('message');
                if (data.success) {
                    messageDiv.textContent = 'Часът е запазен успешно!';
                    messageDiv.className = 'success';
                    bookingForm.reset();
                } else {
                    messageDiv.textContent = 'Грешка при запазване: ' + data.error;
                    messageDiv.className = 'error';
                }
            })
            .catch(error => {
                const messageDiv = document.getElementById('message');
                messageDiv.textContent = 'Грешка при запазване на час';
                messageDiv.className = 'error';
            });
        });
    }

    function loadApprovedReviews() {
        fetch('/api/reviews/approved')
            .then(response => response.json())
            .then(reviews => {
                const reviewsList = document.getElementById('reviewsList');
                if (reviewsList) {
                    reviewsList.innerHTML = reviews.map(review => `
                        <div class="review-item">
                            <h4>${review.customer_name}</h4>
                            <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                            <p>${review.comment}</p>
                            <small>${new Date(review.created_at).toLocaleDateString('bg-BG')}</small>
                        </div>
                    `).join('');
                }
            })
            .catch(error => console.error('Грешка при зареждане на отзиви:', error));
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const contactData = {
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                message: document.getElementById('contactMessage').value
            };
            
            fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            })
            .then(response => response.json())
            .then(data => {
                const statusDiv = document.getElementById('contactMessageStatus');
                if (data.success) {
                    statusDiv.textContent = 'Съобщението е изпратено успешно!';
                    statusDiv.className = 'success';
                    contactForm.reset();
                }
            })
            .catch(error => {
                const statusDiv = document.getElementById('contactMessageStatus');
                statusDiv.textContent = 'Грешка при изпращане';
                statusDiv.className = 'error';
            });
        });
    }

    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const reviewData = {
                customer_name: document.getElementById('reviewName').value,
                rating: parseInt(document.getElementById('reviewRating').value),
                comment: document.getElementById('reviewComment').value
            };
            
            fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            })
            .then(response => response.json())
            .then(data => {
                alert('Отзивът е изпратен успешно! Ще бъде публикуван след одобрение.');
                reviewForm.reset();
                loadApprovedReviews();
            })
            .catch(error => {
                alert('Грешка при изпращане на отзива');
            });
        });
    }

    loadApprovedReviews();
});
