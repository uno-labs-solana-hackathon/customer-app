'use strict';

const $q1 = (selector) => document.querySelector(selector);
const $qa = (selector) => Array.from(document.querySelectorAll(selector));
HTMLElement.prototype.q1 = function(selector) { return this.querySelector(selector) };
HTMLElement.prototype.qa = function(selector) { return Array.from(this.querySelectorAll(selector)) };

window.prepare = function(body) {
  if (body.q1('section.wallet')) window.load_wallet_library(body);
};

window.load_wallet_library = function(body) {
  var section = body.q1('section.wallet');
  if (section) {
    var libs = section.dataset.libraries.split(',');
    libs.forEach(lib => {
      if (!document.head.q1(`script[src="${lib}"]`)) {
        var script = document.createElement('script');
        script.onload = function() { window.load_wallet_library(body) };
        script.src = lib;
        document.head.appendChild(script);
      }
    });
  }
  if (typeof(Module) == 'undefined' || !Module || !Module.Wallet || !window.prepare_wallet) { 
    setTimeout(function() { window.load_wallet_library(body) }, 20);
  }else{
    window.prepare_wallet(body);
  }
};

document.addEventListener("DOMContentLoaded", function() {
  window.prepare(document.body);
});
