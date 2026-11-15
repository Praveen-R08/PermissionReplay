# Permission Replay

Permission Replay is a browser privacy simulator. Paste a public HTTPS URL to inspect its HTML and a bounded set of same-origin scripts for evidence of permission requests. Each detected option links to a scenario where you can simulate granting, denying, or ending access with fictional data.

The scanner reads source without executing it. A match indicates a potential request and can come from code that never runs in your browser. Requests triggered after sign-in or in dynamically loaded code can be missed.

## Build

Run `node worker/build.mjs` from the repository root. It produces `dist/server/index.js`, a Cloudflare Worker module that serves the frontend and handles `POST /api/scan`. The build uses Node.js built-in modules and needs no dependency installation.

Scenario timelines are stored in your browser when local storage is available. Reports can be exported as text.
