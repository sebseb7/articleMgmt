/** Static login markup + styles for first paint before React loads. */

export function loginShellCss() {
  return `
    .login-prerender {
      box-sizing: border-box;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #134e4a;
    }
    .login-prerender *,
    .login-prerender *::before,
    .login-prerender *::after {
      box-sizing: inherit;
    }
    .login-prerender__card {
      width: 100%;
      max-width: 400px;
      padding: 32px;
      background: #f7fbfb;
      border: 1px solid rgba(13, 148, 136, 0.24);
      border-radius: 10px;
    }
    .login-prerender__header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 24px;
    }
    .login-prerender__title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 400;
      line-height: 1.334;
    }
    .login-prerender__subtitle {
      margin: 0 0 24px;
      font-size: 0.875rem;
      line-height: 1.43;
      color: #4f6d6b;
    }
    .login-prerender__field {
      margin-bottom: 16px;
    }
    .login-prerender__field:last-of-type {
      margin-bottom: 24px;
    }
    .login-prerender__label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.875rem;
      color: #0f766e;
    }
    .login-prerender__input {
      width: 100%;
      padding: 16.5px 14px;
      font: inherit;
      font-size: 1rem;
      color: #134e4a;
      background: #f7fbfb;
      border: 1px solid rgba(13, 148, 136, 0.24);
      border-radius: 10px;
    }
    .login-prerender__input:focus {
      outline: 2px solid #0f766e;
      outline-offset: 0;
      border-color: #0f766e;
    }
    .login-prerender__submit {
      width: 100%;
      min-height: 48px;
      padding: 8px 22px;
      font: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      line-height: 1.75;
      color: #ffffff;
      background: linear-gradient(135deg, #115e59 0%, #0f766e 100%);
      border: none;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
      cursor: pointer;
    }
  `.trim();
}

export function loginShellHtml() {
  return `
<main class="login-prerender" data-prerender="login">
  <form class="login-prerender__card" autocomplete="off" aria-label="Sign in">
    <div class="login-prerender__header">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="#0f766e" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2M9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6m9 14H6V10h12v10m-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2"/>
      </svg>
      <h1 class="login-prerender__title">SumUp Article Editor</h1>
    </div>
    <p class="login-prerender__subtitle">Sign in to manage articles.</p>
    <div class="login-prerender__field">
      <label class="login-prerender__label" for="login-prerender-username">Username</label>
      <input class="login-prerender__input" id="login-prerender-username" name="username" type="text" autocomplete="off" autofocus />
    </div>
    <div class="login-prerender__field">
      <label class="login-prerender__label" for="login-prerender-password">Password</label>
      <input class="login-prerender__input" id="login-prerender-password" name="password" type="password" autocomplete="off" />
    </div>
    <button class="login-prerender__submit" type="submit">Sign in</button>
  </form>
</main>
  `.trim();
}

/** Inject prerendered login shell into a built or template index.html document. */
export function injectLoginShell(html) {
  const withCss = html.includes('id="login-prerender"')
    ? html
    : html.replace('</head>', `<style id="login-prerender">${loginShellCss()}</style>\n</head>`);

  if (withCss.includes('data-prerender="login"')) {
    return withCss;
  }

  return withCss.replace(
    '<div id="root"></div>',
    `<div id="root">${loginShellHtml()}</div>`,
  );
}
