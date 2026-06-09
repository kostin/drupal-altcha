<?php

/**
 * Example settings.php configuration for Local Altcha Forms.
 *
 * Copy the array into your site's settings.php before enabling the module on
 * production. Form placement is configured through CAPTCHA points.
 */
$settings['local_altcha_forms'] = [
  // User-facing label.
  'robot_label' => 'Я не робот',

  // Challenge options.
  'challenge_ttl' => 900,
  'max_number' => 50000,

  // Recommended for production, especially for multi-server setups.
  // Generate a strong secret and provide it through the environment.
  'hmac_key' => getenv('LOCAL_ALTCHA_FORMS_HMAC_KEY'),
];
