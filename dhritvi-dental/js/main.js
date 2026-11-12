/* =====================================================================
   CLINIC SETTINGS  -  edit these three values
   SHEET_URL       : Web App URL from Google Apps Script (see booking-setup.gs).
                     Leave '' until you have set up the Google Sheet.
   WHATSAPP_NUMBER : clinic WhatsApp number, country code + digits only
                     (example: 919876543210, no + or spaces)
   CLINIC_PHONE    : clinic phone for the Call buttons, same format
   ===================================================================== */
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwMscpGcID8yHGjd-_4n_7hDwdmL6GgJJ87Clk5WQ-j-tt8b-VMumczcNWQxi6xD2NS6Q/exec';
const WHATSAPP_NUMBER = '919876543210';
const CLINIC_PHONE = '919876543210';

let currentRating = 5;

/* Point every Call and WhatsApp button at the numbers above */
document.querySelectorAll('[data-call]').forEach(a => { a.href = 'tel:+' + CLINIC_PHONE; });
document.querySelectorAll('[data-wa]').forEach(a => {
    a.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' +
        encodeURIComponent('Hello, I would like to book an appointment.');
});

/* Prevent booking dates in the past */
(function () {
    const d = new Date();
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    document.getElementById('appointmentDate').min = iso;
})();

/* Services filter */
document.getElementById('filterBar').addEventListener('click', function (e) {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('#servicesGrid .service-card').forEach(card => {
        const show = filter === 'all' || card.dataset.cat === filter;
        card.style.display = show ? 'flex' : 'none';
        if (show) { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; }
    });
});

function selectServiceAndScroll(serviceName) {
    document.getElementById('selectedService').value = serviceName;
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}

function selectSlot(button) {
    document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    document.getElementById('selectedTimeSlot').value = button.textContent;
}

async function handleBookingSubmission(event) {
    event.preventDefault();
    const timeSlot = document.getElementById('selectedTimeSlot').value;
    if (!timeSlot) {
        alert('Please select an available time slot for your appointment.');
        return;
    }

    const form = document.getElementById('appointmentForm');
    const data = {
        patientType: form.patientType.value,
        name: form.fullName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        service: form.service.value,
        date: form.date.value,
        time: timeSlot,
        notes: form.notes.value.trim()
    };

    /* 1) Send to Google Sheet / owner email */
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    if (SHEET_URL) {
        try {
            await fetch(SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: new URLSearchParams(data)
            });
        } catch (err) {
            alert('We could not send your request. Please call the clinic to book.');
            submitBtn.disabled = false;
            return;
        }
    }
    submitBtn.disabled = false;

    /* 2) Prepare WhatsApp message */
    const msg = 'New appointment request\n' +
        'Name: ' + data.name + '\n' +
        'Phone: ' + data.phone + '\n' +
        'Service: ' + data.service + '\n' +
        'Date: ' + data.date + '\n' +
        'Time: ' + data.time + '\n' +
        'Patient: ' + data.patientType +
        (data.notes ? '\nNotes: ' + data.notes : '');
    document.getElementById('whatsappLink').href =
        'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);

    const confirmationBox = document.getElementById('confirmationBox');
    confirmationBox.style.display = 'block';
    form.reset();
    document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('selectedTimeSlot').value = '';

    setTimeout(() => { confirmationBox.style.display = 'none'; }, 20000);
}

function setRating(rating) {
    currentRating = rating;
    document.querySelectorAll('#starRatingInput i').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active', 'fa-solid');
            star.classList.remove('fa-regular');
        } else {
            star.classList.remove('active', 'fa-solid');
            star.classList.add('fa-regular');
        }
    });
}

function handleReviewSubmission(event) {
    event.preventDefault();
    const name = document.getElementById('reviewerName').value.trim();
    const comment = document.getElementById('reviewComment').value.trim();
    const initials = name.split(/\s+/).map(n => n[0]).join('').toUpperCase().substring(0, 2);

    const card = document.createElement('div');
    card.className = 'review-card';

    const top = document.createElement('div');
    const stars = document.createElement('div');
    stars.className = 'stars';
    for (let i = 1; i <= 5; i++) {
        const s = document.createElement('i');
        s.className = i <= currentRating ? 'fa-solid fa-star' : 'fa-regular fa-star';
        if (i > currentRating) s.style.color = '#cbd5e1';
        stars.appendChild(s);
    }
    const text = document.createElement('p');
    text.className = 'review-text';
    text.textContent = '"' + comment + '"';   // textContent avoids HTML injection
    top.append(stars, text);

    const info = document.createElement('div');
    info.className = 'reviewer-info';
    const avatar = document.createElement('div');
    avatar.className = 'reviewer-avatar';
    avatar.textContent = initials;
    const details = document.createElement('div');
    details.className = 'reviewer-details';
    const h4 = document.createElement('h4');
    h4.textContent = name;
    const span = document.createElement('span');
    span.textContent = 'Verified Patient';
    details.append(h4, span);
    info.append(avatar, details);

    card.append(top, info);
    document.getElementById('reviewsContainer').prepend(card);

    document.getElementById('reviewForm').reset();
    setRating(5);
}
