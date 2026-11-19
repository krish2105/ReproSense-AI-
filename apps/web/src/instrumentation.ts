import type { Instrumentation } from "next";

/**
 * Server-side errors from pages, layouts and route handlers as one JSON line each (Vercel keeps function logs), with
 * the request ID proxy.ts gave the request, so a failed page can be matched to the API's log lines. Logs the
 * route template only (`/shared/[token]`, never the token) and nothing from the body, query or cookies.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const e = err as Error & { digest?: string };
  const id = request.headers["x-request-id"];
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      logger: "reprosense.web",
      msg: e?.message ?? String(err),
      digest: e?.digest, // the code the error screen shows, so a reported "something went wrong" can be found here
      request_id: Array.isArray(id) ? id[0] : id,
      method: request.method,
      route: context.routePath,
      route_type: context.routeType,
      render: context.renderSource,
    }),
  );
};
