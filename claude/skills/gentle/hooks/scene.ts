// Plum night with pink glows in two corners and petals drifting along the edges,
// clear of the middle (text) and the foot (message box).
export const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
@keyframes drift { 0% { transform: translate(0,0) rotate(0deg); opacity: 0 } 10% { opacity: .85 } 90% { opacity: .85 } 100% { transform: translate(-260px,620px) rotate(220deg); opacity: 0 } }
@keyframes breathe { 0%,100% { opacity: .55 } 50% { opacity: .85 } }
.glow { animation: breathe 14s ease-in-out infinite }
.g2 { animation-delay: -7s }
.p { animation: drift linear infinite; transform-box: fill-box; transform-origin: center }
.p1 { animation-duration: 26s } .p2 { animation-duration: 34s; animation-delay: -9s }
.p3 { animation-duration: 30s; animation-delay: -17s } .p4 { animation-duration: 38s; animation-delay: -4s }
.p5 { animation-duration: 28s; animation-delay: -21s } .p6 { animation-duration: 42s; animation-delay: -13s }
@media (prefers-reduced-motion: reduce) { .p, .glow { animation: none } }
</style>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F1420"/><stop offset=".55" stop-color="#1A1218"/><stop offset="1" stop-color="#150E14"/></linearGradient>
<radialGradient id="pink" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#F095C8" stop-opacity=".38"/><stop offset="1" stop-color="#F095C8" stop-opacity="0"/></radialGradient>
<radialGradient id="rose" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#D7A0B8" stop-opacity=".26"/><stop offset="1" stop-color="#D7A0B8" stop-opacity="0"/></radialGradient>
<path id="petal" d="M0-14C9-9 11 4 0 14C-11 4-9-9 0-14Z"/>
</defs>
<rect width="1600" height="1000" fill="url(#bg)"/>
<ellipse class="glow" cx="1480" cy="90" rx="560" ry="420" fill="url(#pink)"/>
<ellipse class="glow g2" cx="80" cy="980" rx="520" ry="380" fill="url(#rose)"/>
<g fill="#F095C8">
<use href="#petal" class="p p1" x="1380" y="-30"/>
<use href="#petal" class="p p2" x="1520" y="-60" fill="#D7A0B8"/>
<use href="#petal" class="p p3" x="1250" y="-40"/>
<use href="#petal" class="p p4" x="300" y="-50" fill="#D7A0B8"/>
<use href="#petal" class="p p5" x="160" y="-20"/>
<use href="#petal" class="p p6" x="1600" y="200" fill="#E9B6CE"/>
</g>
</svg>`
