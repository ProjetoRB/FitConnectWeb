// =========================
// MODAL SAIR PERFIL
// =========================

const logoutBtnPerfil = document.getElementById('logoutBtnPerfil');

const modalSairPerfil = document.getElementById('modalSairPerfil');

const cancelarSairPerfil = document.getElementById('cancelarSairPerfil');

const confirmarSairPerfil = document.getElementById('confirmarSairPerfil');

if (
    logoutBtnPerfil &&
    modalSairPerfil &&
    cancelarSairPerfil &&
    confirmarSairPerfil
) {

    logoutBtnPerfil.addEventListener('click', function(e) {

        e.preventDefault();

        modalSairPerfil.classList.add('active');
    });

    cancelarSairPerfil.addEventListener('click', function() {

        modalSairPerfil.classList.remove('active');
    });

    confirmarSairPerfil.addEventListener('click', function() {

        sessionStorage.removeItem('usuario');

        window.location.href = 'login.html';
    });

    modalSairPerfil.addEventListener('click', function(e) {

        if (e.target === modalSairPerfil) {

            modalSairPerfil.classList.remove('active');
        }
    });
}