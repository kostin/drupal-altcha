<?php

namespace Drupal\local_altcha_forms\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Generates local proof-of-work challenges.
 */
class AltchaController extends ControllerBase {

  /**
   * Returns an Altcha-compatible SHA-256 proof-of-work challenge.
   */
  public function challenge() {
    $settings = local_altcha_forms_settings();
    $secret = local_altcha_forms_get_hmac_key();
    $max_number = (int) $settings['max_number'];
    $expires = time() + (int) $settings['challenge_ttl'];
    $salt = bin2hex(random_bytes(16)) . '?expires=' . $expires;
    $number = random_int(1000, $max_number);

    $response = new JsonResponse([
      'algorithm' => 'SHA-256',
      'challenge' => hash('sha256', $salt . $number),
      'salt' => $salt,
      'signature' => hash_hmac('sha256', $salt . '&', $secret),
      'maxnumber' => $max_number,
    ]);
    $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    $response->headers->set('Pragma', 'no-cache');

    return $response;
  }

}
