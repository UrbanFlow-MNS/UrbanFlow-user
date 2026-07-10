import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { Metadata } from "@grpc/grpc-js";
import { Buffer } from "buffer";
import { timingSafeEqual } from "crypto";

@Injectable()
export class GrpcAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        if (context.getType() !== "rpc") {
            return true;
        }

        const metadata = context.getArgByIndex(1) as Metadata | undefined;
        const expected = process.env.USER_INTERNAL_SECRET;

        if (!metadata || typeof expected !== "string") {
            throw new RpcException("Unauthorized internal call");
        }

        const values = metadata.get("x-internal-secret");
        const raw = values?.[0];
        const provided = typeof raw === "string"
            ? raw
            : raw instanceof Buffer
                ? raw.toString()
                : undefined;

        if (typeof provided !== "string") {
            throw new RpcException("Unauthorized internal call");
        }

        const providedBuf = Buffer.from(provided);
        const expectedBuf = Buffer.from(expected);

        if (providedBuf.length !== expectedBuf.length) {
            throw new RpcException("Unauthorized internal call");
        }

        if (!timingSafeEqual(providedBuf, expectedBuf)) {
            throw new RpcException("Unauthorized internal call");
        }

        return true;
    }
}
