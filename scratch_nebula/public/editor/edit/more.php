<?php
  require __DIR__ . '/../../../../../../vendor/autoload.php';
  $app = require_once __DIR__.'/../../../../../../bootstrap/app.php';
  $app->make(Illuminate\Contracts\Http\Kernel::class)->handle(Illuminate\Http\Request::capture());

  use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Client\BlueprintClientLibrary as BlueprintExtensionLibrary;
  $settings = app()->make('Pterodactyl\Contracts\Repository\SettingsRepositoryInterface');
  $blueprint = app()->make(BlueprintExtensionLibrary::class, ['settings' => $settings]);

  $userId = Auth::id(); // fetch authenticated user's ID
  $user = Auth::user(); // fetch authenticated user
  if($user == false) { echo('401 Unauthorized'); return; }
  if($user->root_admin != 1) { echo('403 Forbidden'); return; }
?>
<head>
  <link rel="stylesheet" href="../assets/base.css">
  <link rel="stylesheet" href="../assets/css/modes/previewless.css">
  <script src="../assets/js/navigation.js"></script>
  <script src="../assets/js/editor.js"></script>
  <!-- popperjs --> <script src="https://unpkg.com/@popperjs/core@2"></script>
  <!-- tippy.js --> <script src="https://unpkg.com/tippy.js@6"></script>
  <!-- tippy.js --> <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/animations/shift-away.css">
  <style>.match-dashboard-bg {background-color: <?php echo $blueprint->dbGet("nebula", "palette_dashboard_7"); ?> !important;} .match-auth-bg {background-color: <?php echo $blueprint->dbGet("nebula", "palette_auth_1"); ?> !important;}</style>
  <title>X HUB HOSTINGER Designer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/extensions/nebula/editor/assets/favicon.ico">
  <?php if($blueprint->dbGet("nebula", "plausible_tracking") == 1) { echo('<script defer="" data-domain="demo.nebula.style" src="https://plausible.prpl.wtf/js/script.js"></script>'); } ?>
</head>

