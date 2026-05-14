// ========================
// DASHBOARD - PROFISSIONAIS E AGENDAMENTOS
// ========================

const API = 'http://localhost:8080';

const usuarioLogado = JSON.parse(sessionStorage.getItem('usuario'));

let currentAlunoId = usuarioLogado?.id || 1;

// ------------------------
// CARREGAR PROFISSIONAIS
// ------------------------
async function carregarProfissionais(filtro = 'todos') {
    try {
        const res = await fetch(`${API}/profissionais`);

        let profissionais = await res.json();

        if (filtro !== 'todos') {
            profissionais = profissionais.filter(p => p.areaProfissional === filtro);
        }

        const container = document.getElementById('profissionaisContainer');

        if (!container) return;

        if (!profissionais.length) {
            container.innerHTML = '<p class="placeholder">Nenhum profissional encontrado.</p>';
            return;
        }

        container.innerHTML = profissionais.map(prof => `
            <div class="card-profissional" data-id="${prof.id}">
                <h4>${prof.nomeCompleto}</h4>
                <p>${prof.areaProfissional}</p>

                <div class="horarios" id="horarios-${prof.id}">
                    <span class="horario-badge">Horários ainda não implementados</span>
                </div>

                <div class="acoes">
                    <button class="conversar-btn" data-id="${prof.id}" data-nome="${prof.nomeCompleto}">
                        💬 Conversar
                    </button>

                    <button class="agendar-btn" data-id="${prof.id}" data-nome="${prof.nomeCompleto}">
                        📅 Agendar
                    </button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.conversar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                alert('Chat ainda não implementado no backend.');
            });
        });

        document.querySelectorAll('.agendar-btn').forEach(btn => {

    btn.addEventListener('click', () => {

        abrirModalAgendamento(
            btn.dataset.id,
            btn.dataset.nome
        );
    });
});

    } catch (err) {
        console.error(err);
        alert('Erro ao carregar profissionais.');
    }
}

// ------------------------
// MODAL DE AGENDAMENTO
// OBS: Backend ainda não possui horários/agendamentos
// ------------------------
let profSelecionadoId = null;

async function abrirModalAgendamento(id, nome) {

    profSelecionadoId = id;

    const profNomeModal = document.getElementById('profNomeModal');
    const profId = document.getElementById('profId');
    const modalAgendar = document.getElementById('modalAgendar');
    const selectHorario = document.getElementById('horaConsulta');

    if (profNomeModal) profNomeModal.innerText = nome;
    if (profId) profId.value = id;

    try {

        const response = await fetch(
            `${API}/agenda-profissional/profissional/${id}`
        );

        const horarios = await response.json();

        selectHorario.innerHTML = '';

        if (!horarios.length) {

            selectHorario.innerHTML =
                '<option>Nenhum horário disponível</option>';

        } else {

            horarios.forEach(horario => {

                const option = document.createElement('option');

                option.value = horario.id;

                option.textContent =
                    `${horario.dataDisponivel} - ${horario.horaDisponivel}`;

                selectHorario.appendChild(option);
            });
        }

        modalAgendar.classList.remove('hidden');

    } catch (error) {

        console.error(error);

        alert('Erro ao carregar horários.');
    }
}

// ------------------------
// FORM AGENDAMENTO
// OBS: Ainda não funciona de verdade sem backend
// ------------------------
document.getElementById('formAgendamento')?.addEventListener('submit', async (e) => {

    e.preventDefault();

    const horarioId =
        document.getElementById('horaConsulta').value;

    const dados = {
        alunoId: currentAlunoId,
        horarioId: horarioId
    };

    try {

        const response = await fetch(
            `${API}/agenda-profissional/agendar`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            }
        );

        if (response.ok) {

            alert('Agendamento realizado com sucesso!');

            document.getElementById('modalAgendar')
                .classList.add('hidden');

        } else {

            alert('Erro ao realizar agendamento.');
        }

    } catch (error) {

        console.error(error);

        alert('Erro de conexão com o servidor.');
    }
});

// ------------------------
// CONSULTAS PENDENTES
// OBS: Ainda não existe endpoint no backend
// ------------------------
async function carregarConsultasPendentes() {
    const div = document.getElementById('pendingList');

    if (!div) return;

    div.innerHTML = '<p class="placeholder">Consultas ainda não implementadas no backend.</p>';
}

// ------------------------
// BOTÕES DE NAVEGAÇÃO
// ------------------------
document.getElementById('verMinhasConsultas')?.addEventListener('click', () => {
    alert('Minhas consultas ainda não foram implementadas.');
});

document.getElementById('verHistorico')?.addEventListener('click', () => {
    alert('Histórico ainda não foi implementado.');
});

// ------------------------
// FECHAR MODAL
// ------------------------
document.querySelector('.fechar-modal')?.addEventListener('click', () => {
    document.getElementById('modalAgendar')?.classList.add('hidden');
});

// ------------------------
// FILTROS
// ------------------------
document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));

        btn.classList.add('active');

        carregarProfissionais(btn.dataset.area);
    });
});

// =========================
// MODAL DE SAIR
// =========================

const logoutBtn = document.getElementById('logoutBtn');
const modalSair = document.getElementById('modalSair');
const cancelarSair = document.getElementById('cancelarSair');
const confirmarSair = document.getElementById('confirmarSair');

if (logoutBtn && modalSair && cancelarSair && confirmarSair) {
  logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    modalSair.classList.add('active');
  });

  cancelarSair.addEventListener('click', function() {
    modalSair.classList.remove('active');
  });

  confirmarSair.addEventListener('click', function() {
    sessionStorage.removeItem('usuario');
    window.location.href = 'login.html';
  });

  modalSair.addEventListener('click', function(e) {
    if (e.target === modalSair) {
      modalSair.classList.remove('active');
    }
  });
}

// ------------------------
// INICIALIZAÇÃO
// ------------------------
carregarProfissionais();
carregarConsultasPendentes();