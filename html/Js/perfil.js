document.addEventListener('DOMContentLoaded', function () {

    const API_BASE = 'http://localhost:8080';

    const usuarioSessao = JSON.parse(sessionStorage.getItem('usuario'));

    if (!usuarioSessao || usuarioSessao.tipo !== 'Aluno') {
        alert('Sessão inválida. Faça login novamente.');
        window.location.href = 'index.html';
        return;
    }

    const campos = {
        nome: document.getElementById('perfilNome'),
        nascimento: document.getElementById('perfilNascimento'),
        sexo: document.getElementById('perfilSexo'),
        email: document.getElementById('perfilEmail'),
        cpf: document.getElementById('perfilCpf'),
        peso: document.getElementById('perfilPeso'),
        altura: document.getElementById('perfilAltura'),
        senha: document.getElementById('perfilSenha'),
    };

    const btnEditar = document.getElementById('btnEditar');
    const btnCancelar = document.getElementById('btnCancelar');
    const formActions = document.getElementById('formActions');
    const formPerfil = document.getElementById('formPerfil');

    let dadosOriginais = {};

    function formatarDataParaExibicao(dataISO) {
        if (!dataISO) return '';
        const parte = dataISO.split('T')[0];
        const [ano, mes, dia] = parte.split('-');
        if (!ano || !mes || !dia) return dataISO;
        return `${dia}/${mes}/${ano}`;
    }

    function formatarDataParaAPI(dataBR) {
        if (!dataBR) return null;
        const [dia, mes, ano] = dataBR.split('/');
        if (!dia || !mes || !ano) return null;
        return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    function validarData(data) {
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

        if (!regex.test(data)) return false;

        const [dia, mes, ano] = data.split('/').map(Number);

        if (ano < 1900 || ano > new Date().getFullYear()) {
            return false;
        }

        if (mes < 1 || mes > 12) {
            return false;
        }

        const dataObj = new Date(ano, mes - 1, dia);

        return (
            dataObj.getFullYear() === ano &&
            dataObj.getMonth() === mes - 1 &&
            dataObj.getDate() === dia
        );
    }

    function aplicarMascaraData(input) {
        input.addEventListener('input', function () {
            let valor = input.value.replace(/\D/g, '');

            if (valor.length > 2) {
                valor = valor.substring(0, 2) + '/' + valor.substring(2);
            }

            if (valor.length > 5) {
                valor = valor.substring(0, 5) + '/' + valor.substring(5, 9);
            }

            input.value = valor.substring(0, 10);
            input.classList.remove('erro');
        });

        input.addEventListener('blur', function () {
            if (input.value && !validarData(input.value)) {
                input.classList.add('erro');
            }
        });
    }

    function mascararCPF(cpf) {
        const s = cpf.replace(/\D/g, '');
        if (s.length !== 11) return cpf;
        return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    if (campos.nascimento) {
        aplicarMascaraData(campos.nascimento);
    }

    function preencherFormulario(dados) {
        if (campos.nome) campos.nome.value = dados.nomeCompleto || '';
        if (campos.nascimento) campos.nascimento.value = formatarDataParaExibicao(dados.dataNascimento);
        if (campos.sexo) campos.sexo.value = dados.sexo || '';
        if (campos.email) campos.email.value = dados.email || '';
        if (campos.cpf) campos.cpf.value = mascararCPF(dados.cpf || '');
        if (campos.peso) campos.peso.value = dados.peso || '';
        if (campos.altura) campos.altura.value = (dados.altura || '').replace(',', '.');

        dadosOriginais = {
            nomeCompleto: campos.nome?.value || '',
            dataNascimento: campos.nascimento?.value || '',
            sexo: campos.sexo?.value || '',
            email: campos.email?.value || '',
            cpf: campos.cpf?.value || '',
            peso: campos.peso?.value || '',
            altura: campos.altura?.value || '',
        };
    }

    async function carregarDados() {
        try {
            const response = await fetch(`${API_BASE}/alunos/${usuarioSessao.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const aluno = await response.json();
                preencherFormulario(aluno);
            } else {
                alert('Não foi possível carregar os dados do perfil.');
            }

        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            alert('Erro de conexão com o servidor. Verifique se a API está rodando.');
        }
    }

    function ativarEdicao() {
        Object.values(campos).forEach(campo => {
            if (campo) campo.disabled = false;
        });

        if (campos.cpf) campos.cpf.disabled = true;

        formActions?.classList.remove('hidden');
        btnEditar?.classList.add('hidden');
    }

    function desativarEdicao() {
        Object.values(campos).forEach(campo => {
            if (campo) campo.disabled = true;
        });

        formActions?.classList.add('hidden');
        btnEditar?.classList.remove('hidden');

        if (campos.senha) campos.senha.value = '';
    }

    function restaurarDados() {
        if (campos.nome) campos.nome.value = dadosOriginais.nomeCompleto;
        if (campos.nascimento) campos.nascimento.value = dadosOriginais.dataNascimento;
        if (campos.sexo) campos.sexo.value = dadosOriginais.sexo;
        if (campos.peso) campos.peso.value = dadosOriginais.peso;
        if (campos.email) campos.email.value = dadosOriginais.email;
        if (campos.cpf) campos.cpf.value = dadosOriginais.cpf;
        if (campos.altura) campos.altura.value = dadosOriginais.altura;
        if (campos.nascimento) campos.nascimento.classList.remove('erro');
    }

    if (btnEditar) {
        btnEditar.addEventListener('click', ativarEdicao);
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            restaurarDados();
            desativarEdicao();
        });
    }

    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();

            const novaSenha = campos.senha?.value?.trim();

            if (campos.nascimento?.value && !validarData(campos.nascimento.value)) {
                campos.nascimento.classList.add('erro');
                alert('Data de nascimento inválida.');
                return;
            }

            const dados = {
                nomeCompleto: campos.nome?.value || undefined,
                dataNascimento: formatarDataParaAPI(campos.nascimento?.value) || undefined,
                sexo: campos.sexo?.value || undefined,
                email: campos.email?.value || undefined,
                peso: campos.peso?.value || undefined,
                altura: campos.altura?.value || undefined,
            };

            if (novaSenha) {
                dados.senha = novaSenha;
            }

            try {
                const response = await fetch(`${API_BASE}/alunos/${usuarioSessao.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados),
                });

                if (response.ok) {
                    const alunoAtualizado = await response.json();

                    alert('Dados atualizados com sucesso!');

                    preencherFormulario(alunoAtualizado);
                    desativarEdicao();

                    usuarioSessao.nome = alunoAtualizado.nomeCompleto;
                    sessionStorage.setItem('usuario', JSON.stringify(usuarioSessao));

                } else {
                    const erro = await response.text();
                    alert(`Erro ao salvar: ${erro}`);
                }

            } catch (error) {
                console.error('Erro ao salvar perfil:', error);
                alert('Erro de conexão com o servidor.');
            }
        });
    }

    carregarDados();
});