<html style="background-color: #050404">
  <body>
    <div class="container">
      <div class="navigation">
        <button onclick="navigationAction('admin')" to="admin" class="return-button"><i class="bi bi-arrow-90deg-left"></i></button>
        <div style="height: 80px;"></div>
        <button onclick="navigationAction('general')" to="general" class="navigation-button"><i class="bi bi-sliders2"></i></button>
        <button onclick="navigationAction('palette')" to="palette" class="navigation-button"><i class="bi bi-palette2"></i></button>
        <button onclick="navigationAction('sidebar')" to="sidebar" class="navigation-button"><i class="bi bi-layout-sidebar-inset"></i></button>
        <button onclick="navigationAction('dashboard')" to="dashboard" class="navigation-button"><i class="bi bi-grid-1x2"></i></button>
        <button onclick="navigationAction('authentication')" to="authentication" class="navigation-button"><i class="bi bi-box-arrow-in-right"></i></button>
        <button onclick="navigationAction('more')" to="more" class="navigation-button active"><i class="bi bi-nut"></i></button>
        <div class="save-padding"></div>
        <button onclick="saveAction()" class="save-button"><i class="bi bi-floppy-fill"></i></button>
      </div>
      <div class="editor fade">
        <form action="/admin/extensions/nebula" method="POST" id="editor-form" autocomplete="off">
          <div class="editor-container">
            <h2 class="editor-title">Miscellaneous</h2>
            <p class="editor-description">Uncategorized and advanced features.</p>

            <!-- Page indexing -->
            <div class="option">
              <p class="option-title">Page indexing</p>
              <!-- Enabled -->
              <input type="radio" id="pageindexing-on" name="page_indexing" value="1" class="hidden" <?php if($blueprint->dbGet("nebula", "page_indexing") == "1") { echo("checked=''"); } ?>>
              <label for="pageindexing-on" class="option-radio">
                <img src="../assets/images/more/pageindexing/on.png" loading="lazy" class="aspect-16:9"/>
              </label>
              <!-- Disabled -->
              <input type="radio" id="pageindexing-off" name="page_indexing" value="0" class="hidden" <?php if($blueprint->dbGet("nebula", "page_indexing") == "0") { echo("checked=''"); } ?>>
              <label for="pageindexing-off" class="option-radio">
                <img src="../assets/images/more/pageindexing/off.png" loading="lazy" class="aspect-16:9"/>
              </label>
              <p class="option-footer">This feature scans for additional pages and groups them into a 'more' button on your sidebar. This feature is useful for Pterodactyl installations with non-standard pages.</p>
            </div>

            <!-- Factory settings -->
            <div class="option">
              <p class="option-title">Factory settings</p>
              <button class="option-button button-danger height-auto width-auto force-square" onclick="notify('#notif-reset')" type="button"><i class="bi bi-trash3-fill" style="font-size: 40px"></i></button>
              <input type="radio" name="reset" id="reset" value="1" class="hidden">
              <p class="option-footer">Reset all your changes back to factory settings. Restoring to factory settings is <b><u>permanent</u></b> and cannot be undone.</p>
            </div>
          </div>
          
          <div id="editor-submit">
            <input type="hidden" name="_token" value="<?php echo csrf_token(); ?>">
            <input type="hidden" name="_endpoint" value="/extensions/nebula/editor/edit/more.php">
            <input type="hidden" name="_method" value="PATCH">
            <button type="submit" class="hidden" id="submit"></button>
          </div>
        </form>
      </div>
      <div id="notif-unsaved" class="notif">
        <div class="notif-hitbox"></div>
        <div class="notif-container">
          <h2 class="notif-title">
            <i class="bi bi-exclamation-triangle-fill" style="margin-right: 4px;"></i>
            Unsaved changes!
          </h2>
          <p class="notif-text">You made changes that haven't been saved yet, do you want to save them?</p>
          <button class="notif-button notif-primary" id="unsaved-save" onclick="saveUnsaved()" type="button">Save</button>
          <button class="notif-button" id="unsaved-discard" onclick="discardUnsaved()" type="button">Discard</button>
          <button class="button-close notif-button align-right" id="unsaved-cancel" type="button">Cancel</button>
        </div>
      </div>
      <div id="notif-reset" class="notif">
        <div class="notif-hitbox"></div>
        <div class="notif-container">
          <h2 class="notif-title">
            <i class="bi bi-trash3-fill" style="margin-right: 4px;"></i>
            Reset X HUB HOSTINGER
          </h2>
          <p class="notif-text">Restore all of your changes to factory settings, this cannot be undone.</p>
          <button class="notif-button notif-danger" id="reset-confirm" onclick="factoryReset()" type="button">Reset</button>
          <button class="button-close notif-button align-right" id="reset-cancel" type="button">Cancel</button>
        </div>
      </div>
      <div id="notif-reset-done" class="notif">
        <div class="notif-hitbox"></div>
        <div class="notif-container">
          <h2 class="notif-title">
            <i class="bi bi-check-circle-fill" style="margin-right: 4px;"></i>
            Reset complete
          </h2>
          <p class="notif-text">Successfully restored nebula's configuration to factory defaults.</p>
          <button class="button-close notif-button" type="button">Dismiss</button>
        </div>
      </div>
    </div>
  </body>
</html>

<script>
  function factoryReset() {
    element("#reset-confirm").innerHTML = "<span style='opacity:0'>.</span>"+SPINNER_SM+"<span style='opacity:0'>.</span>";
    element("#reset-cancel").disabled = true
    element("#reset-cancel").style.opacity = ".6"
    element("#notif-reset > .notif-hitbox").onclick = undefined
    setTimeout(() => {
      element("input[name='_endpoint']").value = "/admin/extensions/nebula"
      element("#reset").click()
      element("#submit").click()
    }, 4000)
  }

  document.addEventListener("DOMContentLoaded", function (event) {
    const params = new URL(window.location).searchParams;
    if(params.get('reset') == "true") {
      notify("#notif-reset-done")
    }
  });
</script>