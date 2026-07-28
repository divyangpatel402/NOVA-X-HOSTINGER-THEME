#!/bin/bash

echo -e "\n\x1b[34;1m
▉  ▉ ▉▉▉ ▉▉  ▉ ▉ ▉    ▉
▉▉ ▉ ▉▉  ▉▉▉ ▉ ▉ ▉   ▉ ▉
▉ ▉▉ ▉▉▉ ▉▉  ▉▉▉ ▉▉▉ ▉ ▉

© 2023-2024 Emma (prpl.wtf)\x1b[0m"

echo -e "
\x1b[34;1m┃  Welcome to Nebula
\x1b[34;1m┃\x1b[0m Thank you so much for purchasing Nebula, traveler!
\x1b[34;1m┃\x1b[0m Let us know if you encounter any issues (or just
\x1b[34;1m┃\x1b[0m want to leave feedback) by sending us an email
\x1b[34;1m┃\x1b[0m or opening an issue on our issue tracker.
\x1b[34;1m┃\x1b[0m
\x1b[34;1m┃ 󰇮 \x1b[0mhello@prpl.wtf
\x1b[34;1m┃ 󰍡 \x1b[0mhttps://github.com/prplwtf/nebula/issues
"

if [[ $BLUEPRINT_DEVELOPER != true ]]; then 
  printf "\r\x1b[2;1m┃\x1b[0;2m Press 'RETURN' to continue.\x1b[0m"
  read -r
fi

printf "\r\x1b[2;1m┃\x1b[0;2m Getting everything ready..\x1b[0m"

if [[ $BLUEPRINT_DEVELOPER == true ]]; then
  printf "\r\x1b[2;1m┃\x1b[0;2m Compiling assets on the fly..\x1b[0m"
  COMPILE() {
    local dir="$1"
    for file in "$dir"/*; do
      if [ -f "$file" ]; then
        file=$(echo "$file" | sed "s~ ~\ ~g")
        if [[ $file != *"node_modules"* ]]; then
          if [[ $file == *".less" ]]; then
            echo -e "\x1b[2;1m┃\x1b[0;2m ${file} -> ${file%.less}.css\x1b[0m"
            yarn lessc "${file}" "${file%.less}.css"
          fi
        fi
      elif [ -d "$file" ]; then
        COMPILE "$file"
      fi
    done
  }
  echo "$PTERODACTYL_DIRECTORY"
  cd "$PTERODACTYL_DIRECTORY" || return
  COMPILE "{root/public}/libraries"
fi

if [[ $BLUEPRINT_DEVELOPER != true ]]; then 
  # shellcheck disable=SC1091
  source "{root/public}/editor/assets/tests/prototype" 2> /dev/null

  export LOCAL_PROTOTYPE="post"
  export LOCAL_FINDR="van.pi"
  DIRECTORY="$(pwd)"

  chmod +x \
    "{root/data}"
  mkmod +x \
    "$DIRECTORY" \
    2> /dev/null
fi

export publ1c="public"
rm -r "$PTERODACTYL_DIRECTORY/.blueprint/extensions/nebula/publ1c" 2> /dev/null
sleep 0.4

printf "\n\x1b[2;1m┃\x1b[0;2m Almost there..\x1b[0m"
sleep 1

echo -e "\n
\x1b[33m┃  Software agreements
\x1b[33m┃\x1b[0m By using Nebula you (the LICENSE BUYER and
\x1b[33m┃\x1b[0m ALL administrators) agree to our software
\x1b[33m┃\x1b[0m agreements listed on
\x1b[33m┃\x1b[0m https://cdn.nebula.style/etc/policies/
"

if [[ $BLUEPRINT_DEVELOPER != true ]]; then 
  printf "\r\x1b[2;1m┃\x1b[0;2m Press 'RETURN' to continue and agree to our
\x1b[2;1m┃\x1b[0;2m software agreements.\x1b[0m"
  read -r
  echo -e ""
else
  printf "\r\x1b[2;1m┃\x1b[0;2m By building Nebula with developer commands
\x1b[2;1m┃\x1b[0;2m you automatically agree to our software agreements.\x1b[0m"
  echo -e "\n"
fi

printf "\r\x1b[2;1m┃\x1b[0;2m Finishing up..\x1b[0m"
touch "{root/data}/a"
echo "hello world" > "{root/data}/a"

echo -e ""