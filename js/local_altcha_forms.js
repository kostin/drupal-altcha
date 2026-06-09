(function (Drupal) {
  'use strict';

  function bytesToHex(bytes) {
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  function toBase64(value) {
    return btoa(unescape(encodeURIComponent(value)));
  }

  async function sha256(value) {
    var data = new TextEncoder().encode(value);
    var digest = await crypto.subtle.digest('SHA-256', data);
    return bytesToHex(new Uint8Array(digest));
  }

  async function solveChallenge(challenge) {
    var max = Number(challenge.maxnumber || challenge.maxNumber || 50000);
    for (var number = 0; number <= max; number++) {
      if (await sha256(challenge.salt + number) === challenge.challenge) {
        return number;
      }
    }
    throw new Error('Altcha solution not found');
  }

  Drupal.behaviors.localAltchaForms = {
    attach: function (context) {
      var checkboxes = context.querySelectorAll
        ? context.querySelectorAll('.local-altcha-checkbox:not([data-local-altcha-ready])')
        : [];

      Array.prototype.forEach.call(checkboxes, function (checkbox) {
        checkbox.setAttribute('data-local-altcha-ready', '1');
        var form = checkbox.closest('form');
        var payload = form ? form.querySelector('.local-altcha-payload') : null;
        var item = checkbox.closest('.form-item');
        var status = item ? item.querySelector('.local-altcha-status') : null;

        checkbox.addEventListener('change', async function () {
          if (!payload) {
            checkbox.checked = false;
            return;
          }

          payload.value = '';
          if (!checkbox.checked) {
            if (status) {
              status.textContent = '';
            }
            return;
          }

          checkbox.disabled = true;
          if (status) {
            status.textContent = ' Checking...';
          }

          try {
            var response = await fetch(checkbox.getAttribute('data-challenge-url') || '/altcha/challenge', {
              cache: 'no-store',
              credentials: 'same-origin'
            });
            if (!response.ok) {
              throw new Error('Challenge request failed');
            }

            var challenge = await response.json();
            var number = await solveChallenge(challenge);
            payload.value = toBase64(JSON.stringify({
              algorithm: challenge.algorithm,
              challenge: challenge.challenge,
              number: number,
              salt: challenge.salt,
              signature: challenge.signature
            }));

            if (status) {
              status.textContent = ' Ready';
            }
          }
          catch (e) {
            checkbox.checked = false;
            if (status) {
              status.textContent = ' Verification failed';
            }
          }
          finally {
            checkbox.disabled = false;
          }
        });
      });
    }
  };
})(Drupal);
