import { Effect } from "effect";
import type { Request, Response } from "express";

/**
 * Bridges Effect programs to Express route handlers.
 * Runs the effect, sends JSON on success, or error status on failure.
 */
export function effectHandler<A>(
  effectFn: (req: Request) => Effect.Effect<A, Error>
) {
  return async (req: Request, res: Response) => {
    const result = await Effect.runPromise(
      effectFn(req).pipe(
        Effect.map((data) => ({ success: true as const, data })),
        Effect.catchAll((error) =>
          Effect.succeed({
            success: false as const,
            error: error.message,
          })
        )
      )
    );

    if (result.success) {
      res.json(result);
    } else {
      const status = getStatusFromError(result.error);
      res.status(status).json(result);
    }
  };
}

function getStatusFromError(message: string): number {
  if (message.includes("not found") || message.includes("Not found")) return 404;
  if (message.includes("unauthorized") || message.includes("Unauthorized")) return 401;
  if (message.includes("forbidden") || message.includes("Forbidden")) return 403;
  if (message.includes("already exists") || message.includes("conflict") || message.includes("Conflict")) return 409;
  if (message.includes("validation") || message.includes("Invalid")) return 400;
  return 500;
}
