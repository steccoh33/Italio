// Patches next-themes@0.4.6 so its no-flash inline <script> only renders on
// the initial SSR/hydration pass, not on later client-side remounts.
//
// Why: under next-intl's [locale] root segment, switching locales makes
// Next.js remount the whole root layout (including ThemeProvider) on the
// client. React 19.2 then warns "Encountered a script tag while rendering
// React component" for the script next-themes re-creates on that remount.
// It's harmless (theming still works via the provider's effects), but the
// warning is noisy. Upstream fix: https://github.com/pacocoursey/next-themes/issues/397
// (not merged as of next-themes 0.4.6). This applies the same patch the
// issue's author verified, via patch-package instead of a pnpm patch.
"use strict";

/* eslint-disable @typescript-eslint/no-require-imports -- plain Node CJS script */
const fs = require("fs");
const path = require("path");

const targets = [
  {
    // ESM build (what Next.js actually resolves for `import ... from "next-themes"`).
    file: "node_modules/next-themes/dist/index.mjs",
    flagInsertion: {
      from: '"use client";import*as t from"react";',
      to: '"use client";import*as t from"react";let tsHasMounted=!1;',
    },
    memoPatch: {
      from: '_=t.memo(({forcedTheme:e,storageKey:i,attribute:s,enableSystem:u,enableColorScheme:m,defaultTheme:a,value:l,themes:h,nonce:d,scriptProps:w})=>{let p=JSON.stringify([s,i,a,e,h,l,u,m]).slice(1,-1);return t.createElement("script",{...w,suppressHydrationWarning:!0,nonce:typeof window=="undefined"?d:"",dangerouslySetInnerHTML:{__html:`(${M.toString()})(${p})`}})})',
      to: '_=t.memo(({forcedTheme:e,storageKey:i,attribute:s,enableSystem:u,enableColorScheme:m,defaultTheme:a,value:l,themes:h,nonce:d,scriptProps:w})=>{let p=JSON.stringify([s,i,a,e,h,l,u,m]).slice(1,-1);t.useEffect(()=>{tsHasMounted=!0},[]);return tsHasMounted?null:t.createElement("script",{...w,suppressHydrationWarning:!0,nonce:typeof window=="undefined"?d:"",dangerouslySetInnerHTML:{__html:`(${M.toString()})(${p})`}})})',
    },
  },
  {
    // CJS build (kept in sync in case anything require()s it).
    file: "node_modules/next-themes/dist/index.js",
    flagInsertion: {
      from: 'module.exports=z(ee);var t=j(require("react"));',
      to: 'module.exports=z(ee);var t=j(require("react"));var tsHasMounted=!1;',
    },
    memoPatch: {
      from: 'Y=t.memo(({forcedTheme:e,storageKey:s,attribute:n,enableSystem:l,enableColorScheme:o,defaultTheme:d,value:u,themes:h,nonce:m,scriptProps:w})=>{let p=JSON.stringify([n,s,d,e,h,u,l,o]).slice(1,-1);return t.createElement("script",{...w,suppressHydrationWarning:!0,nonce:typeof window=="undefined"?m:"",dangerouslySetInnerHTML:{__html:`(${I.toString()})(${p})`}})})',
      to: 'Y=t.memo(({forcedTheme:e,storageKey:s,attribute:n,enableSystem:l,enableColorScheme:o,defaultTheme:d,value:u,themes:h,nonce:m,scriptProps:w})=>{let p=JSON.stringify([n,s,d,e,h,u,l,o]).slice(1,-1);t.useEffect(()=>{tsHasMounted=!0},[]);return tsHasMounted?null:t.createElement("script",{...w,suppressHydrationWarning:!0,nonce:typeof window=="undefined"?m:"",dangerouslySetInnerHTML:{__html:`(${I.toString()})(${p})`}})})',
    },
  },
];

function applyOne(content, file, { from, to }, label) {
  const occurrences = content.split(from).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `Expected exactly 1 match for ${label} in ${file}, found ${occurrences}. ` +
        "The installed next-themes version may differ from what this patch targets."
    );
  }
  return content.replace(from, to);
}

for (const { file, flagInsertion, memoPatch } of targets) {
  const filePath = path.join(__dirname, "..", file);
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes("tsHasMounted")) {
    console.log(`Already patched: ${file}`);
    continue;
  }

  content = applyOne(content, file, flagInsertion, "flag declaration");
  content = applyOne(content, file, memoPatch, "ThemeScript memo");

  fs.writeFileSync(filePath, content);
  console.log(`Patched: ${file}`);
}
