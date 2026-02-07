document.addEventListener('DOMContentLoaded', function() {
    // Зареждане на услуги
    fetch('/api/services')
        .then(response => response.json())
        .then(services => {
            const servicesList = document.getElementById('services-list');
            const serviceSelect = document.getElementById('service');
            
            services.forEach(service => {
                // Добавяне в списъка с услуги
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.innerHTML = `
                    <h3>${service.name}</h3>
                    <p>Цена: ${service.price} лв.</p>
                    <p>Продължителност: ${service.duration} мин.</p>
                `;
                servicesList.appendChild(serviceItem);
                
                // Добавяне в dropdown за запазване
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = `${service.name} - ${service.price} лв.`;
                serviceSelect.appendChild(option);
            });
        });

    // Зареждане на работно време
    fetch('/api/working-hours')
        .then(response => response.json())
        .then(hours => {
            const hoursList = document.getElementById('hours-list');
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
        });

    // Обработка на формата за запазване
    document.getElementById('booking-form').addEventListener('submit', function(e) {
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
                document.getElementById('booking-form').reset();
            } else {
                messageDiv.textContent = 'Грешка при запазване: ' + data.error;
                messageDiv.className = 'error';
            }
        })
        .catch(error => {
            document.getElementById('message').textContent = 'Грешка при запазване на час';
            document.getElementById('message').className = 'error';
        });
    });
});