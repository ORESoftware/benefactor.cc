# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run deploy`          | Manually publish the root-domain build to the production Pages repository |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Deployment

Pull requests run tests, dependency auditing, and a production-shape Astro
build. A successful push to `main` publishes the generated root-domain build to
`benefactor-cc/benefactor-cc.github.io`; that repository remains generated
output and must not be edited directly. Publishing uses the
`BENEFACTOR_PAGES_TOKEN` Actions secret: a fine-grained token limited to that
one generated repository with Contents read/write access. Rotate it before
2026-10-16.

The workflow reads the public Supabase telemetry configuration from repository
variables `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Leave
both unset together when no benefactor Supabase project is available; the site
still builds, while the client telemetry emitter remains disabled.

Every page layout also includes the reviewed anonymous ORES Chat footer
component from `ores-chat.github.io`. With no additional configuration it is a
safe link to the centralized public chat page. To enable the inline dialog,
set the public (non-secret) variable `PUBLIC_ORES_CHAT_API_BASE` to exactly an
HTTPS Benefactor API origin (`https://api.benefactor.cc/...` or
`https://admin-api.benefactor.cc/...`). The layout allow-lists those hosts,
adds only the required CSP `connect-src`, and never places a bearer or provider
credential in browser code. The ORES Chat public route remains anonymous and
site-scoped; customer/admin chat belongs to their separate authenticated
surfaces.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
