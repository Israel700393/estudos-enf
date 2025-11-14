// Estado Global
const state = {
    theme: localStorage.getItem('theme') || 'light',
    flashcards: JSON.parse(localStorage.getItem('flashcards')) || [],
    images: JSON.parse(localStorage.getItem('images')) || [],
    events: JSON.parse(localStorage.getItem('events')) || [],
    chatHistory: JSON.parse(localStorage.getItem('chatHistory')) || [],
    notes: JSON.parse(localStorage.getItem('notes')) || [],
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    studyTime: parseInt(localStorage.getItem('studyTime')) || 0,
    pomodoroSessions: JSON.parse(localStorage.getItem('pomodoroSessions')) || { today: 0, total: 0, lastDate: new Date().toDateString() },
    studyHistory: JSON.parse(localStorage.getItem('studyHistory')) || [],
    currentNoteId: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initFlashcards();
    initGallery();
    initCalendar();
    initChat();
    initTimer();
    initNotes();
    updateStats();
    updateUpcomingEvents();
    startStudyTimer();
});

// Tema
function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeButtons();
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', state.theme);
            updateThemeButtons();
            localStorage.setItem('theme', state.theme);
        });
    }
}

// Navegação
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn, .sidebar-btn');
    const sections = document.querySelectorAll('.section');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const themeToggleSidebar = document.getElementById('themeToggleSidebar');
    
    // Abrir sidebar
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Fechar sidebar
    function closeSidebarFunc() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeSidebarFunc);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebarFunc);
    }
    
    // Navegação entre seções
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Sincronizar botões do menu desktop e sidebar
            document.querySelectorAll(`[data-section="${targetSection}"]`).forEach(b => {
                b.classList.add('active');
            });
            
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');
            
            // Fechar sidebar em mobile
            if (window.innerWidth <= 1024) {
                closeSidebarFunc();
            }
        });
    });
    
    // Theme toggle na sidebar
    if (themeToggleSidebar) {
        themeToggleSidebar.addEventListener('click', () => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', state.theme);
            updateThemeButtons();
            localStorage.setItem('theme', state.theme);
        });
    }
}

function updateThemeButtons() {
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleSidebar = document.getElementById('themeToggleSidebar');
    
    if (state.theme === 'dark') {
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        if (themeToggleSidebar) {
            themeToggleSidebar.innerHTML = '<i class="fas fa-sun"></i><span>Modo Claro</span>';
        }
    } else {
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        if (themeToggleSidebar) {
            themeToggleSidebar.innerHTML = '<i class="fas fa-moon"></i><span>Modo Escuro</span>';
        }
    }
}

function navigateTo(section) {
    const btn = document.querySelector(`[data-section="${section}"]`);
    if (btn) btn.click();
}

// Estatísticas
function updateStats() {
    document.getElementById('totalFlashcards').textContent = state.flashcards.length;
    document.getElementById('totalImages').textContent = state.images.length;
    document.getElementById('totalEvents').textContent = state.events.length;
    document.getElementById('studyTime').textContent = Math.floor(state.studyTime / 60) + 'h';
}

function startStudyTimer() {
    setInterval(() => {
        state.studyTime++;
        localStorage.setItem('studyTime', state.studyTime);
        if (state.studyTime % 60 === 0) {
            updateStats();
        }
    }, 1000);
}

// Próximas Provas
function updateUpcomingEvents() {
    const container = document.getElementById('upcomingEventsList');
    const today = new Date();
    const upcoming = state.events
        .filter(e => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Nenhum evento próximo</p>';
        return;
    }
    
    container.innerHTML = upcoming.map(event => `
        <div class="event-item">
            <div class="event-info">
                <h4>${event.title}</h4>
                <p>${event.description || 'Sem descrição'}</p>
            </div>
            <div class="event-date">
                <div>${formatDate(event.date)}</div>
                <div style="font-size: 0.9rem;">${event.time || ''}</div>
            </div>
        </div>
    `).join('');
}

// Flashcards
function initFlashcards() {
    const addBtn = document.getElementById('addFlashcardBtn');
    const modal = document.getElementById('flashcardModal');
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.cancel-modal');
    const saveBtn = document.getElementById('saveFlashcard');
    const searchInput = document.getElementById('searchFlashcard');
    
    addBtn.addEventListener('click', () => openModal(modal));
    closeBtn.addEventListener('click', () => closeModal(modal));
    cancelBtn.addEventListener('click', () => closeModal(modal));
    saveBtn.addEventListener('click', saveFlashcard);
    searchInput.addEventListener('input', (e) => renderFlashcards(e.target.value));
    
    renderFlashcards();
}

function saveFlashcard() {
    const front = document.getElementById('flashcardFront').value.trim();
    const back = document.getElementById('flashcardBack').value.trim();
    const category = document.getElementById('flashcardCategory').value;
    
    if (!front || !back) {
        alert('Preencha todos os campos!');
        return;
    }
    
    const flashcard = {
        id: Date.now(),
        front,
        back,
        category,
        createdAt: new Date().toISOString()
    };
    
    state.flashcards.push(flashcard);
    localStorage.setItem('flashcards', JSON.stringify(state.flashcards));
    
    closeModal(document.getElementById('flashcardModal'));
    renderFlashcards();
    updateStats();
    
    document.getElementById('flashcardFront').value = '';
    document.getElementById('flashcardBack').value = '';
}

function renderFlashcards(search = '') {
    const container = document.getElementById('flashcardGrid');
    const filtered = state.flashcards.filter(f => 
        f.front.toLowerCase().includes(search.toLowerCase()) ||
        f.back.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase())
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">Nenhum flashcard encontrado</p>';
        return;
    }
    
    container.innerHTML = filtered.map(card => `
        <div class="flashcard" data-id="${card.id}">
            <span class="flashcard-category">${card.category}</span>
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <h3>${card.front}</h3>
                </div>
                <div class="flashcard-back">
                    <p>${card.back}</p>
                </div>
            </div>
            <div class="flashcard-actions">
                <button onclick="deleteFlashcard(${card.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.flashcard').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.flashcard-actions')) {
                card.classList.toggle('flipped');
            }
        });
    });
}

function deleteFlashcard(id) {
    if (confirm('Deseja excluir este flashcard?')) {
        state.flashcards = state.flashcards.filter(f => f.id !== id);
        localStorage.setItem('flashcards', JSON.stringify(state.flashcards));
        renderFlashcards();
        updateStats();
    }
}

// Galeria
function initGallery() {
    const addBtn = document.getElementById('addImageBtn');
    const input = document.getElementById('imageInput');
    const modal = document.getElementById('imageModal');
    const closeBtn = modal.querySelector('.close-modal');
    const saveBtn = document.getElementById('saveImageInfo');
    const deleteBtn = document.getElementById('deleteImage');
    const searchInput = document.getElementById('searchImage');
    
    addBtn.addEventListener('click', () => input.click());
    input.addEventListener('change', handleImageUpload);
    closeBtn.addEventListener('click', () => closeModal(modal));
    saveBtn.addEventListener('click', saveImageInfo);
    deleteBtn.addEventListener('click', deleteImage);
    searchInput.addEventListener('input', (e) => renderGallery(e.target.value));
    
    renderGallery();
}

function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const image = {
                id: Date.now() + Math.random(),
                src: event.target.result,
                name: file.name,
                description: '',
                tags: [],
                createdAt: new Date().toISOString()
            };
            
            state.images.push(image);
            localStorage.setItem('images', JSON.stringify(state.images));
            renderGallery();
            updateStats();
        };
        reader.readAsDataURL(file);
    });
    
    e.target.value = '';
}

function renderGallery(search = '') {
    const container = document.getElementById('galleryGrid');
    const filtered = state.images.filter(img => 
        img.name.toLowerCase().includes(search.toLowerCase()) ||
        img.description.toLowerCase().includes(search.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">Nenhuma imagem encontrada</p>';
        return;
    }
    
    container.innerHTML = filtered.map(img => `
        <div class="gallery-item" onclick="openImageModal(${img.id})">
            <img src="${img.src}" alt="${img.name}">
            <div class="gallery-item-info">
                <p><strong>${img.name}</strong></p>
                <p>${img.description || 'Sem descrição'}</p>
                <div class="gallery-item-tags">
                    ${img.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function openImageModal(id) {
    const image = state.images.find(img => img.id === id);
    if (!image) return;
    
    const modal = document.getElementById('imageModal');
    document.getElementById('imageModalTitle').textContent = image.name;
    document.getElementById('modalImage').src = image.src;
    document.getElementById('imageDescription').value = image.description;
    document.getElementById('imageTags').value = image.tags.join(', ');
    modal.dataset.imageId = id;
    
    openModal(modal);
}

function saveImageInfo() {
    const modal = document.getElementById('imageModal');
    const id = parseFloat(modal.dataset.imageId);
    const image = state.images.find(img => img.id === id);
    
    if (image) {
        image.description = document.getElementById('imageDescription').value;
        image.tags = document.getElementById('imageTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        
        localStorage.setItem('images', JSON.stringify(state.images));
        renderGallery();
        closeModal(modal);
    }
}

function deleteImage() {
    const modal = document.getElementById('imageModal');
    const id = parseFloat(modal.dataset.imageId);
    
    if (confirm('Deseja excluir esta imagem?')) {
        state.images = state.images.filter(img => img.id !== id);
        localStorage.setItem('images', JSON.stringify(state.images));
        renderGallery();
        updateStats();
        closeModal(modal);
    }
}

// Calendário
function initCalendar() {
    const addBtn = document.getElementById('addEventBtn');
    const modal = document.getElementById('eventModal');
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.cancel-modal');
    const saveBtn = document.getElementById('saveEvent');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    
    addBtn.addEventListener('click', () => openModal(modal));
    closeBtn.addEventListener('click', () => closeModal(modal));
    cancelBtn.addEventListener('click', () => closeModal(modal));
    saveBtn.addEventListener('click', saveEvent);
    prevBtn.addEventListener('click', () => changeMonth(-1));
    nextBtn.addEventListener('click', () => changeMonth(1));
    
    renderCalendar();
}

function changeMonth(delta) {
    state.currentMonth += delta;
    if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
    } else if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
    }
    renderCalendar();
}

function renderCalendar() {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    document.getElementById('currentMonth').textContent = 
        `${monthNames[state.currentMonth]} ${state.currentYear}`;
    
    const firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay();
    const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
    const today = new Date();
    
    const calendarHTML = `
        <div class="calendar-header">
            ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => 
                `<div class="calendar-day-name">${day}</div>`
            ).join('')}
        </div>
        <div class="calendar-days">
            ${Array(firstDay).fill('').map(() => '<div class="calendar-day other-month"></div>').join('')}
            ${Array(daysInMonth).fill('').map((_, i) => {
                const day = i + 1;
                const date = new Date(state.currentYear, state.currentMonth, day);
                const isToday = date.toDateString() === today.toDateString();
                const hasEvent = state.events.some(e => 
                    new Date(e.date).toDateString() === date.toDateString()
                );
                
                return `<div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}">${day}</div>`;
            }).join('')}
        </div>
    `;
    
    document.getElementById('calendar').innerHTML = calendarHTML;
    renderEventsList();
}

function renderEventsList() {
    const container = document.getElementById('eventsList');
    const monthEvents = state.events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getMonth() === state.currentMonth && 
               eventDate.getFullYear() === state.currentYear;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (monthEvents.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Nenhum evento este mês</p>';
        return;
    }
    
    container.innerHTML = monthEvents.map(event => `
        <div class="event-item">
            <div class="event-info">
                <h4>${event.title}</h4>
                <p>${event.description || 'Sem descrição'}</p>
                <p style="font-size: 0.85rem; color: var(--text-secondary);">
                    ${event.type} - ${formatDate(event.date)} ${event.time || ''}
                </p>
            </div>
            <button onclick="deleteEvent(${event.id})" style="background: var(--danger); color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function saveEvent() {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const type = document.getElementById('eventType').value;
    const description = document.getElementById('eventDescription').value.trim();
    
    if (!title || !date) {
        alert('Preencha título e data!');
        return;
    }
    
    const event = {
        id: Date.now(),
        title,
        date,
        time,
        type,
        description,
        createdAt: new Date().toISOString()
    };
    
    state.events.push(event);
    localStorage.setItem('events', JSON.stringify(state.events));
    
    closeModal(document.getElementById('eventModal'));
    renderCalendar();
    updateStats();
    updateUpcomingEvents();
    
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventDescription').value = '';
}

