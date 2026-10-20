# Hero depth

Read this only when the hero is a photograph you will cut into planes. A type, CSS, SVG or real-3D hero gets its depth from scale, overlap and the five tools in taste.md and does not need this file. Layering is what a photographic hero needs so it does not read as a poster with text fades; it is not a baseline for every page.

## The layer contract

Write the planes in the plan before touching an image. Use only the planes the scene needs; several divs moving together are one plane.

| Plane | What it is | Movement | Rule |
|---|---|---|---|
| Far | Clean background plate | Smallest | No duplicate of the subject |
| Mid | Landscape, architecture, a surface | Moderate | Establishes scale and distance |
| Subject | Product or person, alpha cutout | Deliberate travel or scale | Stays on its support |
| Near | Cutout, framing element, detail | Strongest, restrained | Frames the subject, spares the copy |
| Atmosphere | Mist, dust, light | Slow, independent | Separates without washing out |
| Type and CTA | Semantic HTML | Stable, or staged behind the subject | Headline readable at the open |

Write the opening, the midpoint and the resolved exit in plain language. Scrolling should reveal a spatial relationship (outside becomes inside, near detail passes the viewer); floating decorations do not become meaningful because their speeds differ.

## Rates and shaping

- **Small rate differences.** A measured premium reference lags the far plane 31% behind the page, the mid 17%, the product 20%, with foreground and copy at 1x. Adjacent planes differ by ten to thirty percent; larger reads as things sliding around. Copy rides at 1x, because text must not move against what it is read on.
- **Shape the foreground for the product**: a straight edge covers the CTA within a few hundred pixels of scroll, so cut it to dip where the product is and rise at the edges.
- **Every plane is solid below its silhouette**, or the plane behind shows through as they separate. **Fade the section floor** with a gradient to the page ground over the last 200 to 300px, above every plane, so the clip line never shows.
- Three planes is plenty; five is a diorama. Pointer response is additive, never the only way to see the depth.

## Plates and cutouts without a generator

1. **Two-shot plate.** Tripod, one frame with the subject, one without. The second is the clean plate; nothing needs rebuilding.
2. **Shoot for keying.** Subject on a plain backdrop, keyed in a free editor (GIMP, Photopea) or a local background-removal tool run once as a throwaway. Inspect the alpha channel: a checkerboard or white backdrop is not transparency.
3. **Cutouts the brand already has.** Product shots are usually delivered on transparent backgrounds; a logo or packaging PNG is a subject plane with zero work.
4. **Avoid the cutout.** The photograph is the far plane; mid and near planes are SVG silhouettes (ridges, arches, frames), CSS gradients with grain for atmosphere, and the typography itself. The rates above apply unchanged.
5. **Real 3D** when the subject must rotate or respond to light, with a rendered poster for no-WebGL and reduced motion.

Whatever the route: keep contact points anchored (the person on the rock, the product on its plinth), inspect edges over light and dark grounds and through the motion for halos and seams, and give new cutout art a new filename so a phone with the old bytes cached does not ship the old art.

## Mobile, and acceptance

Do not shrink the desktop arrangement for phones. Recompose crop, subject position, contact pivot, type size, layer order, travel and scroll duration; type may sit above the subject on a phone even when it passes behind it on desktop. Keep the full headline, the subject's silhouette and the CTA with no horizontal overflow, and check a compact 360x640 as well as a typical phone.

On the sheet at the open, an intermediate position, the exit and the phone: planes visibly move at different rates; no duplicate subject, hole, halo, floating contact point or seam; the headline is readable and the scroll changes what the visitor sees; the scene resolves into the next act; reduced motion gets a complete static composition. If any of that was not looked at, say so.
