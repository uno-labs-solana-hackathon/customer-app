'use strict';

window.prepare_wallet = function(body = document.body) {
  body.qa('button[data-action]').forEach(button => { button.onclick = window['action_'+button.dataset.action] });
  body.qa('a[data-toggle=tab]:not(.disabled)').forEach(a => { a.onclick = window['toggle_tab'] });
  body.qa('a[data-click]:not(.disabled)').forEach(a => { a.onclick = window['click_'+a.dataset.click] });
  body.qa('input[type=radio][data-change]:not(.disabled)').forEach(a => { a.onchange = window['radio_change_'+a.dataset.change] });

  window.register_click_events();
  window.load_wallet(body);
  window.show_fragments(body);
};

window.register_click_events = function() {
  if (window.click_events_registered) return;
  window.click_events_registered = true;
  document.addEventListener('click', function(event) {
    var button = event.target.closest('button') || event.target;
    if (!button) return;
    if (button.dataset.dismiss == 'alert') {
      var alert = event.target.closest('.alert');
      if (alert) alert.parentNode.removeChild(alert);
      event.stopPropagation();
    }
    if (button.dataset.dismiss == 'modal') {
      window.hide_modal('.modal.show');
      event.stopPropagation();
    }
  }, true);
};

window.load_wallet = function(body = document.body) {
  window.wallet = false;
  if (!window.wallet_mnemonic) return;
  window.wallet = get_result(Module.Wallet.new_wallet());
  var hd_group_id = get_result(window.wallet.add_hd_group(window.wallet_mnemonic, ''));
  window.primary_account = get_result(window.wallet.generate_next_hd_address(hd_group_id));
  window.primary_address = get_result(window.primary_account.name());
};

window.show_fragments = function(body = document.body) {
  body.qa('.wallet-fragment').forEach(fragment => { fragment.classList.add('d-none') });
  if (window.wallet) {
    window.show_wallet_info(body.q1('#wallet-info'));
    body.q1('#wallet-operations').classList.remove('d-none');
  }else{
    body.q1('#wallet-sign-in').classList.remove('d-none');
  }
};

window.action_create_wallet = function() {
  window.clear_errors();
  window.show_modal('#wallet-create');
  $q1('#new-mnemonic').textContent = get_result(Module.Wallet.new_mnemonic_phrase());
};

window.action_exit_wallet = function() {
  delete window.wallet;
  delete window.wallet_mnemonic;
  delete window.primary_address;
  delete window.primary_account;
  delete window.latest_transaction_data;
  delete window.latest_transaction_type;
  window.show_fragments();
};

window.action_open_wallet = function() {
  var textarea = $q1('#mnemonic-phrase');
  window.wallet_mnemonic = textarea.value;
  textarea.value = '';
  window.load_wallet();
  window.show_fragments();
};

window.action_sign_challenge = function() {
  if (!window.primary_account) return;
  var challenge = $q1('#pos-challenge').value;
  var signed_challenge = get_result(window.primary_account.sign_data_base64(String(challenge)));
  $q1('#pos-signed-challenge').value = signed_challenge;
};

window.action_copy_mnemonic = function() {
  var tooltip = this.q1('.tooltip');
  var mnemonic = $q1('#new-mnemonic').textContent;
  var textArea = document.createElement("textarea");
  textArea.value = mnemonic;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  var result = document.execCommand('copy');
  if (tooltip) {
    tooltip.classList.add('show');
    tooltip.q1('.tooltip-inner').innerHMTL = result ? 'Copied!' : '<span class="text-warning">Failed to copy!</span>';
  }
  textArea.value = '';
  document.body.removeChild(textArea);
};

window.action_regenerate_mnemonic = function() {
  $q1('#new-mnemonic').textContent = get_result(Module.Wallet.new_mnemonic_phrase());
};

window.action_refresh_wallet = function() {
  window.show_wallet_info(document.body.q1('#wallet-info'));
};

window.show_wallet_info = function(fragment) {
  fragment.qa('tbody tr:not(.placeholder)').forEach(tr => tr.parentNode.removeChild(tr));
  var row = fragment.q1('tr.placeholder').cloneNode(true);
  row.className = 'address';
  row.dataset.address = window.primary_address;
  row.cells[0].textContent = window.primary_address;
  row.cells[1].textContent = 'Ⓟ';

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://api.gplatform.org/sol/api');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
    if (xhr.status === 200) {
      var response = JSON.parse(xhr.responseText);
      if (response.data) {
        row.cells[1].innerHTML = response.data.balance.unlocked + ' <span class="text-muted">Ⓟ</span>';
      }else{
        console.log(response.result.msg);
      }
    }
  };
  xhr.send(JSON.stringify(
    {
      "method": "find_client",
      "data": {
        "client_id": window.primary_address,
        "is_create_if_not_found": true
      }
    }
  ));

  fragment.q1('tbody').appendChild(row);
  fragment.classList.remove('d-none');
};

window.show_modal = function(selector) {
  var modal = $q1(selector);
  modal.classList.add('show');
  modal.style.display = 'block';
  window.backdrop = document.createElement('DIV');
  window.backdrop.className = 'modal-backdrop fade show';
  document.body.appendChild(window.backdrop);
};

window.hide_modal = function(selector) {
  var modal = $q1(selector);
  modal.classList.remove('show');
  modal.style.display = 'none';
  modal.qa('.tooltip').forEach(item => item.classList.remove('show'));
  if (window.backdrop) document.body.removeChild(window.backdrop);
};

window.clear_errors = function() {
  $qa('body > .alert').forEach(alert => {
    alert.parentNode.removeChild(alert);
  });
  $qa('input.is-invalid').forEach(input => {
    input.classList.remove('is-invalid');
    input.parentNode.removeChild(input.nextSibling);
  });
};

function get_result(hash, input=false) {
  var {error, data} = hash;
  if (error) {
    if (input) {
      window.display_error(error, input);
    }else{
      console.log(error);
    }
    throw error;
  }else{
    return data;
  }
}
