// Minimal SSR site: TanStack Router + React on a plain Node.js HTTP server.
// Every page shows which React streaming API renderRouterToStream used for this request.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PORT = Number(process.env.PORT) || 3000;

// Wrap both React streaming APIs to record which one renderRouterToStream calls.
// The router imports the same `react-dom/server` module object, so the wrappers are visible to it.
const ReactDOMServer = require('react-dom/server');
let usedApi = 'none';
for (const name of ['renderToReadableStream', 'renderToPipeableStream']) {
    const original = ReactDOMServer[name];
    if (typeof original === 'function') {
        ReactDOMServer[name] = (...args) => {
            usedApi = name;
            return original(...args);
        };
    }
}

const { createElement: h } = await import('react');
const { createRootRoute, createRoute, createRouter, Outlet } = await import('@tanstack/react-router');
const { createRequestHandler, renderRouterToStream, RouterServer } = await import(
    '@tanstack/react-router/ssr/server'
);

const reactDomVersion = require('react-dom/package.json').version;
const routerVersion = require('@tanstack/react-router/package.json').version;

const rootRoute = createRootRoute({
    component: () =>
        h(
            'html',
            { lang: 'en' },
            h('head', null, h('meta', { charSet: 'utf-8' }), h('title', null, 'SSR stream API check')),
            h(
                'body',
                null,
                h('h1', null, 'Hello from SSR'),
                h(
                    'ul',
                    null,
                    h('li', null, `Node.js: ${process.version}`),
                    h('li', null, `react-dom: ${reactDomVersion}`),
                    h('li', null, `@tanstack/react-router: ${routerVersion}`),
                    h('li', null, 'React streaming API used by renderRouterToStream: ', h('b', null, usedApi)),
                ),
                h(Outlet),
            ),
        ),
});

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => h('p', null, 'Index route rendered on the server.'),
});

const routeTree = rootRoute.addChildren([indexRoute]);

const server = createServer(async (req, res) => {
    try {
        usedApi = 'none';
        const handler = createRequestHandler({
            createRouter: () => createRouter({ routeTree }),
            request: new Request(`http://localhost:${PORT}${req.url}`, { headers: req.headers }),
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
        const html = await response.text();

        console.log(`${req.method} ${req.url} -> ${response.status}, renderRouterToStream used ${usedApi}`);
        res.writeHead(response.status, {
            'content-type': 'text/html; charset=utf-8',
            'x-react-stream-api': usedApi,
        });
        res.end(html);
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(String(error));
    }
});

server.listen(PORT, () => {
    console.log(`react-dom ${reactDomVersion}, @tanstack/react-router ${routerVersion}`);
    console.log(
        `react-dom/server (Node build) exports: renderToReadableStream=${typeof ReactDOMServer.renderToReadableStream}, renderToPipeableStream=${typeof ReactDOMServer.renderToPipeableStream}`,
    );
    console.log(`Open http://localhost:${PORT}`);
});
