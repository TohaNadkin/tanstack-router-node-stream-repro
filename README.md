# renderRouterToStream on Node.js: React 19.1 vs 19.2+

Minimal reproducer: `renderRouterToStream` from `@tanstack/react-router/ssr/server` switches from
`renderToPipeableStream` to `renderToReadableStream` on Node.js after upgrading React to 19.2+.

`repro.mjs` wraps both React streaming APIs, renders a single root route through
`createRequestHandler` + `renderRouterToStream`, and prints which API was called.

## Run

```bash
npm install
npm start
```

Output with React 19.3.1:

```
renderRouterToStream called: renderToReadableStream
react-dom 19.3.1
react-dom/server (Node build) exports: renderToReadableStream=function, renderToPipeableStream=function
```

## Compare with React 19.1

```bash
npm install --no-save react@19.1.1 react-dom@19.1.1
npm start
```

Output:

```
renderRouterToStream called: renderToPipeableStream
react-dom 19.1.1
react-dom/server (Node build) exports: renderToReadableStream=undefined, renderToPipeableStream=function
```