function deleteEvent(id) {
    if (confirm('Deseja excluir este evento?')) {
        state.events = state.events.filter(e => e.id !== id);
        localStorage.setItem('events', JSON.stringify(state.events));
        renderCalendar();
        updateStats();
        updateUpcomingEvents();
    }
}

// Chat IA Avançada
let API_KEY = localStorage.getItem('gemini_api_key') || '';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

function initChat() {
    const sendBtn = document.getElementById('sendMessage');
    const input = document.getElementById('chatInput');
    const quickBtns = document.querySelectorAll('.quick-q');
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            input.value = btn.dataset.q;
            sendMessage();
        });
    });
    
    loadChatHistory();
    checkAPIKey();
}

function checkAPIKey() {
    // Não pedir API Key mais - usar IA offline avançada
    if (!API_KEY) {
        setTimeout(() => {
            addMessageToChat('💙 Bem-vindo! Estou pronta para responder suas dúvidas sobre enfermagem. Pode perguntar qualquer coisa!', false);
        }, 500);
    }
}

function loadChatHistory() {
    const container = document.getElementById('chatMessages');
    state.chatHistory.forEach(msg => {
        addMessageToChat(msg.text, msg.isUser, false);
    });
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessageToChat(message, true);
    input.value = '';
    
    // Mostrar indicador de digitação
    const typingId = showTypingIndicator();
    
    try {
        let response;
        if (API_KEY) {
            response = await getAdvancedAIResponse(message);
        } else {
            response = getBasicAIResponse(message);
        }
        removeTypingIndicator(typingId);
        addMessageToChat(response, false);
    } catch (error) {
        removeTypingIndicator(typingId);
        console.error('Erro na IA:', error);
        addMessageToChat('❌ Erro ao processar sua pergunta. Usando resposta básica...', false);
        setTimeout(() => {
            addMessageToChat(getBasicAIResponse(message), false);
        }, 500);
    }
}

function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    const id = 'typing-' + Date.now();
    typingDiv.id = id;
    typingDiv.className = 'chat-message bot';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>Pensando<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span></p>
        </div>
    `;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

async function getAdvancedAIResponse(question) {
    const systemPrompt = `Você é uma assistente especializada em enfermagem, com conhecimento profundo em:
- Anatomia e Fisiologia
- Farmacologia e Administração de Medicamentos
- Procedimentos de Enfermagem
- Cuidados Intensivos e Emergências
- Patologias e Diagnósticos
- Ética e Legislação em Enfermagem
- Saúde Pública e Epidemiologia
- Cuidados Materno-Infantil
- Geriatria e Cuidados Paliativos

Responda de forma clara, didática e baseada em evidências científicas. Use linguagem profissional mas acessível para estudantes. Quando apropriado, forneça exemplos práticos e dicas de memorização.`;

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\nPergunta do estudante: ${question}`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error('Resposta inválida da API');
    }
}

