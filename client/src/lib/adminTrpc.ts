import { createTRPCReact } from "@trpc/react-query";
import type { AdminAppRouter } from "../../../server/adminAppRouter";

export const adminTrpc = createTRPCReact<AdminAppRouter>();
