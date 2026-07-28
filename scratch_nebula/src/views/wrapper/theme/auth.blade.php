@if(Auth::check() != true)
<script>
  document.querySelector("head > meta[name='theme-color'][content='#0e4688']").setAttribute("content", "{{ $n_palette_auth_1 }}")
</script>

<!-- X HUB HOSTINGER AUTH THEME - Wispbyte Inspired -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

<style id="xhub-auth-theme">

  /* ===== GLOBAL RESETS ===== */
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    font-family: 'Inter', sans-serif !important;
    min-height: 100vh;
  }
  @if($n_auth_background_image != "")
    body {
      background: url("{{ $n_auth_background_image }}") no-repeat center center fixed !important;
      background-size: cover !important;
    }
    @if($n_auth_background_appearance == "1")
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        background: inherit;
        filter: blur(30px);
        z-index: -1;
      }
    @endif
    @if($n_auth_background_appearance == "2")
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        z-index: 0;
        pointer-events: none;
      }
    @endif
  @else
    html, body {
      background: radial-gradient(ellipse at center, #191b1e 30%, #000000 100%) !important;
    }
  @endif

  /* ===== PROGRESS BAR ===== */
  div.ProgressBar___StyledDiv-sc-14ayc3f-1.jleFWY {
    position: fixed !important;
    z-index: 100 !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
  }

  /* ===== PTERODACTYL APP OVERRIDES ===== */
  div.App___StyledDiv-sc-2l91w7-0.fnfeQw {
    background-color: transparent !important;
    background: none !important;
    z-index: 1 !important;
  }
  .LoginFormContainer___StyledDiv-sc-cyh04c-3 {
    background: none !important;
    background-color: transparent !important;
    box-shadow: none !important;
  }
  div.LoginFormContainer___StyledDiv2-sc-cyh04c-4 { display: none; }

  /* ===== HIDE DEFAULT WALLPAPER / BACKDROP / WATERMARK ===== */
  .nebula-auth-wallpaper { display: none !important; }
  .nebula-auth-backdrop { display: none !important; }
  .nebula-watermark { display: none !important; }

  /* ===== AMBIENT GLOW EFFECTS ===== */
  .xhub-ambient-glow {
    position: fixed;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 15, 15, 0.06) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
    animation: xhub-glowPulse 6s ease-in-out infinite;
  }
  .xhub-ambient-glow-1 { top: 10%; left: 15%; }
  .xhub-ambient-glow-2 { bottom: 10%; right: 15%; animation-delay: 3s; }
  @keyframes xhub-glowPulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }

  /* ===== NAVBAR ===== */
  .xhub-navbar {
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    width: calc(100% - 30px);
    max-width: 1450px;
    height: 70px;
    background-color: rgb(15, 15, 20);
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.4);
    border-radius: 25px;
    text-shadow: 0px 0px 5px black;
    animation: xhub-slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .xhub-navbar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    font-size: 22px;
    font-weight: 700;
    text-decoration: none;
    letter-spacing: -0.3px;
  }
  .xhub-navbar-logo i {
    color: #ff0f0f;
    font-size: 24px;
    filter: drop-shadow(0 0 8px rgba(255,15,15,0.5));
  }
  .xhub-navbar-links {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .xhub-navbar-link {
    color: #fff;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    opacity: 0.75;
    transition: opacity 0.3s ease, background-color 0.3s ease;
    padding: 8px 14px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .xhub-navbar-link:hover {
    opacity: 1;
    background: rgba(255,255,255,0.05);
  }
  .xhub-navbar-link i { font-size: 16px; }
  .xhub-hamburger {
    display: none;
    flex-direction: column;
    cursor: pointer;
    padding: 8px;
    z-index: 1001;
  }
  .xhub-hamburger-line {
    width: 25px;
    height: 3px;
    background-color: white;
    margin: 3px 0;
    transition: all 0.3s ease;
    border-radius: 2px;
  }

  /* ===== LOGIN CONTAINER - Compact Glass Card ===== */
  @if($n_auth_customlogo != "")
    .LoginFormContainer__Container-sc-cyh04c-0.cEWvSE .LoginFormContainer___StyledH-sc-cyh04c-1.hpqfJy {
      content: url("{{ $n_auth_customlogo }}");
      border-radius: 10px;
      padding: 0;
      height: 40px;
      max-width: 100%;
      margin-left: auto;
      margin-right: auto;
      display: block;
    }
  @endif

  .LoginFormContainer__Container-sc-cyh04c-0.cEWvSE .LoginFormContainer___StyledH-sc-cyh04c-1.hpqfJy {
    padding-bottom: .25rem !important;
    padding-top: 0 !important;
    margin-bottom: 4px !important;
  }

  /* Hide internal logo inside card (we show it in navbar only) */
  .LoginFormContainer__Container-sc-cyh04c-0.cEWvSE .LoginFormContainer___StyledH-sc-cyh04c-1.hpqfJy img,
  .LoginFormContainer__Container-sc-cyh04c-0.cEWvSE .LoginFormContainer___StyledH-sc-cyh04c-1.hpqfJy svg {
    display: none !important;
  }

  div.LoginFormContainer__Container-sc-cyh04c-0 {
    z-index: 4;
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 340px !important;
    max-width: 88vw;
    background: rgba(18, 19, 23, 0.92) !important;
    border: 1px solid rgba(255, 15, 15, 0.10) !important;
    border-radius: 18px !important;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.35),
      0 0 0 1px rgba(255,255,255,0.03),
      inset 0 1px 0 rgba(255,255,255,0.04) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    padding: 26px 28px 24px !important;
    animation: xhub-cardIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important;
    overflow: visible;
    max-height: 90vh;
    overflow-y: auto;
  }

  /* ===== INPUT FIELDS ===== */
  .Input-sc-19rce1w-0.fFYzlR,
  .Input-sc-19rce1w-0.floJYL {
    background: #e8f0fe !important;
    background-color: #e8f0fe !important;
    border: none !important;
    border-radius: 10px !important;
    transition: border-color 0.3s ease, box-shadow 0.3s ease !important;
    padding: 11px 14px !important;
    height: auto !important;
    margin-bottom: 2px !important;
  }
  .Input-sc-19rce1w-0.fFYzlR:focus,
  .Input-sc-19rce1w-0.floJYL:focus {
    border-color: #ff0f0f !important;
    box-shadow: 0 0 0 3px rgba(255, 15, 15, 0.15) !important;
    outline: none !important;
  }
  input[type=text],
  input[type=password],
  input[type=email] {
    color: #000000 !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 14px !important;
    font-weight: 600 !important;
  }
  input[type=text]::placeholder,
  input[type=password]::placeholder,
  input[type=email]::placeholder {
    color: rgba(0, 0, 0, 0.35) !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 14px !important;
  }
  /* ===== INPUT LABELS RED ===== */
  label {
    color: #ff0f0f !important;
    font-size: 11px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
    letter-spacing: 1px !important;
  }

  /* ===== SIGN IN BUTTON ===== */
  .dLAOsI:not(:disabled),
  .Button__ButtonStyle-sc-1qu1gou-0.dLAOsI {
    background: linear-gradient(135deg, #ff0f0f 0%, #ff4d4d 100%) !important;
    background-color: transparent !important;
    border-radius: 10px !important;
    border: none !important;
    box-shadow: 0 2px 12px rgba(255, 15, 15, 0.18) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    padding: 10px 16px !important;
    font-weight: 600 !important;
    letter-spacing: 0.2px !important;
    width: 100% !important;
  }
  .dLAOsI:hover:not(:disabled) {
    box-shadow: 0 6px 24px rgba(255, 15, 15, 0.35) !important;
    transform: translateY(-2px) !important;
    opacity: 1 !important;
    background: linear-gradient(90deg, #ff2222 60%, #ff6b6b 100%) !important;
  }
  .dLAOsI:active:not(:disabled) {
    transform: translateY(0px) !important;
  }
  button.Button__ButtonStyle-sc-1qu1gou-0 span.Button___StyledSpan-sc-1qu1gou-2 {
    color: #fff !important;
    font-weight: 600 !important;
    font-size: 15px !important;
    font-family: 'Inter', sans-serif !important;
  }

  /* ===== REMEMBER ME ===== */
  .jtfgdV {
    border-color: #191b1e !important;
    border-radius: 4px !important;
  }

  /* ===== LINKS ===== */
  .cjgCjC { color: rgba(255, 255, 255, 0.45) !important; font-size: 12px !important; }
  .dqkKHi,
  .LoginContainer___StyledLink-sc-qtrnpk-4.cjgCjC {
    color: #ff0f0f !important;
    transition: color 0.3s ease !important;
    text-decoration: none !important;
  }
  .LoginContainer___StyledLink-sc-qtrnpk-4.cjgCjC:hover {
    color: #ff4d4d !important;
    text-decoration: underline !important;
  }

  /* ===== PTERODACTYL FOOTER - HIDE ===== */
  .LoginFormContainer___StyledP-sc-cyh04c-7.llNNfK {
    display: none !important;
  }

  /* ===== SOCIAL LINKS BAR ===== */
  .xhub-social-bar {
    position: fixed;
    z-index: 50;
    bottom: 55px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    animation: xhub-fadeIn 0.8s ease 0.4s both;
  }
  .xhub-social-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: linear-gradient(135deg, #191b1e, #1a1b20);
    border: 2px solid #191b1e;
    border-radius: 15px;
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
    font-family: 'Inter', sans-serif;
  }
  .xhub-social-link i {
    font-size: 17px;
    transition: transform 0.3s, color 0.3s;
  }
  .xhub-social-link:hover {
    transform: translateY(-3px);
    border-color: #ff0f0f;
    box-shadow: 0px 0px 20px rgba(0,0,0,0.3), 0px 0px 30px rgba(255,15,15,0.15);
    color: #fff;
  }
  .xhub-social-link:hover i { transform: scale(1.15); }
  .xhub-social-link.youtube i { color: #ff0000; }
  .xhub-social-link.youtube:hover i { color: #ff3333; }
  .xhub-social-link.instagram i { color: #e4405f; }
  .xhub-social-link.instagram:hover i { color: #f05a7a; }
  .xhub-social-link.discord i { color: #ff0f0f; }
  .xhub-social-link.discord:hover i { color: #ff4d4d; }

  /* ===== FOOTER ===== */
  .xhub-footer {
    position: fixed;
    z-index: 50;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    padding: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    font-family: 'Inter', sans-serif;
    animation: xhub-fadeIn 0.8s ease 0.6s both;
    white-space: nowrap;
  }
  .xhub-footer a {
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    transition: color 0.3s;
    font-weight: 500;
  }
  .xhub-footer a:hover { color: #ff0f0f; }
  .xhub-footer .xhub-heart {
    color: #ff4757;
    display: inline-block;
    animation: xhub-heartbeat 1.5s ease-in-out infinite;
    font-size: 12px;
  }

  /* ===== RECAPTCHA NOTIFICATION ===== */
  .xhub-recaptcha-notification {
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: rgba(25, 27, 30, 0.95);
    padding: 20px 24px;
    border-radius: 15px;
    max-width: 320px;
    z-index: 100;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,15,15,0.1);
    animation: xhub-cardIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    color: #fff;
    font-family: 'Inter', sans-serif;
  }
  .xhub-recaptcha-notification b {
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .xhub-recaptcha-notification b i { color: #ff0f0f; }
  .xhub-recaptcha-notification a { color: #ff0f0f; text-decoration: none; }
  .xhub-recaptcha-notification a:hover { text-decoration: underline; }

  /* ===== ANIMATIONS ===== */
  @keyframes xhub-fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes xhub-cardIn {
    from { opacity: 0; transform: translate(-50%, -50%) translateY(16px) scale(0.97); }
    to { opacity: 1; transform: translate(-50%, -50%) translateY(0) scale(1); }
  }
  @keyframes xhub-slideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes xhub-heartbeat {
    0%, 100% { transform: scale(1); }
    15% { transform: scale(1.25); }
    30% { transform: scale(1); }
    45% { transform: scale(1.15); }
    60% { transform: scale(1); }
  }

  /* ===== RESPONSIVE: LARGE ===== */
  @media screen and (max-width: 1100px) {
  }

  /* ===== RESPONSIVE: MOBILE ===== */
  @media screen and (max-width: 900px) {
    .xhub-navbar-links { display: none !important; }
    .xhub-hamburger { display: flex !important; }

    div.LoginFormContainer__Container-sc-cyh04c-0 {
      width: 90vw !important;
      max-width: 360px !important;
      padding: 22px 24px 20px !important;
    }

    .xhub-social-bar {
      bottom: 50px;
      gap: 8px;
    }
    .xhub-social-link {
      padding: 8px 14px;
      font-size: 12px;
      border-radius: 12px;
    }
    .xhub-social-link span { display: none; }
    .xhub-social-link i { font-size: 20px; }

    .xhub-footer { bottom: 15px; font-size: 12px; }
    .xhub-ambient-glow { display: none; }
  }

  @media screen and (max-width: 500px) {
    .xhub-navbar {
      height: 50px;
      padding: 0 14px;
      border-radius: 16px;
    }
    .xhub-navbar-logo { font-size: 15px; }
    .xhub-navbar-logo i { font-size: 17px; }

    div.LoginFormContainer__Container-sc-cyh04c-0 {
      width: 94vw !important;
      padding: 20px 20px 18px !important;
      border-radius: 14px !important;
    }

    .xhub-social-bar { gap: 6px; }
    .xhub-social-link { padding: 8px 12px; border-radius: 10px; }
    .xhub-social-link i { font-size: 18px; }
  }

  /* ===== SOCIAL LOGIN OVERRIDES ===== */
  .SocialLogin\:container {
    margin: 0 !important;
    margin-bottom: 20px !important;
    padding: 0 !important;
    background-color: transparent !important;
    box-shadow: unset !important;
  }
  .style-module_Yp7-2Fw- {
    --thisButtonColor: #191b1e !important;
    border-radius: 12px !important;
    border: 2px solid #191b1e !important;
    transition: border-color 0.3s ease, box-shadow 0.3s ease !important;
  }
  .style-module_Yp7-2Fw-:hover {
    --thisButtonColor: #1e2024 !important;
    border-color: #ff0f0f !important;
    box-shadow: 0 0 0 3px rgba(255, 15, 15, 0.15) !important;
  }

</style>
@endif
