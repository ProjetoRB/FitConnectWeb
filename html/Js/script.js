// ========================
// INICIALIZAÇÃO APÓS DOM CARREGADO
// ========================
document.addEventListener('DOMContentLoaded', function() {

    const btnSenha = document.getElementById('btn-senha');
    const inputSenha = document.getElementById('loginSenha');

if (btnSenha && inputSenha) {
    btnSenha.addEventListener('click', () => {
        if (inputSenha.type === 'password') {
            inputSenha.type = 'text';
            btnSenha.classList.replace('bi-eye', 'bi-eye-slash');
        } else {
            inputSenha.type = 'password';
            btnSenha.classList.replace('bi-eye-slash', 'bi-eye');
        }
    });
}

const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.querySelector('.container');

if (signUpButton && signInButton && container) {
    signUpButton.addEventListener('click', () => {
        container.classList.add('right-panel-active');
    });

    signInButton.addEventListener('click', () => {
        container.classList.remove('right-panel-active');
    });
}
    
    const btnConta = document.getElementById('btnConta');
    const dropdown = document.getElementById('dropdown');

    if (btnConta && dropdown) {
        btnConta.addEventListener('click', function(event) {
            event.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', function() {
            dropdown.classList.add('hidden');
        });
    } else {
        console.error('Elementos btnConta ou dropdown não encontrados no HTML');
    }

    // ------------------------
    // CAMPO DINÂMICO DO PROFISSIONAL
    // ------------------------
    const area = document.getElementById('areaProfissional');
    const documentoLabel = document.getElementById('documentoLabel');
    const documentoInput = document.getElementById('documentoProfissional');

    if (area && documentoLabel && documentoInput) {
        area.addEventListener('change', () => {
            const valor = area.value;
            documentoLabel.innerText = valor || 'Documento Profissional';
            documentoInput.placeholder = valor ? `Digite seu ${valor}` : 'Digite seu documento';
        });
    }

    // ------------------------
    // FUNÇÃO VALIDADORA DE CPF
    // ------------------------
    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');

        if (cpf.length !== 11) return false;

        if (/^(\d)\1{10}$/.test(cpf)) return false;

        let soma = 0;
        let resto;

        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }

        resto = (soma * 10) % 11;

        if (resto === 10 || resto === 11) resto = 0;

        if (resto !== parseInt(cpf.substring(9, 10))) return false;

        soma = 0;

        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }

        resto = (soma * 10) % 11;

        if (resto === 10 || resto === 11) resto = 0;

        if (resto !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    }

    // ------------------------
    // FUNÇÃO PARA MÁSCARA DE CPF
    // ------------------------
    function aplicarMascaraCPF(input) {
        let value = input.value.replace(/\D/g, '');

        if (value.length > 11) value = value.slice(0, 11);

        if (value.length <= 3) {
            input.value = value;
        } else if (value.length <= 6) {
            input.value = value.replace(/(\d{3})(\d+)/, '$1.$2');
        } else if (value.length <= 9) {
            input.value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
        } else {
            input.value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        }
    }

    // ------------------------
    // APLICA MÁSCARA NOS CAMPOS DE CPF
    // ------------------------
    const cpfAluno = document.getElementById('cpf');
    const cpfProf = document.getElementById('cpfProf');

    if (cpfAluno) {
        cpfAluno.addEventListener('input', () => aplicarMascaraCPF(cpfAluno));
    }

    if (cpfProf) {
        cpfProf.addEventListener('input', () => aplicarMascaraCPF(cpfProf));
    }

    // ------------------------
    // URL BASE DA API ATUAL
    // ------------------------
    const API_BASE = 'http://localhost:8080';

    // ------------------------
    // CADASTRO DE ALUNO
    // ------------------------
    const formAluno = document.getElementById('formAluno');

    if (formAluno) {
        formAluno.addEventListener('submit', async (e) => {
            e.preventDefault();

            const cpf = document.getElementById('cpf')?.value;

            if (!validarCPF(cpf)) {
                alert('CPF inválido. Por favor, digite um CPF válido.');
                return;
            }

            const dados = {
                nomeCompleto: document.getElementById('nomeCompleto')?.value,
                email: document.getElementById('email')?.value,
                cpf: cpf,
                peso: document.getElementById('peso')?.value,
                altura: document.getElementById('altura')?.value,
                sexo: document.getElementById('sexo')?.value,
                senha: document.getElementById('senha')?.value
            };

            try {
                const response = await fetch(`${API_BASE}/alunos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });

                if (response.ok) {
                    const aluno = await response.json();
                    alert(`Cadastro realizado com sucesso! ID: ${aluno.id}`);
                    formAluno.reset();
                } else {
                    const erro = await response.text();
                    alert(`Erro: ${erro}`);
                }
            } catch (error) {
                console.error(error);
                alert('Erro de conexão com o servidor. Verifique se a API está rodando.');
            }
        });
    }

    // ------------------------
    // CADASTRO DE PROFISSIONAL
    // ------------------------
    const formProfissional = document.getElementById('formProfissional');

    if (formProfissional) {
        formProfissional.addEventListener('submit', async (e) => {
            e.preventDefault();

            const cpf = document.getElementById('cpfProf')?.value;

            if (!validarCPF(cpf)) {
                alert('CPF inválido. Por favor, digite um CPF válido.');
                return;
            }

            const dados = {
                nomeCompleto: document.getElementById('nomeCompletoProf')?.value,
                email: document.getElementById('emailProf')?.value,
                cpf: cpf,
                areaProfissional: document.getElementById('areaProfissional')?.value,
                documentoProfissional: document.getElementById('documentoProfissional')?.value,
                senha: document.getElementById('senhaProf')?.value
            };

            try {
                const response = await fetch(`${API_BASE}/profissionais`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });

                if (response.ok) {
                    const profissional = await response.json();
                    alert(`Cadastro profissional realizado! ID: ${profissional.id}`);
                    formProfissional.reset();

                    if (documentoLabel) documentoLabel.innerText = 'Documento Profissional';
                    if (documentoInput) documentoInput.placeholder = '';
                } else {
                    const erro = await response.text();
                    alert(`Erro: ${erro}`);
                }
            } catch (error) {
                console.error(error);
                alert('Erro de conexão com o servidor.');
            }
        });
    }

    // ------------------------
    // LOGIN
    // ------------------------
    const formLogin = document.getElementById('formLogin');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const dados = {
                email: document.getElementById('loginEmail')?.value,
                senha: document.getElementById('loginSenha')?.value
            };

            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });

                const resultado = await response.json();

                if (response.ok) {
                    alert(`Bem-vindo(a), ${resultado.nome}! (${resultado.tipo})`);

                    sessionStorage.setItem('usuario', JSON.stringify(resultado));

                    window.location.href = 'dashboard-aluno.html';
                } else {
                    alert(resultado.mensagem || 'Falha no login. Verifique suas credenciais.');
                }
            } catch (error) {
                console.error(error);
                alert('Erro de conexão com o servidor.');
            }
        });
    }
});