function getBasicAIResponse(question) {
    const q = question.toLowerCase();
    
    // Sistema de busca inteligente por palavras-chave
    const keywords = {
        anatomia: ['anatomia', 'órgão', 'órgãos', 'sistema', 'corpo', 'estrutura'],
        cardiovascular: ['coração', 'cardíaco', 'cardiovascular', 'circulação', 'sangue', 'artéria', 'veia'],
        respiratorio: ['pulmão', 'respiração', 'respiratório', 'oxigênio', 'ventilação'],
        medicacao: ['medicamento', 'remédio', 'droga', 'farmaco', 'dose', 'administração'],
        calculo: ['calcular', 'cálculo', 'gotejamento', 'dose', 'diluição'],
        procedimento: ['como fazer', 'procedimento', 'técnica', 'passo a passo'],
        emergencia: ['emergência', 'urgência', 'grave', 'crítico'],
    };
    
    // Detectar contexto da pergunta
    let context = '';
    for (let key in keywords) {
        if (keywords[key].some(word => q.includes(word))) {
            context = key;
            break;
        }
    }
    
    const knowledgeBase = {
        'pressão arterial': 'A pressão arterial (PA) é a força que o sangue exerce contra as paredes das artérias. É medida em mmHg e possui dois valores:\n\n• Sistólica (máxima): quando o coração contrai - normal até 120 mmHg\n• Diastólica (mínima): quando o coração relaxa - normal até 80 mmHg\n\nClassificação:\n- Normal: <120/80\n- Pré-hipertensão: 120-139/80-89\n- Hipertensão estágio 1: 140-159/90-99\n- Hipertensão estágio 2: ≥160/≥100',
        
        'sinais vitais': 'Os sinais vitais são indicadores essenciais das funções corporais:\n\n1. Temperatura: 36-37°C (axilar)\n2. Frequência Cardíaca: 60-100 bpm (adultos)\n3. Frequência Respiratória: 12-20 irpm (adultos)\n4. Pressão Arterial: 120/80 mmHg\n5. Saturação de O₂: >95%\n6. Dor: escala 0-10\n\nVerifique sempre em ambiente calmo e registre corretamente!',
        
        'curativo': 'Técnica de Curativo:\n\n1. Higienize as mãos\n2. Reúna material estéril\n3. Calce luvas de procedimento\n4. Remova curativo anterior\n5. Avalie a ferida\n6. Limpe com SF 0,9% (centro→periferia)\n7. Seque com gaze estéril\n8. Aplique cobertura apropriada\n9. Fixe adequadamente\n10. Descarte material e higienize mãos\n\nRegistre: aspecto, tamanho, exsudato, sinais de infecção.',
        
        'sepse': 'SEPSE - Emergência Médica!\n\nDefinição: Resposta inflamatória sistêmica grave à infecção.\n\nSinais de Alerta (qSOFA):\n• Alteração do nível de consciência\n• Pressão sistólica ≤100 mmHg\n• Frequência respiratória ≥22 irpm\n\nOutros sinais:\n• Febre >38°C ou hipotermia <36°C\n• Taquicardia >90 bpm\n• Leucocitose ou leucopenia\n\nTratamento:\n• Antibiótico em 1 hora\n• Reposição volêmica\n• Suporte hemodinâmico\n• Monitorização intensiva',
        
        'medicação': 'Administração de Medicamentos - 9 Certos:\n\n1. Paciente certo\n2. Medicamento certo\n3. Via certa\n4. Dose certa\n5. Horário certo\n6. Registro certo\n7. Orientação certa\n8. Forma certa\n9. Resposta certa\n\nVias:\n• VO: oral\n• IM: intramuscular\n• SC: subcutânea\n• EV: endovenosa\n• SL: sublingual\n• Tópica, retal, inalatória',
        
        'sonda': 'Sondagem Vesical de Demora (SVD):\n\nIndicações:\n• Retenção urinária\n• Controle de diurese\n• Pós-operatório\n• Incontinência com lesão\n\nTécnica:\n1. Higiene íntima rigorosa\n2. Técnica asséptica\n3. Lubrificação adequada\n4. Introdução suave\n5. Insuflar balão (10ml)\n6. Fixar adequadamente\n7. Sistema fechado\n\nCuidados: higiene diária, sistema fechado, trocar conforme protocolo.',
        
        'ferida': 'Classificação de Feridas:\n\nPor profundidade:\n• Grau I: epiderme\n• Grau II: derme\n• Grau III: tecido subcutâneo\n• Grau IV: músculo/osso\n\nPor tempo:\n• Aguda: <3 meses\n• Crônica: >3 meses\n\nCoberturas:\n• Hidrocolóide: feridas limpas\n• Alginato: exsudato intenso\n• Hidrogel: necrose\n• AGE: granulação\n• Carvão ativado: odor',
        
        'oxigenoterapia': 'Oxigenoterapia:\n\nDispositivos:\n• Cateter nasal: 1-6 L/min (24-44%)\n• Máscara simples: 5-10 L/min (40-60%)\n• Máscara com reservatório: 10-15 L/min (60-90%)\n• Venturi: concentração precisa\n\nCuidados:\n• Umidificar se >4L/min\n• Monitorar saturação\n• Avaliar sinais de hipóxia\n• Cuidado com DPOC\n• Risco de incêndio',
        
        'diabetes': 'Diabetes Mellitus:\n\nTipos:\n• Tipo 1: autoimune, insulinodependente\n• Tipo 2: resistência insulínica\n• Gestacional: na gravidez\n\nSinais:\n• Poliúria, polidipsia, polifagia\n• Perda de peso\n• Glicemia >126 mg/dL (jejum)\n\nComplicações:\n• Hipoglicemia (<70 mg/dL)\n• Hiperglicemia (>180 mg/dL)\n• Cetoacidose diabética\n• Neuropatia, retinopatia, nefropatia\n\nCuidados: dieta, exercício, medicação, monitorização.',
        
        'rcp': 'RCP - Reanimação Cardiopulmonar:\n\nAdulto (Protocolo AHA):\n1. Checar responsividade\n2. Acionar emergência\n3. Posicionar em superfície rígida\n4. Compressões: 100-120/min\n5. Profundidade: 5-6 cm\n6. Relação 30:2 (compressões:ventilações)\n7. Minimizar interrupções\n8. Trocar socorrista a cada 2 min\n9. DEA assim que disponível\n\nNão pare até:\n• Retorno da circulação\n• Equipe especializada assumir\n• Exaustão física\n• Ordem médica',
        
        'lavagem': 'Lavagem das Mãos:\n\nSimples (40-60 seg):\n1. Molhe as mãos\n2. Aplique sabão\n3. Ensaboe palmas\n4. Palma direita sobre dorso esquerdo\n5. Palma esquerda sobre dorso direito\n6. Entrelace os dedos\n7. Esfregue polegares\n8. Esfregue pontas dos dedos\n9. Esfregue punhos\n10. Enxágue e seque\n\nÁlcool gel: mesma técnica, 20-30 seg',
        
        'ppe': 'EPI - Equipamento de Proteção Individual:\n\nSequência de Colocação:\n1. Higienize as mãos\n2. Avental\n3. Máscara/respirador\n4. Óculos/face shield\n5. Luvas\n\nSequência de Retirada:\n1. Luvas\n2. Higienize as mãos\n3. Óculos/face shield\n4. Avental\n5. Higienize as mãos\n6. Máscara\n7. Higienize as mãos',
        
        'vacina': 'Vacinação:\n\nVias:\n• IM: deltoide, vasto lateral (90°)\n• SC: região deltóidea, face anterior coxa (45°)\n• ID: face anterior antebraço (15°)\n• VO: oral\n\nCuidados:\n• Verificar validade e conservação\n• Assepsia do local\n• Aspirar antes de injetar (IM)\n• Não massagear após aplicação\n• Registrar: data, lote, via, local\n• Orientar sobre reações',
        
        'glicemia': 'Glicemia Capilar:\n\nTécnica:\n1. Higienize as mãos\n2. Prepare o glicosímetro\n3. Faça antissepsia do dedo\n4. Aguarde secar\n5. Puncione lateral do dedo\n6. Descarte primeira gota\n7. Aplique sangue na fita\n8. Aguarde resultado\n9. Faça hemostasia\n10. Registre\n\nValores:\n• Jejum: 70-100 mg/dL\n• Pós-prandial: <140 mg/dL\n• Hipoglicemia: <70 mg/dL\n• Hiperglicemia: >180 mg/dL',
        
        'ecg': 'ECG - Eletrocardiograma:\n\nDerivações:\n• V1: 4º EIC direito, paraesternal\n• V2: 4º EIC esquerdo, paraesternal\n• V3: entre V2 e V4\n• V4: 5º EIC esquerdo, linha hemiclavicular\n• V5: 5º EIC esquerdo, linha axilar anterior\n• V6: 5º EIC esquerdo, linha axilar média\n\nMembros:\n• Vermelho: braço direito\n• Amarelo: braço esquerdo\n• Verde: perna esquerda\n• Preto: perna direita',
        
        'sng': 'Sonda Nasogástrica (SNG):\n\nIndicações:\n• Nutrição enteral\n• Descompressão gástrica\n• Lavagem gástrica\n• Administração de medicamentos\n\nTécnica:\n1. Medir: nariz-orelha-apêndice xifoide\n2. Lubrificar sonda\n3. Introduzir pela narina\n4. Pedir para deglutir\n5. Verificar posicionamento\n6. Fixar adequadamente\n\nTeste: aspirar conteúdo gástrico ou ausculta',
        
        'inalação': 'Inalação/Nebulização:\n\nIndicações:\n• Broncoespasmo\n• Secreção espessa\n• Hidratação de vias aéreas\n\nTécnica:\n1. Higienize as mãos\n2. Prepare medicação prescrita\n3. Adicione SF 0,9% (3-5ml)\n4. Conecte máscara/bocal\n5. Ligue nebulizador (6-8 L/min)\n6. Oriente respiração lenta e profunda\n7. Duração: 10-15 min\n8. Higienize equipamento',
        
        'precaução': 'Precauções:\n\nPadrão (todos os pacientes):\n• Higiene das mãos\n• Luvas se contato com fluidos\n• EPI conforme risco\n\nContato:\n• Avental e luvas\n• Ex: MRSA, C. difficile\n\nGotículas:\n• Máscara cirúrgica\n• Ex: Influenza, meningite\n\nAerossol:\n• N95/PFF2\n• Quarto com pressão negativa\n• Ex: Tuberculose, COVID-19, sarampo',
        
        'dor': 'Avaliação da Dor:\n\nEscalas:\n• Numérica: 0-10\n• Visual analógica: linha\n• Faces: Wong-Baker\n• CPOT: paciente crítico\n\nCaracterísticas (PQRST):\n• P: Provocação/Paliação\n• Q: Qualidade\n• R: Região/Irradiação\n• S: Severidade (0-10)\n• T: Tempo/Duração\n\nRegistrar sempre: localização, intensidade, característica, fatores de melhora/piora',
        
        'ciclo cardíaco': 'Ciclo Cardíaco:\n\n1. DIÁSTOLE (Relaxamento):\n• Átrios e ventrículos relaxados\n• Sangue entra nos átrios\n• Válvulas AV abertas (mitral e tricúspide)\n• Válvulas semilunares fechadas\n• Enchimento ventricular passivo (70%)\n\n2. SÍSTOLE ATRIAL:\n• Contração dos átrios\n• Enchimento ventricular ativo (30%)\n• Completa enchimento dos ventrículos\n\n3. SÍSTOLE VENTRICULAR:\n• Contração dos ventrículos\n• Válvulas AV fecham (1ª bulha - TUM)\n• Pressão aumenta nos ventrículos\n• Válvulas semilunares abrem\n• Ejeção do sangue\n• Válvulas semilunares fecham (2ª bulha - TÁ)\n\nDébito Cardíaco = FC × Volume Sistólico',
        
        'icc': 'Insuficiência Cardíaca Congestiva (ICC):\n\nDefinição: Incapacidade do coração bombear sangue adequadamente.\n\nTipos:\n• ICC Esquerda: congestão pulmonar\n• ICC Direita: congestão sistêmica\n• ICC Biventricular: ambos\n\nSinais e Sintomas:\nEsquerda:\n• Dispneia, ortopneia\n• Tosse seca noturna\n• Crepitações pulmonares\n• Fadiga\n\nDireita:\n• Edema MMII\n• Hepatomegalia\n• Turgência jugular\n• Ascite\n\nTratamento:\n• Diuréticos\n• IECA/BRA\n• Beta-bloqueadores\n• Restrição hídrica e sódio\n• Monitorar peso diário',
        
        'iam': 'Infarto Agudo do Miocárdio (IAM):\n\nDefinição: Necrose do músculo cardíaco por falta de oxigênio.\n\nSinais Clássicos:\n• Dor precordial intensa (>20 min)\n• Irradiação: braço E, mandíbula, dorso\n• Sudorese fria\n• Náuseas/vômitos\n• Dispneia\n• Ansiedade (sensação de morte)\n\nDiagnóstico:\n• ECG: supra ST, onda Q\n• Troponina elevada\n• CK-MB elevada\n\nTratamento (Tempo = Músculo!):\n• AAS 200mg (mastigar)\n• Oxigênio se SpO₂ <90%\n• Morfina (dor)\n• Nitroglicerina\n• Angioplastia ou trombolítico\n• Monitorização contínua\n\nCuidados:\n• Repouso absoluto\n• Dieta leve\n• Controle ansiedade\n• Prevenir complicações',
        
        'avc': 'AVC - Acidente Vascular Cerebral:\n\nTipos:\n• Isquêmico (80%): obstrução\n• Hemorrágico (20%): ruptura\n\nSinais (SAMU):\n• S: Sorriso - desvio de rima\n• A: Abraço - fraqueza em membros\n• M: Música - fala arrastada\n• U: Urgência - ligar 192\n\nOutros sinais:\n• Perda súbita de força\n• Alteração visual\n• Cefaleia intensa\n• Tontura, desequilíbrio\n• Confusão mental\n\nJanela Terapêutica:\n• Trombolítico: até 4,5h\n• Trombectomia: até 24h\n\nCuidados:\n• Cabeceira 30°\n• Jejum (risco aspiração)\n• Monitorar PA\n• Glicemia\n• Avaliar deglutição\n• Prevenir úlceras pressão',
        
        'pneumonia': 'Pneumonia:\n\nDefinição: Infecção do parênquima pulmonar.\n\nSinais e Sintomas:\n• Febre alta\n• Tosse produtiva\n• Dispneia\n• Dor torácica pleurítica\n• Taquipneia\n• Crepitações\n• Expectoração purulenta\n\nDiagnóstico:\n• Raio-X: infiltrado\n• Ausculta: crepitações\n• Leucocitose\n• Cultura escarro\n\nTratamento:\n• Antibiótico (conforme agente)\n• Hidratação\n• Oxigenoterapia\n• Fisioterapia respiratória\n• Repouso\n\nCuidados:\n• Cabeceira elevada\n• Higiene oral\n• Aspiração se necessário\n• Monitorar SpO₂\n• Incentivar tosse',
        
        'dpoc': 'DPOC - Doença Pulmonar Obstrutiva Crônica:\n\nDefinição: Obstrução crônica das vias aéreas (enfisema + bronquite).\n\nSinais:\n• Dispneia progressiva\n• Tosse crônica\n• Expectoração\n• Sibilos\n• Tórax em barril\n• Uso musculatura acessória\n\nFatores de Risco:\n• Tabagismo (principal)\n• Poluição\n• Exposição ocupacional\n\nTratamento:\n• Broncodilatadores\n• Corticoides inalatórios\n• Oxigenoterapia (cuidado!)\n• Cessação tabagismo\n• Vacinação\n• Reabilitação pulmonar\n\nCuidados:\n• O₂ baixo fluxo (1-3L/min)\n• Monitorar SpO₂ (88-92%)\n• Fisioterapia respiratória\n• Nutrição adequada',
        
        'choque': 'Choque:\n\nDefinição: Perfusão tecidual inadequada.\n\nTipos:\n\n1. HIPOVOLÊMICO:\n• Causa: hemorragia, desidratação\n• Sinais: PA↓, FC↑, pele fria\n• Tratamento: reposição volêmica\n\n2. CARDIOGÊNICO:\n• Causa: IAM, ICC grave\n• Sinais: congestão pulmonar\n• Tratamento: inotrópicos\n\n3. DISTRIBUTIVO:\n• Séptico: infecção\n• Anafilático: alergia\n• Neurogênico: lesão medular\n• Sinais: vasodilatação\n• Tratamento: vasopressores\n\n4. OBSTRUTIVO:\n• Causa: TEP, tamponamento\n• Tratamento: remover obstrução\n\nSinais Gerais:\n• PA sistólica <90 mmHg\n• FC >100 bpm\n• Pele fria, pegajosa\n• Oligúria\n• Alteração consciência\n• Lactato elevado',
        
        'queimadura': 'Queimaduras:\n\nClassificação por Profundidade:\n\n1º GRAU:\n• Epiderme\n• Vermelhidão, dor\n• Sem bolhas\n• Cura: 3-6 dias\n\n2º GRAU:\n• Epiderme + derme\n• Bolhas, dor intensa\n• Superficial ou profunda\n• Cura: 7-21 dias\n\n3º GRAU:\n• Todas camadas\n• Branca/carbonizada\n• Sem dor (nervos destruídos)\n• Necessita enxerto\n\nRegra dos 9 (adulto):\n• Cabeça: 9%\n• Tronco anterior: 18%\n• Tronco posterior: 18%\n• Braço: 9% cada\n• Perna: 18% cada\n• Períneo: 1%\n\nPrimeiros Socorros:\n• Resfriar com água corrente (10-20 min)\n• Não usar gelo\n• Não furar bolhas\n• Cobrir com pano limpo\n• Não passar pasta de dente, manteiga, etc\n\nTratamento:\n• Reposição hídrica (Parkland)\n• Analgesia\n• Curativo apropriado\n• Prevenir infecção\n• Suporte nutricional',
        
        'calculo medicação': 'Cálculos de Medicação:\n\n1. REGRA DE TRÊS:\nTenho : Quero = Tem : X\n\nExemplo: Prescrito 500mg, ampola tem 1g/2ml\n1000mg : 500mg = 2ml : X\nX = 1ml\n\n2. GOTEJAMENTO:\nGotas/min = (Volume × 20) ÷ Tempo(h)\nMicrogotas/min = Volume ÷ Tempo(h)\n\nExemplo: 1000ml SF em 8h\nGotas = (1000 × 20) ÷ 8 = 42 gts/min\nMicrogotas = 1000 ÷ 8 = 125 mcgts/min\n\n3. DILUIÇÃO:\nConcentração = Dose ÷ Volume\n\n4. DOSE POR PESO:\nDose = Peso(kg) × Dose/kg\n\nExemplo: 10mg/kg para 70kg\nDose = 70 × 10 = 700mg\n\n5. VELOCIDADE INFUSÃO:\nml/h = Volume total ÷ Tempo(h)\n\nDicas:\n• Sempre conferir unidades\n• 1g = 1000mg\n• 1mg = 1000mcg\n• 1ml = 20 gotas = 60 microgotas',
        
        'hemodiálise': 'Hemodiálise:\n\nIndicações:\n• Insuficiência renal crônica\n• IRA grave\n• Intoxicações\n• Hipercalemia grave\n• Acidose metabólica\n• Sobrecarga hídrica\n\nAcesso Vascular:\n• FAV (fístula arteriovenosa) - preferencial\n• Cateter duplo lúmen\n\nCuidados Pré-Diálise:\n• Verificar sinais vitais\n• Pesar paciente\n• Avaliar acesso vascular\n• Não puncionar braço da FAV\n• Não aferir PA no braço da FAV\n• Jejum não obrigatório\n\nCuidados Durante:\n• Monitorar PA, FC\n• Observar sinais hipotensão\n• Náuseas, vômitos\n• Cãibras\n• Sangramento\n\nCuidados Pós:\n• Pesar novamente\n• Verificar sinais vitais\n• Hemostasia do acesso\n• Observar sangramento\n• Orientar repouso\n\nCuidados com FAV:\n• Auscultar frêmito\n• Não comprimir\n• Não puncionar\n• Não aferir PA\n• Observar sinais infecção',
        
        'parto': 'Assistência ao Parto:\n\nPeríodos do Parto:\n\n1º PERÍODO (Dilatação):\n• Fase latente: 0-4cm\n• Fase ativa: 4-10cm\n• Contrações regulares\n• Cuidados: deambulação, hidratação, alívio dor\n\n2º PERÍODO (Expulsão):\n• Dilatação completa até nascimento\n• Puxos (força materna)\n• Coroamento\n• Nascimento\n\n3º PERÍODO (Dequitação):\n• Expulsão da placenta\n• Até 30 minutos\n• Verificar integridade placenta\n\n4º PERÍODO (Greenberg):\n• Primeira hora pós-parto\n• Risco hemorragia\n• Monitorização rigorosa\n\nCuidados Imediatos RN:\n• Secar e aquecer\n• Clampeamento cordão (1-3 min)\n• APGAR (1 e 5 min)\n• Contato pele a pele\n• Amamentação 1ª hora\n• Vitamina K IM\n• Credé (nitrato prata)\n• Identificação\n\nSinais Alerta:\n• Sangramento excessivo\n• Hipotonia uterina\n• Alteração sinais vitais\n• Descolamento prematuro placenta',
        
        'aleitamento': 'Aleitamento Materno:\n\nBenefícios:\n• Nutrição completa até 6 meses\n• Proteção imunológica\n• Vínculo mãe-bebê\n• Reduz mortalidade infantil\n• Econômico\n\nTécnica Correta:\n• Pega: boca aberta, aréola na boca\n• Posição: barriga com barriga\n• Nariz livre\n• Queixo toca mama\n• Lábios evertidos\n\nPosições:\n• Tradicional (sentada)\n• Cavalinho\n• Deitada\n• Invertida (futebol americano)\n\nLivre Demanda:\n• Sem horários fixos\n• Sempre que bebê quiser\n• Mínimo 8-12x/dia\n• Esvaziar uma mama antes\n\nProblemas Comuns:\n\nFISSURAS:\n• Causa: pega incorreta\n• Tratamento: corrigir pega, próprio leite\n\nINGURGITAMENTO:\n• Causa: acúmulo leite\n• Tratamento: ordenha, compressas\n\nMASTITE:\n• Sinais: febre, dor, vermelhidão\n• Tratamento: antibiótico, continuar amamentar\n\nContraindicações:\n• HIV positivo\n• HTLV\n• Drogas ilícitas\n• Alguns medicamentos',
        
        'pediatria': 'Cuidados Pediátricos:\n\nSinais Vitais Normais:\n\nRECÉM-NASCIDO:\n• FC: 120-160 bpm\n• FR: 30-60 irpm\n• PA: 60-90/30-60 mmHg\n• Temp: 36,5-37,5°C\n\nLACTENTE (1-12 meses):\n• FC: 100-160 bpm\n• FR: 25-40 irpm\n• PA: 80-100/55-65 mmHg\n\nPRÉ-ESCOLAR (1-5 anos):\n• FC: 90-140 bpm\n• FR: 20-30 irpm\n• PA: 95-105/60-70 mmHg\n\nESCOLAR (6-12 anos):\n• FC: 70-120 bpm\n• FR: 18-25 irpm\n• PA: 100-120/60-75 mmHg\n\nDesidratação Infantil:\n\nLEVE (5%):\n• Sede, mucosas secas\n• TEC <2 seg\n\nMODERADA (10%):\n• Olhos fundos\n• Fontanela deprimida\n• TEC 2-3 seg\n• Oligúria\n\nGRAVE (15%):\n• Letargia\n• TEC >3 seg\n• Pulso fraco\n• Anúria\n• Choque\n\nTratamento:\n• Leve: TRO (soro caseiro)\n• Moderada/Grave: hidratação EV',
        
        'idoso': 'Cuidados Geriátricos:\n\nAlterações do Envelhecimento:\n\nCARDIOVASCULAR:\n• Rigidez arterial\n• Hipertensão\n• Arritmias\n\nRESPIRATÓRIO:\n• Capacidade vital↓\n• Risco pneumonia\n\nRENAL:\n• Filtração glomerular↓\n• Risco desidratação\n\nMUSCULOESQUELÉTICO:\n• Sarcopenia\n• Osteoporose\n• Risco quedas\n\nNEUROLÓGICO:\n• Memória↓\n• Reflexos↓\n• Risco demência\n\nSíndromes Geriátricas:\n\n1. IMOBILIDADE:\n• Úlceras pressão\n• Trombose\n• Pneumonia\n• Prevenção: mobilização\n\n2. INSTABILIDADE:\n• Quedas frequentes\n• Fraturas\n• Prevenção: ambiente seguro\n\n3. INCONTINÊNCIA:\n• Urinária/fecal\n• Impacto social\n• Cuidados: higiene, hidratação\n\n4. INSUFICIÊNCIA COGNITIVA:\n• Demência\n• Delirium\n• Depressão\n\n5. IATROGENIA:\n• Polifarmácia\n• Reações adversas\n• Revisar medicações\n\nPrevenção Quedas:\n• Iluminação adequada\n• Barras apoio\n• Piso antiderrapante\n• Calçados adequados\n• Óculos corretos\n• Revisar medicações',
        
        // ========== FARMACOLOGIA AVANÇADA ==========
        
        'dipirona': 'DIPIRONA (Metamizol):\n\nClasse: Analgésico e antipirético\n\nIndicações:\n• Dor leve a moderada\n• Febre\n• Cólicas\n\nDoses:\n• Adulto: 500-1000mg VO/EV 6/6h\n• Máximo: 4g/dia\n• Criança: 10-15mg/kg/dose\n\nVia EV:\n• Diluir em 100ml SF 0,9%\n• Infundir em 20-30 min\n• NUNCA em bolus (risco choque)\n\nEfeitos Adversos:\n• Hipotensão (EV rápido)\n• Agranulocitose (raro)\n• Reações alérgicas\n\nContraindicações:\n• Alergia conhecida\n• Porfiria\n• Deficiência G6PD\n\nCuidados:\n• Monitorar PA se EV\n• Infusão lenta\n• Observar reações',
        
        'paracetamol': 'PARACETAMOL (Acetaminofeno):\n\nClasse: Analgésico e antipirético\n\nIndicações:\n• Dor leve a moderada\n• Febre\n\nDoses:\n• Adulto: 500-1000mg VO 6/6h\n• Máximo: 4g/dia (3g se hepatopata)\n• Criança: 10-15mg/kg/dose 4/6h\n\nApresentações:\n• Comprimido 500mg, 750mg\n• Solução oral 200mg/ml\n• EV 1g/100ml\n\nEfeitos Adversos:\n• Hepatotoxicidade (overdose)\n• Raros: reações alérgicas\n\nIntoxicação:\n• >150mg/kg = tóxico\n• Sintomas: náuseas, vômitos\n• Antídoto: N-acetilcisteína\n• Janela: até 8h\n\nContraindicações:\n• Hepatopatia grave\n• Alcoolismo\n\nCuidados:\n• Não exceder dose máxima\n• Atenção em hepatopatas\n• Verificar outros medicamentos com paracetamol',
        
        'omeprazol': 'OMEPRAZOL:\n\nClasse: Inibidor da bomba de prótons (IBP)\n\nIndicações:\n• DRGE (refluxo)\n• Úlcera gástrica/duodenal\n• Gastrite\n• Prevenção úlcera por AINE\n• Erradicação H. pylori\n\nDoses:\n• DRGE: 20mg 1x/dia\n• Úlcera: 20-40mg 1x/dia\n• H. pylori: 20mg 2x/dia + antibióticos\n\nAdministração:\n• Tomar em jejum (30 min antes café)\n• Não mastigar cápsula\n• Se SNG: abrir cápsula, diluir em água\n\nEfeitos Adversos:\n• Cefaleia\n• Diarreia/constipação\n• Náuseas\n• Uso prolongado: ↓B12, ↓magnésio, ↑risco fratura\n\nInterações:\n• ↓absorção: cetoconazol, ferro\n• ↑efeito: clopidogrel, varfarina\n\nCuidados:\n• Uso máximo: 8 semanas (sem indicação)\n• Desmame gradual\n• Monitorar B12 se uso prolongado',
        
        'captopril': 'CAPTOPRIL:\n\nClasse: IECA (Inibidor ECA)\n\nIndicações:\n• Hipertensão arterial\n• Insuficiência cardíaca\n• Pós-IAM\n• Nefropatia diabética\n\nDoses:\n• Inicial: 12,5-25mg 2-3x/dia\n• Manutenção: 25-50mg 2-3x/dia\n• Máximo: 150mg/dia\n\nAdministração:\n• 1h antes ou 2h após refeições\n• Iniciar dose baixa\n• Titular gradualmente\n\nEfeitos Adversos:\n• Tosse seca (10-20%)\n• Hipotensão (1ª dose)\n• Hipercalemia\n• Angioedema (raro, grave)\n• ↑creatinina\n\nContraindicações:\n• Gravidez (teratogênico)\n• Estenose renal bilateral\n• Angioedema prévio\n• Hipercalemia\n\nCuidados:\n• Monitorar PA, K+, creatinina\n• Cuidado em idosos\n• Orientar sobre tosse\n• Suspender se gravidez',
        
        'losartana': 'LOSARTANA:\n\nClasse: BRA (Bloqueador receptor AT1)\n\nIndicações:\n• Hipertensão arterial\n• ICC\n• Nefropatia diabética\n• Alternativa ao IECA (tosse)\n\nDoses:\n• Inicial: 25-50mg 1x/dia\n• Manutenção: 50-100mg 1x/dia\n• Máximo: 100mg/dia\n\nVantagens sobre IECA:\n• Não causa tosse\n• Melhor tolerado\n• Mesma eficácia\n\nEfeitos Adversos:\n• Tontura\n• Hipercalemia\n• ↑creatinina\n• Hipotensão\n\nContraindicações:\n• Gravidez\n• Estenose renal bilateral\n• Hipercalemia\n\nCuidados:\n• Monitorar PA, K+, creatinina\n• Hidratação adequada\n• Cuidado com diuréticos poupadores K+',
        
        'furosemida': 'FUROSEMIDA (Lasix):\n\nClasse: Diurético de alça\n\nIndicações:\n• Edema (ICC, cirrose, renal)\n• Hipertensão\n• Edema agudo pulmão\n\nDoses:\n• VO: 20-80mg/dia\n• EV: 20-40mg (bolus lento)\n• Máximo: 600mg/dia\n\nAdministração EV:\n• Bolus: 2-4 min (máx 4mg/min)\n• Infusão contínua: 5-10mg/h\n\nEfeitos Adversos:\n• Hipocalemia (principal)\n• Hiponatremia\n• Hipomagnesemia\n• Desidratação\n• Ototoxicidade (dose alta)\n• Hiperuricemia\n\nMonitorização:\n• Eletrólitos (K+, Na+, Mg++)\n• Função renal\n• Balanço hídrico\n• Peso diário\n• PA\n\nCuidados:\n• Repor K+ se necessário\n• Administrar pela manhã\n• Monitorar diurese\n• Cuidado em idosos',
        
        'insulina': 'INSULINA:\n\nTipos:\n\n1. ULTRARRÁPIDA (Lispro, Aspart):\n• Início: 5-15 min\n• Pico: 1-2h\n• Duração: 3-5h\n• Uso: antes refeições\n\n2. RÁPIDA (Regular):\n• Início: 30 min\n• Pico: 2-4h\n• Duração: 6-8h\n• Uso: 30 min antes refeição, EV\n\n3. INTERMEDIÁRIA (NPH):\n• Início: 1-2h\n• Pico: 4-8h\n• Duração: 12-18h\n• Uso: basal\n\n4. LENTA (Glargina, Detemir):\n• Início: 1-2h\n• Sem pico\n• Duração: 24h\n• Uso: basal\n\nVias:\n• SC: abdome (mais rápida), coxa, braço\n• EV: apenas regular\n• Rodízio de locais\n\nDoses:\n• Individualizada\n• Esquema basal-bolus comum\n\nHipoglicemia:\n• Glicemia <70 mg/dL\n• Sintomas: sudorese, tremor, confusão\n• Tratamento: 15g carboidrato\n\nCuidados:\n• Armazenar 2-8°C\n• Após aberto: temperatura ambiente 28 dias\n• Não agitar\n• Verificar aspecto\n• Técnica correta aplicação',
        
        'heparina': 'HEPARINA:\n\nTipos:\n\n1. NÃO-FRACIONADA (HNF):\n• Via: EV ou SC\n• Monitorização: TTPa\n• Reversão: protamina\n• Uso: TEP, TVP, SCA\n\nDose EV:\n• Ataque: 80 UI/kg bolus\n• Manutenção: 18 UI/kg/h\n• Ajustar por TTPa (1,5-2,5x controle)\n\n2. BAIXO PESO MOLECULAR (Enoxaparina):\n• Via: SC\n• Não precisa monitorar\n• Dose: 1mg/kg 12/12h ou 1,5mg/kg 1x/dia\n• Melhor que HNF\n\nIndicações:\n• Trombose venosa profunda\n• Embolia pulmonar\n• Síndrome coronariana aguda\n• Prevenção trombose\n• Hemodiálise\n\nEfeitos Adversos:\n• Sangramento (principal)\n• Trombocitopenia induzida (HIT)\n• Osteoporose (uso prolongado)\n\nContraindicações:\n• Sangramento ativo\n• Trombocitopenia\n• Cirurgia recente SNC\n\nCuidados:\n• Monitorar plaquetas\n• Observar sangramentos\n• Não massagear local SC\n• Protamina disponível',
        
        'varfarina': 'VARFARINA (Marevan):\n\nClasse: Anticoagulante oral\n\nIndicações:\n• Fibrilação atrial\n• Prótese valvar\n• TVP/TEP (manutenção)\n• Prevenção trombose\n\nDose:\n• Inicial: 5mg/dia\n• Ajustar por INR\n• Individualizada\n\nINR Alvo:\n• FA, TVP: 2-3\n• Prótese mecânica: 2,5-3,5\n\nMonitorização:\n• INR semanal (início)\n• INR mensal (estável)\n\nEfeitos Adversos:\n• Sangramento\n• Necrose cutânea (raro)\n• Teratogênico\n\nInterações (MUITAS!):\n• ↑INR: antibióticos, amiodarona, omeprazol\n• ↓INR: rifampicina, carbamazepina\n• Alimentos: vitamina K (↓INR)\n\nReversão:\n• INR alto sem sangramento: suspender\n• Sangramento: vitamina K EV + plasma\n• Emergência: concentrado protrombina\n\nCuidados:\n• Dieta constante vitamina K\n• Evitar IM\n• Cartão anticoagulação\n• Orientar sinais sangramento',
        
        'adrenalina': 'ADRENALINA (Epinefrina):\n\nIndicações:\n• PCR (1mg EV 3-5 min)\n• Anafilaxia (0,3-0,5mg IM)\n• Broncoespasmo grave\n• Choque\n\nDoses PCR:\n• 1mg (1ml 1:1000) EV\n• Repetir 3-5 min\n• Infusão: 2-10 mcg/min\n\nDoses Anafilaxia:\n• 0,3-0,5mg IM (coxa)\n• Repetir 5-15 min se necessário\n• Criança: 0,01mg/kg\n\nApresentações:\n• 1:1000 (1mg/ml) - IM, SC\n• 1:10000 (0,1mg/ml) - EV\n\nEfeitos:\n• Taquicardia\n• Hipertensão\n• Tremor\n• Ansiedade\n• Arritmias\n\nCuidados:\n• Verificar diluição\n• Monitorar ECG, PA\n• Acesso venoso calibroso\n• Não misturar com bicarbonato',
        
        'atropina': 'ATROPINA:\n\nClasse: Anticolinérgico\n\nIndicações:\n• Bradicardia sintomática\n• Intoxicação organofosforados\n• Pré-anestésico\n• Antídoto colinérgicos\n\nDoses:\n• Bradicardia: 0,5mg EV (repetir até 3mg)\n• Intoxicação: 2-5mg EV (repetir)\n• Mínimo: 0,5mg (evitar bradicardia paradoxal)\n\nEfeitos:\n• Taquicardia\n• Midríase\n• Boca seca\n• Retenção urinária\n• Confusão (idosos)\n\nContraindicações:\n• Glaucoma ângulo fechado\n• Taquiarritmias\n• Obstrução intestinal\n\nCuidados:\n• Dose mínima 0,5mg\n• Monitorar FC\n• Cuidado em idosos\n• Pode piorar taquicardia',
        
        'morfina': 'MORFINA:\n\nClasse: Opioide forte\n\nIndicações:\n• Dor intensa\n• IAM (dor + ansiedade)\n• Edema agudo pulmão\n• Dor oncológica\n\nDoses:\n• EV: 2-5mg (diluir, lento)\n• SC: 5-10mg\n• VO: 10-30mg 4/4h\n• Titular conforme dor\n\nAdministração EV:\n• Diluir em 10ml SF\n• Infundir 2-5 min\n• Repetir 5-15 min\n\nEfeitos Adversos:\n• Depressão respiratória\n• Náuseas/vômitos\n• Constipação\n• Sonolência\n• Prurido\n• Hipotensão\n\nAntídoto:\n• Naloxona 0,4mg EV\n• Repetir 2-3 min\n• Duração curta (vigilância)\n\nContraindicações:\n• Depressão respiratória\n• Íleo paralítico\n• Trauma craniano\n\nCuidados:\n• Monitorar FR, SpO₂\n• Naloxona disponível\n• Laxante profilático\n• Antiemético se necessário\n• Controle especial (receita A)',
        
        'amiodarona': 'AMIODARONA:\n\nClasse: Antiarrítmico classe III\n\nIndicações:\n• Fibrilação/flutter atrial\n• Taquicardia ventricular\n• PCR (FV/TV sem pulso)\n• Prevenção arritmias\n\nDoses:\n• PCR: 300mg EV bolus (1ª dose)\n• PCR: 150mg EV (2ª dose)\n• Arritmia estável: 150mg EV 10 min\n• Manutenção: 1mg/min 6h, depois 0,5mg/min\n• VO: 200-400mg/dia\n\nAdministração:\n• Diluir em SG 5%\n• Acesso central (preferencial)\n• Infusão lenta\n• Proteger da luz\n\nEfeitos Adversos:\n• Bradicardia\n• Hipotensão\n• Flebite (periférico)\n• Toxicidade pulmonar\n• Disfunção tireóide\n• Fotossensibilidade\n• Depósitos corneanos\n\nInterações:\n• Potencializa: digoxina, varfarina\n• Prolonga QT\n\nMonitorização:\n• ECG, PA\n• TSH (6 meses)\n• Raio-X tórax\n• Função hepática\n\nCuidados:\n• Acesso calibroso\n• Monitorar PA\n• Protetor solar\n• Não suspender abruptamente',
    };
    
    // Sistema de busca inteligente - procura em todas as chaves
    let bestMatch = null;
    let maxMatches = 0;
    
    for (let key in knowledgeBase) {
        const keyWords = key.split(' ');
        let matches = 0;
        
        keyWords.forEach(word => {
            if (q.includes(word.toLowerCase())) {
                matches++;
            }
        });
        
        if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = key;
        }
    }
    
    if (bestMatch && maxMatches > 0) {
        return knowledgeBase[bestMatch];
    }
    
    // Busca por sinônimos e termos relacionados
    const synonyms = {
        'coração': ['cardíaco', 'cardio', 'coração'],
        'pulmão': ['pulmonar', 'respiratório', 'pulmão'],
        'rim': ['renal', 'rim', 'rins'],
        'cérebro': ['cerebral', 'neurológico', 'cérebro'],
        'infarto': ['iam', 'infarto', 'ataque cardíaco'],
        'derrame': ['avc', 'derrame', 'acidente vascular'],
        'pressão': ['pa', 'pressão arterial', 'hipertensão'],
        'açúcar': ['glicemia', 'diabetes', 'açúcar no sangue'],
        'dipirona': ['novalgina', 'metamizol', 'dipirona'],
        'paracetamol': ['tylenol', 'acetaminofeno', 'paracetamol'],
        'omeprazol': ['omeprazol', 'inibidor bomba', 'protetor gástrico'],
        'captopril': ['captopril', 'ieca', 'capoten'],
        'losartana': ['losartana', 'losartan', 'bra'],
        'furosemida': ['lasix', 'furosemida', 'diurético'],
        'insulina': ['insulina', 'diabetes'],
        'heparina': ['heparina', 'anticoagulante', 'enoxaparina'],
        'varfarina': ['marevan', 'varfarina', 'coumadin'],
        'adrenalina': ['epinefrina', 'adrenalina'],
        'atropina': ['atropina'],
        'morfina': ['morfina', 'opioide'],
        'amiodarona': ['amiodarona', 'ancoron'],
    };
    
    for (let term in synonyms) {
        if (synonyms[term].some(syn => q.includes(syn))) {
            for (let key in knowledgeBase) {
                if (key.includes(term) || synonyms[term].some(syn => key.includes(syn))) {
                    return knowledgeBase[key];
                }
            }
        }
    }
    
    // Respostas contextuais inteligentes
    if (q.includes('diferença') || q.includes('diferenca')) {
        if (q.includes('icc') && q.includes('iam')) {
            return '🔍 DIFERENÇA ENTRE ICC E IAM:\n\n' +
                   '📌 ICC (Insuficiência Cardíaca):\n' +
                   '• Condição CRÔNICA\n' +
                   '• Coração fraco, não bombeia bem\n' +
                   '• Sintomas: cansaço, falta de ar, edema\n' +
                   '• Evolução gradual\n\n' +
                   '📌 IAM (Infarto):\n' +
                   '• Evento AGUDO\n' +
                   '• Obstrução coronária, morte tecido\n' +
                   '• Sintomas: dor intensa súbita\n' +
                   '• Emergência médica!\n\n' +
                   '💡 IAM pode CAUSAR ICC se não tratado!';
        }
        if (q.includes('heparina') || (q.includes('varfarina') && q.includes('heparina'))) {
            return '🔍 DIFERENÇA ENTRE HEPARINA E VARFARINA:\n\n' +
                   '📌 HEPARINA:\n' +
                   '• Via: EV ou SC\n' +
                   '• Início: IMEDIATO\n' +
                   '• Uso: AGUDO (hospitalar)\n' +
                   '• Monitorar: TTPa\n' +
                   '• Reversão: Protamina\n\n' +
                   '📌 VARFARINA:\n' +
                   '• Via: VO (oral)\n' +
                   '• Início: 2-3 dias\n' +
                   '• Uso: CRÔNICO (casa)\n' +
                   '• Monitorar: INR\n' +
                   '• Reversão: Vitamina K\n\n' +
                   '💡 Geralmente inicia com heparina e depois troca para varfarina!';
        }
    }
    
    if (q.includes('como calcular') || q.includes('calculo') || q.includes('cálculo')) {
        return knowledgeBase['calculo medicação'];
    }
    
    // Perguntas sobre "que remédio tomar"
    if (q.includes('que remedio') || q.includes('que remédio') || q.includes('qual medicamento') || q.includes('qual remedio')) {
        if (q.includes('dor') && !q.includes('forte')) {
            return '💊 MEDICAMENTOS PARA DOR LEVE/MODERADA:\n\n' +
                   '1. DIPIRONA (Novalgina):\n' +
                   '• Dose: 500-1000mg 6/6h\n' +
                   '• Boa para dor e febre\n' +
                   '• Cuidado: hipotensão se EV rápido\n\n' +
                   '2. PARACETAMOL (Tylenol):\n' +
                   '• Dose: 500-1000mg 6/6h\n' +
                   '• Seguro, poucos efeitos\n' +
                   '• Cuidado: hepatotoxicidade em overdose\n\n' +
                   '3. IBUPROFENO:\n' +
                   '• Dose: 400-600mg 8/8h\n' +
                   '• Anti-inflamatório\n' +
                   '• Cuidado: gastrite, renal\n\n' +
                   '⚠️ SEMPRE prescrição médica!\n' +
                   '⚠️ Respeitar dose máxima!\n' +
                   '⚠️ Avaliar contraindicações!';
        }
        if (q.includes('dor forte') || q.includes('dor intensa')) {
            return '💊 MEDICAMENTOS PARA DOR FORTE:\n\n' +
                   '1. TRAMADOL:\n' +
                   '• Opioide fraco\n' +
                   '• Dose: 50-100mg 6/6h\n' +
                   '• Receita B (controle)\n\n' +
                   '2. MORFINA:\n' +
                   '• Opioide forte\n' +
                   '• Dose: 5-10mg SC/EV\n' +
                   '• Receita A (controle especial)\n' +
                   '• Monitorar respiração\n\n' +
                   '3. CODEÍNA:\n' +
                   '• Opioide fraco\n' +
                   '• Dose: 30-60mg 4/6h\n' +
                   '• Receita B\n\n' +
                   '⚠️ OPIOIDES:\n' +
                   '• Risco dependência\n' +
                   '• Depressão respiratória\n' +
                   '• Constipação\n' +
                   '• Naloxona como antídoto\n' +
                   '• SEMPRE prescrição médica!';
        }
        if (q.includes('pressão alta') || q.includes('hipertensão') || q.includes('hipertensao')) {
            return '💊 MEDICAMENTOS PARA HIPERTENSÃO:\n\n' +
                   '1. CAPTOPRIL (IECA):\n' +
                   '• Dose: 25-50mg 2-3x/dia\n' +
                   '• Efeito: tosse seca comum\n' +
                   '• Protege rim e coração\n\n' +
                   '2. LOSARTANA (BRA):\n' +
                   '• Dose: 50-100mg 1x/dia\n' +
                   '• Não causa tosse\n' +
                   '• Alternativa ao IECA\n\n' +
                   '3. ANLODIPINO (Bloqueador canal Ca):\n' +
                   '• Dose: 5-10mg 1x/dia\n' +
                   '• Efeito: edema tornozelo\n\n' +
                   '4. HIDROCLOROTIAZIDA (Diurético):\n' +
                   '• Dose: 25mg 1x/dia\n' +
                   '• Tomar pela manhã\n' +
                   '• Monitorar K+\n\n' +
                   '⚠️ Tratamento CRÔNICO!\n' +
                   '⚠️ Não suspender sem orientação!\n' +
                   '⚠️ Monitorar PA regularmente!';
        }
        if (q.includes('febre')) {
            return '💊 MEDICAMENTOS PARA FEBRE:\n\n' +
                   '1. PARACETAMOL:\n' +
                   '• Dose: 500-1000mg 6/6h\n' +
                   '• 1ª escolha\n' +
                   '• Seguro\n\n' +
                   '2. DIPIRONA:\n' +
                   '• Dose: 500-1000mg 6/6h\n' +
                   '• Ação rápida\n' +
                   '• Cuidado EV\n\n' +
                   '3. IBUPROFENO:\n' +
                   '• Dose: 400-600mg 8/8h\n' +
                   '• Anti-inflamatório também\n\n' +
                   '💡 MEDIDAS NÃO-FARMACOLÓGICAS:\n' +
                   '• Banho morno\n' +
                   '• Hidratação\n' +
                   '• Roupas leves\n' +
                   '• Repouso\n\n' +
                   '⚠️ Febre >39°C ou persistente: procurar médico!';
        }
        if (q.includes('diabetes') || q.includes('açúcar alto') || q.includes('glicemia alta')) {
            return '💊 MEDICAMENTOS PARA DIABETES:\n\n' +
                   '1. METFORMINA (1ª linha):\n' +
                   '• Dose: 500-2550mg/dia\n' +
                   '• Tomar com refeições\n' +
                   '• Efeito: diarreia inicial\n\n' +
                   '2. GLIBENCLAMIDA (Sulfoniluréia):\n' +
                   '• Dose: 2,5-20mg/dia\n' +
                   '• Risco hipoglicemia\n' +
                   '• Tomar antes café\n\n' +
                   '3. INSULINA:\n' +
                   '• Vários tipos (rápida, NPH, lenta)\n' +
                   '• Via SC\n' +
                   '• Dose individualizada\n\n' +
                   '💡 CONTROLE:\n' +
                   '• Dieta\n' +
                   '• Exercício\n' +
                   '• Monitorar glicemia\n' +
                   '• HbA1c <7%\n\n' +
                   '⚠️ Hipoglicemia: 15g carboidrato!\n' +
                   '⚠️ Tratamento individualizado!';
        }
        if (q.includes('refluxo') || q.includes('azia') || q.includes('gastrite')) {
            return '💊 MEDICAMENTOS PARA REFLUXO/GASTRITE:\n\n' +
                   '1. OMEPRAZOL (IBP):\n' +
                   '• Dose: 20-40mg 1x/dia\n' +
                   '• Tomar em jejum\n' +
                   '• Tratamento: 4-8 semanas\n\n' +
                   '2. RANITIDINA (Bloqueador H2):\n' +
                   '• Dose: 150mg 2x/dia\n' +
                   '• Menos potente que IBP\n\n' +
                   '3. ANTIÁCIDOS:\n' +
                   '• Hidróxido alumínio/magnésio\n' +
                   '• Alívio rápido\n' +
                   '• Uso sintomático\n\n' +
                   '💡 MEDIDAS:\n' +
                   '• Elevar cabeceira\n' +
                   '• Evitar: café, álcool, frituras\n' +
                   '• Não deitar após comer\n' +
                   '• Perder peso\n\n' +
                   '⚠️ Sintomas persistentes: endoscopia!';
        }
    }
    
    // Perguntas sobre "como funciona"
    if (q.includes('como funciona') || q.includes('mecanismo') || q.includes('ação')) {
        if (q.includes('dipirona') || q.includes('paracetamol') || q.includes('analgésico') || q.includes('analgesico')) {
            return '🔬 COMO FUNCIONAM OS ANALGÉSICOS:\n\n' +
                   '📌 DIPIRONA:\n' +
                   '• Inibe COX (ciclooxigenase)\n' +
                   '• ↓Prostaglandinas (dor e febre)\n' +
                   '• Ação central e periférica\n' +
                   '• Relaxamento muscular\n\n' +
                   '📌 PARACETAMOL:\n' +
                   '• Inibe COX no SNC\n' +
                   '• ↓Prostaglandinas centrais\n' +
                   '• Analgésico + antipirético\n' +
                   '• NÃO é anti-inflamatório\n\n' +
                   '📌 AINES (Ibuprofeno):\n' +
                   '• Inibe COX-1 e COX-2\n' +
                   '• ↓Prostaglandinas\n' +
                   '• Analgésico + antipirético + anti-inflamatório\n\n' +
                   '📌 OPIOIDES (Morfina):\n' +
                   '• Liga receptores opioides (μ, κ, δ)\n' +
                   '• Bloqueia transmissão dor\n' +
                   '• Ação no SNC\n' +
                   '• Dor moderada a severa';
        }
        if (q.includes('insulina')) {
            return '🔬 COMO FUNCIONA A INSULINA:\n\n' +
                   '📌 MECANISMO:\n' +
                   '• Hormônio produzido pelo pâncreas\n' +
                   '• Liga receptor na célula\n' +
                   '• Ativa transportador GLUT-4\n' +
                   '• Glicose entra na célula\n' +
                   '• ↓Glicemia sanguínea\n\n' +
                   '📌 EFEITOS:\n' +
                   '• ↑Captação glicose (músculo, gordura)\n' +
                   '• ↓Produção glicose (fígado)\n' +
                   '• ↑Síntese glicogênio\n' +
                   '• ↑Síntese proteínas\n' +
                   '• ↑Síntese gorduras\n\n' +
                   '📌 DIABETES:\n' +
                   '• Tipo 1: não produz insulina\n' +
                   '• Tipo 2: resistência à insulina\n' +
                   '• Tratamento: insulina exógena';
        }
    }
    
    // Lista de tópicos disponíveis
    return `💙 Posso ajudar com diversos temas de enfermagem! Aqui estão alguns exemplos:\n\n` +
           `📚 TÓPICOS DISPONÍVEIS:\n\n` +
           `🫀 Cardiovascular:\n` +
           `• Ciclo cardíaco\n` +
           `• ICC (Insuficiência Cardíaca)\n` +
           `• IAM (Infarto)\n` +
           `• Pressão arterial\n` +
           `• Sinais vitais\n\n` +
           `🫁 Respiratório:\n` +
           `• Pneumonia\n` +
           `• DPOC\n` +
           `• Oxigenoterapia\n\n` +
           `🧠 Neurológico:\n` +
           `• AVC (Derrame)\n` +
           `• Avaliação dor\n\n` +
           `💊 Medicação:\n` +
           `• Administração\n` +
           `• Cálculos (gotejamento, doses)\n\n` +
           `🚨 Emergências:\n` +
           `• RCP\n` +
           `• Sepse\n` +
           `• Choque\n` +
           `• Queimaduras\n\n` +
           `🩺 Procedimentos:\n` +
           `• Curativos\n` +
           `• Sondagem (vesical, nasogástrica)\n` +
           `• Vacinação\n` +
           `• Glicemia capilar\n` +
           `• ECG\n` +
           `• Hemodiálise\n\n` +
           `👶 Materno-Infantil:\n` +
           `• Parto\n` +
           `• Aleitamento materno\n` +
           `• Pediatria\n\n` +
           `👴 Geriatria:\n` +
           `• Cuidados ao idoso\n` +
           `• Prevenção quedas\n\n` +
           `🦠 Outros:\n` +
           `• Diabetes\n` +
           `• Precauções (EPI)\n` +
           `• Lavagem das mãos\n` +
           `• Feridas\n\n` +
           `💬 Faça sua pergunta! Exemplo:\n` +
           `"O que é sepse?"\n` +
           `"Como fazer RCP?"\n` +
           `"Explique o ciclo cardíaco"\n` +
           `"Como calcular gotejamento?"`;
}

