# renderRouterToStream on Node.js: React 19.1 vs 19.2+

Minimal reproducer: `renderRouterToStream` from `@tanstack/react-router/ssr/server` switches from
`renderToPipeableStream` to `renderToReadableStream` on Node.js after upgrading React to 19.2+.

The project is a tiny SSR site: a plain Node.js HTTP server renders a TanStack Router route tree
through `createRequestHandler` + `renderRouterToStream`. Both React streaming APIs are wrapped,
and every page shows which one was used for the request (also sent as the `x-react-stream-api`
response header and printed to the server log).

## Run

```bash
npm install
npm start
```

Open http://localhost:3000. With React 19.3.1 the page shows:

```
Hello from SSR
react-dom: 19.3.1
@tanstack/react-router: 1.170.46
React streaming API used by renderRouterToStream: renderToReadableStream
```

## Compare with React 19.1

```bash
npm install --no-save react@19.1.1 react-dom@19.1.1
npm start
```

The page now shows:

```
react-dom: 19.1.1
React streaming API used by renderRouterToStream: renderToPipeableStream
```

## Why

Up to React 19.1, the Node build of `react-dom/server` exported only `renderToPipeableStream`.
Since React 19.2 it also exports `renderToReadableStream`, and `renderRouterToStream` checks for
`renderToReadableStream` first, so Node.js apps switch to Web Streams after the React upgrade.

`npm run repro` runs a one-off script (`repro.mjs`) that prints the same result without starting a server.
