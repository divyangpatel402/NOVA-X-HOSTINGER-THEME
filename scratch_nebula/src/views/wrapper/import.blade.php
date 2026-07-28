<!-- Import scripts. -->
@if(Auth::check())
  <script src="/extensions/nebula/libraries/fetchStyle.js?{timestamp}"></script>
  <script src="/extensions/nebula/libraries/currentPage.js?{timestamp}"></script>
  <script src="/extensions/nebula/libraries/fetchServerId.js?{timestamp}"></script>
  <script src="/extensions/nebula/libraries/statusOrb.js?{timestamp}"></script>
  <script src="/extensions/nebula/libraries/customContextMenu.js?{timestamp}"></script>
  <script src="/extensions/nebula/libraries/copyapi.js?{timestamp}"></script>
  <script src="/extensions/nebula/libraries/assignElementIds.js?{timestamp}"></script>
  <script src="/extensions/nebula/libraries/fileMode.js?{timestamp}"></script>
  <script src="/extensions/nebula/libraries/insertAboveApp.js?{timestamp}"></script>
  <script src="/extensions/nebula/libraries/sidebarMiddleClick.js?{timestamp}"></script>
  <script src="/extensions/nebula/libraries/viewportVisibility.js?{timestamp}"></script>
  <script src="/extensions/nebula/libraries/floatingWindows.js?{timestamp}"></script>
  @if($n_keyboard_shortcuts == "1")<script src="/extensions/nebula/libraries/keybinds.js?{timestamp}"></script>@endif
  @if($n_keyboard_shortcuts == "1")<script src="/extensions/nebula/libraries/keybindsModal.js?{timestamp}"></script>@endif
  @if($n_alert == "1")<script src="https://cdn.nebula.style/modules/marked/marked.min.js?{timestamp}" crossorigin="anonymous"></script>@endif
  <script src="/extensions/nebula/libraries/assets/popper.min.js"></script>
  <script src="/extensions/nebula/libraries/assets/tippy-bundle.umd.min.js"></script>
@endif
<script src="/extensions/nebula/libraries/errorHandler.js?{timestamp}"></script>
<script src="/extensions/nebula/libraries/locationchange.js?{timestamp}"></script>
<script src="https://cdn.nebula.style/modules/dart.js?{random}"></script>
<?php if($blueprint->dbGet("nebula", "plausible_tracking") == 1) { echo('<script defer="" data-domain="demo.nebula.style" src="https://plausible.prpl.wtf/js/script.js"></script>'); } ?>

<!-- Import stylesheets. -->
<style>
  @import url("/extensions/nebula/libraries/statusOrb.css?{timestamp}");
  @import url("/extensions/nebula/libraries/fixUserInterfaceBugs.css?{timestamp}");
  @import url("/extensions/nebula/libraries/customContextMenu.css?{timestamp}");
  @import url("/extensions/nebula/libraries/fileMode.css?{timestamp}");
  @import url("/extensions/nebula/libraries/borderRadius.css?{timestamp}");
  @import url("/extensions/nebula/libraries/extendedStyles.css?{timestamp}");
  @import url("/extensions/nebula/libraries/tagStyling.css?{timestamp}");
  @import url("/extensions/nebula/libraries/floatingWindows.css?{timestamp}");
  @import url("/extensions/nebula/libraries/patterns.css?{timestamp}");
  @import url("/extensions/nebula/libraries/animations.css?{timestamp}");

  @if($n_server_list == "cards")
    @import url("/extensions/nebula/libraries/serversCards.css?{timestamp}");
  @else
    @import url("/extensions/nebula/libraries/serversList.css?{timestamp}");
  @endif

  @if($n_keyboard_shortcuts == "1")
    @import url("/extensions/nebula/libraries/keybindsModal.css?{timestamp}");
  @endif

  @if($n_server_overview_graphs == "0")
    @import url("/extensions/nebula/libraries/hideServerOverviewGraphs.css?{timestamp}");
  @endif

  @if($n_dashboard_transparency != "0")
    @import url("/extensions/nebula/libraries/transparentUI.css?{timestamp}");
    @import url("/extensions/nebula/libraries/extendedStylesTransparency.css?{timestamp}");
  @endif

  @if($n_sidebar_hover_tooltip == "1")
    @import url("/extensions/nebula/libraries/sidebarTooltip.css?{timestamp}");
  @endif

  @if($n_website_links == "1")
    @import url("/extensions/nebula/libraries/weblinks.css?{timestamp}");
  @endif

  @if($n_alert == "1")
    @import url("/extensions/nebula/libraries/alert.css?{timestamp}");
  @endif

  @if($n_watermark_auth != "0")
    @import url("/extensions/nebula/libraries/authWatermark.css?{timestamp}");
  @endif

  @if($blueprint->dbGet("settings", "recaptcha:enabled") == "true")
    @import url("/extensions/nebula/libraries/recaptcha.css?{timestamp}");
  @endif

  @if(!Auth::check())
    @import url("/extensions/nebula/libraries/hideRecaptcha.css?{timestamp}");
    @import url("/extensions/nebula/libraries/extendedStylesAuth.css?{timestamp}");
  @endif

  <?php 
    /* Icon theme imports
    *
    * Nebula fetches icon themes from multiple sources: cdn.nebula.style and private.nebula.style. 
    * "private.nebula.style" is only used for assets we ("Emma (prpl.wtf)") had to purchase a commercial license for.
    */
  ?>
  @import url("https://cdn.nebula.style/icons/bootstrap/bootstrap-icons.css");
  @if($n_icon_fallback == "feather")                 @import url("https://cdn.nebula.style/icons/feather/feather-icons.css"); @endif
  @if($n_icon_fallback == "lucide")                  @import url("https://cdn.nebula.style/icons/lucide/lucide.css"); @endif
  @if($n_icon_fallback == "material")                @import url("https://cdn.nebula.style/icons/materialdesign/default/materialdesignicons.css"); @endif
  @if($n_icon_fallback == "material-light")          @import url("https://cdn.nebula.style/icons/materialdesign/light/materialdesignicons-light.css"); @endif
  @if($n_icon_fallback == "fontawesome")             @import url("https://cdn.nebula.style/icons/fontawesome/fontawesome.css"); @endif
  @if($n_icon_fallback == "eva-outline")             @import url("https://cdn.nebula.style/icons/eva/evaicons.css"); @endif
  @if($n_icon_fallback == "eva-solid")               @import url("https://cdn.nebula.style/icons/eva/evaicons.css"); @endif
  @if($n_icon_fallback == "remix-outline")           @import url("https://cdn.nebula.style/icons/remix/remixicon.css"); @endif
  @if($n_icon_fallback == "remix-solid")             @import url("https://cdn.nebula.style/icons/remix/remixicon.css"); @endif
  @if($n_icon_fallback == "tabler")                  @import url("https://cdn.nebula.style/icons/tabler/tabler.css"); @endif
  @if($n_icon_fallback == "octicons")                @import url("https://cdn.nebula.style/icons/octicons/octicons.css"); @endif
  @if($n_icon_fallback == "akar-icons")              @import url("https://cdn.nebula.style/icons/akar-icons/akar-icons.css"); @endif
  @if($n_icon_fallback == "hugeicons-solid")         @import url("https://private.nebula.style/icons/hugeicons/hugeicons-font.css"); @endif
  @if($n_icon_fallback == "hugeicons-stroke")        @import url("https://private.nebula.style/icons/hugeicons/hugeicons-font.css"); @endif
</style>