function addMessageToChat(text, isUser, save = true) {
    const container = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    
    // Formatar texto com quebras de linha e listas
    const formattedText = text
        .replace(/\n/g, '<br>')
        .replace(/•/g, '•')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${isUser ? 'user' : 'robot'}"></i>
        </div>
        <div class="message-content">
            <p>${formattedText}</p>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    if (save) {
        state.chatHistory.push({ text, isUser, timestamp: new Date().toISOString() });
        if (state.chatHistory.length > 50) {
            state.chatHistory = state.chatHistory.slice(-50);
        }
        localStorage.setItem('chatHistory', JSON.stringify(state.chatHistory));
    }
}

// Configuração da API
function configureAPI() {
    const currentKey = API_KEY ? '(Configurada)' : '(Não configurada)';
    const message = `Status atual: ${currentKey}\n\n` +
        `Para usar a IA avançada do Google Gemini (gratuita):\n\n` +
        `1. Acesse: https://makersuite.google.com/app/apikey\n` +
        `2. Faça login e crie uma API Key\n` +
        `3. Cole a chave abaixo\n\n` +
        `Deixe em branco para remover a configuração atual.`;
    
    const key = prompt(message, API_KEY);
    
    if (key === null) return; // Cancelou
    
    if (key.trim() === '') {
        // Remover API
        API_KEY = '';
        localStorage.removeItem('gemini_api_key');
        alert('✅ API removida. Usando modo offline básico.');
        addMessageToChat('ℹ️ API removida. Agora usando IA básica offline.', false);
    } else {
        // Configurar API
        API_KEY = key.trim();
        localStorage.setItem('gemini_api_key', API_KEY);
        alert('✅ API configurada com sucesso! Agora você pode fazer qualquer pergunta sobre enfermagem.');
        addMessageToChat('✅ API configurada! Agora posso responder qualquer pergunta sobre enfermagem com IA avançada. Teste-me!', false);
    }
}

