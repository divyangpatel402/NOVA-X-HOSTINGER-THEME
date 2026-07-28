<html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter&display=swap&version=477012');
      @import url("https://cdn.nebula.style/icons/bootstrap/bootstrap-icons.css");
    </style>
    <script src="{webroot/public}/libraries/errorHandler.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script>
      HandleNebulaError(`
        <code>${window.location.hostname}</code>
        utilizes X HUB HOSTINGER to bring users an optimal experience.
        This page contains information that might be useful for
        debugging certain problems administrators might encounter
        with modifications such as X HUB HOSTINGER.

        <div style="
          background-color: #241e2f;
          border-radius: 7px;
          padding: 10px;
          width: max-content;
        ">
          <p style="margin: 0">
            <code>
              !{identifier} {identifier} <br>
              !{name} {name} <br>
              !{author} {author} <br>
              !{version} {version} <br>
              !{random} {random} <br>
              !{timestamp} {timestamp} <br>
              !{mode} {mode} <br>
              !{target} {target} <br>
              !{root} {root}
            </code>
          </p>
        </div>
      `, ` `)
    </script>
  </body>
</html>