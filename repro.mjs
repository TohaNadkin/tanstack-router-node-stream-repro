// Minimal reproducer: which React streaming API does renderRouterToStream use on Node.js?
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Wrap both React streaming APIs to log which one renderRouterToStream calls.
// The router imports the same `react-dom/server` module object, so the wrappers are visible to it.
const ReactDOMServer = require('react-dom/server');
for (const name of ['renderToReadableStream', 'renderToPipeableStream']) {
    const original = ReactDOMServer[name];
    if (typeof original === 'function') {
        ReactDOMServer[name] = (...args) => {
            console.log(`renderRouterToStream called: ${name}`);
            return original(...args);
        };
    }
}

const { createElement: h } = await import('react');
const { createRootRoute, createRouter } = await import('@tanstack/react-router');
const { createRequestHandler, renderRouterToStream, RouterServer } = await import(
    '@tanstack/react-router/ssr/server'
);

const rootRoute = createRootRoute({
    component: () => h('html', null, h('body', null, h('div', null, 'Hello'))),
});

const handler = createRequestHandler({
    createRouter: () => createRouter({ routeTree: rootRoute }),
    request: new Request('http://localhost/'),
});

const result = await handler(({ request, responseHeaders, router }) =>
    renderRouterToStream({
        children: h(RouterServer, { router }),
        request,
        responseHeaders,
        router,
    }),
);
const response = result instanceof Response ? result : result.response;
await response.text();

console.log(`Node.js ${process.version}`);
console.log(`react-dom ${require('react-dom/package.json').version}`);
console.log(
    `react-dom/server (Node build) exports: renderToReadableStream=${typeof ReactDOMServer.renderToReadableStream}, renderToPipeableStream=${typeof ReactDOMServer.renderToPipeableStream}`,
);