// Utilitários
function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Fechar modais ao clicar fora
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
});


// ==================== TIMER E CRONÔMETRO ====================

let clockInterval;
let pomodoroInterval;
let pomodoroTime = 25 * 60; // 25 minutos em segundos
let pomodoroRunning = false;
let pomodoroMode = 'study'; // 'study' ou 'break'
let stopwatchInterval;
let stopwatchTime = 0;
let stopwatchRunning = false;
let laps = [];

function initTimer() {
    // Relógio
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
    
    // Pomodoro
    document.getElementById('startPomodoro').addEventListener('click', startPomodoro);
    document.getElementById('pausePomodoro').addEventListener('click', pausePomodoro);
    document.getElementById('resetPomodoro').addEventListener('click', resetPomodoro);
    document.getElementById('studyTime').addEventListener('change', updatePomodoroSettings);
    document.getElementById('breakTime').addEventListener('change', updatePomodoroSettings);
    
    // Cronômetro
    document.getElementById('startStopwatch').addEventListener('click', startStopwatch);
    document.getElementById('pauseStopwatch').addEventListener('click', pauseStopwatch);
    document.getElementById('resetStopwatch').addEventListener('click', resetStopwatch);
    document.getElementById('lapStopwatch').addEventListener('click', addLap);
    
    // Atualizar estatísticas
    updatePomodoroStats();
    renderStudyHistory();
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.getElementById('clockDisplay').textContent = `${hours}:${minutes}:${seconds}`;
    
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const dateStr = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
    document.getElementById('dateDisplay').textContent = dateStr;
}

