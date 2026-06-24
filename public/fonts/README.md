# Custom fonts

To use the **real Advercase** display font instead of the EB Garamond stand-in:

1. Download Advercase from https://indieground.net/product/advercase-font/
   (note: the free version is **personal use only** — since this site sells
   commissions, you'll want the **commercial license** for the live site).
2. Put the web font file here, e.g. `Advercase.woff2`.
3. In `app/layout.js`, follow the commented instructions to switch from
   `EB_Garamond` to the local `Advercase` file.

That's it — the rest of the styling already points at the display font variable.
