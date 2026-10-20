#!/usr/bin/env bash
# Claude Code status line (Git Bash on Windows), in the spirit of Boris Cherny's
# tip: always see model, directory, git branch, remaining context and cost, so
# several parallel sessions are easy to tell apart at a glance.
#
#   line 1:  model  dir  ⎇ branch ✦ +a -d  ⌂ worktree  PR #n  "session name"
#   line 2:  ctx ████░░ 32% · 68% left  $1.23  12m  5h 23% · 7d 41%  effort
#
# Colors use the terminal's 16-color palette so they read on light and dark themes.

input=$(cat)

# One jq pass for every field, joined by ASCII unit separator (0x1f) so empty
# fields keep their position; tr strips the CRLF jq emits on Windows.
IFS=$'\x1f' read -r model cwd ctx_used ctx_left ctx_size cost dur_ms l_add l_del \
  rl5 rl7 wt_name pr_num pr_state effort fast sname exceeds < <(
  printf '%s' "$input" | jq -r '[
    (.model.display_name // ""),
    (.workspace.current_dir // .cwd // ""),
    (.context_window.used_percentage // ""),
    (.context_window.remaining_percentage // ""),
    (.context_window.context_window_size // ""),
    (.cost.total_cost_usd // ""),
    (.cost.total_duration_ms // ""),
    (.cost.total_lines_added // ""),
    (.cost.total_lines_removed // ""),
    (.rate_limits.five_hour.used_percentage // ""),
    (.rate_limits.seven_day.used_percentage // ""),
    (.worktree.name // .workspace.git_worktree // ""),
    (.pr.number // ""),
    (.pr.review_state // ""),
    (.effort.level // ""),
    (.fast_mode // ""),
    (.session_name // ""),
    (.exceeds_200k_tokens // "")
  ] | map(tostring) | join("")' 2>/dev/null | tr -d '\r'
)

B=$'\033[1m'; D=$'\033[90m'; R=$'\033[0m'   # 90 = bright black: readable on dark and light, unlike faint (2)
CYAN=$'\033[36m'; BLUE=$'\033[34m'; MAG=$'\033[35m'
GREEN=$'\033[32m'; YEL=$'\033[33m'; RED=$'\033[31m'
SEP="  ${D}·${R}  "

is_num() { case "$1" in ''|*[!0-9.]*) return 1;; *) return 0;; esac; }
int() { printf '%.0f' "$1" 2>/dev/null || printf '0'; }

# ---- model -----------------------------------------------------------------
model="${model% (*}"                       # strip "(1M context)" style suffix
model_part="${B}${CYAN}${model:-Claude}${R}"
[ "$ctx_size" = "1000000" ] && model_part="${model_part} ${D}1M${R}"
[ "$fast" = "true" ] && model_part="${model_part} ${YEL}⚡${R}"

# ---- directory: ~ for home, fish-style shortening of middle segments --------
disp="$cwd"
winhome=$(cygpath -w "$HOME" 2>/dev/null)
if [ -n "$winhome" ] && [ "${cwd#"$winhome"}" != "$cwd" ]; then
  disp="~${cwd#"$winhome"}"
fi
IFS='\/' read -ra parts <<< "$disp"
last=$(( ${#parts[@]} - 1 ))
short=""
for i in "${!parts[@]}"; do
  seg="${parts[$i]}"
  if [ "$i" -ne 0 ] && [ "$i" -ne "$last" ]; then
    case "$seg" in .?*) seg="${seg:0:2}";; ?*) seg="${seg:0:1}";; esac
  fi
  if [ "$i" -eq 0 ]; then short="$seg"; else short="$short\\$seg"; fi
done
[ -n "$short" ] && disp="$short"
dir_part=""; [ -n "$disp" ] && dir_part="${BLUE}${disp}${R}"

# ---- git: branch, dirty marker, +/- lines (cached 5s per directory) --------
git_part=""
if [ -n "$cwd" ]; then
  gitpath="${cwd//\\//}"
  key=$(printf '%s' "$gitpath" | tr -c 'A-Za-z0-9' '_')
  cache="${TMPDIR:-/tmp}/claude-statusline-git-${key}"
  now=$(date +%s)
  fresh=0
  if [ -f "$cache" ]; then
    mtime=$(stat -c %Y "$cache" 2>/dev/null || echo 0)
    [ $(( now - mtime )) -lt 5 ] && fresh=1
  fi
  if [ "$fresh" -eq 0 ]; then
    branch=$(git -C "$gitpath" branch --show-current 2>/dev/null)
    [ -z "$branch" ] && branch=$(git -C "$gitpath" rev-parse --short HEAD 2>/dev/null)
    dirty=""; ins=""; del=""
    if [ -n "$branch" ]; then
      [ -n "$(git -C "$gitpath" status --porcelain --untracked-files=no 2>/dev/null | head -1)" ] && dirty=1
      shortstat=$(git -C "$gitpath" diff HEAD --shortstat 2>/dev/null)
      ins=$(printf '%s' "$shortstat" | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+')
      del=$(printf '%s' "$shortstat" | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+')
    fi
    printf '%s\t%s\t%s\t%s\n' "$branch" "$dirty" "$ins" "$del" > "$cache" 2>/dev/null
  fi
  IFS=$'\t' read -r branch dirty ins del < "$cache" 2>/dev/null
  if [ -n "$branch" ]; then
    git_part="${MAG}⎇ ${branch}${R}"
    [ -n "$dirty" ] && git_part="${git_part}${YEL}✦${R}"
    if [ -n "$ins" ] || [ -n "$del" ]; then
      git_part="${git_part} ${GREEN}+${ins:-0}${R} ${RED}-${del:-0}${R}"
    fi
  fi
fi

wt_part=""; [ -n "$wt_name" ] && wt_part="${D}⌂ ${wt_name}${R}"

pr_part=""
if [ -n "$pr_num" ]; then
  case "$pr_state" in
    approved)          pc="$GREEN"; ps=" ✓";;
    changes_requested) pc="$RED";   ps=" ✗";;
    draft)             pc="$D";     ps=" draft";;
    *)                 pc="$YEL";   ps="";;
  esac
  pr_part="${pc}PR #${pr_num}${ps}${R}"
fi

sname_part=""; [ -n "$sname" ] && sname_part="${D}\"${sname}\"${R}"

# ---- context gauge ----------------------------------------------------------
gauge() { # $1 = percent used
  local pct=$1 width=10 filled i=0 fill="" rest="" cc
  is_num "$pct" || pct=0
  pct=$(int "$pct"); [ "$pct" -gt 100 ] && pct=100
  filled=$(( (pct * width + 50) / 100 ))
  while [ "$i" -lt "$filled" ]; do fill="${fill}█"; i=$((i+1)); done
  i=$filled; while [ "$i" -lt "$width" ]; do rest="${rest}░"; i=$((i+1)); done
  cc="$GREEN"; [ "$pct" -ge 50 ] && cc="$YEL"; [ "$pct" -ge 75 ] && cc="$RED"
  printf '%s' "${cc}${fill}${D}${rest}${R}"
}

ctx_part=""
if is_num "$ctx_used"; then
  used=$(int "$ctx_used")
  left=$(( 100 - used )); is_num "$ctx_left" && left=$(int "$ctx_left")
  lc="$GREEN"; [ "$used" -ge 50 ] && lc="$YEL"; [ "$used" -ge 75 ] && lc="$RED"
  ctx_part="${D}ctx${R} $(gauge "$used") ${lc}${used}%${R} ${D}· ${left}% left${R}"
  [ "$exceeds" = "true" ] && ctx_part="${ctx_part} ${RED}>200k${R}"
fi

# ---- cost / duration ---------------------------------------------------------
cost_part=""
if is_num "$cost"; then
  cost_part=$(printf '%s$%.2f%s' "$B" "$cost" "$R")
fi

dur_part=""
if is_num "$dur_ms"; then
  s=$(( $(int "$dur_ms") / 1000 ))
  if [ "$s" -ge 3600 ]; then dur_part="$(( s / 3600 ))h$(( (s % 3600) / 60 ))m"
  elif [ "$s" -ge 60 ]; then dur_part="$(( s / 60 ))m"
  else dur_part="${s}s"; fi
  dur_part="${D}${dur_part}${R}"
fi

# ---- rate limits (Pro/Max only) ---------------------------------------------
rl_part=""
rl() { # label pct
  local p; p=$(int "$2")
  local c="$GREEN"; [ "$p" -ge 50 ] && c="$YEL"; [ "$p" -ge 80 ] && c="$RED"
  printf '%s%s%s %s%s%%%s' "$D" "$1" "$R" "$c" "$p" "$R"
}
is_num "$rl5" && rl_part="$(rl 5h "$rl5")"
if is_num "$rl7"; then
  [ -n "$rl_part" ] && rl_part="${rl_part} ${D}·${R} "
  rl_part="${rl_part}$(rl 7d "$rl7")"
fi

effort_part=""; [ -n "$effort" ] && effort_part="${D}${effort}${R}"

# ---- assemble ---------------------------------------------------------------
join() { local out="" seg; for seg in "$@"; do [ -z "$seg" ] && continue
  if [ -z "$out" ]; then out="$seg"; else out="${out}${SEP}${seg}"; fi; done; printf '%s' "$out"; }

line1=$(join "$model_part" "$dir_part" "$git_part" "$wt_part" "$pr_part" "$sname_part")
line2=$(join "$ctx_part" "$cost_part" "$dur_part" "$rl_part" "$effort_part")

printf '%s\n' "$line1"
[ -n "$line2" ] && printf '%s\n' "$line2"