function startPomodoro() {
    if (!pomodoroRunning) {
        pomodoroRunning = true;
        document.getElementById('pomodoroStatus').textContent = 
            pomodoroMode === 'study' ? '📚 Estudando...' : '☕ Pausa...';
        
        pomodoroInterval = setInterval(() => {
            pomodoroTime--;
            updatePomodoroDisplay();
            
            if (pomodoroTime <= 0) {
                pomodoroComplete();
            }
        }, 1000);
    }
}

function pausePomodoro() {
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
    document.getElementById('pomodoroStatus').textContent = '⏸️ Pausado';
}

function resetPomodoro() {
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
    pomodoroMode = 'study';
    pomodoroTime = parseInt(document.getElementById('studyTime').value) * 60;
    updatePomodoroDisplay();
    document.getElementById('pomodoroStatus').textContent = 'Pronto para começar';
}

function pomodoroComplete() {
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
    
    // Tocar som (opcional)
    playNotificationSound();
    
    if (pomodoroMode === 'study') {
        // Completou sessão de estudo
        state.pomodoroSessions.total++;
        
        // Verificar se é um novo dia
        const today = new Date().toDateString();
        if (state.pomodoroSessions.lastDate !== today) {
            state.pomodoroSessions.today = 0;
            state.pomodoroSessions.lastDate = today;
        }
        state.pomodoroSessions.today++;
        
        localStorage.setItem('pomodoroSessions', JSON.stringify(state.pomodoroSessions));
        updatePomodoroStats();
        
        // Adicionar ao histórico
        addToStudyHistory('Pomodoro', parseInt(document.getElementById('studyTime').value));
        
        // Mudar para pausa
        pomodoroMode = 'break';
        pomodoroTime = parseInt(document.getElementById('breakTime').value) * 60;
        document.getElementById('pomodoroStatus').textContent = '✅ Sessão completa! Hora da pausa.';
        
        if (confirm('🎉 Sessão de estudo completa! Iniciar pausa?')) {
            startPomodoro();
        }
    } else {
        // Completou pausa
        pomodoroMode = 'study';
        pomodoroTime = parseInt(document.getElementById('studyTime').value) * 60;
        document.getElementById('pomodoroStatus').textContent = '✅ Pausa completa! Pronto para estudar.';
        
        if (confirm('☕ Pausa completa! Iniciar nova sessão de estudo?')) {
            startPomodoro();
        }
    }
    
    updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroTime / 60);
    const seconds = pomodoroTime % 60;
    document.getElementById('pomodoroDisplay').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updatePomodoroSettings() {
    if (!pomodoroRunning) {
        pomodoroTime = parseInt(document.getElementById('studyTime').value) * 60;
        updatePomodoroDisplay();
    }
}

