# Cloudflare Worker Domain Routing

With Cloudflare, if we have a domain like `xyz.com`, can we route the traffic using a Cloudflare Worker to `abc.com/foo/bar`?

Yes. You can do that with a Cloudflare Worker.

There are two common ways:

1. Redirect `xyz.com/*` to `abc.com/foo/bar...`
   - The browser is sent to the new URL with a `301` or `302`.
   - Example: `https://xyz.com/test` -> `https://abc.com/foo/bar/test` ([Cloudflare Docs][1])
2. Proxy or rewrite traffic so the user stays on `xyz.com`, but the Worker fetches content from `abc.com/foo/bar...`
   - This is done with `fetch()` inside the Worker.
   - Cloudflare explicitly supports fetching another site or external endpoint from a Worker. ([Cloudflare Docs][2])

## Minimal Redirect Example

```js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = "https://abc.com/foo/bar" + url.pathname + url.search;
    return Response.redirect(target, 301);
  }
}
```

## Minimal Proxy Example

```js
export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const target = new URL("https://abc.com/foo/bar" + incoming.pathname + incoming.search);

    const newRequest = new Request(target.toString(), request);
    return fetch(newRequest);
  }
}
```

## Routing Options

- Use a Route if the Worker should run on an existing proxied hostname in your zone.
- Use a Custom Domain if the Worker itself should be the origin for that hostname.
- Cloudflare documents the distinction as:
  - Routes are for running a Worker in front of an existing origin.
  - Custom Domains make the Worker the origin. ([Cloudflare Docs][3])

## Practical Gotchas

- For a redirect, SEO and the browser URL both move to `abc.com/...`.
- For a proxy, cookies, absolute links, CORS, and origin assumptions on `abc.com` may need extra handling.
- Request redirect behavior in Workers also has some header and redirect nuances documented by Cloudflare. ([Cloudflare Docs][4])

## Bottom Line

- Yes, if you want `xyz.com` to send users to `abc.com/foo/bar`, use a redirect Worker.
- Yes, if you want `xyz.com` to stay visible while serving content from `abc.com/foo/bar`, use a proxying Worker.

[1]: https://developers.cloudflare.com/workers/examples/redirect/?utm_source=chatgpt.com "Redirect · Cloudflare Workers docs"
[2]: https://developers.cloudflare.com/workers/runtime-apis/fetch/?utm_source=chatgpt.com "Fetch · Cloudflare Workers docs"
[3]: https://developers.cloudflare.com/workers/configuration/routing/routes/?utm_source=chatgpt.com "Routes · Cloudflare Workers docs"
[4]: https://developers.cloudflare.com/workers/runtime-apis/request/?utm_source=chatgpt.com "Request · Cloudflare Workers docs"
