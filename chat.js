(function () {
  'use strict';

  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwLp3ZNDnXMHRoqtEo3yNHo7lLPlH8IqozsEERUcoA-fShI-9JkrLhnc6ewrTm_Z8gmKQ/exec';
  var POLLING_MS = 4000;
  var chatAbierto = false;
  var chatActivo = null;
  var totalNoLeidos = 0;
  var pollingTimer = null;
  var ultimoId = 0;
  var contactos = [];
  var miCodigo = '';
  var miNombre = '';
  var soyDirector = false;
  var todosLosMensajes = [];
  var audioCtx = null;
  var sonidoActivo = true;
  var mensajesPorChat = {};
  var totalsPrevios = {};
  var notificacionesPermitidas = false;
  var tituloOriginal = document.title;

  function detectarUsuario() {
    if (typeof directorActual !== 'undefined' && directorActual && directorActual.codigo) {
      miCodigo = directorActual.codigo;
      miNombre = directorActual.nombre;
      soyDirector = true;
      return true;
    }
    if (typeof maestroActual !== 'undefined' && maestroActual && maestroActual.codigo) {
      miCodigo = maestroActual.codigo;
      miNombre = maestroActual.nombre;
      soyDirector = false;
      return true;
    }
    return false;
  }

  function construirContactos() {
    contactos = [];
    if (soyDirector) {
      contactos.push({ codigo: 'GRUPO', nombre: 'ANUNCIO A TODOS LOS PROFES', tipo: 'grupo' });
      if (typeof MAESTROS !== 'undefined') {
        MAESTROS.forEach(function (m) {
          contactos.push({ codigo: m.codigo, nombre: m.nombre, tipo: 'individual' });
        });
      }
    } else {
      contactos.push({ codigo: 'CED-26-ZX7QR4', nombre: 'DIRECTOR', tipo: 'individual' });
    }
  }

  function inicializarAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return;
    }
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }

  function playSonido() {
    if (!sonidoActivo) return;
    if (!audioCtx) inicializarAudio();
    if (!audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      var t = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(880, t);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
      var osc2 = audioCtx.createOscillator();
      var gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.setValueAtTime(1100, t + 0.15);
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, t + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc2.start(t + 0.15);
      osc2.stop(t + 0.45);
    } catch (e) {}
  }

  function crearBotonFlotante() {
    var btn = document.createElement('div');
    btn.id = 'chat_boton';
    btn.innerHTML = '&#128172;<span id="chat_badge" style="display:none">0</span>';
    btn.addEventListener('click', function () {
      inicializarAudio();
      toggleChat();
    });
    document.body.appendChild(btn);
  }

  function crearPanel() {
    var panel = document.createElement('div');
    panel.id = 'chat_panel';
    panel.innerHTML =
      '<div id="chat_header">' +
        '<span id="chat_titulo">CHAT</span>' +
        '<div id="chat_header_acciones">' +
          '<button id="chat_btn_sonido" title="Sonido">&#128276;</button>' +
          '<button id="chat_btn_cerrar">&#10005;</button>' +
        '</div>' +
      '</div>' +
      '<div id="chat_contactos"></div>' +
      '<div id="chat_ventana">' +
        '<div id="chat_mensajes"></div>' +
        '<div id="chat_input_area">' +
          '<input type="text" id="chat_input" placeholder="Escribe tu mensaje..." maxlength="500">' +
          '<button id="chat_btn_enviar">&#10148;</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(panel);
    document.getElementById('chat_btn_cerrar').addEventListener('click', toggleChat);
    document.getElementById('chat_btn_enviar').addEventListener('click', enviarMensaje);
    document.getElementById('chat_input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') enviarMensaje();
    });
    document.getElementById('chat_btn_sonido').addEventListener('click', toggleSonido);
  }

  function toggleChat() {
    var panel = document.getElementById('chat_panel');
    var btn = document.getElementById('chat_boton');
    chatAbierto = !chatAbierto;
    if (chatAbierto) {
      panel.classList.add('chat_visible');
      btn.classList.add('chat_oculto');
      btn.classList.remove('chat_alerta');
      if (chatActivo) {
        mensajesPorChat[chatActivo.codigo] = 0;
      }
      totalNoLeidos = 0;
      Object.keys(mensajesPorChat).forEach(function (k) {
        totalNoLeidos += mensajesPorChat[k];
      });
      actualizarBadge();
      pintarContactos();
      if (chatActivo) cargarMensajes();
    } else {
      panel.classList.remove('chat_visible');
      btn.classList.remove('chat_oculto');
    }
  }

  function pintarContactos() {
    var contenedor = document.getElementById('chat_contactos');
    contenedor.innerHTML = '';
    contactos.forEach(function (c) {
      var item = document.createElement('div');
      item.className = 'chat_contacto';
      item.dataset.codigo = c.codigo;
      var noLeidos = mensajesPorChat[c.codigo] || 0;
      var nombreSpan = document.createElement('span');
      nombreSpan.className = 'chat_contacto_nombre';
      nombreSpan.textContent = c.nombre;
      item.appendChild(nombreSpan);
      if (noLeidos > 0) {
        var badge = document.createElement('span');
        badge.className = 'chat_contacto_badge';
        badge.textContent = noLeidos;
        item.appendChild(badge);
        item.classList.add('chat_contacto_nuevo');
      }
      if (chatActivo && chatActivo.codigo === c.codigo) {
        item.classList.add('chat_activo');
      }
      item.addEventListener('click', function () { seleccionarChat(c); });
      contenedor.appendChild(item);
    });
  }

  function seleccionarChat(contacto) {
    chatActivo = contacto;
    document.getElementById('chat_titulo').textContent = contacto.nombre;
    mensajesPorChat[contacto.codigo] = 0;
    totalNoLeidos = 0;
    Object.keys(mensajesPorChat).forEach(function (k) {
      totalNoLeidos += mensajesPorChat[k];
    });
    actualizarBadge();
    pintarContactos();
    ultimoId = 0;
    todosLosMensajes = [];
    cargarMensajes();
    document.getElementById('chat_ventana').style.display = 'flex';
    document.getElementById('chat_input').focus();
  }

  function cargarMensajes() {
    if (!chatActivo) return;
    var params = new URLSearchParams({
      accion: 'chat_leer',
      desde: '0',
      tipo: chatActivo.tipo
    });
    if (chatActivo.tipo === 'individual') {
      params.set('de', miCodigo);
      params.set('para', chatActivo.codigo);
    }
    fetch(SCRIPT_URL + '?' + params.toString())
      .then(function (r) { return r.json(); })
      .then(function (resultado) {
        if (!resultado.ok || !resultado.mensajes) return;
        todosLosMensajes = resultado.mensajes;
        var maxId = 0;
        resultado.mensajes.forEach(function (m) {
          if (m.id > maxId) maxId = m.id;
        });
        ultimoId = maxId;
        renderizarMensajesFiltrados();
      })
      .catch(function () {});
  }

  function renderizarMensajesFiltrados() {
    if (!chatActivo) return;
    var filtrados;
    if (chatActivo.tipo === 'grupo') {
      filtrados = todosLosMensajes.filter(function (m) { return m.tipo === 'grupo'; });
    } else {
      filtrados = todosLosMensajes.filter(function (m) {
        return m.tipo === 'individual' &&
          ((m.de === miCodigo && m.para === chatActivo.codigo) ||
           (m.de === chatActivo.codigo && m.para === miCodigo));
      });
    }
    renderizarMensajes(filtrados);
  }

  function renderizarMensajes(mensajes) {
    var contenedor = document.getElementById('chat_mensajes');
    contenedor.innerHTML = '';
    if (mensajes.length === 0) {
      contenedor.innerHTML = '<p style="text-align:center;color:#7a8a9a;font-size:13px;padding:20px">No hay mensajes aun. Escribe el primero.</p>';
      return;
    }
    mensajes.forEach(function (m) {
      var burbuja = document.createElement('div');
      burbuja.className = 'chat_mensaje' + (m.de === miCodigo ? ' chat_mio' : ' chat_ajeno');
      var hora = m.hora || '';
      var nombre = m.de === miCodigo ? 'Tu' : (m.nombre_de || m.de);
      burbuja.innerHTML =
        '<div class="chat_mensaje_nombre">' + escapeHtml(nombre) + '</div>' +
        '<div class="chat_mensaje_texto">' + escapeHtml(m.mensaje) + '</div>' +
        '<div class="chat_mensaje_hora">' + escapeHtml(hora) + '</div>';
      contenedor.appendChild(burbuja);
    });
    contenedor.scrollTop = contenedor.scrollHeight;
  }

  function escapeHtml(texto) {
    var div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  function enviarMensaje() {
    var input = document.getElementById('chat_input');
    var texto = input.value.trim();
    if (!texto || !chatActivo) return;
    input.value = '';
    var datos = {
      accion: 'chat_enviar',
      de: miCodigo,
      nombre_de: miNombre,
      tipo: chatActivo.tipo,
      mensaje: texto
    };
    if (chatActivo.tipo === 'individual') {
      datos.para = chatActivo.codigo;
    }
    fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(datos)
    })
      .then(function (r) { return r.json(); })
      .then(function (resultado) {
        if (resultado.ok) setTimeout(cargarMensajes, 800);
      })
      .catch(function () {});
  }

  function actualizarBadge() {
    var badge = document.getElementById('chat_badge');
    var btn = document.getElementById('chat_boton');
    if (!badge) return;
    totalNoLeidos = 0;
    Object.keys(mensajesPorChat).forEach(function (k) {
      totalNoLeidos += mensajesPorChat[k];
    });
    if (totalNoLeidos > 0) {
      badge.textContent = totalNoLeidos;
      badge.style.display = 'flex';
      if (btn && !chatAbierto) btn.classList.add('chat_alerta');
      document.title = '(' + totalNoLeidos + ') ' + tituloOriginal;
    } else {
      badge.style.display = 'none';
      if (btn) btn.classList.remove('chat_alerta');
      document.title = tituloOriginal;
    }
  }

  function toggleSonido() {
    sonidoActivo = !sonidoActivo;
    document.getElementById('chat_btn_sonido').innerHTML = sonidoActivo ? '&#128276;' : '&#128263;';
  }

  function pedirPermisoNotificaciones() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      notificacionesPermitidas = true;
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(function (permiso) {
        notificacionesPermitidas = permiso === 'granted';
      });
    }
  }

  function mostrarNotificacion(titulo, mensaje) {
    if (!notificacionesPermitidas || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      var notif = new Notification(titulo, {
        body: mensaje,
        icon: 'logo.png',
        tag: 'ced-chat',
        requireInteraction: false
      });
      setTimeout(function () { notif.close(); }, 5000);
    } catch (e) {}
  }

  function tabVisible() {
    return !document.hidden;
  }

  function iniciarPolling() {
    pollingTimer = setInterval(function () {
      if (!detectarUsuario()) return;
      var totalActual = 0;
      var hayNuevos = false;
      var pendientes = contactos.length;
      if (pendientes === 0) return;

      contactos.forEach(function (contacto) {
        var params = new URLSearchParams({
          accion: 'chat_leer',
          desde: '0',
          tipo: contacto.tipo
        });
        if (contacto.tipo === 'individual') {
          params.set('de', miCodigo);
          params.set('para', contacto.codigo);
        }
        fetch(SCRIPT_URL + '?' + params.toString())
          .then(function (r) { return r.json(); })
          .then(function (resultado) {
            if (resultado.ok && resultado.mensajes) {
              var totalMensajes = resultado.mensajes.length;
              var previo = totalsPrevios[contacto.codigo] || 0;
              if (totalMensajes > previo && previo > 0) {
                var nuevos = resultado.mensajes.filter(function (m) {
                  return m.de !== miCodigo;
                });
                if (nuevos.length > 0) {
                  if (!chatAbierto) {
                    hayNuevos = true;
                  }
                  if (!tabVisible() && notificacionesPermitidas) {
                    var nombreRemitente = nuevos[nuevos.length - 1].nombre_de || 'Alguien';
                    var textoMensaje = nuevos[nuevos.length - 1].mensaje || '';
                    mostrarNotificacion('Mensaje de ' + nombreRemitente, textoMensaje);
                  }
                }
                mensajesPorChat[contacto.codigo] = nuevos.length;
              } else if (previo === 0 && totalMensajes > 0) {
                var nuevosInit = resultado.mensajes.filter(function (m) {
                  return m.de !== miCodigo;
                });
                mensajesPorChat[contacto.codigo] = nuevosInit.length;
              }
              totalsPrevios[contacto.codigo] = totalMensajes;
            }
          })
          .catch(function () {})
          .then(function () {
            pendientes--;
              if (pendientes === 0) {
              if (chatActivo) {
                cargarMensajes();
              }
              if (hayNuevos) {
                if (tabVisible()) {
                  playSonido();
                }
              }
              actualizarBadge();
              pintarContactos();
            }
          });
      });
    }, POLLING_MS);
  }

  function ocultarWidgetSiLogin() {
    var btn = document.getElementById('chat_boton');
    var panel = document.getElementById('chat_panel');
    var loginVisible = document.getElementById('vista_login') &&
      document.getElementById('vista_login').classList.contains('activa');
    if (btn) btn.style.display = loginVisible ? 'none' : 'flex';
    if (panel && !chatAbierto) panel.classList.remove('chat_visible');
  }

  function init() {
    if (!detectarUsuario()) {
      setTimeout(init, 500);
      return;
    }
    construirContactos();
    crearBotonFlotante();
    crearPanel();
    pintarContactos();
    document.getElementById('chat_ventana').style.display = 'none';
    document.addEventListener('click', inicializarAudio, { once: true });
    document.addEventListener('touchstart', inicializarAudio, { once: true });
    document.addEventListener('click', pedirPermisoNotificaciones, { once: true });
    document.addEventListener('touchstart', pedirPermisoNotificaciones, { once: true });
    iniciarPolling();
    var observer = new MutationObserver(ocultarWidgetSiLogin);
    var loginEl = document.getElementById('vista_login');
    var panelEl = document.getElementById('vista_panel');
    if (loginEl) observer.observe(loginEl, { attributes: true, attributeFilter: ['class'] });
    if (panelEl) observer.observe(panelEl, { attributes: true, attributeFilter: ['class'] });
    ocultarWidgetSiLogin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