function updatePomodoroStats() {
    document.getElementById('sessionsToday').textContent = state.pomodoroSessions.today;
    document.getElementById('totalSessions').textContent = state.pomodoroSessions.total;
}

function playNotificationSound() {
    // Criar um beep simples
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Cronômetro
function startStopwatch() {
    if (!stopwatchRunning) {
        stopwatchRunning = true;
        const startTime = Date.now() - (stopwatchTime * 1000);
        
        stopwatchInterval = setInterval(() => {
            stopwatchTime = Math.floor((Date.now() - startTime) / 1000);
            updateStopwatchDisplay();
        }, 100);
    }
}

function pauseStopwatch() {
    stopwatchRunning = false;
    clearInterval(stopwatchInterval);
}

function resetStopwatch() {
    stopwatchRunning = false;
    clearInterval(stopwatchInterval);
    stopwatchTime = 0;
    laps = [];
    updateStopwatchDisplay();
    document.getElementById('lapsContainer').innerHTML = '';
}

function addLap() {
    if (stopwatchRunning) {
        laps.push(stopwatchTime);
        const lapNumber = laps.length;
        const lapTime = formatStopwatchTime(stopwatchTime);
        
        const lapItem = document.createElement('div');
        lapItem.className = 'lap-item';
        lapItem.innerHTML = `
            <span>Volta ${lapNumber}</span>
            <span>${lapTime}</span>
        `;
        
        document.getElementById('lapsContainer').prepend(lapItem);
    }
}

function updateStopwatchDisplay() {
    document.getElementById('stopwatchDisplay').textContent = formatStopwatchTime(stopwatchTime);
}

function formatStopwatchTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function addToStudyHistory(type, duration) {
    const history = {
        id: Date.now(),
        type: type,
        duration: duration,
        date: new Date().toISOString()
    };
    
    state.studyHistory.unshift(history);
    if (state.studyHistory.length > 50) {
        state.studyHistory = state.studyHistory.slice(0, 50);
    }
    
    localStorage.setItem('studyHistory', JSON.stringify(state.studyHistory));
    renderStudyHistory();
}

function renderStudyHistory() {
    const container = document.getElementById('studyHistoryList');
    
    if (state.studyHistory.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Nenhum histórico ainda</p>';
        return;
    }
    
    const today = state.studyHistory.filter(h => {
        const historyDate = new Date(h.date).toDateString();
        const todayDate = new Date().toDateString();
        return historyDate === todayDate;
    });
    
    container.innerHTML = today.slice(0, 10).map(h => {
        const time = new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="history-item">
                <div>
                    <strong>${h.type}</strong>
                    <span style="color: var(--text-secondary); margin-left: 10px;">${time}</span>
                </div>
                <div style="color: var(--primary); font-weight: bold;">
                    ${h.duration} min
                </div>
            </div>
        `;
    }).join('');
}

// ==================== ANOTAÇÕES ====================

function initNotes() {
    const addBtn = document.getElementById('addNoteBtn');
    const modal = document.getElementById('noteModal');
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.cancel-modal');
    const saveBtn = document.getElementById('saveNote');
    const deleteBtn = document.getElementById('deleteNote');
    const searchInput = document.getElementById('searchNotes');
    const filterSelect = document.getElementById('filterNotes');
    
    addBtn.addEventListener('click', () => {
        state.currentNoteId = null;
        document.getElementById('noteModalTitle').textContent = 'Nova Anotação';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteCategory').value = 'outros';
        document.getElementById('noteFavorite').checked = false;
        document.getElementById('deleteNote').style.display = 'none';
        openModal(modal);
    });
    
    closeBtn.addEventListener('click', () => closeModal(modal));
    cancelBtn.addEventListener('click', () => closeModal(modal));
    saveBtn.addEventListener('click', saveNote);
    deleteBtn.addEventListener('click', deleteNote);
    searchInput.addEventListener('input', (e) => renderNotes(e.target.value, filterSelect.value));
    filterSelect.addEventListener('change', (e) => renderNotes(searchInput.value, e.target.value));
    
    renderNotes();
}

function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const category = document.getElementById('noteCategory').value;
    const favorite = document.getElementById('noteFavorite').checked;
    
    if (!title || !content) {
        alert('Preencha título e conteúdo!');
        return;
    }
    
    if (state.currentNoteId) {
        // Editar nota existente
        const note = state.notes.find(n => n.id === state.currentNoteId);
        if (note) {
            note.title = title;
            note.content = content;
            note.category = category;
            note.favorite = favorite;
            note.updatedAt = new Date().toISOString();
        }
    } else {
        // Criar nova nota
        const note = {
            id: Date.now(),
            title,
            content,
            category,
            favorite,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.notes.unshift(note);
    }
    
    localStorage.setItem('notes', JSON.stringify(state.notes));
    closeModal(document.getElementById('noteModal'));
    renderNotes();
}

function renderNotes(search = '', filter = 'all') {
    const container = document.getElementById('notesGrid');
    
    let filtered = state.notes;
    
    // Filtrar por categoria
    if (filter !== 'all') {
        filtered = filtered.filter(n => n.category === filter);
    }
    
    // Filtrar por busca
    if (search) {
        filtered = filtered.filter(n => 
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.content.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    // Ordenar: favoritos primeiro
    filtered.sort((a, b) => {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">Nenhuma anotação encontrada</p>';
        return;
    }
    
    container.innerHTML = filtered.map(note => {
        const date = new Date(note.updatedAt).toLocaleDateString('pt-BR');
        const preview = note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '');
        
        return `
            <div class="note-card ${note.favorite ? 'favorite' : ''}" onclick="openNoteModal(${note.id})">
                <div class="note-header">
                    <div>
                        <div class="note-title">${note.title}</div>
                        <span class="note-category">${note.category}</span>
                    </div>
                </div>
                <div class="note-content-preview">${preview}</div>
                <div class="note-footer">
                    <div class="note-date">
                        <i class="fas fa-calendar"></i>
                        ${date}
                    </div>
                    <div>${note.content.length} caracteres</div>
                </div>
            </div>
        `;
    }).join('');
}

function openNoteModal(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;
    
    state.currentNoteId = id;
    const modal = document.getElementById('noteModal');
    
    document.getElementById('noteModalTitle').textContent = 'Editar Anotação';
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    document.getElementById('noteCategory').value = note.category;
    document.getElementById('noteFavorite').checked = note.favorite;
    document.getElementById('deleteNote').style.display = 'block';
    
    openModal(modal);
}

function deleteNote() {
    if (confirm('Deseja excluir esta anotação?')) {
        state.notes = state.notes.filter(n => n.id !== state.currentNoteId);
        localStorage.setItem('notes', JSON.stringify(state.notes));
        closeModal(document.getElementById('noteModal'));
        renderNotes();
    }
}

// Fechar modais ao clicar fora
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
});
